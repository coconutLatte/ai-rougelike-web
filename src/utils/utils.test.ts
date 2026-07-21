import { describe, it, expect } from 'vitest';
import { createRNG, randomInt } from './rng';
import { findPath } from './pathfinding';
import { TileData, TileType } from '../core/types';

describe('RNG', () => {
  it('should produce deterministic results with same seed', () => {
    const rng1 = createRNG(42);
    const rng2 = createRNG(42);
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('should produce different results with different seeds', () => {
    const rng1 = createRNG(1);
    const rng2 = createRNG(2);
    // First values should differ
    expect(rng1()).not.toBe(rng2());
  });

  it('randomInt should return values in range', () => {
    const rng = createRNG(123);
    for (let i = 0; i < 100; i++) {
      const val = randomInt(rng, 1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
    }
  });
});

describe('Pathfinding', () => {
  it('should find a path in an open grid', () => {
    const tiles: TileData[][] = [];
    for (let y = 0; y < 10; y++) {
      tiles[y] = [];
      for (let x = 0; x < 10; x++) {
        tiles[y][x] = {
          type: TileType.Floor,
          visible: true,
          explored: true,
          blocksMovement: false,
          blocksVision: false,
        };
      }
    }

    const path = findPath({ x: 0, y: 0 }, { x: 5, y: 5 }, tiles, 10, 10);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
    expect(path![0]).toEqual({ x: 0, y: 0 });
    expect(path![path!.length - 1]).toEqual({ x: 5, y: 5 });
  });

  it('should return null when no path exists (blocked by walls)', () => {
    const tiles: TileData[][] = [];
    for (let y = 0; y < 5; y++) {
      tiles[y] = [];
      for (let x = 0; x < 5; x++) {
        // Create a wall barrier
        const isWall = x === 2;
        tiles[y][x] = {
          type: isWall ? TileType.Wall : TileType.Floor,
          visible: true,
          explored: true,
          blocksMovement: isWall,
          blocksVision: isWall,
        };
      }
    }

    const path = findPath({ x: 0, y: 0 }, { x: 4, y: 0 }, tiles, 5, 5);
    expect(path).toBeNull();
  });
});
