// エントリポイント。初期化とHUD（M0暫定。M3で ui/hud.js へ移す予定）。
import { Game, PHASE } from "./core/game.js";
import { Renderer } from "./core/renderer.js";

const PHASE_LABEL = {
  [PHASE.PREPARING]: "準備中",
  [PHASE.PLAYING]: "プレイ中",
  [PHASE.PAUSED]: "一時停止",
  [PHASE.CLEARED]: "クリア",
  [PHASE.GAME_OVER]: "ゲームオーバー",
};

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
game.start();
