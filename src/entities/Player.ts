import { Entity } from './Entity';
import { Stats, Position } from '../core/types';
import type { Game } from '../core/Game';
import type { Item } from './Item';
import { ItemType } from './Item';

export class Player extends Entity {
  xp: number;
  level: number;
  inventory: Item[];

  constructor(position: Position) {
    const stats: Stats = { hp: 20, maxHp: 20, attack: 5, defense: 2 };
    super('Adventurer', '@', '#4ae04a', position, stats);
    this.xp = 0;
    this.level = 1;
    this.inventory = [];
  }

  takeTurn(_game: Game): void {
    // Player turns are driven by input, not AI.
  }

  gainXp(amount: number): boolean {
    this.xp += amount;
    const xpNeeded = this.level * 15;
    if (this.xp >= xpNeeded) {
      this.xp -= xpNeeded;
      this.levelUp();
      return true;
    }
    return false;
  }

  levelUp(): void {
    this.level++;
    this.stats.maxHp += 5;
    this.stats.hp = this.stats.maxHp;
    this.stats.attack += 1;
    this.stats.defense += 1;
  }

  useItem(item: Item, game: Game): void {
    if (item.template.type === ItemType.Potion) {
      const { hp, attack, defense } = item.template.stats;
      if (hp) {
        this.heal(hp);
        game.addMessage(`You drink the ${item.template.name}. +${hp} HP.`, 'success');
      }
      if (attack) {
        this.stats.attack += attack;
        game.addMessage(
          `You drink the ${item.template.name}. +${attack} Attack!`,
          'success',
        );
      }
      if (defense) {
        this.stats.defense += defense;
        game.addMessage(
          `You drink the ${item.template.name}. +${defense} Defense!`,
          'success',
        );
      }
      // Remove from inventory
      const idx = this.inventory.indexOf(item);
      if (idx >= 0) this.inventory.splice(idx, 1);
    }
  }
}
