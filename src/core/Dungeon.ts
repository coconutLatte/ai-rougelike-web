import { TileData, TileType, Position, Room } from './types';
import { createTile } from './Tile';
import { createRNG, randomInt } from '../utils/rng';
import { MAP_WIDTH, MAP_HEIGHT, MIN_ROOM_SIZE, MAX_ROOM_SIZE } from '../utils/constants';

export type { Room };

interface BspLeaf {
  x: number;
  y: number;
  width: number;
  height: number;
  left: BspLeaf | null;
  right: BspLeaf | null;
  room: Room | null;
}

export class Dungeon {
  width: number;
  height: number;
  tiles: TileData[][];
  rooms: Room[];

  constructor(seed?: number) {
    this.width = MAP_WIDTH;
    this.height = MAP_HEIGHT;
    this.tiles = [];
    this.rooms = [];
    const rng = createRNG(seed ?? Date.now());
    this.generate(rng);
  }

  private generate(rng: () => number): void {
    // Initialize with walls
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = createTile(TileType.Wall);
      }
    }

    // BSP tree
    const root: BspLeaf = {
      x: 1,
      y: 1,
      width: this.width - 2,
      height: this.height - 2,
      left: null,
      right: null,
      room: null,
    };

    const leaves = this.splitBsp(root, rng, 0);
    this.rooms = [];

    // Place rooms in leaves
    for (const leaf of leaves) {
      const roomW = randomInt(rng, MIN_ROOM_SIZE, Math.min(MAX_ROOM_SIZE, leaf.width - 2));
      const roomH = randomInt(rng, MIN_ROOM_SIZE, Math.min(MAX_ROOM_SIZE, leaf.height - 2));
      const roomX = leaf.x + randomInt(rng, 1, leaf.width - roomW - 1);
      const roomY = leaf.y + randomInt(rng, 1, leaf.height - roomH - 1);

      const room: Room = { x: roomX, y: roomY, width: roomW, height: roomH };
      leaf.room = room;
      this.rooms.push(room);

      // Carve room
      for (let y = roomY; y < roomY + roomH; y++) {
        for (let x = roomX; x < roomX + roomW; x++) {
          this.tiles[y][x] = createTile(TileType.Floor);
        }
      }
    }

    // Connect rooms (walk the BSP tree again)
    this.connectBsp(root, rng);

    // Place stairs in last room
    const lastRoom = this.rooms[this.rooms.length - 1];
    const stairsX = lastRoom.x + Math.floor(lastRoom.width / 2);
    const stairsY = lastRoom.y + Math.floor(lastRoom.height / 2);
    this.tiles[stairsY][stairsX].type = TileType.StairsDown;
  }

  private splitBsp(leaf: BspLeaf, rng: () => number, depth: number): BspLeaf[] {
    const minLeafSize = 8;

    if (depth > 4) {
      return [leaf];
    }

    // Decide split direction
    const canSplitH = leaf.height >= minLeafSize * 2;
    const canSplitV = leaf.width >= minLeafSize * 2;

    if (!canSplitH && !canSplitV) {
      return [leaf];
    }

    const splitH = canSplitH && (!canSplitV || rng() > 0.5);

    if (splitH) {
      const split = randomInt(rng, Math.floor(leaf.height * 0.3), Math.floor(leaf.height * 0.7));
      leaf.left = {
        x: leaf.x,
        y: leaf.y,
        width: leaf.width,
        height: split,
        left: null,
        right: null,
        room: null,
      };
      leaf.right = {
        x: leaf.x,
        y: leaf.y + split,
        width: leaf.width,
        height: leaf.height - split,
        left: null,
        right: null,
        room: null,
      };
    } else {
      const split = randomInt(rng, Math.floor(leaf.width * 0.3), Math.floor(leaf.width * 0.7));
      leaf.left = {
        x: leaf.x,
        y: leaf.y,
        width: split,
        height: leaf.height,
        left: null,
        right: null,
        room: null,
      };
      leaf.right = {
        x: leaf.x + split,
        y: leaf.y,
        width: leaf.width - split,
        height: leaf.height,
        left: null,
        right: null,
        room: null,
      };
    }

    return [
      ...this.splitBsp(leaf.left, rng, depth + 1),
      ...this.splitBsp(leaf.right, rng, depth + 1),
    ];
  }

  private connectBsp(leaf: BspLeaf, rng: () => number): void {
    if (!leaf.left || !leaf.right) return;

    this.connectBsp(leaf.left, rng);
    this.connectBsp(leaf.right, rng);

    // Find rooms in each subtree
    const leftRoom = this.getRoom(leaf.left);
    const rightRoom = this.getRoom(leaf.right);

    if (!leftRoom || !rightRoom) return;

    const lx = leftRoom.x + Math.floor(leftRoom.width / 2);
    const ly = leftRoom.y + Math.floor(leftRoom.height / 2);
    const rx = rightRoom.x + Math.floor(rightRoom.width / 2);
    const ry = rightRoom.y + Math.floor(rightRoom.height / 2);

    // L-shaped corridor
    if (rng() > 0.5) {
      this.carveHCorridor(lx, rx, ly);
      this.carveVCorridor(ly, ry, rx);
    } else {
      this.carveVCorridor(ly, ry, lx);
      this.carveHCorridor(lx, rx, ry);
    }
  }

  private getRoom(leaf: BspLeaf): Room | null {
    if (leaf.room) return leaf.room;
    if (leaf.left) return this.getRoom(leaf.left);
    if (leaf.right) return this.getRoom(leaf.right);
    return null;
  }

  private carveHCorridor(x1: number, x2: number, y: number): void {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    for (let x = start; x <= end; x++) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        this.tiles[y][x] = createTile(TileType.Floor);
      }
    }
  }

  private carveVCorridor(y1: number, y2: number, x: number): void {
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);
    for (let y = start; y <= end; y++) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        this.tiles[y][x] = createTile(TileType.Floor);
      }
    }
  }

  getTile(x: number, y: number): TileData | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.tiles[y][x];
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile !== null && !tile.blocksMovement;
  }

  getStairsPosition(): Position {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].type === TileType.StairsDown) {
          return { x, y };
        }
      }
    }
    // Fallback: last room center
    const room = this.rooms[this.rooms.length - 1];
    return { x: room.x + Math.floor(room.width / 2), y: room.y + Math.floor(room.height / 2) };
  }

  getRandomFloorPosition(rng: () => number): Position {
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = randomInt(rng, 1, this.width - 2);
      const y = randomInt(rng, 1, this.height - 2);
      if (this.tiles[y][x].type === TileType.Floor) {
        return { x, y };
      }
    }
    return { x: 1, y: 1 };
  }
}
