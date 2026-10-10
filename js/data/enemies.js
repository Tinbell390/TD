// 敵定義（specification.md 6.3章・11章）。
// hpMultiplier はウェーブ側で指定し、createEnemy() が Math.ceil で適用する。

export const ENEMIES = {
  zako: {
    id: "zako",
    name: "ザコ",
    hp: 40,
    speed: 60,
    reward: 10,
    lifeDamage: 1,
  },
};
