export interface Position {
  x: number;
  y: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export enum TileType {
  Wall = 0,
  Floor = 1,
  StairsDown = 2,
}

export enum Visibility {
  Unknown = 0,
  Remembered = 1,
  Visible = 2,
}

export enum ActionType {
  Move = 'move',
  Wait = 'wait',
}

export interface Action {
  type: ActionType;
  dx: number;
  dy: number;
}

export interface TileData {
  type: TileType;
  visible: boolean;
  explored: boolean;
  blocksMovement: boolean;
  blocksVision: boolean;
}

export interface GameState {
  player: import('../entities/Player').Player;
  enemies: import('../entities/Enemy').Enemy[];
  items: import('../entities/Item').Item[];
  dungeon: {
    width: number;
    height: number;
    tiles: TileData[][];
    rooms: import('./Dungeon').Room[];
  };
  turn: number;
  currentFloor: number;
  messageLog: MessageEntry[];
  gameOver: boolean;
  visibility: Visibility[][];
}

export interface MessageEntry {
  text: string;
  type: 'info' | 'combat' | 'danger' | 'success';
  turn: number;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function positionEquals(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
