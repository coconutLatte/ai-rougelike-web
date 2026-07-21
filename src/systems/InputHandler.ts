import { Action, ActionType } from '../core/types';
import { KEY_BINDINGS } from '../utils/constants';
import type { Game } from '../core/Game';

export class InputHandler {
  private game: Game;
  private boundHandler: (e: KeyboardEvent) => void;

  constructor(game: Game) {
    this.game = game;
    this.boundHandler = this.handleKey.bind(this);
  }

  attach(): void {
    window.addEventListener('keydown', this.boundHandler);
  }

  detach(): void {
    window.removeEventListener('keydown', this.boundHandler);
  }

  private handleKey(e: KeyboardEvent): void {
    if (this.game.state.gameOver) {
      if (e.key === 'Enter' || e.key === ' ') {
        this.game.restart();
      }
      return;
    }

    const binding = KEY_BINDINGS[e.key];
    if (binding) {
      e.preventDefault();
      const action: Action = {
        type: ActionType.Move,
        dx: binding.dx,
        dy: binding.dy,
      };
      this.game.update(action);
      return;
    }

    // Wait / pass turn
    if (e.key === '.' || e.key === '5') {
      e.preventDefault();
      this.game.update({ type: ActionType.Wait, dx: 0, dy: 0 });
      return;
    }

    // Pickup
    if (e.key === 'g' || e.key === ',') {
      e.preventDefault();
      this.game.pickupItem();
      return;
    }

    // Save
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      this.game.save();
      return;
    }
  }
}
