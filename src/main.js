// src/main.js - UNO Game Controller, Networking, and Screen Coordinator
import './style.css';
import { UnoGameEngine } from './game/engine.js';
import { BotBrain, createBot } from './game/bots.js';
import { CARD_COLORS, CARD_TYPES, isCardPlayable } from './game/cards.js';
import { getDefaultAvatar, saveAvatar, updateAvatarElement, createAvatarElement, AVATAR_LIMITS } from './ui/avatar.js';
import { createCardElement, createCardBackElement } from './ui/cards.js';
import { PlayerList } from './ui/playerList.js';
import { ChatPanel } from './ui/chat.js';
import { sound } from './ui/sound.js';

class UnoApp {
  constructor() {
    this.screen = 'landing';
    this.user = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      name: localStorage.getItem('uno_name') || '',
      avatar: getDefaultAvatar()
    };

    this.room = null;
    this.engine = null;
    this.botBrain = null;
    this.isSinglePlayer = true;
    this.ws = null;
    this.myHand = [];

    // UI Components
    this.lobbyPlayerList = null;
    this.gamePlayerList = null;
    this.gameoverPlayerList = null;
    this.lobbyChat = null;
    this.gameChat = null;
    this.gameoverChat = null;

    this.activeCarouselSlide = 0;
    this.carouselTimer = null;

