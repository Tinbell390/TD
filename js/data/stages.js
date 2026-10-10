// ステージ定義（specification.md 4章・6章・7章・11章）。
// ウェイポイントはグリッドセル中心の [col, row]。水平・垂直区間のみを使う。

export const STAGES = [
  {
    id: "stage-1",
    name: "草原の一本道",
    grid: {
      cols: 24,
      rows: 16,
      cellSize: 40,
    },
    // 経路長720px。出現位置 [0,2] から右へ進み、下方向にゴールする。
    path: [
      [0, 2],
      [10, 2],
      [10, 10],
    ],
    startFunds: 200,
    startLife: 20,
    waves: [
      { count: 8, interval: 1.0, hpMultiplier: 1.0 },
      { count: 10, interval: 1.0, hpMultiplier: 1.1 },
      { count: 12, interval: 0.9, hpMultiplier: 1.2 },
      { count: 14, interval: 0.9, hpMultiplier: 1.3 },
      { count: 16, interval: 0.8, hpMultiplier: 1.4 },
    ],
  },
];
