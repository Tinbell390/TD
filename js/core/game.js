// ゲーム状態管理とメインループ（specification.md 2章・5章・7章・8章・9章）。
import { STAGES } from "../data/stages.js";
import { ENEMIES } from "../data/enemies.js";
import { TOWERS } from "../data/towers.js";
import { buildPath, pathCells, validateWaypoints, cellKey } from "../systems/pathing.js";
import { canAfford, spendFunds, addReward } from "../systems/economy.js";
import { createSpawner, advanceSpawner, pendingCount, isSpawnerDone } from "../systems/waves.js";
import { createEnemy, updateEnemy, resetEnemyIds } from "../entities/enemy.js";
import { createTower, updateTower, resetTowerIds } from "../entities/tower.js";
import { updateProjectile, resetProjectileIds } from "../entities/projectile.js";

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 640;
export const CELL_SIZE = 40;
export const COLS = LOGICAL_WIDTH / CELL_SIZE; // 24
export const ROWS = LOGICAL_HEIGHT / CELL_SIZE; // 16

export const STEP = 1 / 60; // 固定更新ステップ（秒）
export const MAX_FRAME_DELTA = 0.25; // 1フレームの経過時間の上限（秒）

// 7章：初期版は全ウェーブの敵がザコのみ。ウェーブ定義に敵IDがないため、ここで固定する。
const WAVE_ENEMY_ID = "zako";

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
    wave: 0, // 開始済みの最新ウェーブ番号（未開始は0）
    nextWave: stage.waves.length > 0 ? 1 : null, // 次に開始するウェーブ番号（残りがなければnull）
    totalWaves: stage.waves.length,
    canStartWave: stage.waves.length > 0, // 7章の有効条件をGameが判定した結果
    pendingSpawns: 0, // 現在のウェーブの出現待ち敵数
    resumePhase: null, // 一時停止中のみ、再開後に戻る状態（preparing / playing）
    elapsed: 0, // プレイ中の累積ゲーム時間（5.2章）
    path: runtime.path,
    pathCells: runtime.pathCells,
    enemies: [],
    towers: [],
    projectiles: [],
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
    this.lastTime = null;
    this.accumulator = 0;
    this.rafId = null;
    this.frame = this.frame.bind(this);
    this.resetGame();
  }

  // 初期状態を作る（コンストラクタとリスタートで共用。9章）。
  resetGame() {
    resetEnemyIds();
    resetTowerIds();
    resetProjectileIds();
    this.state = createInitialState(this.stage, this.runtime);
    this.waveIndex = 0; // 開始済みのウェーブ数
    this.spawner = null; // 現在のウェーブの出現器
    this.resetClock();
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

  /**
   * 次のウェーブを開始する（7章）。
   * @returns {{ ok: true } | { ok: false, reason: "phase" | "enemies-remain" | "no-more-waves" }}
   */
  startNextWave() {
    const state = this.state;
    if (state.phase !== PHASE.PREPARING) return { ok: false, reason: "phase" };
    if (state.enemies.length > 0) return { ok: false, reason: "enemies-remain" };
    if (this.waveIndex >= this.stage.waves.length) return { ok: false, reason: "no-more-waves" };
    this.spawner = createSpawner(this.stage.waves[this.waveIndex]);
    this.waveIndex++;
    state.phase = PHASE.PLAYING;
    this.refreshDerived();
    return { ok: true };
  }

  /** 準備中・プレイ中なら一時停止、一時停止中なら元の状態へ再開する。クリア・ゲームオーバー中は何もしない（9章）。 */
  togglePause() {
    const state = this.state;
    if (state.phase === PHASE.PREPARING || state.phase === PHASE.PLAYING) {
      state.resumePhase = state.phase;
      state.phase = PHASE.PAUSED;
    } else if (state.phase === PHASE.PAUSED) {
      state.phase = state.resumePhase ?? PHASE.PREPARING;
      state.resumePhase = null;
      this.resetClock(); // 停止中の経過時間を反映させない（2章）
    }
    this.refreshDerived();
  }

  /** 初期状態（準備中）へ戻す（9章）。 */
  restart() {
    this.resetGame();
    this.refreshDerived();
  }

  // state の派生キー（HUD用）を更新する。HUDは読み取りのみ。
  refreshDerived() {
    const state = this.state;
    const total = this.stage.waves.length;
    state.wave = this.waveIndex;
    state.nextWave = this.waveIndex < total ? this.waveIndex + 1 : null;
    state.canStartWave =
      state.phase === PHASE.PREPARING && state.enemies.length === 0 && this.waveIndex < total;
    state.pendingSpawns = this.spawner ? pendingCount(this.spawner) : 0;
  }

  spawnEnemy(defId, hpMultiplier) {
    const def = ENEMIES[defId];
    if (!def) throw new Error(`未定義の敵です: ${defId}`);
    this.state.enemies.push(createEnemy(def, hpMultiplier, this.runtime.path));
  }

  /**
   * セル (col, row) にタワーを設置する（8章）。拒否時は状態を一切変更しない（資金も消費しない）。
   * 拒否理由：phase（一時停止・クリア・ゲームオーバー中）/ out-of-bounds / path / occupied / funds
   * @returns {{ ok: true, tower: object } | { ok: false, reason: string }}
   */
  placeTower(defId, col, row) {
    const def = TOWERS[defId];
    if (!def) throw new Error(`未定義のタワーです: ${defId}`);
    const state = this.state;
    if (state.phase === PHASE.PAUSED || state.phase === PHASE.CLEARED || state.phase === PHASE.GAME_OVER) {
      return { ok: false, reason: "phase" };
    }
    if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || col >= COLS || row < 0 || row >= ROWS) {
      return { ok: false, reason: "out-of-bounds" };
    }
    if (this.runtime.pathCells.has(cellKey(col, row))) return { ok: false, reason: "path" };
    if (state.towers.some((t) => t.col === col && t.row === row)) return { ok: false, reason: "occupied" };
    if (!canAfford(state.funds, def.cost)) return { ok: false, reason: "funds" };
    // すべての拒否条件を通過した後にのみ支払う。
    state.funds = spendFunds(state.funds, def.cost);
    const tower = createTower(def, col, row, CELL_SIZE);
    state.towers.push(tower);
    return { ok: true, tower };
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

  // 1ステップの更新順序：出現 → 敵の移動 → タワー（発射） → 弾（移動・命中） → 状態遷移。
  // ゲーム内時間は「プレイ中」のみ進める（5章）。
  update(dt) {
    const state = this.state;
    if (state.phase !== PHASE.PLAYING) return;
    state.elapsed += dt;
    this.updateSpawner(dt);
    this.updateEnemies(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.checkTransitions();
    this.refreshDerived();
  }

  updateSpawner(dt) {
    if (!this.spawner) return;
    const count = advanceSpawner(this.spawner, dt);
    for (let i = 0; i < count; i++) this.spawnEnemy(WAVE_ENEMY_ID, this.spawner.hpMultiplier);
  }

  updateEnemies(dt) {
    const state = this.state;
    for (const enemy of state.enemies) {
      updateEnemy(enemy, dt, this.runtime.path);
      if (enemy.reachedGoal) {
        state.life = Math.max(0, state.life - enemy.lifeDamage);
      }
    }
    state.enemies = state.enemies.filter((e) => e.alive && !e.reachedGoal);
  }

  updateTowers(dt) {
    const state = this.state;
    for (const tower of state.towers) {
      const projectile = updateTower(tower, dt, state.enemies);
      if (projectile) state.projectiles.push(projectile);
    }
  }

  updateProjectiles(dt) {
    const state = this.state;
    for (const p of state.projectiles) {
      const result = updateProjectile(p, dt);
      // 撃破報酬は、撃破した命中時に1回だけ加算する（damageEnemy は撃破済みの敵に対して false を返す）。
      if (result.type === "hit" && result.killed) {
        state.funds = addReward(state.funds, result.enemy.reward);
      }
    }
    state.projectiles = state.projectiles.filter((p) => p.alive);
    state.enemies = state.enemies.filter((e) => e.alive && !e.reachedGoal);
  }

  // 5.1章：ゲームオーバー（ライフ0以下）を優先し、次にウェーブ完了・クリアを判定する。
  checkTransitions() {
    const state = this.state;
    if (state.life <= 0) {
      state.phase = PHASE.GAME_OVER;
      return;
    }
    const waveFinished = this.spawner !== null && isSpawnerDone(this.spawner) && state.enemies.length === 0;
    if (!waveFinished) return;
    this.spawner = null;
    if (this.waveIndex < this.stage.waves.length) {
      state.phase = PHASE.PREPARING;
      state.projectiles = []; // 標的が全滅しているため、飛行中の弾をすべて消す
    } else {
      state.phase = PHASE.CLEARED;
    }
  }
}
