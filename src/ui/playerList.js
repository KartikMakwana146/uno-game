// src/ui/playerList.js - Left Sidebar Scoreboard & Player List

import { createAvatarElement } from './avatar.js';
import arrowGifUrl from '../assets/arrow.gif';

export class PlayerList {
  constructor(containerEl, localPlayerId) {
    this.container = containerEl;
    this.localPlayerId = localPlayerId;
  }

  setLocalPlayerId(id) {
    this.localPlayerId = id;
  }

  update(players = [], activeTurnPlayerId = null, currentScreen = 'game') {
    this.container.innerHTML = '';

    // In game screen, sort by points or keep consistent
    const sorted = [...players].sort((a, b) => (b.points || 0) - (a.points || 0));

    sorted.forEach((player, index) => {
      const isYou = player.id === this.localPlayerId;
      const isActive = player.id === activeTurnPlayerId;
      const rank = index + 1;

      const row = document.createElement('div');
      row.className = `player-row ${index % 2 === 1 ? 'player-row--stripe' : ''} ${isActive ? 'player-row--active' : ''} ${isYou ? 'player-row--you' : ''}`;
      row.dataset.playerId = player.id;

      // Rank or UNO badge
      let badgeHtml = `<span class="player-row__rank">#${rank}</span>`;
      if (currentScreen === 'game' && player.cardCount === 1) {
        badgeHtml = `<span class="player-row__uno-tag">UNO!</span>`;
      }

      // Name & subtitle
      const displayName = isYou ? `${player.name} (You)` : player.name;
      const subInfo = currentScreen === 'game'
        ? `${player.cardCount ?? 0} cards • ${player.points || 0} pts`
        : `${player.points || 0} points`;

      row.innerHTML = `
        <div class="player-row__left">
          ${badgeHtml}
        </div>
        <div class="player-row__info">
          <div class="player-row__name ${isYou ? 'player-row__name--you' : ''}">${this.escapeHTML(displayName)}</div>
          <div class="player-row__points">${subInfo}</div>
        </div>
        <div class="player-row__avatar-wrap">
          ${isActive ? `<img class="player-row__turn-arrow" src="${arrowGifUrl}" alt="turn" />` : ''}
          <div class="player-row__avatar-slot"></div>
        </div>
      `;

      // Mount sprite avatar
      const avatarSlot = row.querySelector('.player-row__avatar-slot');
      const avatarEl = createAvatarElement(player.avatar, 48, !!player.isOwner);
      avatarSlot.appendChild(avatarEl);

      this.container.appendChild(row);
    });
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
