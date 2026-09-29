// src/game/bots.js - AI Bot players with skribbl.io personas, card strategy, and chat banter
import { isCardPlayable, CARD_COLORS, CARD_TYPES } from './cards.js';

export const BOT_NAMES = [
  'Jimmy',
  'bigfat0327',
  'Ligma',
  '•_•',
  'kenchoi',
  'Seongjun',
  'jazz',
  'dirty',
  'speedy',
  'pixel_cat',
  'doodle_king',
  'noobmaster'
];

export function getRandomBotAvatar() {
  return {
    color: Math.floor(Math.random() * 28),
    eyes: Math.floor(Math.random() * 57),
    mouth: Math.floor(Math.random() * 51)
  };
}

export function createBot(nameIndex = 0) {
  const name = BOT_NAMES[nameIndex % BOT_NAMES.length];
  return {
    id: `bot_${Math.random().toString(36).substring(2, 9)}`,
    name,
    avatar: getRandomBotAvatar(),
    isBot: true,
    isOwner: false,
    points: 0,
    hand: []
  };
}

export class BotBrain {
  constructor(engine, onChatMessage, onReaction) {
    this.engine = engine;
    this.onChatMessage = onChatMessage;
    this.onReaction = onReaction;
    this.thinkingTimeout = null;
  }

  handleTurn(player) {
    if (!player || !player.isBot) return;
    this.clearThinking();

    // Natural delay to mimic human thinking (900ms - 1800ms)
    const delay = 900 + Math.random() * 900;
    this.thinkingTimeout = setTimeout(() => {
      this.makeMove(player);
    }, delay);
  }

  clearThinking() {
    if (this.thinkingTimeout) {
      clearTimeout(this.thinkingTimeout);
      this.thinkingTimeout = null;
    }
  }

  makeMove(player) {
    if (this.engine.state === 'choosing_color') {
      this.handleBotColorChoice(player);
      return;
    }

    if (this.engine.state !== 'turn' || this.engine.getCurrentPlayer()?.id !== player.id) {
      return;
    }

    const topCard = this.engine.getTopCard();
    const activeColor = this.engine.activeColor;
    const hand = player.hand;

    // Find all playable cards
    const playable = hand.filter(c => isCardPlayable(c, topCard, activeColor));

    // Bot UNO call logic: If hand will be 1 after this move, 95% chance to call UNO beforehand or simultaneously
    if (hand.length === 2 && Math.random() < 0.95) {
      setTimeout(() => {
        this.engine.sayUno(player.id);
      }, 300);
    }

    if (playable.length > 0) {
      // Prioritize cards: Action cards > Number cards matching color > Wilds
      let chosenCard = null;

      // 1. Try to play Action cards (+2, Skip, Reverse) to disrupt opponents
      const actionCards = playable.filter(c => [CARD_TYPES.DRAW_TWO, CARD_TYPES.SKIP, CARD_TYPES.REVERSE].includes(c.type));
      if (actionCards.length > 0) {
        chosenCard = actionCards[Math.floor(Math.random() * actionCards.length)];
      } else {
        // 2. Play number cards that match the active color
        const colorMatches = playable.filter(c => c.color === activeColor);
        if (colorMatches.length > 0) {
          // Play higher score card first to reduce penalty
          colorMatches.sort((a, b) => b.score - a.score);
          chosenCard = colorMatches[0];
        } else {
          // 3. Play any other playable non-wild
          const nonWilds = playable.filter(c => c.color !== CARD_COLORS.WILD);
          if (nonWilds.length > 0) {
            chosenCard = nonWilds[0];
          } else {
            // 4. Play Wild or Wild Draw 4
            chosenCard = playable[0];
          }
        }
      }

      this.engine.playCard(player.id, chosenCard.id);

      // If playing Wild, trigger bot color choice
      if (chosenCard.color === CARD_COLORS.WILD && this.engine.state === 'choosing_color') {
        setTimeout(() => {
          this.handleBotColorChoice(player);
        }, 800 + Math.random() * 600);
      }
    } else {
      // Must draw a card
      const drawResult = this.engine.drawCard(player.id);
      if (drawResult && drawResult.canPlay) {
        // Bot plays drawn card if playable
        setTimeout(() => {
          if (this.engine.getCurrentPlayer()?.id === player.id) {
            this.engine.playCard(player.id, drawResult.card.id);
            if (drawResult.card.color === CARD_COLORS.WILD && this.engine.state === 'choosing_color') {
              setTimeout(() => this.handleBotColorChoice(player), 700);
            }
          }
        }, 700);
      }
    }
  }

  handleBotColorChoice(player) {
    if (this.engine.getCurrentPlayer()?.id !== player.id) return;

    // Pick the color the bot has the most of in hand
    const colorCounts = {
      [CARD_COLORS.RED]: 0,
      [CARD_COLORS.YELLOW]: 0,
      [CARD_COLORS.GREEN]: 0,
      [CARD_COLORS.BLUE]: 0
    };

    for (const card of player.hand) {
      if (colorCounts[card.color] !== undefined) {
        colorCounts[card.color]++;
      }
    }

    let bestColor = CARD_COLORS.RED;
    let maxCount = -1;
    for (const [col, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        bestColor = col;
      }
    }

    this.engine.resolveColorChoice(player.id, bestColor);
  }
}
