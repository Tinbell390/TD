// 経路の構築と位置計算（specification.md 4章）。DOM・Canvasに依存しない。

/**
 * セル中心のウェイポイント列から、ピクセル座標の経路を構築する。
 * @param {Array<[number, number]>} waypoints [[col,row], ...]（セル中心）
 * @param {number} cellSize
 * @returns {{ points: Array<{x:number,y:number}>, cumulative: number[], length: number }}
 */
export function buildPath(waypoints, cellSize) {
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    throw new Error("経路には2点以上のウェイポイントが必要です");
  }
  const points = waypoints.map(([col, row]) => ({
    x: (col + 0.5) * cellSize,
    y: (row + 0.5) * cellSize,
  }));
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const seg = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (!(seg > 0)) throw new Error(`隣り合うウェイポイントが同一です: index ${i}`);
    cumulative.push(cumulative[i - 1] + seg);
  }
  return { points, cumulative, length: cumulative[cumulative.length - 1] };
}

/**
 * 経路上の距離（px）に対応する座標を返す。範囲外は端点に丸める。
 * @returns {{ x: number, y: number }}
 */
export function positionAt(path, distance) {
  const { points, cumulative, length } = path;
  if (distance <= 0) return { x: points[0].x, y: points[0].y };
  if (distance >= length) {
    const last = points[points.length - 1];
    return { x: last.x, y: last.y };
  }
  let i = 1;
  while (cumulative[i] < distance) i++;
  const a = points[i - 1];
  const b = points[i];
  const t = (distance - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1]);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * 経路が通る全セルを返す（経路マス。タワー設置禁止判定用）。
 * 隣り合うウェイポイントは同じ列または同じ行にある（水平・垂直）ことを要求する。
 * @returns {Set<string>} "col,row" 形式のキー集合
 */
export function pathCells(waypoints) {
  const cells = new Set();
  for (let i = 0; i < waypoints.length; i++) {
    const [c, r] = waypoints[i];
    cells.add(cellKey(c, r));
    if (i === 0) continue;
    const [pc, pr] = waypoints[i - 1];
    if (c !== pc && r !== pr) {
      throw new Error(`斜めの区間は未対応です: [${pc},${pr}] -> [${c},${r}]`);
    }
    const dc = Math.sign(c - pc);
    const dr = Math.sign(r - pr);
    for (let cc = pc, rr = pr; cc !== c || rr !== r; cc += dc, rr += dr) {
      cells.add(cellKey(cc, rr));
    }
  }
  return cells;
}

export function cellKey(col, row) {
  return `${col},${row}`;
}

/**
 * ウェイポイントが盤面内か検証する。問題があれば説明文の配列を返す（空なら正常）。
 */
export function validateWaypoints(waypoints, cols, rows) {
  const errors = [];
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    return ["ウェイポイントが2点未満です"];
  }
  waypoints.forEach(([c, r], i) => {
    if (!Number.isInteger(c) || !Number.isInteger(r)) errors.push(`index ${i}: 整数ではありません`);
    else if (c < 0 || c >= cols || r < 0 || r >= rows) errors.push(`index ${i}: 盤面外 [${c},${r}]`);
  });
  return errors;
}
