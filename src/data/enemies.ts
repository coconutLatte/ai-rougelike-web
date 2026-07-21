import { Stats } from '../core/types';
import type { Enemy } from '../entities/Enemy';

export interface EnemyTemplate {
  name: string;
  glyph: string;
  color: string;
  stats: Stats;
  xpValue: number;
}

export const ENEMY_TEMPLATES: EnemyTemplate[] = [
  {
    name: 'Rat',
    glyph: 'r',
    color: '#a08060',
    stats: { hp: 6, maxHp: 6, attack: 2, defense: 0 },
    xpValue: 5,
  },
  {
    name: 'Bat',
    glyph: 'b',
    color: '#808080',
    stats: { hp: 4, maxHp: 4, attack: 3, defense: 0 },
    xpValue: 5,
  },
  {
    name: 'Goblin',
    glyph: 'g',
    color: '#40a040',
    stats: { hp: 12, maxHp: 12, attack: 4, defense: 1 },
    xpValue: 10,
  },
  {
    name: 'Skeleton',
    glyph: 's',
    color: '#c0c0c0',
    stats: { hp: 16, maxHp: 16, attack: 5, defense: 2 },
    xpValue: 15,
  },
  {
    name: 'Orc',
    glyph: 'O',
    color: '#c08040',
    stats: { hp: 24, maxHp: 24, attack: 7, defense: 3 },
    xpValue: 25,
  },
];

export type EnemyBehaviorFn = (enemy: Enemy) => void;
