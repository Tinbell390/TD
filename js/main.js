// エントリポイント。初期化・ポインター入力・HUD（M0暫定。HUDはM3で ui/hud.js へ移す予定）。
import { Game, PHASE } from "./core/game.js";
import { Renderer, clientToLogical, logicalToCell } from "./core/renderer.js";

const PHASE_LABEL = {
  [PHASE.PREPARING]: "準備中",
  [PHASE.PLAYING]: "プレイ中",
  [PHASE.PAUSED]: "一時停止",
  [PHASE.CLEARED]: "クリア",
  [PHASE.GAME_OVER]: "ゲームオーバー",
};

// 初期版はタワーが1種のため、クリックで直接設置する（選択UIはM4以降）。
const PLACE_TOWER_ID = "cannon";

function requireElement(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`要素が見つかりません: #${id}`);
  return el;
}

function createHud() {
  const els = {
    funds: requireElement("hud-funds"),
    life: requireElement("hud-life"),
    wave: requireElement("hud-wave"),
    phase: requireElement("hud-phase"),
    elapsed: requireElement("hud-elapsed"),
  };
  const cache = {};
  // 値が変わったときだけDOMを更新する。
  const set = (key, text) => {
    if (cache[key] === text) return;
    cache[key] = text;
    els[key].textContent = text;
  };
  return (state) => {
    set("funds", String(state.funds));
    set("life", String(state.life));
    set("wave", `${state.wave} / ${state.totalWaves}`);
    set("phase", PHASE_LABEL[state.phase] ?? state.phase);
    set("elapsed", `${state.elapsed.toFixed(1)}s`);
  };
}

const canvas = requireElement("game-canvas");
const game = new Game({
  renderer: new Renderer(canvas),
  onFrame: createHud(),
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

// M1確認用（暫定）：http://localhost:8000/?m1demo で敵が出現する。M3で削除する。
if (new URLSearchParams(location.search).has("m1demo")) game.enableM1Demo();
game.start();
