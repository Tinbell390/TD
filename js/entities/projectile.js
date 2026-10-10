// 弾エンティティ。標的を追尾して命中時にダメージを与える。
import { damageEnemy } from "./enemy.js";

let nextId = 1;

/** リスタート時に生成順カウンタを初期化する。 */
export function resetProjectileIds() {
  nextId = 1;
}

/**
 * @param {{ x:number, y:number, damage:number, projectileSpeed:number }} tower
 * @param {object} target 標的の敵
 */
export function createProjectile(tower, target) {
  return {
    id: nextId++,
    x: tower.x,
    y: tower.y,
    damage: tower.damage,
    speed: tower.projectileSpeed,
    target,
    alive: true,
  };
}

/**
 * 弾を標的へ向けて進める。
 * 1ステップで標的に届く距離なら命中として扱い、すり抜けを防ぐ。
 * 標的が撃破済み・ゴール到達済みの場合は、ダメージを与えずに弾を消す（"lost"）。
 * @returns {{ type: "moving" | "hit" | "lost", enemy?: object, killed?: boolean }}
 */
export function updateProjectile(p, dt) {
  if (!p.alive) return { type: "lost" };
  const t = p.target;
  if (!t.alive || t.reachedGoal) {
    p.alive = false;
    return { type: "lost" };
  }
  const dx = t.x - p.x;
  const dy = t.y - p.y;
  const dist = Math.hypot(dx, dy);
  const step = p.speed * dt;
  if (dist <= step) {
    p.x = t.x;
    p.y = t.y;
    p.alive = false;
    const killed = damageEnemy(t, p.damage);
    return { type: "hit", enemy: t, killed };
  }
  p.x += (dx / dist) * step;
  p.y += (dy / dist) * step;
  return { type: "moving" };
}
