import { Entity } from './Entity';
import { Position } from '../core/types';
import type { EnemyTemplate, EnemyBehaviorFn } from '../data/enemies';

export class Enemy extends Entity {
  template: EnemyTemplate;
  behavior: EnemyBehaviorFn;
  xpValue: number;

  constructor(template: EnemyTemplate, position: Position) {
    super(template.name, template.glyph, template.color, position, { ...template.stats });
    this.template = template;
    this.xpValue = template.xpValue;
    this.behavior = defaultBehavior;
  }

  takeTurn(): void {
    if (!this.isAlive) return;
    this.behavior(this);
  }
}

/**
 * Default enemy AI: chase player if visible, otherwise wander randomly.
 * The actual AI logic is handled by TurnManager.processEnemyTurns().
 * This behavior function is a placeholder for future per-enemy-type AI.
 */
const defaultBehavior: EnemyBehaviorFn = function (_enemy: Enemy): void {
  // Behavior is handled by TurnManager for the seed implementation.
  // Per-type behavior functions will be used in P1-02.
};
