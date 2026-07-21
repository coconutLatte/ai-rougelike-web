export const TILE_SIZE = 24;
export const MAP_WIDTH = 50;
export const MAP_HEIGHT = 30;
export const VIEWPORT_TILES_X = 29;
export const VIEWPORT_TILES_Y = 19;
export const FOV_RADIUS = 8;
export const MIN_ROOM_SIZE = 4;
export const MAX_ROOM_SIZE = 10;
export const MIN_ROOMS = 6;
export const MAX_ROOMS = 10;

export const SAVE_KEY = 'ai-roguelike-save';

export const KEY_BINDINGS: Record<string, { dx: number; dy: number }> = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  k: { dx: 0, dy: -1 },
  j: { dx: 0, dy: 1 },
  h: { dx: -1, dy: 0 },
  l: { dx: 1, dy: 0 },
  y: { dx: -1, dy: -1 },
  u: { dx: 1, dy: -1 },
  b: { dx: -1, dy: 1 },
  n: { dx: 1, dy: 1 },
};
