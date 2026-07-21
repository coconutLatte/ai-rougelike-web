import { Stats } from '../core/types';

export enum ItemType {
  Weapon = 'weapon',
  Armor = 'armor',
  Potion = 'potion',
  Misc = 'misc',
}

export interface ItemTemplate {
  name: string;
  type: ItemType;
  glyph: string;
  color: string;
  stats: Partial<Stats>;
  description: string;
}

export const ITEM_TEMPLATES: ItemTemplate[] = [
  {
    name: 'Health Potion',
    type: ItemType.Potion,
    glyph: '!',
    color: '#e04080',
    stats: { hp: 10 },
    description: 'Restores 10 HP.',
  },
  {
    name: 'Iron Sword',
    type: ItemType.Weapon,
    glyph: '/',
    color: '#c0c0c0',
    stats: { attack: 3 },
    description: '+3 Attack.',
  },
  {
    name: 'Leather Armor',
    type: ItemType.Armor,
    glyph: '[',
    color: '#a08060',
    stats: { defense: 2 },
    description: '+2 Defense.',
  },
  {
    name: 'Strength Potion',
    type: ItemType.Potion,
    glyph: '!',
    color: '#e04040',
    stats: { attack: 2 },
    description: '+2 Attack permanently.',
  },
  {
    name: 'Gold',
    type: ItemType.Misc,
    glyph: '$',
    color: '#e0c040',
    stats: {},
    description: 'Shiny gold coins.',
  },
];
