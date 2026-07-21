import { Position } from '../core/types';
import { ItemTemplate, ItemType } from '../data/items';

export { ItemType };
export type { ItemTemplate };

export class Item {
  template: ItemTemplate;
  position: Position;
  glyph: string;
  color: string;
  name: string;

  constructor(template: ItemTemplate, position: Position) {
    this.template = template;
    this.position = { ...position };
    this.glyph = template.glyph;
    this.color = template.color;
    this.name = template.name;
  }
}
