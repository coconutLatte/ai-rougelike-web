import { Entity } from '../entities/Entity';
import { createRNG, randomInt } from '../utils/rng';
import type { Game } from '../core/Game';

export class CombatSystem {
  private rng: () => number;

  constructor(seed?: number) {
    this.rng = createRNG(seed ?? Date.now());
  }

  /**
   * Resolve an attack from attacker to defender.
   * Returns the actual damage dealt.
   */
  resolve(attacker: Entity, defender: Entity, game: Game): number {
    const baseDamage = Math.max(1, attacker.attack - defender.defense);
    const variance = randomInt(this.rng, -2, 2);
    const damage = Math.max(1, baseDamage + variance);

    const killed = defender.takeDamage(damage);

    game.addMessage(
      `${attacker.name} hits ${defender.name} for ${damage} damage!`,
      'combat',
    );

    if (killed) {
      game.addMessage(`${defender.name} is slain!`, 'danger');

      if (defender === game.state.player) {
        game.gameOver();
      }
    }

    return damage;
  }
}
