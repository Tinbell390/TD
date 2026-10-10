// DOM HUD。ゲーム状態は読み取り専用とし、操作はGameの公開APIへ委譲する。

const PHASE_LABEL = {
  preparing: "準備中",
  playing: "プレイ中",
  paused: "一時停止",
  cleared: "クリア",
  gameOver: "ゲームオーバー",
};

function requireElement(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`要素が見つかりません: #${id}`);
  return element;
}

/**
 * HUDを生成する。
 * @param {{
 *   onStartNextWave: () => void,
 *   onTogglePause: () => void,
 *   onRestart: () => void
 * }} actions Gameの公開APIを呼び出す操作関数
 * @returns {(state: object) => void} 毎フレーム呼び出す表示更新関数
 */
export function createHud({
  onStartNextWave,
  onTogglePause,
  onRestart,
}) {
  if (typeof onStartNextWave !== "function"
    || typeof onTogglePause !== "function"
    || typeof onRestart !== "function") {
    throw new TypeError("HUD操作用の3つのコールバックが必要です");
  }

  const els = {
    funds: requireElement("hud-funds"),
    life: requireElement("hud-life"),
    wave: requireElement("hud-wave"),
    phase: requireElement("hud-phase"),
    elapsed: requireElement("hud-elapsed"),
    nextWave: requireElement("btn-next-wave"),
    pause: requireElement("btn-pause"),
    restart: requireElement("btn-restart"),
    message: requireElement("hud-message"),
  };

  const cache = new Map();
  let latestState = null;

  const setText = (key, element, value) => {
    const text = String(value);
    if (cache.get(key) === text) return;
    cache.set(key, text);
    element.textContent = text;
  };

  els.nextWave.addEventListener("click", () => {
    if (latestState?.canStartWave) onStartNextWave();
  });
  els.pause.addEventListener("click", () => {
    if (latestState
      && latestState.phase !== "cleared"
      && latestState.phase !== "gameOver") {
      onTogglePause();
    }
  });
  els.restart.addEventListener("click", () => onRestart());

  return (state) => {
    latestState = state;
    setText("funds", els.funds, state.funds);
    setText("life", els.life, state.life);
    setText("phase", els.phase, PHASE_LABEL[state.phase] ?? state.phase);
    setText("elapsed", els.elapsed, `${state.elapsed.toFixed(1)}s`);

    let waveText;
    if (state.phase === "playing") {
      waveText = `${state.wave} 進行中 / ${state.totalWaves}`;
    } else if (state.phase === "paused" && state.resumePhase === "preparing") {
      // 準備中から一時停止した場合は、開始済みのウェーブではなく次のウェーブを示す。
      waveText = `${state.nextWave ?? state.totalWaves} / ${state.totalWaves}`;
    } else if (state.phase === "paused") {
      waveText = `${state.wave} 一時停止中 / ${state.totalWaves}`;
    } else if (state.phase === "gameOver") {
      // 敗北時は、次に開始する番号ではなく敗北したウェーブを表示する。
      waveText = `${state.wave} / ${state.totalWaves}`;
    } else {
      waveText = `${state.nextWave ?? state.totalWaves} / ${state.totalWaves}`;
    }
    setText("wave", els.wave, waveText);

    let nextWaveLabel;
    if (state.phase === "playing") {
      nextWaveLabel = `ウェーブ${state.wave} 進行中`;
    } else if (state.phase === "paused" && state.resumePhase === "preparing") {
      nextWaveLabel = state.nextWave == null
        ? "全ウェーブ終了"
        : `ウェーブ${state.nextWave}開始（停止中）`;
    } else if (state.phase === "paused") {
      nextWaveLabel = "一時停止中";
    } else if (state.phase === "gameOver") {
      nextWaveLabel = "ゲームオーバー";
    } else if (state.nextWave === null || state.nextWave === undefined) {
      nextWaveLabel = "全ウェーブ終了";
    } else {
      nextWaveLabel = `ウェーブ${state.nextWave}開始`;
    }
    setText("nextWaveLabel", els.nextWave, nextWaveLabel);
    els.nextWave.disabled = !state.canStartWave;

    setText("pauseLabel", els.pause, state.phase === "paused" ? "再開" : "一時停止");
    els.pause.disabled = state.phase === "cleared" || state.phase === "gameOver";

    let message = "";
    if (state.phase === "cleared") message = "ゲームクリア！";
    if (state.phase === "gameOver") message = "ゲームオーバー";
    setText("message", els.message, message);
  };
}
