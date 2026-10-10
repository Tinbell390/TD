// タワーエンティティ（specification.md 6.2章・8章・10章）。
import { selectTarget } from "../systems/targeting.js";
import { createProjectile } from "./projectile.js";

let nextId = 1;

/** リスタート時に生成順カウンタを初期化する。 */
export function resetTowerIds() {
  nextId = 1;
}

/**
 * セル (col, row) の中心に置くタワーを作る。設置可否の判定（経路・重複・資金）は呼び出し側で行う。
 * @param {{ id:string, cost:number, range:number, damage:number, interval:number, projectileSpeed:number, targeting:string }} def
 */
export function createTower(def, col, row, cellSize) {
  return {
    id: nextId++,
    defId: def.id,
    col,
    row,
    x: (col + 0.5) * cellSize,
    y: (row + 0.5) * cellSize,
    range: def.range,
    damage: def.damage,
    interval: def.interval,
    projectileSpeed: def.projectileSpeed,
    targeting: def.targeting,
    cooldown: 0, // 0以下で発射可能。
  };
}

/**
 * タワーを1ステップ進める。発射したら弾を返し、発射しなければnullを返す。
 * 発射時は cooldown に interval を加算する（端数を持ち越して発射間隔のずれを防ぐ）。
 * 標的がいない間は cooldown が0で止まり、射程に入った次のステップで即発射できる。
 */
export function updateTower(tower, dt, enemies) {
  tower.cooldown = Math.max(0, tower.cooldown - dt);
  if (tower.cooldown > 0) return null;
  const target = selectTarget(tower, enemies);
  if (!target) return null;
  tower.cooldown += tower.interval;
  return createProjectile(tower, target);
}
