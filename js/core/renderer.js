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

  // eslint-disable-next-line no-unused-vars
  render(state) {
    const { ctx } = this;
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.fillStyle = "#1e2a1e";
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.drawGrid();
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
}
