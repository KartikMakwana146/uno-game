// src/game/cards.js - Card definitions, deck generator, and validation logic

export const CARD_COLORS = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
  BLUE: 'blue',
  WILD: 'wild'
};

export const CARD_TYPES = {
  NUMBER: 'number',
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'draw2',
  WILD: 'wild',
  WILD_DRAW_FOUR: 'wild4'
};

/**
 * Creates a standard 108-card UNO deck
 */
export function createDeck() {
  const deck = [];
  let id = 1;
  const standardColors = [CARD_COLORS.RED, CARD_COLORS.YELLOW, CARD_COLORS.GREEN, CARD_COLORS.BLUE];

  // Number cards and action cards for each color
  for (const color of standardColors) {
    // Exactly one 0 card per color
    deck.push({
      id: `c_${id++}`,
      color,
      type: CARD_TYPES.NUMBER,
      value: 0,
      score: 0
    });

    // Two of each 1-9 per color
    for (let num = 1; num <= 9; num++) {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({
          id: `c_${id++}`,
          color,
          type: CARD_TYPES.NUMBER,
          value: num,
          score: num
        });
      }
    }

    // Two Skip, two Reverse, two Draw Two per color
    for (let copy = 0; copy < 2; copy++) {
      deck.push({
        id: `c_${id++}`,
        color,
        type: CARD_TYPES.SKIP,
        value: 'skip',
        score: 20
      });
      deck.push({
        id: `c_${id++}`,
        color,
        type: CARD_TYPES.REVERSE,
        value: 'reverse',
        score: 20
      });
      deck.push({
        id: `c_${id++}`,
        color,
        type: CARD_TYPES.DRAW_TWO,
        value: '+2',
        score: 20
      });
    }
  }

  // Four Wild cards and four Wild Draw Four cards
  for (let copy = 0; copy < 4; copy++) {
    deck.push({
      id: `c_${id++}`,
      color: CARD_COLORS.WILD,
      type: CARD_TYPES.WILD,
      value: 'wild',
      score: 50
    });
    deck.push({
      id: `c_${id++}`,
      color: CARD_COLORS.WILD,
      type: CARD_TYPES.WILD_DRAW_FOUR,
      value: '+4',
      score: 50
    });
  }

  return deck;
}

/**
 * Fisher-Yates shuffle
 */
export function shuffleDeck(cards) {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Checks if a card is legally playable on the current discard pile and active color
 */
export function isCardPlayable(card, topCard, activeColor) {
  if (!card) return false;
  // Wild cards can always be played
  if (card.color === CARD_COLORS.WILD) return true;

  // Active color takes precedence (e.g. after a wild was played)
  if (activeColor && card.color === activeColor) return true;

  // Match by base color if no wild activeColor override
  if (card.color === topCard.color) return true;

  // Match by value or action symbol
  if (card.value !== undefined && topCard.value !== undefined && card.value === topCard.value) {
    return true;
  }

  return false;
}
