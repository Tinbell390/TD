// タワー定義（specification.md 6.2章・11章）。
// targeting: "first" は経路上の進行度が最大の敵を選ぶ（10章）。
export const TOWERS = {
  cannon: {
    id: "cannon",
    name: "キャノン",
    cost: 50,
    range: 120,
    damage: 10,
    interval: 0.8,
    projectileSpeed: 400,
    targeting: "first",
  },
};
