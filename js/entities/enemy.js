// 敵エンティティ（specification.md 4章・6.3章・10章）。経路上の移動距離で位置を管理する。
import { positionAt } from "../systems/pathing.js";

let nextId = 1;

/** リスタート時に生成順カウンタを初期化する。 */
export function resetEnemyIds() {
  nextId = 1;
}

/**
 * @param {{ id: string, hp: number, speed: number, reward: number, lifeDamage: number }} def
 * @param {number} hpMultiplier ウェーブごとのHP倍率
 * @param {object} path buildPath() の戻り値
 */
export function createEnemy(def, hpMultiplier, path) {
  // 7章：Math.ceil で整数化し、最小1。
  const maxHp = Math.max(1, Math.ceil(def.hp * hpMultiplier));
  const pos = positionAt(path, 0);
  return {
    id: nextId++, // 生成順。標的選択のタイブレークに使う（10章）。
    defId: def.id,
    maxHp,
    hp: maxHp,
    speed: def.speed,
    reward: def.reward,
    lifeDamage: def.lifeDamage,
    distance: 0, // 経路上の進行度（px）。大きいほどゴールに近い。
    x: pos.x,
    y: pos.y,
    alive: true,
    reachedGoal: false,
  };
}

/** 経路に沿って移動する。ゴールに達したら reachedGoal を立てる。 */
export function updateEnemy(enemy, dt, path) {
  if (!enemy.alive || enemy.reachedGoal) return;
  enemy.distance += enemy.speed * dt;
  if (enemy.distance >= path.length) {
    enemy.distance = path.length;
    enemy.reachedGoal = true;
  }
  const pos = positionAt(path, enemy.distance);
  enemy.x = pos.x;
  enemy.y = pos.y;
}

/** ダメージを与える。HPが0以下になったら alive を false にし、撃破したら true を返す。 */
export function damageEnemy(enemy, amount) {
  if (!enemy.alive) return false;
  enemy.hp -= amount;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.alive = false;
    return true;
  }
  return false;
}
