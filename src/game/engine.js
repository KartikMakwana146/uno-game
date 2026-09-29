// src/game/engine.js - Full UNO Game Engine
import { createDeck, shuffleDeck, isCardPlayable, CARD_COLORS, CARD_TYPES } from './cards.js';

export class UnoGameEngine {
  constructor(options = {}) {
    this.options = {
      startingCards: options.startingCards || 7,
      rounds: options.rounds || 3,
      turnTime: options.turnTime || 30,
      houseRules: options.houseRules || 'none', // 'none' | 'stacking' | 'jumpin'
      ...options
    };

    this.currentRound = 1;
    this.totalRounds = this.options.rounds;
    this.players = []; // [{ id, name, avatar, isBot, hand: [], points: 0, calledUno: false, connected: true }]
    this.drawPile = [];
    this.discardPile = [];
    this.currentTurnIndex = 0;
    this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    this.activeColor = null;
    this.state = 'idle'; // 'idle' | 'waiting' | 'turn' | 'choosing_color' | 'round_over' | 'game_over'
    this.pendingWildCard = null;
    this.stackedPenalty = 0; // For stacking house rules
    this.turnTimeLeft = this.options.turnTime;
    this.timerInterval = null;
    this.lastAction = null;
    this.listeners = new Set();
  }

