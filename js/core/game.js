// ゲーム状態管理とメインループ（specification.md 2章・5章）。
import { STAGES } from "../data/stages.js";
import { ENEMIES } from "../data/enemies.js";
import { buildPath, pathCells, validateWaypoints } from "../systems/pathing.js";
import { createEnemy, updateEnemy, resetEnemyIds } from "../entities/enemy.js";

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

/**
 * ステージ定義を検証し、実行時データ（経路・経路マス）を作る。
 * 盤面定数と食い違う、または経路が不正な場合は例外にする（4章）。
 */
export function prepareStage(stage) {
  const { cols, rows, cellSize } = stage.grid;
  if (cols !== COLS || rows !== ROWS || cellSize !== CELL_SIZE) {
    throw new Error(`ステージの盤面定義が3章（${COLS}x${ROWS}, ${CELL_SIZE}px）と一致しません: ${stage.id}`);
  }
  const errors = validateWaypoints(stage.path, cols, rows);
  if (errors.length > 0) throw new Error(`経路が不正です（${stage.id}）: ${errors.join(" / ")}`);
  return {
    path: buildPath(stage.path, cellSize),
    pathCells: pathCells(stage.path), // 斜め区間はここで例外になる
  };
}

export function createInitialState(stage, runtime) {
  return {
    phase: PHASE.PREPARING,
    funds: stage.startFunds,
    life: stage.startLife,
    wave: 0,
    totalWaves: stage.waves.length,
    elapsed: 0, // 経過時間の意味はM3で協議（準備中も加算される現状）。
    path: runtime.path,
    pathCells: runtime.pathCells,
    enemies: [],
  };
}

export class Game {
  /**
   * @param {{ renderer: { render(state: object): void }, onFrame?: (state: object) => void, stage?: object }} deps
   */
  constructor({ renderer, onFrame = () => {}, stage = STAGES[0] }) {
    this.renderer = renderer;
    this.onFrame = onFrame;
    this.stage = stage;
    this.runtime = prepareStage(stage);
    resetEnemyIds();
    this.state = createInitialState(stage, this.runtime);
    // M1確認用の暫定スポナー。M3でwaves.jsに置き換えて削除する。
    this.demo = null;
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

  /** M1確認用：ウェーブ1相当の敵を一定間隔で出現させる（ゲーム内時間基準）。 */
  enableM1Demo() {
    const wave = this.stage.waves[0];
    this.demo = { remaining: wave.count, interval: wave.interval, hpMultiplier: wave.hpMultiplier, timer: 0 };
  }

  spawnEnemy(defId, hpMultiplier) {
    const def = ENEMIES[defId];
    if (!def) throw new Error(`未定義の敵です: ${defId}`);
    this.state.enemies.push(createEnemy(def, hpMultiplier, this.runtime.path));
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
    const state = this.state;
    const { phase } = state;
    if (phase === PHASE.PAUSED || phase === PHASE.CLEARED || phase === PHASE.GAME_OVER) {
      return;
    }
    state.elapsed += dt;
    this.updateDemoSpawner(dt);
    this.updateEnemies(dt);
  }

  updateDemoSpawner(dt) {
    const d = this.demo;
    if (!d || d.remaining <= 0) return;
    d.timer -= dt;
    // 1ステップで複数回の出現条件を満たしても取りこぼさない。
    while (d.remaining > 0 && d.timer <= 0) {
      this.spawnEnemy("zako", d.hpMultiplier);
      d.remaining--;
      d.timer += d.interval;
    }
  }

  updateEnemies(dt) {
    const state = this.state;
    for (const enemy of state.enemies) {
      updateEnemy(enemy, dt, this.runtime.path);
      if (enemy.reachedGoal) {
        // ライフは0未満にしない。ゲームオーバー遷移はM3（9章・5章）で実装する。
        state.life = Math.max(0, state.life - enemy.lifeDamage);
      }
    }
    state.enemies = state.enemies.filter((e) => e.alive && !e.reachedGoal);
  }
}
