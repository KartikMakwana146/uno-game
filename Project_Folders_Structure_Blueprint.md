# Project Folder Structure Blueprint: UNO Game (skribbl.io style)

## 1. Structural Overview
This project is an online multiplayer UNO card game styled after skribbl.io's iconic visual identity and user interface architecture. It follows a clean modular client-server organization:
- **Client**: Vanilla HTML5, modern CSS with custom properties (design tokens), and modular JavaScript built using Vite. No external heavy UI frameworks or CSS utility classes are used, adhering strictly to [DESIGN.md](file:///c:/Users/Kartik%20Makwana/Desktop/Projects/UNO-bwp/UNO-game-bwp/DESIGN.md).
- **Backend / Game Engine**: Node.js patterns providing room management, game state validation, deck shuffling, turn timers, and WebSocket communication with AI bot simulation capabilities.
- **Assets**: Authentic sprite atlases for multi-layered customizable avatars (color, eyes, mouth), UI icons, sound effects, and tiled background doodle pattern.

## 2. Directory Visualization

```
UNO-game-bwp/
├── .agents/                               # Custom agent rules & skills
│   └── skills/                            # Specific development workflows
├── public/                                # Public static assets
├── src/                                   # Frontend source code
│   ├── assets/                            # Visual assets (skribbl.io theme)
│   │   ├── avatar/                        # Avatar sprite atlases
│   │   │   ├── color_atlas.gif            # 480x480 (10x10 grid, 28 active colors)
│   │   │   ├── eye_atlas.gif              # 480x480 (10x10 grid, 57 active eyes)
│   │   │   └── mouth_atlas.gif            # 480x480 (10x10 grid, 51 active mouths)
│   │   ├── about.gif                      # Info card icon
│   │   ├── arrow.gif                      # Chevron & turn direction indicator
│   │   ├── background.png                 # Tiled doodle blue background
│   │   ├── book.gif                       # Rules & language icon
│   │   ├── clock.gif                      # Animated turn timer
│   │   ├── clock_empty.gif                # Idle state clock
│   │   ├── crown.gif                      # Owner & winner crown
│   │   ├── dotted_circle.gif              # Rounds icon
│   │   ├── link.svg                       # Room invite link icon
│   │   ├── load.gif                       # Loading indicator
│   │   ├── logo.gif                       # Doodle logo
│   │   ├── news.gif                       # News card icon
│   │   ├── person.gif                     # Players count icon
│   │   ├── randomize.gif                  # Avatar dice randomize icon
│   │   ├── two_bars.gif                   # Starting cards icon
│   │   └── white_que_mark.gif             # House rules help icon
│   ├── game/                              # UNO Core Game Logic (Client & Shared)
│   │   ├── cards.js                       # Deck definition, card types, colors, values
│   │   ├── engine.js                      # UNO game rules, validation, turn & round state
│   │   └── bots.js                        # Intelligent bot AI for solo & public matchmaking
│   ├── ui/                                # UI Components & Renderers
│   │   ├── avatar.js                      # Sprite-composed avatar renderer & picker
│   │   ├── board.js                       # Draw pile, discard pile, active color ring
│   │   ├── hand.js                        # Player hand fanning, hover, selection & play
│   │   ├── playerList.js                  # Left sidebar scoreboard & turn indicator
│   │   ├── chat.js                        # Right sidebar chat & colored system logs
│   │   ├── sound.js                       # Cartoony sound effects & mute manager
│   │   └── modals.js                      # Color picker, settings gear, overlays
│   ├── main.js                            # App entry point, screen router, event hub
│   └── style.css                          # Design tokens, skribbl.io styling & responsive layout
├── server/                                # Node.js backend server patterns
│   ├── server.js                          # Express & WebSocket server for multiplayer
│   └── roomManager.js                     # Room lifecycle, lobby sync & state broadcast
├── index.html                             # Single page HTML structure
├── package.json                           # Dependencies & run scripts
├── vite.config.js                         # Vite bundler & dev server config
├── AGENTS.md                              # Repository instructions
├── DESIGN.md                              # Master UI design tokens & specifications
└── Project_Folders_Structure_Blueprint.md # This architecture blueprint
```

## 3. Key Directory Analysis
- **`src/assets/`**: Houses all graphical assets. Pixel-art atlases are sampled at integer scales (48px, 64px, 96px) with `image-rendering: pixelated`.
- **`src/game/`**: Implements standard UNO rules (108 cards, Draw 2, Skip, Reverse, Wild, Wild Draw 4, UNO call check) separated cleanly from DOM rendering.
- **`src/ui/`**: Modular DOM renderers that update based on game state changes via data attributes and classes.
- **`server/`**: Follows `nodejs-backend-patterns` with lightweight WebSocket handlers for private rooms and peer synchronization.

## 4. File Placement & Naming Patterns
- All CSS class names follow descriptive, kebab-cased BEM-like conventions (e.g. `.player-row`, `.player-row--active`, `.uno-card--wild`).
- JavaScript modules use ES Modules (`import`/`export`) with camelCase filenames.
- Asset filenames preserve skribbl conventions for drop-in theme asset replacement.

## 5. Maintenance & Updates
Maintained according to [DESIGN.md](file:///c:/Users/Kartik%20Makwana/Desktop/Projects/UNO-bwp/UNO-game-bwp/DESIGN.md) and user rules. Last updated: September 2026.
