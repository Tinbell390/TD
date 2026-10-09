#!/usr/bin/env python3
"""
Marge.py - Markdown append-log merger for the TD game project.

Default directory layout:
    README.md
    discussion.md       <- merged output (managed by this script)
    discussion/*.md    <- append-only input records
    Changes.md
    Changes/*.md
    logs.md
    logs/*.md

Usage:
    python Marge.py --dry-run
    python Marge.py
    python Marge.py --only discussion
    python Marge.py --only Changes logs
    python Marge.py --no-delete

The script uses only Python's standard library.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import shutil
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class MergeTarget:
    name: str
    source_dir: str
    main_file: str


TARGETS = {
    "discussion": MergeTarget("discussion", "discussion", "discussion.md"),
    "Changes": MergeTarget("Changes", "Changes", "Changes.md"),
    "logs": MergeTarget("logs", "logs", "logs.md"),
}

MARKER_RE = re.compile(
    r"^<!-- MARGE-SOURCE: (?P<source>.+?) sha256=(?P<digest>[0-9a-f]{64}) -->$",
    re.MULTILINE,
)


class MergeError(Exception):
    """Raised when a merge cannot safely continue."""


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def read_utf8(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise MergeError(f"UTF-8として読み取れません: {path}") from exc
    except OSError as exc:
        raise MergeError(f"ファイルを読み取れません: {path}: {exc}") from exc


def atomic_write(path: Path, text: str) -> None:
    """Write UTF-8 text atomically in the same directory as the destination."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent)
    )
    temp_path = Path(temp_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(text)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_path, path)
    except Exception:
        try:
            temp_path.unlink(missing_ok=True)
        except OSError:
            pass
        raise


def make_backup(main_path: Path) -> Path | None:
    if not main_path.exists():
        return None
    timestamp = datetime.now().astimezone().strftime("%Y%m%d_%H%M%S_%f")
    backup = main_path.with_name(f"{main_path.name}.{timestamp}.bak")
    shutil.copy2(main_path, backup)
    return backup


def source_marker(relative_source: str, digest: str) -> str:
    return f"<!-- MARGE-SOURCE: {relative_source} sha256={digest} -->"


def inspect_sources(root: Path, target: MergeTarget) -> list[tuple[Path, str, str]]:
    source_dir = root / target.source_dir
    if not source_dir.exists():
        return []
    if not source_dir.is_dir():
        raise MergeError(f"追記用パスがディレクトリではありません: {source_dir}")

    files = sorted(
        (p for p in source_dir.iterdir() if p.is_file() and p.suffix.lower() == ".md"),
        key=lambda p: p.name.casefold(),
    )
    records: list[tuple[Path, str, str]] = []
    for path in files:
        text = read_utf8(path)
        if not text.strip():
            raise MergeError(f"空のMarkdownファイルは処理できません: {path}")
        # Reject accidental marker injection, which could confuse duplicate detection.
        if MARKER_RE.search(text):
            raise MergeError(f"入力ファイルにMarge.py管理マーカーがあります: {path}")
        relative = path.relative_to(root).as_posix()
        records.append((path, text.rstrip() + "\n", relative))
    return records


def merge_one(
    root: Path,
    target: MergeTarget,
    dry_run: bool,
    delete_sources: bool,
) -> tuple[int, int]:
    main_path = root / target.main_file
    records = inspect_sources(root, target)

    if not records:
        print(f"[{target.name}] 対象ファイルなし")
        return (0, 0)

    if main_path.exists():
        original = read_utf8(main_path)
    else:
        original = f"# {target.main_file.removesuffix('.md')}\n"

    updated = original
    if updated and not updated.endswith("\n"):
        updated += "\n"

    markers = {
        match.group("source"): match.group("digest")
        for match in MARKER_RE.finditer(original)
    }

    to_merge: list[tuple[Path, str, str, str]] = []
    already_merged: list[tuple[Path, str]] = []
    for path, body, relative in records:
        digest = sha256_text(body)
        prior_digest = markers.get(relative)
        if prior_digest == digest:
            already_merged.append((path, relative))
            continue
        if prior_digest is not None and prior_digest != digest:
            raise MergeError(
                f"同じ記録ファイルの内容が以前のマージ後に変わっています: {relative}\n"
                "追記専用ルールに反する可能性があるため、中断しました。"
            )
        to_merge.append((path, body, relative, digest))

    if not to_merge and not already_merged:
        print(f"[{target.name}] マージ対象なし")
        return (0, 0)

    print(
        f"[{target.name}] {target.main_file}: "
        f"新規 {len(to_merge)} 件 / マージ済み再検出 {len(already_merged)} 件"
    )
    for path, _, relative, _ in to_merge:
        print(f"  + {relative}")
    for path, relative in already_merged:
        print(f"  = 既にマージ済み: {relative}")

    if dry_run:
        print("  DRY-RUN: 書き込み・削除は行いません")
        return (len(to_merge), len(already_merged))

    if to_merge:
        backup = make_backup(main_path)
        if backup:
            print(f"  バックアップ: {backup.relative_to(root).as_posix()}")

        sections: list[str] = []
        for _, body, relative, digest in to_merge:
            sections.append(
                f"\n---\n\n{source_marker(relative, digest)}\n\n{body.rstrip()}\n"
            )
        updated = updated.rstrip() + "\n" + "".join(sections) + "\n"
        atomic_write(main_path, updated)

        # Verify that every new marker and body is present before deleting anything.
        written = read_utf8(main_path)
        for _, body, relative, digest in to_merge:
            marker = source_marker(relative, digest)
            if marker not in written or body.rstrip() not in written:
                raise MergeError(
                    f"書き込み後の検証に失敗しました。入力ファイルは保持します: {relative}"
                )

    # If a prior run wrote the output but crashed before deleting inputs, the marker
    # lets this run safely finish cleanup without duplicating the record.
    if delete_sources:
        for path, relative in already_merged:
            path.unlink()
            print(f"  削除（前回マージ済み）: {relative}")
        for path, _, relative, _ in to_merge:
            path.unlink()
            print(f"  削除: {relative}")
    else:
        print("  --no-delete: 追記用ファイルは保持しました")

    return (len(to_merge), len(already_merged))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="追記用Markdownをメインファイルに安全にマージします。"
    )
    parser.add_argument(
        "--only",
        nargs="+",
        choices=sorted(TARGETS.keys()),
        help="処理する記録種別（省略時は全種類）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="対象一覧のみ表示し、書き込み・削除を行わない",
    )
    parser.add_argument(
        "--no-delete",
        action="store_true",
        help="マージ後も追記用ファイルを削除しない",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent,
        help="プロジェクトルート（既定値はMarge.pyのあるディレクトリ）",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        print(f"エラー: プロジェクトルートが存在しません: {root}", file=sys.stderr)
        return 2

    selected: Iterable[str] = args.only if args.only else TARGETS.keys()
    total_new = 0
    total_existing = 0
    try:
        for name in selected:
            new_count, existing_count = merge_one(
                root=root,
                target=TARGETS[name],
                dry_run=args.dry_run,
                delete_sources=not args.no_delete and not args.dry_run,
            )
            total_new += new_count
            total_existing += existing_count
    except (MergeError, OSError) as exc:
        print(f"\nエラー: {exc}", file=sys.stderr)
        print("安全のため、未処理の追記用ファイルは削除していません。", file=sys.stderr)
        return 1

    print(
        f"\n完了: 新規マージ {total_new} 件、"
        f"既にマージ済み {total_existing} 件"
    )
    if args.dry_run:
        print("DRY-RUNのため、ファイルの変更はありません。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
