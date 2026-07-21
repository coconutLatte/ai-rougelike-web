import { GameState, Visibility, TileType, Position } from '../core/types';
import { COLORS } from '../data/colors';
import { TILE_SIZE, VIEWPORT_TILES_X, VIEWPORT_TILES_Y, MAP_WIDTH, MAP_HEIGHT } from '../utils/constants';

export class RenderSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
  }

  draw(state: GameState): void {
    const { player, dungeon, visibility } = state;

    // Calculate viewport (centered on player)
    const viewW = VIEWPORT_TILES_X;
    const viewH = VIEWPORT_TILES_Y;
    const halfW = Math.floor(viewW / 2);
    const halfH = Math.floor(viewH / 2);

    let startX = player.position.x - halfW;
    let startY = player.position.y - halfH;

    // Clamp to map bounds
    if (startX < 0) startX = 0;
    if (startY < 0) startY = 0;
    if (startX + viewW > MAP_WIDTH) startX = MAP_WIDTH - viewW;
    if (startY + viewH > MAP_HEIGHT) startY = MAP_HEIGHT - viewH;

    this.canvas.width = viewW * TILE_SIZE;
    this.canvas.height = viewH * TILE_SIZE;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw tiles
    for (let vy = 0; vy < viewH; vy++) {
      for (let vx = 0; vx < viewW; vx++) {
        const mx = startX + vx;
        const my = startY + vy;

        if (mx < 0 || mx >= dungeon.width || my < 0 || my >= dungeon.height) continue;

        const tile = dungeon.tiles[my][mx];
        const vis = visibility[my]?.[mx] ?? Visibility.Unknown;
        const px = vx * TILE_SIZE;
        const py = vy * TILE_SIZE;

        if (vis === Visibility.Visible) {
          this.drawTile(px, py, tile.type, false);
        } else if (vis === Visibility.Remembered) {
          this.drawTile(px, py, tile.type, true);
        }
        // Unknown tiles stay black (background)
      }
    }

    // Draw entities
    for (const item of state.items) {
      if (this.isInViewport(item.position, startX, startY, viewW, viewH)) {
        const vis = visibility[item.position.y]?.[item.position.x] ?? Visibility.Unknown;
        if (vis === Visibility.Visible) {
          this.drawEntity(
            item.position.x - startX,
            item.position.y - startY,
            item.glyph,
            item.color,
          );
        }
      }
    }

    for (const enemy of state.enemies) {
      if (this.isInViewport(enemy.position, startX, startY, viewW, viewH)) {
        const vis = visibility[enemy.position.y]?.[enemy.position.x] ?? Visibility.Unknown;
        if (vis === Visibility.Visible) {
          this.drawEntity(
            enemy.position.x - startX,
            enemy.position.y - startY,
            enemy.glyph,
            enemy.color,
          );
        }
      }
    }

    // Draw player (always, they're the center)
    this.drawEntity(
      player.position.x - startX,
      player.position.y - startY,
      '@',
      COLORS.player,
    );
  }

  private drawTile(x: number, y: number, type: TileType, dim: boolean): void {
    const ctx = this.ctx;

    switch (type) {
      case TileType.Wall:
        ctx.fillStyle = dim ? COLORS.rememberedWall : COLORS.wall;
        break;
      case TileType.Floor:
        ctx.fillStyle = dim ? COLORS.rememberedFloor : COLORS.floor;
        break;
      case TileType.StairsDown:
        ctx.fillStyle = dim ? COLORS.rememberedFloor : COLORS.floor;
        break;
    }

    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Stairs glyph
    if (type === TileType.StairsDown && !dim) {
      ctx.fillStyle = COLORS.stairs;
      ctx.font = `${TILE_SIZE - 4}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('>', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    }
  }

  private drawEntity(x: number, y: number, glyph: string, color: string): void {
    const ctx = this.ctx;
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    ctx.fillStyle = color;
    ctx.font = `bold ${TILE_SIZE - 2}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, px + TILE_SIZE / 2, py + TILE_SIZE / 2);
  }

  private isInViewport(
    pos: Position,
    startX: number,
    startY: number,
    viewW: number,
    viewH: number,
  ): boolean {
    return (
      pos.x >= startX &&
      pos.x < startX + viewW &&
      pos.y >= startY &&
      pos.y < startY + viewH
    );
  }
}
