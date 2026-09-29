// src/ui/cards.js - UNO Card HTML & SVG Renderer matching skribbl.io aesthetics

import { CARD_COLORS, CARD_TYPES } from '../game/cards.js';

export function getCardColorVariable(color) {
  switch (color) {
    case CARD_COLORS.RED: return 'var(--uno-red)';
    case CARD_COLORS.YELLOW: return 'var(--uno-yellow)';
    case CARD_COLORS.GREEN: return 'var(--uno-green)';
    case CARD_COLORS.BLUE: return 'var(--uno-blue)';
    default: return 'var(--uno-black)';
  }
}

export function getCardSymbol(card) {
  if (card.type === CARD_TYPES.NUMBER) return card.value.toString();
  if (card.type === CARD_TYPES.SKIP) return '⊘';
  if (card.type === CARD_TYPES.REVERSE) return '⇄';
  if (card.type === CARD_TYPES.DRAW_TWO) return '+2';
  if (card.type === CARD_TYPES.WILD) return 'W';
  if (card.type === CARD_TYPES.WILD_DRAW_FOUR) return '+4';
  return '';
}

export function createCardElement(card, options = {}) {
  const { isDiscard = false, isPlayable = true, onClick = null, rotation = 0 } = options;

  const cardDiv = document.createElement('div');
  const sizeClass = isDiscard ? 'uno-card--discard' : 'uno-card--hand';
  cardDiv.className = `uno-card ${sizeClass} uno-card--${card.color} ${isPlayable ? 'uno-card--playable' : 'uno-card--disabled'}`;
  cardDiv.dataset.cardId = card.id;
  cardDiv.dataset.color = card.color;
  cardDiv.setAttribute('role', 'button');
  cardDiv.setAttribute('tabindex', isPlayable ? '0' : '-1');

  // Accessible aria-label
  const colorName = card.color.charAt(0).toUpperCase() + card.color.slice(1);
  const typeName = card.type === CARD_TYPES.NUMBER ? card.value : card.type;
  cardDiv.setAttribute('aria-label', `${colorName} ${typeName}`);

  if (rotation) {
    cardDiv.style.transform = `rotate(${rotation}deg)`;
  }

  const symbol = getCardSymbol(card);
  const isWild = card.color === CARD_COLORS.WILD;

  // Inner card structure: corner indices + center tilted oval + center symbol
  cardDiv.innerHTML = `
    <div class="uno-card__inner">
      <div class="uno-card__corner uno-card__corner--tl">
        ${renderCorner(card, symbol)}
      </div>
      <div class="uno-card__oval ${isWild ? 'uno-card__oval--wild' : ''}">
        ${renderCenterContent(card, symbol)}
      </div>
      <div class="uno-card__corner uno-card__corner--br">
        ${renderCorner(card, symbol)}
      </div>
    </div>
  `;

  if (onClick && isPlayable) {
    cardDiv.addEventListener('click', () => onClick(card));
    cardDiv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(card);
      }
    });
  }

  return cardDiv;
}

function renderCorner(card, symbol) {
  if (card.type === CARD_TYPES.WILD) {
    return `<div class="uno-card__wild-pip"></div>`;
  }
  if (card.type === CARD_TYPES.WILD_DRAW_FOUR) {
    return `<span class="uno-card__pip-text">+4</span>`;
  }
  return `<span class="uno-card__pip-text">${symbol}</span>`;
}

function renderCenterContent(card, symbol) {
  if (card.type === CARD_TYPES.WILD) {
    return `
      <div class="uno-card__wild-wheel">
        <span class="wheel-quad red"></span>
        <span class="wheel-quad blue"></span>
        <span class="wheel-quad yellow"></span>
        <span class="wheel-quad green"></span>
      </div>
    `;
  }
  if (card.type === CARD_TYPES.WILD_DRAW_FOUR) {
    return `
      <div class="uno-card__wild4-symbol">
        <span class="wild4-text">+4</span>
      </div>
    `;
  }
  return `<span class="uno-card__symbol">${symbol}</span>`;
}

export function createCardBackElement(onClick = null) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'uno-card uno-card--back';
  cardDiv.setAttribute('role', 'button');
  cardDiv.setAttribute('aria-label', 'Draw Card');
  cardDiv.innerHTML = `
    <div class="uno-card__inner">
      <div class="uno-card__oval uno-card__oval--back">
        <span class="uno-card__logo-text">UNO</span>
      </div>
    </div>
  `;
  if (onClick) {
    cardDiv.addEventListener('click', onClick);
  }
  return cardDiv;
}
