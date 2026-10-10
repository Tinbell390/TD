// Canvas描画と座標変換（specification.md 3章）。
import { CELL_SIZE, COLS, ROWS, LOGICAL_WIDTH, LOGICAL_HEIGHT } from "./game.js";

/**
 * ポインターのクライアント座標を論理座標へ変換する。
 * @param {{ left: number, top: number, width: number, height: number }} rect Canvasの表示矩形
 * @returns {{ x: number, y: number } | null} 表示サイズが0の場合はnull
 */
export function clientToLogical(rect, clientX, clientY) {
  if (!(rect.width > 0) || !(rect.height > 0)) return null;
  return {
    x: ((clientX - rect.left) * LOGICAL_WIDTH) / rect.width,
    y: ((clientY - rect.top) * LOGICAL_HEIGHT) / rect.height,
  };
}

/**
 * 論理座標をセル（列・行）へ変換する。盤面外はnull。
 * @returns {{ col: number, row: number } | null}
 */
export function logicalToCell(x, y) {
  if (x < 0 || y < 0 || x >= LOGICAL_WIDTH || y >= LOGICAL_HEIGHT) return null;
  return { col: Math.floor(x / CELL_SIZE), row: Math.floor(y / CELL_SIZE) };
}

const ENEMY_RADIUS = 10;

export class Renderer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");
    this.canvas = canvas;
    this.ctx = ctx;
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;
  }

  render(state) {
    const { ctx } = this;
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = "#1e2a1e";
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.drawPathCells(state.pathCells);
    this.drawGrid();
    this.drawPathLine(state.path);
    this.drawEnemies(state.enemies);
  }

  // 経路マス（タワー設置不可）を塗る。キーは "col,row"。
  drawPathCells(cells) {
    if (!cells) return;
    const { ctx } = this;
    ctx.fillStyle = "#4a4130";
    for (const key of cells) {
      const [col, row] = key.split(",").map(Number);
      ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  drawGrid() {
    const { ctx } = this;
    ctx.strokeStyle = "#31443a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // 0.5px のオフセットで1px線をにじませない。
    for (let c = 0; c <= COLS; c++) {
      const x = Math.min(c * CELL_SIZE, LOGICAL_WIDTH - 1) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, LOGICAL_HEIGHT);
    }
    for (let r = 0; r <= ROWS; r++) {
      const y = Math.min(r * CELL_SIZE, LOGICAL_HEIGHT - 1) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(LOGICAL_WIDTH, y);
    }
    ctx.stroke();
  }

  // 経路の中心線と、出現位置（緑）・ゴール位置（赤）の印。
  drawPathLine(path) {
    if (!path) return;
    const { ctx } = this;
    const { points } = path;
    ctx.strokeStyle = "#8a7a54";
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    this.drawMarker(points[0], "#4caf50");
    this.drawMarker(points[points.length - 1], "#e5534b");
  }

  drawMarker(p, color) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEnemies(enemies) {
    if (!enemies) return;
    const { ctx } = this;
    for (const e of enemies) {
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.arc(e.x, e.y, ENEMY_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      // HPバー（満タンでも常時表示）
      const w = 24;
      const x = e.x - w / 2;
      const y = e.y - ENEMY_RADIUS - 7;
      ctx.fillStyle = "#222";
      ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = "#6fcf6f";
      ctx.fillRect(x, y, (w * e.hp) / e.maxHp, 4);
    }
  }
}
