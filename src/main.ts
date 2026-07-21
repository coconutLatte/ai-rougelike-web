import { Game } from './core/Game';
import { InputHandler } from './systems/InputHandler';

function init(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #game-canvas not found');
  }

  const game = new Game(canvas);
  const inputHandler = new InputHandler(game);
  inputHandler.attach();

  game.start();
}

document.addEventListener('DOMContentLoaded', init);
