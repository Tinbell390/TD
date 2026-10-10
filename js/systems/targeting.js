// タワーの標的選択（specification.md 10章）。DOM・Canvasに依存しない。

/** 射程内（境界を含む）で生存中、かつゴール未到達の敵だけを標的候補にする。 */
function inRange(tower, enemy) {
  if (!enemy.alive || enemy.reachedGoal) return false;
  return Math.hypot(enemy.x - tower.x, enemy.y - tower.y) <= tower.range;
}

// 標的選択方式。キー名は data/towers.js の targeting と対応する。
const STRATEGIES = {
  // 「ゴールに最も近い敵」＝経路上の進行度（distance）が最大の敵。同値は生成順（id）が早い敵。
  first(candidates) {
    let best = null;
    for (const e of candidates) {
      if (best === null || e.distance > best.distance || (e.distance === best.distance && e.id < best.id)) {
        best = e;
      }
    }
    return best;
  },
};

/**
 * @param {{ x:number, y:number, range:number, targeting:string }} tower
 * @param {Array<object>} enemies
 * @returns {object | null} 標的の敵。射程内に候補がなければnull
 */
export function selectTarget(tower, enemies) {
  const strategy = STRATEGIES[tower.targeting];
  if (!strategy) throw new Error(`未定義の標的選択方式です: ${tower.targeting}`);
  return strategy(enemies.filter((e) => inRange(tower, e)));
}
