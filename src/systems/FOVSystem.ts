import { Visibility, Position } from '../core/types';
import { TileData, TileType } from '../core/types';
import { FOV_RADIUS } from '../utils/constants';

/**
 * Recursive shadowcasting FOV (simplified octant-based).
 * Computes which tiles are visible from an origin point.
 */
export class FOVSystem {
  private tiles: TileData[][];
  private width: number;
  private height: number;
  private radius: number;
  private visibility: Visibility[][];
  private ox = 0;
  private oy = 0;

  constructor(tiles: TileData[][], width: number, height: number) {
    this.tiles = tiles;
    this.width = width;
    this.height = height;
    this.radius = FOV_RADIUS;
    this.visibility = [];
  }

  compute(origin: Position, existingVisibility?: Visibility[][]): Visibility[][] {
    this.ox = origin.x;
    this.oy = origin.y;

    // Initialize visibility grid
    this.visibility = [];
    for (let y = 0; y < this.height; y++) {
      this.visibility[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Preserve previously seen tiles as remembered
        if (
          existingVisibility &&
          existingVisibility[y]?.[x] !== undefined &&
          existingVisibility[y][x] !== Visibility.Unknown
        ) {
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
      this.castOctant(octant);
    }

    // Update tile explored/visible state
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

  /**
   * Cast rays in one octant using recursive shadowcasting.
   */
  private castOctant(octant: number): void {
    // Scan each row (distance from origin) and check visibility
    const slopes: number[] = [];

    for (let row = 1; row <= this.radius; row++) {
      const newSlopes: number[] = [];
      let wasBlocked = false;

      // For each column in this row of the octant
      for (let col = 0; col <= row; col++) {
        const { x, y } = this.transformOctant(this.ox, this.oy, row, col, octant);

        if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

        // Check if this cell is in a shadow from the previous row
        const slope0 = col / (row + 0.5);
        const slope1 = (col + 1) / (row - 0.5);

        // The actual visibility check: is this angle range fully blocked?
        const inShadow = this.isInShadow(slope0, slope1, slopes);

        if (!inShadow) {
          this.markVisible(x, y);
        }

        const blocks = this.tiles[y][x].type === TileType.Wall;

        if (blocks) {
          if (!wasBlocked) {
            newSlopes.push(slope0);
          }
          wasBlocked = true;
        } else {
          if (wasBlocked) {
            newSlopes.push(slope1);
          }
          wasBlocked = false;
        }
      }

      if (wasBlocked) {
        newSlopes.push(1.0);
      }

      slopes.length = 0;
      slopes.push(...newSlopes);
    }
  }

  /**
   * Check if the angle range [a0, a1] falls within any blocked slope pair.
   */
  private isInShadow(a0: number, a1: number, slopes: number[]): boolean {
    for (let i = 0; i < slopes.length; i += 2) {
      const s0 = slopes[i];
      const s1 = slopes[i + 1] ?? 1.0;
      // The range is blocked if it's fully contained within [s0, s1]
      if (a0 >= s0 && a1 <= s1) return true;
    }
    return false;
  }

  private transformOctant(
    ox: number,
    oy: number,
    row: number,
    col: number,
    octant: number,
  ): { x: number; y: number } {
    switch (octant) {
      case 0: return { x: ox + row, y: oy - col };
      case 1: return { x: ox + col, y: oy - row };
      case 2: return { x: ox - col, y: oy - row };
      case 3: return { x: ox - row, y: oy - col };
      case 4: return { x: ox - row, y: oy + col };
      case 5: return { x: ox - col, y: oy + row };
      case 6: return { x: ox + col, y: oy + row };
      case 7: return { x: ox + row, y: oy + col };
      default: return { x: ox + row, y: oy - col };
    }
  }

  private markVisible(x: number, y: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.visibility[y][x] = Visibility.Visible;
    }
  }
}
