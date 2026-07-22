import type { Game } from '../core/Game';
import { Visibility } from '../core/types';
import { manhattanDistance } from '../core/types';
import { findPath } from '../utils/pathfinding';
import { createRNG, randomInt } from '../utils/rng';

export class TurnManager {
  private rng: () => number;

  constructor() {
    this.rng = createRNG(Date.now());
  }

  processEnemyTurns(game: Game): void {
    const { enemies, player, dungeon, visibility } = game.state;

    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;

      // Check if player is visible to enemy
      const pvis =
        visibility[player.position.y]?.[player.position.x] ?? Visibility.Unknown;
      const playerVisible = pvis === Visibility.Visible;

      if (playerVisible) {
        const dist = manhattanDistance(enemy.position, player.position);

        if (dist <= 1) {
          // Adjacent: attack
          game.combat.resolve(enemy, player, game);
          if (!player.isAlive) return;
        } else {
          // Chase player
          const path = findPath(
            enemy.position,
            player.position,
            dungeon.tiles,
            dungeon.width,
            dungeon.height,
          );

          if (path && path.length > 1) {
            const next = path[1];
            // Check if next tile is occupied by another enemy
            const occupied = enemies.some(
              (e) =>
                e !== enemy &&
                e.isAlive &&
                e.position.x === next.x &&
                e.position.y === next.y,
            );
            // Check if it's the player's position
            const isPlayer = player.position.x === next.x && player.position.y === next.y;

            if (isPlayer) {
              game.combat.resolve(enemy, player, game);
              if (!player.isAlive) return;
            } else if (!occupied && !dungeon.tiles[next.y][next.x].blocksMovement) {
              enemy.position = next;
            }
          }
        }
      } else {
        // Wander randomly (25% chance)
        if (this.rng() < 0.25) {
          const dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
          ];
          const dir = dirs[randomInt(this.rng, 0, dirs.length - 1)];
          const nx = enemy.position.x + dir.dx;
          const ny = enemy.position.y + dir.dy;

          // Bounds check before accessing tile data
          if (nx < 0 || nx >= dungeon.width || ny < 0 || ny >= dungeon.height) continue;

          const occupied = enemies.some(
            (e) =>
              e !== enemy &&
              e.isAlive &&
              e.position.x === nx &&
              e.position.y === ny,
          );
          const isPlayer = player.position.x === nx && player.position.y === ny;

          if (isPlayer) {
            game.combat.resolve(enemy, player, game);
          } else if (!occupied && !dungeon.tiles[ny][nx].blocksMovement) {
            enemy.position = { x: nx, y: ny };
          }
        }
      }
    }
  }
}
