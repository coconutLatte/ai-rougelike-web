import { GameState } from '../core/types';

export class HUD {
  private hpBar: HTMLElement;
  private hpText: HTMLElement;
  private floorText: HTMLElement;
  private turnText: HTMLElement;
  private atkText: HTMLElement;
  private defText: HTMLElement;
  private levelText: HTMLElement;
  private messageLog: HTMLElement;

  constructor() {
    this.hpBar = document.getElementById('hp-bar')!;
    this.hpText = document.getElementById('hp-text')!;
    this.floorText = document.getElementById('floor-text')!;
    this.turnText = document.getElementById('turn-text')!;
    this.atkText = document.getElementById('atk-text')!;
    this.defText = document.getElementById('def-text')!;
    this.levelText = document.getElementById('level-text')!;
    this.messageLog = document.getElementById('message-log-inner')!;
  }

  update(state: GameState): void {
    const { player, currentFloor, turn } = state;
    const hpPercent = Math.round((player.hp / player.stats.maxHp) * 100);

    this.hpBar.style.width = `${hpPercent}%`;
    this.hpBar.classList.toggle('low', hpPercent < 30);
    this.hpText.textContent = `${player.hp}/${player.stats.maxHp}`;
    this.floorText.textContent = String(currentFloor);
    this.turnText.textContent = String(turn);
    this.atkText.textContent = String(player.stats.attack);
    this.defText.textContent = String(player.stats.defense);
    this.levelText.textContent = String(player.level);
  }

  addMessage(text: string, type: 'info' | 'combat' | 'danger' | 'success' = 'info'): void {
    const el = document.createElement('div');
    el.className = `message ${type}`;
    el.textContent = text;
    this.messageLog.appendChild(el);
    this.messageLog.parentElement!.scrollTop =
      this.messageLog.parentElement!.scrollHeight;

    // Limit messages
    while (this.messageLog.children.length > 100) {
      this.messageLog.firstChild?.remove();
    }
  }

  showOverlay(title: string, message: string, buttonText: string, onAction: () => void): void {
    const overlay = document.getElementById('overlay')!;
    const content = document.getElementById('overlay-content')!;

    content.innerHTML = `
      <h2>${title}</h2>
      <p>${message}</p>
      <button id="overlay-button">${buttonText}</button>
    `;

    overlay.classList.remove('hidden');

    document.getElementById('overlay-button')!.addEventListener('click', () => {
      overlay.classList.add('hidden');
      onAction();
    });
  }

  hideOverlay(): void {
    document.getElementById('overlay')!.classList.add('hidden');
  }
}
