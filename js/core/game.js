// ゲーム状態管理とメインループ（specification.md 2章・5章）。

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 640;
export const CELL_SIZE = 40;
export const COLS = LOGICAL_WIDTH / CELL_SIZE; // 24
export const ROWS = LOGICAL_HEIGHT / CELL_SIZE; // 16

export const STEP = 1 / 60; // 固定更新ステップ（秒）
export const MAX_FRAME_DELTA = 0.25; // 1フレームの経過時間の上限（秒）

export const PHASE = Object.freeze({
  PREPARING: "preparing",
  PLAYING: "playing",
  PAUSED: "paused",
  CLEARED: "cleared",
  GAME_OVER: "gameOver",
});

// M0暫定値。M1で data/stages.js の値に置き換える。
const TEMP_START_FUNDS = 200;
const TEMP_START_LIFE = 20;
const TEMP_TOTAL_WAVES = 5;

export function createInitialState() {
  return {
    phase: PHASE.PREPARING,
    funds: TEMP_START_FUNDS,
    life: TEMP_START_LIFE,
    wave: 0,
    totalWaves: TEMP_TOTAL_WAVES,
    elapsed: 0, // M0のループ動作確認用。M3で用途を見直す。
  };
}

export class Game {
  /**
   * @param {{ renderer: { render(state: object): void }, onFrame?: (state: object) => void }} deps
   */
  constructor({ renderer, onFrame = () => {} }) {
    this.renderer = renderer;
    this.onFrame = onFrame;
    this.state = createInitialState();
    this.lastTime = null;
    this.accumulator = 0;
    this.rafId = null;
    this.frame = this.frame.bind(this);
  }

  start() {
    if (this.rafId !== null) return;
    this.resetClock();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop() {
    if (this.rafId === null) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  // 時間基準とアキュムレータをリセットする（再開時・リスタート時に使用）。
  resetClock() {
    this.lastTime = null;
    this.accumulator = 0;
  }

  frame(now) {
    if (this.lastTime === null) this.lastTime = now;
    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (delta < 0) delta = 0;
    if (delta > MAX_FRAME_DELTA) delta = MAX_FRAME_DELTA;

    this.accumulator += delta;
    while (this.accumulator >= STEP) {
      this.update(STEP);
      this.accumulator -= STEP;
    }

    this.renderer.render(this.state);
    this.onFrame(this.state);
    this.rafId = requestAnimationFrame(this.frame);
  }

  update(dt) {
    const { phase } = this.state;
    if (phase === PHASE.PAUSED || phase === PHASE.CLEARED || phase === PHASE.GAME_OVER) {
      return;
    }
    this.state.elapsed += dt;
  }
}
