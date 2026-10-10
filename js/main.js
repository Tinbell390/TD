// エントリポイント。初期化・ポインター入力・HUDの配線（specification.md 8章・9章）。
import { Game } from "./core/game.js";
import { Renderer, clientToLogical, logicalToCell } from "./core/renderer.js";
import { createHud } from "./ui/hud.js";

// 初期版はタワーが1種のため、クリックで直接設置する（選択UIはM4以降）。
const PLACE_TOWER_ID = "cannon";

function requireElement(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`要素が見つかりません: #${id}`);
  return el;
}

const canvas = requireElement("game-canvas");

// HUDの操作はGameの公開APIへ委譲する。コールバックはクリック時に評価されるため、game の生成前に渡せる。
const updateHud = createHud({
  onStartNextWave: () => game.startNextWave(),
  onTogglePause: () => game.togglePause(),
  onRestart: () => game.restart(),
});

const game = new Game({
  renderer: new Renderer(canvas),
  onFrame: updateHud,
});

// ポインター位置 → 論理座標 → セル → 設置（8章）。拒否理由は開発者向けにコンソールへ出す。
canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const logical = clientToLogical(canvas.getBoundingClientRect(), event.clientX, event.clientY);
  if (!logical) return;
  const cell = logicalToCell(logical.x, logical.y);
  if (!cell) return;
  const result = game.placeTower(PLACE_TOWER_ID, cell.col, cell.row);
  if (!result.ok) console.debug(`タワーを設置できません: ${result.reason} [${cell.col},${cell.row}]`);
});

game.start();
