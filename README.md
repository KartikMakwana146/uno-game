# UNO Online — skribbl.io Style

An online multiplayer UNO card game styled after the iconic **skribbl.io** visual design aesthetic: doodle-blue tiled world, sprite-layered pixel avatars, chunky high-contrast cards, retro game-room UI, and real-time multiplayer gameplay with smart AI bot opponents.

---

## ✨ Features

- **🎨 Authentic skribbl.io Aesthetic**:
  - Hand-drawn doodle tiled background (`background.png`).
  - Signature 3-column layout: Player scoreboard (left), 800×600 slate stage (center), striped chat panel (right), under a clean white status header bar.
  - Multi-layer sprite avatar customizer with 28 body colors, 57 eye styles, 51 mouth types, and a dice randomizer.
  - Skribbl-styled announcement overlays (e.g. *"Jimmy is choosing a color!"*) with live animated avatars.
  - Slanted royal-blue section on the landing page with interactive 5-slide "How to play" carousel.

- **🃏 Complete UNO Gameplay**:
  - Full 108-card official deck (Numbers 0–9 in 4 colors, Skip, Reverse, Draw Two, Wild, and Wild Draw Four).
  - Proper action card mechanics, play-direction indicator, card-drawing penalties, and reshuffling.
  - Big red retro **UNO!** call button enabled on 1–2 cards with caught-out penalties.
  - Discard pile framed by a glowing/flat border matching the current active color.
  - Flat, chunky cards with thick black borders, tilted center ovals, and outlined typography.

- **🤖 Solo & Multiplayer Ready**:
  - **Instant Matchmaking**: Jump right into action against intelligent AI bots with distinct personalities, realistic thinking delays, strategic card selection, and chat banter.
  - **Private Rooms**: Create private rooms, adjust game settings (rounds, turn time, house rules, players count), and share instant join links (`?room=XYZ`).
  - **Node.js WebSocket Server**: Lightweight, production-ready backend following clean patterns with health checks and room state management.

- **🔊 Audio & Accessibility**:
  - Zero-latency synthesized sound effects using the Web Audio API (card play, draw, skip, trumpet fanfare, UNO shouting sound, mute toggle).
  - Keyboard shortcuts:
    - <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd>: Navigate playable hand cards
    - <kbd>Enter</kbd> / <kbd>Space</kbd>: Play selected card
    - <kbd>D</kbd>: Draw card from deck
    - <kbd>U</kbd>: Shout UNO!
    - <kbd>/</kbd>: Focus chat input

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, Vanilla CSS (Custom Properties / Design Tokens), ES Modules JavaScript.
- **Bundler & Dev Server**: [Vite](https://vite.dev/)
- **Backend**: Node.js HTTP & [ws](https://github.com/websockets/ws) WebSocket server.
- **Design Guidelines**: Adheres strictly to [DESIGN.md](./DESIGN.md) and [Project_Folders_Structure_Blueprint.md](./Project_Folders_Structure_Blueprint.md).

---

## 📁 Project Structure

```
UNO-game-bwp/
├── public/                                # Public static assets
├── src/                                   # Frontend source code
│   ├── assets/                            # skribbl.io theme art & sprite atlases
│   │   ├── avatar/                        # 480x480 sprite atlases (color, eye, mouth)
│   │   ├── background.png                 # Tiled doodle background
│   │   ├── clock.gif / clock_empty.gif    # Turn timer icons
│   │   ├── logo.gif                       # Hand-drawn rainbow logo
│   │   └── ...                            # UI icons (arrow, crown, link, etc.)
│   ├── game/                              # UNO Core Engine & Game Logic
│   │   ├── cards.js                       # Deck creation, card types, and play validation
│   │   ├── engine.js                      # Game rules, turns, timers, penalties, scoring
│   │   └── bots.js                        # AI bot strategy and chat reactions
│   ├── ui/                                # UI Renderers & Components
│   │   ├── avatar.js                      # Sprite-atlas avatar builder and preview
│   │   ├── cards.js                       # Card HTML renderer (hand, discard, draw pile)
│   │   ├── playerList.js                  # Left scoreboard, turn indicator & UNO badges
│   │   ├── chat.js                        # Right sidebar chat & colored system log
│   │   └── sound.js                       # Web Audio retro sound effects synthesizer
│   ├── main.js                            # App coordinator, routing & networking
│   └── style.css                          # Design tokens, layouts & responsive CSS
├── server/                                # Node.js backend
│   ├── roomManager.js                     # Multiplayer room management
│   └── server.js                          # WebSocket & HTTP server
├── index.html                             # Single-page application HTML
├── DESIGN.md                              # Master visual design specification
├── Project_Folders_Structure_Blueprint.md # Architecture blueprint
└── package.json                           # Scripts and dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KartikMakwana146/uno-game.git
   cd uno-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

1. **Start the Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

2. **(Optional) Start the Multiplayer WebSocket Server**:
   ```bash
   npm run server
   ```
   Runs the Node.js game server on port `3001` with health check at [http://localhost:3001/health](http://localhost:3001/health).

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📜 How to Play

1. **Match Cards**: Match the top card of the discard pile by color or number/symbol.
2. **Action Cards**:
   - **Skip (⊘)**: Skips the next player's turn.
   - **Reverse (⇄)**: Inverts play direction.
   - **Draw Two (+2)**: Next player draws 2 cards and loses their turn.
3. **Wild Cards**:
   - **Wild**: Change the active color to Red, Yellow, Green, or Blue.
   - **Wild Draw 4 (+4)**: Change active color and force next player to draw 4 cards!
4. **Call UNO!**: When down to 1 card, press the **UNO!** button immediately before anyone catches you!
5. **Score & Win**: Empty your hand first to win the round and score points based on your opponents' remaining cards!

---

## 📄 License & Credits

- Visual styling, layout conventions, and sprite assets inspired by [skribbl.io](https://skribbl.io).
- Built with vanilla web standards and love for classic card games.
