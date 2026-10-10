// ウェーブの出現スケジュール管理。DOM・Canvas・Game状態には依存しない。

function assertWaveDef(waveDef) {
  if (!waveDef || !Number.isInteger(waveDef.count) || waveDef.count < 0) {
    throw new RangeError("waveDef.count は0以上の整数である必要があります");
  }
  if (!Number.isFinite(waveDef.interval) || waveDef.interval <= 0) {
    throw new RangeError("waveDef.interval は0より大きい有限数である必要があります");
  }
  if (!Number.isFinite(waveDef.hpMultiplier) || waveDef.hpMultiplier <= 0) {
    throw new RangeError("waveDef.hpMultiplier は0より大きい有限数である必要があります");
  }
}

/**
 * ウェーブ定義から出現器を作る。
 * remaining はまだ出現していない敵数。最初の敵は advanceSpawner の初回呼び出しで出現する。
 */
export function createSpawner(waveDef) {
  assertWaveDef(waveDef);
  return {
    remaining: waveDef.count,
    interval: waveDef.interval,
    hpMultiplier: waveDef.hpMultiplier,
    timer: 0,
    firstSpawnPending: waveDef.count > 0,
  };
}

/**
 * dt 秒進め、そのステップで出現させる敵数を返す。
 * 初回は即時に1体出し、以降は interval 秒ごとに出現させる。
 * 大きな dt で複数回の出現時刻を越えた場合も、出現数を取りこぼさない。
 */
export function advanceSpawner(spawner, dt) {
  if (!spawner || !Number.isInteger(spawner.remaining) || spawner.remaining < 0) {
    throw new TypeError("有効なspawnerが必要です");
  }
  if (!Number.isFinite(dt) || dt < 0) {
    throw new RangeError("dt は0以上の有限数である必要があります");
  }
  if (spawner.remaining === 0) return 0;

  let spawned = 0;
  if (spawner.firstSpawnPending) {
    spawner.firstSpawnPending = false;
    spawner.remaining--;
    spawned++;
    spawner.timer = spawner.interval;
  }

  // 初回出現後の経過時間を同じステップに反映する。
  spawner.timer -= dt;
  while (spawner.remaining > 0 && spawner.timer <= 0) {
    spawner.remaining--;
    spawned++;
    spawner.timer += spawner.interval;
  }
  return spawned;
}

/** まだ出現していない敵数を返す。 */
export function pendingCount(spawner) {
  if (!spawner || !Number.isInteger(spawner.remaining) || spawner.remaining < 0) {
    throw new TypeError("有効なspawnerが必要です");
  }
  return spawner.remaining;
}

/** 出現待ちの敵がいないかを返す（場にいる敵の有無はGame側で判定する）。 */
export function isSpawnerDone(spawner) {
  return pendingCount(spawner) === 0;
}
