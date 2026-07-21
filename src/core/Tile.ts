import { TileType, TileData } from './types';

export function createTile(type: TileType): TileData {
  const blocksMovement = type === TileType.Wall;
  const blocksVision = type === TileType.Wall;
  return {
    type,
    visible: false,
    explored: false,
    blocksMovement,
    blocksVision,
  };
}

export function isWalkable(tile: TileData): boolean {
  return !tile.blocksMovement;
}
