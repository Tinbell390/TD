// 資金計算。DOM・Canvas・ゲーム状態に依存しない純粋関数。

function assertAmount(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} は0以上の有限数である必要があります`);
  }
}

/** 現在の資金で費用を支払えるか判定する。資金・費用は変更しない。 */
export function canAfford(funds, cost) {
  assertAmount(funds, "funds");
  assertAmount(cost, "cost");
  return funds >= cost;
}

/**
 * 設置費を支払った後の資金を返す。
 * 資金不足の場合は例外にするため、呼び出し側は設置前に canAfford() で判定する。
 */
export function spendFunds(funds, cost) {
  if (!canAfford(funds, cost)) {
    throw new RangeError("資金が不足しています");
  }
  return funds - cost;
}

/** 敵撃破報酬を加算した後の資金を返す。 */
export function addReward(funds, reward) {
  assertAmount(funds, "funds");
  assertAmount(reward, "reward");
  return funds + reward;
}
