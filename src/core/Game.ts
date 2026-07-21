import {
  GameState,
  Action,
  ActionType,
  Visibility,
  Position,
  MessageEntry,
} from './types';
import { TileType } from './types';
import { Dungeon } from './Dungeon';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Item } from '../entities/Item';
import { RenderSystem } from '../systems/RenderSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { FOVSystem } from '../systems/FOVSystem';
import { TurnManager } from '../systems/TurnManager';
import { SaveManager } from '../systems/SaveManager';
import { HUD } from '../ui/HUD';
import { ENEMY_TEMPLATES } from '../data/enemies';
import { ITEM_TEMPLATES } from '../data/items';
import { createRNG, randomInt, randomChoice } from '../utils/rng';
import { MAP_WIDTH, MAP_HEIGHT } from '../utils/constants';

export class Game {
  state!: GameState;
  renderSystem: RenderSystem;
  combat: CombatSystem;
  fovSystem!: FOVSystem;
  turnManager: TurnManager;
  hud: HUD;
  private rng: () => number;

  constructor(canvas: HTMLCanvasElement) {
    this.renderSystem = new RenderSystem(canvas);
    this.combat = new CombatSystem();
    this.turnManager = new TurnManager();
    this.hud = new HUD();
    this.rng = createRNG(Date.now());
  }

  start(dungeonSeed?: number): void {
    const seed = dungeonSeed ?? Date.now();
    this.rng = createRNG(seed);

    // Try loading saved game
    const saved = SaveManager.load();
    if (saved) {
      this.state = saved;
    } else {
      this.state = this.createNewGame(seed);
    }

    this.fovSystem = new FOVSystem(
      this.state.dungeon.tiles,
      this.state.dungeon.width,
      this.state.dungeon.height,
    );

    this.updateVisibility();
    this.renderSystem.draw(this.state);
    this.hud.update(this.state);

    // Welcome message
    if (!saved) {
      this.addMessage('Welcome to the Dungeon! Arrow keys to move.', 'info');
      this.addMessage('Bump into enemies to attack. Find the stairs >.', 'info');
    }
  }

  private createNewGame(seed: number): GameState {
    const dungeon = new Dungeon(seed);

    // Place player in the first room
    const firstRoom = dungeon.rooms[0];
    const playerPos: Position = {
      x: firstRoom.x + Math.floor(firstRoom.width / 2),
      y: firstRoom.y + Math.floor(firstRoom.height / 2),
    };
    const player = new Player(playerPos);

    // Place enemies
    const enemies: Enemy[] = [];
    for (let i = 1; i < dungeon.rooms.length; i++) {
      const room = dungeon.rooms[i];
      const ex = room.x + randomInt(this.rng, 1, room.width - 2);
      const ey = room.y + randomInt(this.rng, 1, room.height - 2);

      // Don't place near player
      if (Math.abs(ex - playerPos.x) + Math.abs(ey - playerPos.y) < 5) continue;

      const template = randomChoice(this.rng, ENEMY_TEMPLATES.slice(0, 3)); // Weaker enemies early
      const enemy = new Enemy(template, { x: ex, y: ey });
      enemies.push(enemy);
    }

    // Place some items
    const items: Item[] = [];
    const itemRooms = dungeon.rooms.slice(1, Math.min(dungeon.rooms.length, 4));
    for (const room of itemRooms) {
      if (this.rng() < 0.7) {
        const ix = room.x + randomInt(this.rng, 1, room.width - 2);
        const iy = room.y + randomInt(this.rng, 1, room.height - 2);
        const template = randomChoice(this.rng, ITEM_TEMPLATES);
        items.push(new Item(template, { x: ix, y: iy }));
      }
    }

    const visibility: Visibility[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      visibility[y] = new Array(MAP_WIDTH).fill(Visibility.Unknown);
    }

    return {
      player,
      enemies,
      items,
      dungeon: {
        width: dungeon.width,
        height: dungeon.height,
        tiles: dungeon.tiles,
        rooms: dungeon.rooms,
      },
      turn: 0,
      currentFloor: 1,
      messageLog: [],
      gameOver: false,
      visibility,
    };
  }

