import { Visibility, Position } from '../core/types';
import { TileData, TileType } from '../core/types';
import { FOV_RADIUS } from '../utils/constants';

/**
 * Recursive shadowcasting FOV.
 * Computes which tiles are visible from an origin point.
 */
export class FOVSystem {
  private tiles: TileData[][];
  private width: number;
  private height: number;
  private radius: number;
  private visibility: Visibility[][];

  constructor(tiles: TileData[][], width: number, height: number) {
    this.tiles = tiles;
    this.width = width;
    this.height = height;
    this.radius = FOV_RADIUS;
    this.visibility = [];
  }

  compute(origin: Position, existingVisibility?: Visibility[][]): Visibility[][] {
    // Initialize visibility grid
    this.visibility = [];
    for (let y = 0; y < this.height; y++) {
      this.visibility[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Keep remembered tiles from previous state
        if (existingVisibility && existingVisibility[y]?.[x] === Visibility.Remembered) {
          this.visibility[y][x] = Visibility.Remembered;
        } else {
          this.visibility[y][x] = Visibility.Unknown;
        }
      }
    }

    // Mark origin as visible
    this.markVisible(origin.x, origin.y);

    // Cast rays in all 8 octants
    for (let octant = 0; octant < 8; octant++) {
      this.castRay(origin.x, origin.y, 1, 1.0, 0.0, octant);
    }

    // Also mark explored for all visible tiles
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.visibility[y][x] === Visibility.Visible) {
          this.tiles[y][x].explored = true;
          this.tiles[y][x].visible = true;
        } else if (this.visibility[y][x] === Visibility.Remembered) {
          this.tiles[y][x].visible = false;
        } else {
          this.tiles[y][x].visible = false;
        }
      }
    }

    return this.visibility;
  }

  private castRay(
    ox: number,
    oy: number,
    depth: number,
    startSlope: number,
    endSlope: number,
    octant: number,
  ): void {
    if (depth > this.radius) return;

    let prevBlocked = false;

    const startY = Math.floor(depth * startSlope + 0.5);
    const endY = Math.ceil(depth * endSlope - 0.5);

    for (let dy = startY; dy <= endY; dy++) {
      const dx = depth;
      const { x, y } = this.transformOctant(ox, oy, dx, dy, octant);

      if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

      this.markVisible(x, y);

      const blocks = this.tiles[y][x].type === TileType.Wall;

      if (prevBlocked && !blocks) {
        // Wall corner — reset slope from this point
        const newStart = (dy - 0.5) / (depth + 0.5);
        if (newStart > startSlope) {
          this.castRay(ox, oy, depth + 1, newStart, endSlope, octant);
        }
      }

      if (blocks) {
        if (!prevBlocked) {
          // Wall encountered — recurse with narrowed slope
          const newEnd = (dy - 0.5) / (depth - 0.5);
          if (newEnd > startSlope) {
            this.castRay(ox, oy, depth + 1, startSlope, newEnd, octant);
          }
        }
        prevBlocked = true;
      } else {
        prevBlocked = false;
      }
    }

    // Continue if not fully blocked
    if (!prevBlocked || endSlope > startSlope) {
      this.castRay(ox, oy, depth + 1, startSlope, endSlope, octant);
    }
  }

  private transformOctant(
    ox: number,
    oy: number,
    dx: number,
    dy: number,
    octant: number,
  ): { x: number; y: number } {
    switch (octant) {
      case 0:
        return { x: ox + dx, y: oy - dy };
      case 1:
        return { x: ox + dy, y: oy - dx };
      case 2:
        return { x: ox - dy, y: oy - dx };
      case 3:
        return { x: ox - dx, y: oy - dy };
      case 4:
        return { x: ox - dx, y: oy + dy };
      case 5:
        return { x: ox - dy, y: oy + dx };
      case 6:
        return { x: ox + dy, y: oy + dx };
      case 7:
        return { x: ox + dx, y: oy + dy };
      default:
        return { x: ox + dx, y: oy - dy };
    }
  }

  private markVisible(x: number, y: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.visibility[y][x] = Visibility.Visible;
    }
  }
}
