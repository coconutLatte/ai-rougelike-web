import { Position } from '../core/types';
import { TileData, TileType } from '../core/types';

interface PathNode {
  pos: Position;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

function heuristic(a: Position, b: Position): number {
  // Octile distance (allows diagonal movement)
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
}

export function findPath(
  start: Position,
  goal: Position,
  tiles: TileData[][],
  width: number,
  height: number,
): Position[] | null {
  const open: PathNode[] = [];
  const closed = new Set<string>();

  const key = (p: Position) => `${p.x},${p.y}`;

  const startNode: PathNode = {
    pos: start,
    g: 0,
    h: heuristic(start, goal),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  open.push(startNode);

  const neighbors = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  while (open.length > 0) {
    // Find node with lowest f
    let lowestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[lowestIdx].f) {
        lowestIdx = i;
      }
    }

    const current = open.splice(lowestIdx, 1)[0];

    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      // Reconstruct path
      const path: Position[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift(node.pos);
        node = node.parent;
      }
      return path;
    }

    closed.add(key(current.pos));

    for (const n of neighbors) {
      const nx = current.pos.x + n.dx;
      const ny = current.pos.y + n.dy;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (closed.has(key({ x: nx, y: ny }))) continue;
      if (tiles[ny][nx].type === TileType.Wall) continue;
      // Goal tile is walkable even if occupied
      if (!(nx === goal.x && ny === goal.y) && tiles[ny][nx].blocksMovement) continue;

      const g = current.g + 1;
      const h = heuristic({ x: nx, y: ny }, goal);

      const existingIdx = open.findIndex((n) => n.pos.x === nx && n.pos.y === ny);
      if (existingIdx >= 0) {
        if (g < open[existingIdx].g) {
          open[existingIdx].g = g;
          open[existingIdx].f = g + open[existingIdx].h;
          open[existingIdx].parent = current;
        }
        continue;
      }

      open.push({ pos: { x: nx, y: ny }, g, h, f: g + h, parent: current });
    }
  }

  return null; // No path found
}