  update(action: Action): void {
    if (this.state.gameOver) return;

    const { player, dungeon } = this.state;

    if (action.type === ActionType.Wait) {
      this.addMessage('You wait...', 'info');
      this.endTurn();
      return;
    }

    // Movement / bump attack
    const nx = player.position.x + action.dx;
    const ny = player.position.y + action.dy;

    // Bounds check
    if (nx < 0 || nx >= dungeon.width || ny < 0 || ny >= dungeon.height) {
      return;
    }

    // Check for wall
    const tile = dungeon.tiles[ny][nx];
    if (tile.type === TileType.Wall) return;

    // Check for enemy at target
    const targetEnemy = this.state.enemies.find(
      (e) => e.isAlive && e.position.x === nx && e.position.y === ny,
    );

    if (targetEnemy) {
      // Bump attack
      this.combat.resolve(player, targetEnemy, this);

      if (!targetEnemy.isAlive) {
        // Grant XP
        const leveledUp = player.gainXp(targetEnemy.xpValue);
        if (leveledUp) {
          this.addMessage(`Level up! You are now level ${player.level}.`, 'success');
        }
      }
    } else {
      // Move
      player.position = { x: nx, y: ny };
    }

    // Check for stairs
    if (tile.type === TileType.StairsDown) {
      this.addMessage('You descend deeper into the dungeon...', 'success');
      this.nextFloor();
      return;
    }

    this.endTurn();
  }

  private endTurn(): void {
    this.state.turn++;

    // Enemy turns
    this.turnManager.processEnemyTurns(this);

    // Update visibility
    this.updateVisibility();

    // Render
    this.renderSystem.draw(this.state);
    this.hud.update(this.state);

    // Auto-save
    SaveManager.save(this.state);
  }

  pickupItem(): void {
    const { player, items } = this.state;
    const item = items.find(
      (i) => i.position.x === player.position.x && i.position.y === player.position.y,
    );

    if (item) {
      // Auto-use potions
      player.inventory.push(item);
      this.state.items = items.filter((i) => i !== item);
      this.addMessage(`You pick up ${item.name}.`, 'success');

      // Auto-use potions on pickup
      if (item.template.stats.hp && item.template.stats.hp > 0) {
        player.useItem(item, this);
      }

      this.endTurn();
    } else {
      this.addMessage('Nothing to pick up here.', 'info');
    }
  }

  private nextFloor(): void {
    this.state.currentFloor++;
    const seed = Date.now() + this.state.currentFloor * 1000;
    const newState = this.createNewGame(seed);

    // Carry over player
    newState.player = this.state.player;
    newState.currentFloor = this.state.currentFloor;
    newState.turn = this.state.turn;

    this.state = newState;
    this.fovSystem = new FOVSystem(
      this.state.dungeon.tiles,
      this.state.dungeon.width,
      this.state.dungeon.height,
    );

    this.updateVisibility();
    this.renderSystem.draw(this.state);
    this.hud.update(this.state);
    SaveManager.save(this.state);

    this.addMessage(`Floor ${this.state.currentFloor} — Be careful...`, 'info');
  }

  updateVisibility(): void {
    this.state.visibility = this.fovSystem.compute(
      this.state.player.position,
      this.state.visibility,
    );
  }

  addMessage(text: string, type: 'info' | 'combat' | 'danger' | 'success' = 'info'): void {
    const entry: MessageEntry = { text, type, turn: this.state.turn };
    this.state.messageLog.push(entry);
    this.hud.addMessage(text, type);
  }

  gameOver(): void {
    this.state.gameOver = true;
    SaveManager.deleteSave();
    this.hud.showOverlay(
      'You Died!',
      `Slain on floor ${this.state.currentFloor} after ${this.state.turn} turns.`,
      'Try Again',
      () => this.restart(),
    );
  }

  restart(): void {
    SaveManager.deleteSave();
    this.hud.hideOverlay();
    this.start();
  }

  save(): void {
    if (SaveManager.save(this.state)) {
      this.addMessage('Game saved.', 'success');
    } else {
      this.addMessage('Failed to save game.', 'danger');
    }
  }
}