  onUpdate(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(event, data = {}) {
    for (const listener of this.listeners) {
      try {
        listener(event, data, this.getPublicState());
      } catch (err) {
        console.error('Error in game listener:', err);
      }
    }
  }

  setPlayers(playerList) {
    this.players = playerList.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isBot: !!p.isBot,
      isOwner: !!p.isOwner,
      hand: [],
      points: p.points || 0,
      calledUno: false,
      connected: p.connected !== false
    }));
  }

  startNewGame() {
    this.currentRound = 1;
    for (const p of this.players) {
      p.points = 0;
    }
    this.startRound();
  }

  startRound() {
    this.clearInterval();
    this.drawPile = shuffleDeck(createDeck());
    this.discardPile = [];
    this.direction = 1;
    this.stackedPenalty = 0;
    this.state = 'turn';

    // Deal cards to players
    for (const player of this.players) {
      player.hand = [];
      player.calledUno = false;
      for (let i = 0; i < this.options.startingCards; i++) {
        if (this.drawPile.length === 0) this.refillDrawPile();
        player.hand.push(this.drawPile.pop());
      }
    }

    // Flip the first card to discard pile. If it's a Wild Draw 4, reshuffle and draw another.
    let firstCard = this.drawPile.pop();
    while (firstCard.type === CARD_TYPES.WILD_DRAW_FOUR) {
      this.drawPile.unshift(firstCard);
      this.drawPile = shuffleDeck(this.drawPile);
      firstCard = this.drawPile.pop();
    }

    this.discardPile.push(firstCard);
    this.activeColor = firstCard.color === CARD_COLORS.WILD ? CARD_COLORS.RED : firstCard.color;

    // Apply first card effect if it's an action card
    this.currentTurnIndex = 0;
    this.applyFirstCardEffect(firstCard);

    this.startTurnTimer();
    this.notify('round_started', {
      round: this.currentRound,
      totalRounds: this.totalRounds,
      firstCard
    });
  }

  applyFirstCardEffect(card) {
    if (card.type === CARD_TYPES.SKIP) {
      this.advanceTurn();
    } else if (card.type === CARD_TYPES.REVERSE) {
      if (this.players.length === 2) {
        this.advanceTurn();
      } else {
        this.direction *= -1;
      }
    } else if (card.type === CARD_TYPES.DRAW_TWO) {
      const target = this.players[this.currentTurnIndex];
      this.dealCards(target, 2);
      this.advanceTurn();
    }
  }

  refillDrawPile() {
    if (this.discardPile.length <= 1) return;
    const topCard = this.discardPile.pop();
    this.drawPile = shuffleDeck(this.discardPile);
    this.discardPile = [topCard];
  }

  dealCards(player, count) {
    const dealt = [];
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) this.refillDrawPile();
      if (this.drawPile.length > 0) {
        const card = this.drawPile.pop();
        player.hand.push(card);
        dealt.push(card);
      }
    }
    // If player had called UNO, drawing removes UNO status if hand > 1
    if (player.hand.length > 1) {
      player.calledUno = false;
    }
    return dealt;
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  getTopCard() {
    return this.discardPile[this.discardPile.length - 1];
  }

  startTurnTimer() {
    this.clearInterval();
    this.turnTimeLeft = this.options.turnTime;
    this.timerInterval = setInterval(() => {
      this.turnTimeLeft--;
      this.notify('timer_tick', { timeLeft: this.turnTimeLeft });

      if (this.turnTimeLeft <= 0) {
        this.handleTurnTimeout();
      }
    }, 1000);
  }

  clearInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleTurnTimeout() {
    this.clearInterval();
    const player = this.getCurrentPlayer();
    if (!player) return;

    if (this.state === 'choosing_color') {
      // Auto pick random color if timed out on color choice
      const colors = [CARD_COLORS.RED, CARD_COLORS.YELLOW, CARD_COLORS.GREEN, CARD_COLORS.BLUE];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      this.resolveColorChoice(player.id, randomColor);
      return;
    }

    // Auto-draw a card and pass
    const drawn = this.dealCards(player, 1);
    this.notify('player_drew', {
      player,
      count: 1,
      timeout: true,
      card: drawn[0]
    });
    this.advanceTurn();
  }

  playCard(playerId, cardId) {
    if (this.state !== 'turn') return { success: false, reason: 'Not in turn state' };
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) return { success: false, reason: 'Not your turn' };

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, reason: 'Card not in hand' };

    const card = player.hand[cardIndex];
    const topCard = this.getTopCard();

    if (!isCardPlayable(card, topCard, this.activeColor)) {
      return { success: false, reason: 'Card cannot be played' };
    }

    // Check UNO call rule:
    // If playing down to 1 card and player didn't call UNO, other players can catch them
    // or we mark whether they called UNO
    player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);

    if (card.color !== CARD_COLORS.WILD) {
      this.activeColor = card.color;
    }

    this.notify('card_played', {
      player,
      card,
      handCount: player.hand.length
    });

    // Check if player won the round
    if (player.hand.length === 0) {
      this.endRound(player);
      return { success: true };
    }

    // Check special action cards
    if (card.type === CARD_TYPES.WILD || card.type === CARD_TYPES.WILD_DRAW_FOUR) {
      this.state = 'choosing_color';
      this.pendingWildCard = card;
      this.startTurnTimer();
      this.notify('awaiting_color', { player, card });
      return { success: true };
    }

    if (card.type === CARD_TYPES.SKIP) {
      this.advanceTurn(2); // Skip next player
    } else if (card.type === CARD_TYPES.REVERSE) {
      if (this.players.length === 2) {
        this.advanceTurn(2);
      } else {
        this.direction *= -1;
        this.advanceTurn(1);
      }
    } else if (card.type === CARD_TYPES.DRAW_TWO) {
      const nextIndex = this.getNextTurnIndex(1);
      const nextPlayer = this.players[nextIndex];
      this.dealCards(nextPlayer, 2);
      this.notify('player_penalized', {
        player: nextPlayer,
        cardsDrawn: 2,
        reason: 'Draw Two'
      });
      this.advanceTurn(2);
    } else {
      this.advanceTurn(1);
    }

    return { success: true };
  }

  resolveColorChoice(playerId, color) {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) return;

    this.activeColor = color;
    const wildCard = this.pendingWildCard;
    this.pendingWildCard = null;
    this.state = 'turn';

    this.notify('color_chosen', { player, color });

    if (wildCard && wildCard.type === CARD_TYPES.WILD_DRAW_FOUR) {
      const nextIndex = this.getNextTurnIndex(1);
      const nextPlayer = this.players[nextIndex];
      this.dealCards(nextPlayer, 4);
      this.notify('player_penalized', {
        player: nextPlayer,
        cardsDrawn: 4,
        reason: 'Wild Draw Four'
      });
      this.advanceTurn(2);
    } else {
      this.advanceTurn(1);
    }
  }

  drawCard(playerId) {
    if (this.state !== 'turn') return { success: false, reason: 'Not in turn state' };
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) return { success: false, reason: 'Not your turn' };

    const drawn = this.dealCards(player, 1);
    this.notify('player_drew', {
      player,
      count: 1,
      card: drawn[0]
    });

    // Check if drawn card is immediately playable
    const topCard = this.getTopCard();
    const canPlayDrawn = drawn[0] && isCardPlayable(drawn[0], topCard, this.activeColor);

    if (!canPlayDrawn) {
      this.advanceTurn(1);
    } else {
      // Reset timer so player can choose to play the drawn card
      this.startTurnTimer();
    }

    return { success: true, card: drawn[0], canPlay: canPlayDrawn };
  }

  passTurn(playerId) {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== playerId) return { success: false };
    this.advanceTurn(1);
    return { success: true };
  }

  sayUno(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;

    // Rule: Saying UNO is valid if you have 1 card or 2 cards
    if (player.hand.length <= 2) {
      player.calledUno = true;
      this.notify('uno_called', { player });
      return true;
    }
    return false;
  }

  catchUno(accuserPlayerId, accusedPlayerId) {
    const accused = this.players.find(p => p.id === accusedPlayerId);
    if (!accused) return false;

    // If accused player has 1 card and did NOT call UNO, penalty 2 cards!
    if (accused.hand.length === 1 && !accused.calledUno) {
      this.dealCards(accused, 2);
      this.notify('uno_caught', {
        accuser: this.players.find(p => p.id === accuserPlayerId),
        accused,
        penalty: 2
      });
      return true;
    }
    return false;
  }

  getNextTurnIndex(steps = 1) {
    const count = this.players.length;
    let next = (this.currentTurnIndex + this.direction * steps) % count;
    if (next < 0) next += count;
    return next;
  }

  advanceTurn(steps = 1) {
    this.currentTurnIndex = this.getNextTurnIndex(steps);
    this.startTurnTimer();
    this.notify('turn_changed', {
      currentPlayer: this.getCurrentPlayer(),
      direction: this.direction
    });
  }

  endRound(winner) {
    this.clearInterval();
    this.state = 'round_over';

    // Calculate score: winner gains points from all other players' remaining hands
    let roundPoints = 0;
    for (const player of this.players) {
      if (player.id !== winner.id) {
        for (const card of player.hand) {
          roundPoints += card.score || 0;
        }
      }
    }
    winner.points += roundPoints;

    this.notify('round_ended', {
      winner,
      roundPoints,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds
    });

    if (this.currentRound >= this.totalRounds) {
      this.endGame();
    }
  }

  nextRound() {
    this.currentRound++;
    this.startRound();
  }

  endGame() {
    this.clearInterval();
    this.state = 'game_over';
    const sorted = [...this.players].sort((a, b) => b.points - a.points);
    const overallWinner = sorted[0];

    this.notify('game_ended', {
      winner: overallWinner,
      standings: sorted
    });
  }

  getPublicState() {
    return {
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      direction: this.direction,
      activeColor: this.activeColor,
      topCard: this.getTopCard(),
      state: this.state,
      turnTimeLeft: this.turnTimeLeft,
      currentTurnIndex: this.currentTurnIndex,
      currentPlayer: this.getCurrentPlayer(),
      drawPileCount: this.drawPile.length,
      discardPileCount: this.discardPile.length,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isBot: p.isBot,
        isOwner: p.isOwner,
        cardCount: p.hand.length,
        points: p.points,
        calledUno: p.calledUno,
        connected: p.connected
      }))
    };
  }
}