    this.init();
  }

  init() {
    this.setupLandingUI();
    this.setupLobbyUI();
    this.setupGameUI();
    this.setupGameoverUI();
    this.setupAccessibilityKeys();

    // Check URL parameters for direct room invite: ?room=XYZ
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      this.switchScreen('landing');
      // If room is specified, auto focus name input
      document.querySelector('#player-name-input')?.focus();
    } else {
      this.switchScreen('landing');
    }
  }

  switchScreen(screenName) {
    this.screen = screenName;
    document.body.dataset.screen = screenName;
    window.scrollTo(0, 0);

    // Close any open popovers
    document.querySelector('#settings-popover')?.classList.remove('active');
  }

  /* ========================================================
     LANDING SCREEN SETUP
  ======================================================== */
  setupLandingUI() {
    const nameInput = document.querySelector('#player-name-input');
    if (nameInput) {
      nameInput.value = this.user.name;
      nameInput.addEventListener('input', (e) => {
        this.user.name = e.target.value.trim();
        localStorage.setItem('uno_name', this.user.name);
      });
    }

    // Avatar preview & customization arrows
    this.renderLandingAvatarPreview();

    document.querySelector('#prev-color-btn')?.addEventListener('click', () => {
      this.user.avatar.color = (this.user.avatar.color - 1 + AVATAR_LIMITS.COLORS) % AVATAR_LIMITS.COLORS;
      this.onAvatarChanged();
    });
    document.querySelector('#next-color-btn')?.addEventListener('click', () => {
      this.user.avatar.color = (this.user.avatar.color + 1) % AVATAR_LIMITS.COLORS;
      this.onAvatarChanged();
    });

    document.querySelector('#prev-eye-btn')?.addEventListener('click', () => {
      this.user.avatar.eyes = (this.user.avatar.eyes - 1 + AVATAR_LIMITS.EYES) % AVATAR_LIMITS.EYES;
      this.onAvatarChanged();
    });
    document.querySelector('#next-eye-btn')?.addEventListener('click', () => {
      this.user.avatar.eyes = (this.user.avatar.eyes + 1) % AVATAR_LIMITS.EYES;
      this.onAvatarChanged();
    });

    document.querySelector('#prev-mouth-btn')?.addEventListener('click', () => {
      this.user.avatar.mouth = (this.user.avatar.mouth - 1 + AVATAR_LIMITS.MOUTHS) % AVATAR_LIMITS.MOUTHS;
      this.onAvatarChanged();
    });
    document.querySelector('#next-mouth-btn')?.addEventListener('click', () => {
      this.user.avatar.mouth = (this.user.avatar.mouth + 1) % AVATAR_LIMITS.MOUTHS;
      this.onAvatarChanged();
    });

    document.querySelector('#randomize-avatar-btn')?.addEventListener('click', () => {
      sound.click();
      this.user.avatar = {
        color: Math.floor(Math.random() * AVATAR_LIMITS.COLORS),
        eyes: Math.floor(Math.random() * AVATAR_LIMITS.EYES),
        mouth: Math.floor(Math.random() * AVATAR_LIMITS.MOUTHS)
      };
      this.onAvatarChanged();
    });

    // Decorative bouncing row of avatars under the logo
    this.renderDecorativeBouncingAvatars();

    // How to play carousel
    this.setupHowToPlayCarousel();

    // Play! & Create Private Room buttons
    document.querySelector('#btn-play-public')?.addEventListener('click', () => {
      sound.click();
      this.ensureUserName();
      this.startPublicMatch();
    });

    document.querySelector('#btn-create-private')?.addEventListener('click', () => {
      sound.click();
      this.ensureUserName();
      this.createPrivateRoom();
    });
  }

  ensureUserName() {
    if (!this.user.name) {
      const defaultNames = ['Speedy', 'UnoPlayer', 'DoodleChamp', 'Lucky', 'Captain'];
      this.user.name = defaultNames[Math.floor(Math.random() * defaultNames.length)];
      const nameInput = document.querySelector('#player-name-input');
      if (nameInput) nameInput.value = this.user.name;
      localStorage.setItem('uno_name', this.user.name);
    }
  }

  onAvatarChanged() {
    sound.click();
    saveAvatar(this.user.avatar);
    this.renderLandingAvatarPreview();
  }

  renderLandingAvatarPreview() {
    const previewSlot = document.querySelector('#landing-avatar-preview');
    if (previewSlot) {
      updateAvatarElement(previewSlot, this.user.avatar, 96);
    }
  }

  renderDecorativeBouncingAvatars() {
    const row = document.querySelector('#landing-bouncing-avatars');
    if (!row) return;
    row.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const av = {
        color: (i * 3 + 2) % AVATAR_LIMITS.COLORS,
        eyes: (i * 5 + 4) % AVATAR_LIMITS.EYES,
        mouth: (i * 4 + 3) % AVATAR_LIMITS.MOUTHS
      };
      const el = createAvatarElement(av, 38, i === 1); // 2nd avatar wears a crown!
      el.style.animationDelay = `${i * 90}ms`;
      row.appendChild(el);
    }
  }

  setupHowToPlayCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    const showSlide = (idx) => {
      slides.forEach((s, i) => s.classList.toggle('active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      this.activeCarouselSlide = idx;
    };

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        showSlide(idx);
        this.resetCarouselInterval();
      });
    });

    this.resetCarouselInterval = () => {
      if (this.carouselTimer) clearInterval(this.carouselTimer);
      this.carouselTimer = setInterval(() => {
        const next = (this.activeCarouselSlide + 1) % slides.length;
        showSlide(next);
      }, 4000);
    };

    this.resetCarouselInterval();
  }

  /* ========================================================
     LOBBY SCREEN SETUP
  ======================================================== */
  setupLobbyUI() {
    this.lobbyPlayerList = new PlayerList(
      document.querySelector('#lobby-player-list'),
      this.user.id
    );

    this.lobbyChat = new ChatPanel(
      document.querySelector('#lobby-chat-column'),
      (text) => this.sendChatMessage(text)
    );

    document.querySelector('#btn-lobby-start')?.addEventListener('click', () => {
      sound.click();
      this.startGameFromLobby();
    });

    document.querySelector('#btn-lobby-invite')?.addEventListener('click', () => {
      sound.click();
      const url = `${window.location.origin}${window.location.pathname}?room=${this.room?.id || 'ABCD'}`;
      navigator.clipboard?.writeText(url);
      const textSpan = document.querySelector('#invite-btn-text');
      if (textSpan) {
        textSpan.textContent = 'Copied!';
        setTimeout(() => { textSpan.textContent = 'Invite'; }, 2000);
      }
    });

    document.querySelector('#lobby-gear-btn')?.addEventListener('click', () => {
      this.toggleSettingsPopover();
    });
  }

  /* ========================================================
     GAME SCREEN SETUP
  ======================================================== */
  setupGameUI() {
    this.gamePlayerList = new PlayerList(
      document.querySelector('#game-player-list'),
      this.user.id
    );

    this.gameChat = new ChatPanel(
      document.querySelector('#game-chat-column'),
      (text) => this.sendChatMessage(text)
    );

    // Draw pile click
    const drawSlot = document.querySelector('#draw-pile-slot');
    if (drawSlot) {
      drawSlot.appendChild(createCardBackElement(() => {
        this.handlePlayerDraw();
      }));
    }

    // UNO! Button
    const unoBtn = document.querySelector('#btn-say-uno');
    unoBtn?.addEventListener('click', () => {
      this.handleSayUno();
    });

    // Reaction buttons
    document.querySelector('#btn-react-thumbsup')?.addEventListener('click', () => {
      this.sendReaction('👍');
    });
    document.querySelector('#btn-react-thumbsdown')?.addEventListener('click', () => {
      this.sendReaction('👎');
    });

    // Color chooser overlay squares
    document.querySelectorAll('.color-choice-square').forEach(sq => {
      sq.addEventListener('click', (e) => {
        const color = e.currentTarget.dataset.color;
        this.handleColorChosen(color);
      });
    });

    // Settings popover toggle
    document.querySelector('#game-gear-btn')?.addEventListener('click', () => {
      this.toggleSettingsPopover();
    });

    document.querySelector('#toggle-sound-btn')?.addEventListener('change', (e) => {
      sound.setMuted(!e.target.checked);
    });

    document.querySelector('#btn-leave-game')?.addEventListener('click', () => {
      this.leaveRoom();
    });
  }

  /* ========================================================
     GAMEOVER SCREEN SETUP
  ======================================================== */
  setupGameoverUI() {
    this.gameoverPlayerList = new PlayerList(
      document.querySelector('#gameover-player-list'),
      this.user.id
    );

    this.gameoverChat = new ChatPanel(
      document.querySelector('#gameover-chat-column'),
      (text) => this.sendChatMessage(text)
    );

    document.querySelector('#btn-play-again')?.addEventListener('click', () => {
      sound.click();
      this.startGameFromLobby();
    });

    document.querySelector('#btn-gameover-lobby')?.addEventListener('click', () => {
      sound.click();
      this.switchScreen('lobby');
    });
  }

  setupAccessibilityKeys() {
    window.addEventListener('keydown', (e) => {
      // Focus chat on '/' key if not already typing
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (this.screen === 'game') this.gameChat.focus();
        else if (this.screen === 'lobby') this.lobbyChat.focus();
      }
      // Press 'D' to draw card
      if ((e.key === 'd' || e.key === 'D') && this.screen === 'game' && document.activeElement?.tagName !== 'INPUT') {
        this.handlePlayerDraw();
      }
      // Press 'U' to say UNO!
      if ((e.key === 'u' || e.key === 'U') && this.screen === 'game' && document.activeElement?.tagName !== 'INPUT') {
        this.handleSayUno();
      }
    });
  }

  toggleSettingsPopover() {
    const popover = document.querySelector('#settings-popover');
    popover?.classList.toggle('active');
  }

  /* ========================================================
     MATCHMAKING & GAME LIFECYCLE
  ======================================================== */
  startPublicMatch() {
    // Single player instant bot match or connect to room
    this.isSinglePlayer = true;
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.room = {
      id: roomCode,
      ownerId: this.user.id,
      players: [
        { id: this.user.id, name: this.user.name, avatar: this.user.avatar, isOwner: true, isBot: false, points: 0 }
      ],
      settings: {
        maxPlayers: 4,
        rounds: 3,
        turnTime: 30,
        startingCards: 7,
        houseRules: 'none'
      }
    };

    // Add 3 fun bots
    this.room.players.push(createBot(0)); // Jimmy
    this.room.players.push(createBot(1)); // bigfat0327
    this.room.players.push(createBot(2)); // Ligma

    this.initGameEngine();
    this.switchScreen('game');
    this.engine.startNewGame();

    this.gameChat.addSystemMessage(`${this.user.name} joined the room!`, 'info');
  }

  createPrivateRoom() {
    this.isSinglePlayer = true;
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.room = {
      id: roomCode,
      ownerId: this.user.id,
      players: [
        { id: this.user.id, name: this.user.name, avatar: this.user.avatar, isOwner: true, isBot: false, points: 0 }
      ],
      settings: {
        maxPlayers: parseInt(document.querySelector('#setting-players')?.value || '4'),
        rounds: parseInt(document.querySelector('#setting-rounds')?.value || '3'),
        turnTime: parseInt(document.querySelector('#setting-turntime')?.value || '30'),
        startingCards: parseInt(document.querySelector('#setting-starting-cards')?.value || '7'),
        houseRules: document.querySelector('#setting-house-rules')?.value || 'none'
      }
    };

    // Add bot companions to lobby
    this.room.players.push(createBot(0));
    this.room.players.push(createBot(1));
    this.room.players.push(createBot(2));

    this.switchScreen('lobby');
    this.updateLobbyView();
    this.lobbyChat.addSystemMessage(`${this.user.name} is now the room owner!`, 'owner');
  }

  updateLobbyView() {
    this.lobbyPlayerList.update(this.room.players, null, 'lobby');
    const roundTitle = document.querySelector('#lobby-round-title');
    if (roundTitle) roundTitle.textContent = `Round 1 of ${this.room.settings.rounds}`;
  }

  startGameFromLobby() {
    if (!this.room) return;

    // Read configured settings
    this.room.settings = {
      maxPlayers: parseInt(document.querySelector('#setting-players')?.value || '4'),
      rounds: parseInt(document.querySelector('#setting-rounds')?.value || '3'),
      turnTime: parseInt(document.querySelector('#setting-turntime')?.value || '30'),
      startingCards: parseInt(document.querySelector('#setting-starting-cards')?.value || '7'),
      houseRules: document.querySelector('#setting-house-rules')?.value || 'none'
    };

    this.initGameEngine();
    this.switchScreen('game');
    this.engine.startNewGame();
  }

  initGameEngine() {
    this.engine = new UnoGameEngine(this.room.settings);
    this.engine.setPlayers(this.room.players);

    // Bot Brain
    this.botBrain = new BotBrain(
      this.engine,
      (bot, text) => {
        this.gameChat.addUserMessage(bot.name, text);
      },
      (bot, reaction) => {
        this.gameChat.addSystemMessage(`${bot.name} reacted ${reaction}`, 'info');
      }
    );

    // Hook engine events
    this.engine.onUpdate((event, data, publicState) => {
      this.handleGameEngineEvent(event, data, publicState);
    });
  }

  handleGameEngineEvent(event, data, publicState) {
    const isMyTurn = publicState.currentPlayer?.id === this.user.id;

    // Update Round Title
    const roundTitle = document.querySelector('#game-round-title');
    if (roundTitle) {
      roundTitle.textContent = `Round ${publicState.currentRound} of ${publicState.totalRounds}`;
    }

    // Update Clock timer
    const clockText = document.querySelector('#game-clock-text');
    const clockWrap = document.querySelector('#game-clock-wrap');
    if (clockText) clockText.textContent = publicState.turnTimeLeft;
    if (clockWrap) {
      if (publicState.turnTimeLeft <= 10) clockWrap.classList.add('shake');
      else clockWrap.classList.remove('shake');
    }

    // Update Header Status (Mono)
    const statusEl = document.querySelector('#game-status-mono');
    if (statusEl) {
      if (publicState.state === 'choosing_color') {
        statusEl.textContent = isMyTurn ? 'CHOOSE A COLOR' : `${publicState.currentPlayer?.name.toUpperCase()} IS CHOOSING`;
      } else {
        statusEl.textContent = isMyTurn ? 'YOUR TURN' : `${publicState.currentPlayer?.name.toUpperCase()}'S TURN`;
      }
    }

    // Update Scoreboard / Player List
    this.gamePlayerList.update(publicState.players, publicState.currentPlayer?.id, 'game');

    // Update Discard Pile & Active Color Frame
    this.updateDiscardPile(publicState.topCard, publicState.activeColor);

    // Update Direction Indicator
    const dirIndicator = document.querySelector('#stage-direction-indicator');
    if (dirIndicator) {
      dirIndicator.className = `direction-indicator ${publicState.direction === 1 ? 'clockwise' : 'counter-clockwise'}`;
    }

    // Update Hand Cards
    const me = this.engine.players.find(p => p.id === this.user.id);
    if (me) {
      this.myHand = me.hand;
      this.renderPlayerHand(this.myHand, publicState.topCard, publicState.activeColor, isMyTurn);

      // Update UNO! button state
      const unoBtn = document.querySelector('#btn-say-uno');
      if (unoBtn) {
        const canSayUno = me.hand.length <= 2;
        unoBtn.disabled = !canSayUno;
        unoBtn.classList.toggle('disabled', !canSayUno);
      }
    }

    // Handle Specific Events
    switch (event) {
      case 'round_started':
        this.gameChat.addSystemMessage(`Round ${data.round} started!`, 'info');
        sound.drawCard();
        break;

      case 'card_played':
        sound.playCard();
        this.gameChat.addSystemMessage(`${data.player.name} played a card.`, 'info');
        break;

      case 'player_drew':
        sound.drawCard();
        this.gameChat.addSystemMessage(`${data.player.name} drew a card.`, 'negative');
        break;

      case 'player_penalized':
        sound.skip();
        this.gameChat.addSystemMessage(`${data.player.name} was hit with +${data.cardsDrawn}!`, 'negative');
        break;

      case 'turn_changed':
        if (isMyTurn) sound.click();
        break;

      case 'awaiting_color':
        if (isMyTurn) {
          this.showColorChooser(true);
        } else {
          this.showAnnouncement(`${data.player.name} is choosing a color!`, data.player.avatar);
        }
        break;

      case 'color_chosen':
        this.showColorChooser(false);
        this.hideAnnouncement();
        sound.click();
        this.gameChat.addSystemMessage(`${data.player.name} chose ${data.color.toUpperCase()}!`, 'info');
        break;

      case 'uno_called':
        sound.unoCall();
        this.gameChat.addSystemMessage(`${data.player.name} said UNO!`, 'success');
        break;

      case 'round_ended':
        sound.win();
        this.gameChat.addSystemMessage(`${data.winner.name} won the round! (+${data.roundPoints} points)`, 'success');
        if (data.currentRound < data.totalRounds) {
          setTimeout(() => {
            this.engine.nextRound();
          }, 3500);
        }
        break;

      case 'game_ended':
        sound.win();
        this.showGameOver(data.winner, data.standings);
        break;
    }

    // Bot AI turn trigger
    const activePlayer = this.engine.getCurrentPlayer();
    if (activePlayer && activePlayer.isBot) {
      this.botBrain.handleTurn(activePlayer);
    }
  }

  updateDiscardPile(topCard, activeColor) {
    const discardSlot = document.querySelector('#discard-pile-slot');
    if (!discardSlot || !topCard) return;

    discardSlot.innerHTML = '';
    discardSlot.className = `pile-slot pile-slot--discard active-color-${activeColor || topCard.color}`;

    const rotation = (Math.random() * 12 - 6).toFixed(1);
    const cardEl = createCardElement(topCard, {
      isDiscard: true,
      isPlayable: false,
      rotation
    });
    discardSlot.appendChild(cardEl);
  }

  renderPlayerHand(hand, topCard, activeColor, isMyTurn) {
    const handRow = document.querySelector('#player-hand-row');
    if (!handRow) return;
    handRow.innerHTML = '';

    hand.forEach(card => {
      const playable = isMyTurn && isCardPlayable(card, topCard, activeColor);
      const cardEl = createCardElement(card, {
        isDiscard: false,
        isPlayable: playable,
        onClick: (c) => this.handlePlayCard(c)
      });
      handRow.appendChild(cardEl);
    });
  }

  handlePlayCard(card) {
    if (!this.engine) return;
    this.engine.playCard(this.user.id, card.id);
  }

  handlePlayerDraw() {
    if (!this.engine) return;
    if (this.engine.getCurrentPlayer()?.id !== this.user.id) return;
    this.engine.drawCard(this.user.id);
  }

  handleSayUno() {
    if (!this.engine) return;
    this.engine.sayUno(this.user.id);
  }

  showColorChooser(show) {
    const overlay = document.querySelector('#overlay-color-chooser');
    if (overlay) overlay.classList.toggle('active', show);
  }

  handleColorChosen(color) {
    this.showColorChooser(false);
    if (!this.engine) return;
    this.engine.resolveColorChoice(this.user.id, color);
  }

  showAnnouncement(text, avatar) {
    const overlay = document.querySelector('#overlay-announcement');
    const title = document.querySelector('#announcement-title');
    const slot = document.querySelector('#announcement-avatar-slot');
    if (overlay && title && slot) {
      title.textContent = text;
      updateAvatarElement(slot, avatar, 64);
      overlay.classList.add('active');
    }
  }

  hideAnnouncement() {
    document.querySelector('#overlay-announcement')?.classList.remove('active');
  }

  sendChatMessage(text) {
    if (this.screen === 'game') {
      this.gameChat.addUserMessage(this.user.name, text, true);
    } else if (this.screen === 'lobby') {
      this.lobbyChat.addUserMessage(this.user.name, text, true);
    } else if (this.screen === 'gameover') {
      this.gameoverChat.addUserMessage(this.user.name, text, true);
    }
  }

  sendReaction(emoji) {
    sound.click();
    this.gameChat.addSystemMessage(`${this.user.name} reacted ${emoji}`, 'info');
  }

  showGameOver(winner, standings) {
    this.switchScreen('gameover');
    this.gameoverPlayerList.update(standings, null, 'gameover');

    const winnerNameEl = document.querySelector('#gameover-winner-name');
    const winnerScoreEl = document.querySelector('#gameover-winner-score');
    const winnerAvatarSlot = document.querySelector('#gameover-winner-avatar-slot');
    const runnersList = document.querySelector('#gameover-runners-list');

    if (winnerNameEl) winnerNameEl.textContent = winner.name;
    if (winnerScoreEl) winnerScoreEl.textContent = `Total Points: ${winner.points}`;
    if (winnerAvatarSlot) updateAvatarElement(winnerAvatarSlot, winner.avatar, 96, true);

    if (runnersList) {
      runnersList.innerHTML = '';
      standings.slice(1).forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = 'runner-up-row';
        row.innerHTML = `<span>#${idx + 2} ${p.name}</span><span>${p.points} pts</span>`;
        runnersList.appendChild(row);
      });
    }
  }

  leaveRoom() {
    if (this.engine) {
      this.engine.clearInterval();
    }
    this.switchScreen('landing');
  }
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  new UnoApp();
});
