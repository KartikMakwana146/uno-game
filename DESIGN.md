# DESIGN.md — UNO, skribbl.io style

> Source of truth for all UI work in this repo. Read this fully before touching
> `index.html`, `src/style.css` or any UI code in `src/main.js`.
> Goal: the UNO site should feel like skribbl.io — same doodle-blue world, same
> flat, chunky, slightly-rough look, same screen flow — but with UNO gameplay
> in place of drawing gameplay.

---

## 0. Rules for AI agents working in this repo

1. Stack is **vanilla HTML + CSS + JS** (Vite-style layout: `index.html`, `src/main.js`, `src/style.css`). No React/Tailwind/UI frameworks. No CSS-in-JS.
2. All colors, sizes and fonts come from the **CSS variables in §2**. Never hardcode a hex value inside a component rule.
3. Use the **existing assets in `src/assets/`** (§4) before creating anything new. Do not replace them with emoji, icon fonts, or SVG lookalikes.
4. Animated `.gif` files must be used as `<img>` elements (not CSS backgrounds) so they keep animating.
5. Pixel-art assets (avatars, icons) must render crisp: `image-rendering: pixelated;` and only scale by integer multiples (1x, 2x, 3x).
6. Do **not** add gradients, drop-shadow blur, glassmorphism, or rounded "modern SaaS" cards. The style is flat, high-contrast and slightly boxy.
7. Keep gameplay logic (`main.js`, websocket code) separate from styling. Style via classes; toggle state with classes/`data-*` attributes.
8. If something in this file conflicts with the screenshots the user provided, the screenshots win; update this file afterwards.
9. Colors marked `≈` were eyeballed from screenshots. Sample the real values from `src/assets/background.png` / the reference screenshots with a color picker and fix the variables in one place (§2).

---

## 1. Design principles

- **Doodle world.** The page background is a tiled, hand-drawn doodle pattern in blue. Everything sits on top of it like paper cards.
- **Flat and chunky.** Solid fills, hard edges, tiny corner radius (2–4px), no blur shadows.
- **Three-column game screen.** Players list (left) · main stage (center) · chat (right), under one white status bar. This is the signature layout; keep it.
- **Loud, friendly color.** Saturated green for the primary action, saturated blue for the secondary action, dark slate for "game" surfaces, white for "info" surfaces.
- **Bold Nunito everywhere.** Rounded, friendly, always legible.
- **Playful micro-feedback.** Avatars bounce, buttons press down, timer clock shakes when time is low. Nothing slow or fancy.

---

## 2. Design tokens

Put these in `:root` at the top of `src/style.css`.

```css
:root {
  /* Page */
  --bg-doodle-blue: #2a55a5;        /* ≈ base color behind background.png */
  --bg-royal-blue: #0e2b9c;         /* ≈ solid lower section on landing page */

  /* Surfaces */
  --surface-white: #ffffff;
  --surface-stripe: #ececec;        /* alternate rows in player list + chat */
  --surface-slate: #383a4d;         /* ≈ dark "stage" and lobby settings panel */
  --surface-panel-blue: rgba(10, 35, 140, 0.55); /* ≈ About/News/How-to-play cards */

  /* Text */
  --text-on-light: #000000;
  --text-on-dark: #ffffff;
  --text-muted: #6b6b6b;
  --text-you: #4a90e2;              /* the local player's own name */

  /* Actions */
  --btn-primary: #53e237;           /* Play! / Start! */
  --btn-primary-hover: #6cf252;
  --btn-secondary: #2c8ee8;         /* Create Private Room / Invite */
  --btn-secondary-hover: #4aa2f5;
  --btn-danger: #e5432f;

  /* System-message colors (chat) */
  --msg-info: #3b6fd6;              /* "X is drawing now!" style */
  --msg-negative: #e55a1c;          /* "X disliked the drawing!" style */
  --msg-owner: #f5a04a;             /* "X is now the room owner!" */
  --msg-success: #2fb52f;           /* good things (e.g. "X said UNO!") */

  /* UNO card colors (flat, saturated, match the skribbl palette) */
  --uno-red: #e8351f;
  --uno-yellow: #f7d417;
  --uno-green: #53e237;
  --uno-blue: #2c8ee8;
  --uno-black: #1a1a1a;             /* wild cards + card back */

  /* Shape + spacing */
  --radius-sm: 3px;
  --radius-md: 4px;
  --gap: 6px;
  --stage-w: 800px;
  --stage-h: 600px;
  --players-w: 200px;
  --chat-w: 300px;
  --game-w: 1312px;                 /* players + stage + chat + gaps */
  --header-h: 50px;

  /* Type */
  --font-main: "Nunito", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "Inconsolata", ui-monospace, Consolas, monospace;
}
```

Global rules:

```css
html, body { height: 100%; margin: 0; }
body {
  font-family: var(--font-main);
  color: var(--text-on-dark);
  background: var(--bg-doodle-blue) url("./assets/background.png") repeat;
}
img { image-rendering: pixelated; }
```

---

## 3. Typography

- **Font:** Nunito (weights 400, 700, 800, 900). Install with `npm i @fontsource/nunito` and import weights in `main.js`, or add the Google Fonts `<link>` in `index.html`. Fallback stack is in `--font-main`.
- **Monospace** (`--font-mono`) only for the small uppercase status text in the center of the header bar (e.g. `WAITING`, `YOUR TURN`).

| Role | Size | Weight | Notes |
|---|---|---|---|
| Landing card title | 24px | 700 | white, centered |
| Landing card body | 16px | 400 | white |
| Header "Round X of Y" | 20px | 700 | black on white bar |
| Header status (mono) | 12px | 400 | uppercase, letter-spacing 0.5px |
| Player name | 14px | 700 | centered in row |
| Player points / card count | 12px | 400 | under the name |
| Rank `#1` | 12px | 700 | top-left of row |
| Chat message | 14px | 700 | |
| Stage announcement ("Jimmy is choosing…") | 32px | 400 | white, centered on slate |
| Button label | 20–28px | 800 | white, `text-shadow: 1px 1px 0 rgba(0,0,0,.25)` |
| Form labels (lobby) | 15px | 700 | white on slate |
| Card number (UNO card) | 44px+ | 900 | white fill + black outline (see §6.11) |

---

## 4. Assets (`src/assets/`)

Mapping is based on file names and the reference screenshots. **Open each file once and verify visually before wiring it up**, then correct this table if a guess is wrong.

| File | Use in UNO |
|---|---|
| `background.png` | Tiled page background. `background-repeat: repeat`, natural size (do not stretch). Fixed behind everything on every screen. |
| `logo.gif` | Landing page logo. **Replace with your own "UNO" logo in the same rainbow-letter, hand-drawn style before any public deploy** (see §12). |
| `avatar/color_atlas.gif` | Sprite sheet of avatar body colors. |
| `avatar/eye_atlas.gif` | Sprite sheet of avatar eyes. |
| `avatar/mouth_atlas.gif` | Sprite sheet of avatar mouths. |
| `arrow.gif` | The `<` `>` chevrons in the avatar picker (mirror for left). May also be reused for the play-direction indicator (rotate/flip). |
| `randomize.gif` | Dice button at top-right of the avatar picker. |
| `crown.gif` | Room-owner crown on top of the owner's avatar; also the winner crown on the game-over screen and rank #1 marker. |
| `clock.gif` | Turn timer while counting down (alarm clock, shakes). |
| `clockEmpty.gif` | Timer while idle/waiting (number shows `0`). |
| `about.gif` | Icon for the "About" card on the landing page. |
| `news.gif` | Icon for the "News" card. |
| `book.gif` | Icon for the "How to play" card (or Language row in lobby, whichever matches visually). |
| `person.gif` | "Players" row icon in lobby settings. |
| `twoBars.gif` | Lobby settings row icon (e.g. "Starting cards"). |
| `whiteQmark.gif` | Lobby settings row icon for optional/hint-like rules; also a generic help icon. |
| `dottedCircle.gif` | Lobby settings row icon (e.g. "Rounds"), or the "speaking" ring for voice chat if it fits visually. |
| `load.gif` | Loading spinner (connecting to server, waiting for room). |
| `link.svg` | Icon on the **Invite** button. |

### 4.1 Avatar system (sprite-composed, like skribbl)

An avatar is **three stacked layers** — body color, eyes, mouth — each cut from its atlas.

```js
// avatar = { color: 0, eyes: 0, mouth: 0 }   (indexes into the atlases)
```

Rules:
- Read each atlas's natural width/height at startup, then compute the cell size (`cell = atlasHeight / rows` — count rows/columns by looking at the image, and store `COLS`/`ROWS` per atlas in one constants object).
- Render with three absolutely-positioned `div`s inside a fixed-size `.avatar` box:
  `background-image: url(atlas); background-position: calc(-1 * col * cellPx) calc(-1 * row * cellPx); background-size: (atlasW * scale) (atlasH * scale);`
- Sizes: **48px** in player-list rows, **96px** in the landing picker, **64px** on the stage. Integer scale only.
- Crown (`crown.gif`) overlays the top-right of the owner's avatar, ~50% of avatar width, tilted ~15°.
- Persist the chosen avatar + name in `localStorage` and send it to the server on join.
- Randomize button picks random indexes for all three layers.

---

## 5. Screens

The whole app is 4 screens, switched by a `data-screen` attribute on `<body>`:
`landing` → `lobby` → `game` → `gameover`.

### 5.1 Landing screen

```
                 [ logo.gif ]
        [ row of small avatars, bouncing ]

   ┌───────────────────────────────┐   ← 400px wide, --surface-panel-blue
   │ [Enter your name ] [Language▾]│
   │  ┌──────────────────────────┐ │
   │  │  <  [avatar]  >          │ │   ← 3 rows of arrows (color/eyes/mouth)
   │  │  <           >   [dice]  │ │
   │  │  <           >           │ │
   │  └──────────────────────────┘ │
   │  [        Play!            ]  │   ← green, 54px tall
   │  [   Create Private Room   ]  │   ← blue, 40px tall
   └───────────────────────────────┘

   ═════ slanted edge ═════════════════════════════
   (solid --bg-royal-blue, tilted ~2° at top edge)
   [ About card ]   [ News card ]   [ How to play card ]
```

- Top area uses `background.png`; the section below the form has a solid `--bg-royal-blue` background with a slightly slanted top edge (`clip-path: polygon(0 3%, 100% 0, 100% 100%, 0 100%)` or a skewed pseudo-element).
- Name input: white, square corners, 32px tall, placeholder "Enter your name", `maxlength=20`.
- Language select next to it (English default). Keep even if only English exists.
- The row of avatars under the logo is decorative: 8 avatars, each a different color, one wearing a crown, gentle staggered bounce.
- Three info cards (About / News / How to play) sit side by side, ~320px each, icon + title on top, body text below. The "How to play" card has a small carousel with dot indicators (5 dots) explaining UNO rules (match color/number, action cards, say UNO, first to empty hand wins).
- "Play!" joins a public room. "Create Private Room" creates a room and goes to the lobby as owner.

### 5.2 Lobby screen

Same three-column frame as the game screen (§5.3) so the transition is seamless.

- Header bar: clock shows `0` (`clockEmpty.gif`), text "Round 1 of N", center status `WAITING`.
- Left: player list (owner has crown on avatar).
- Center: **settings panel** on `--surface-slate`, padding 4px. Each setting is a row: icon (32px) + label on the left, a full-width white `<select>` on the right (row height ~38px, 4px gap). Suggested settings:

  | Row | Icon | Options |
  |---|---|---|
  | Players | `person.gif` | 2–8 (default 8) |
  | Language | `book.gif` | English |
  | Turn time | `clockEmpty.gif` | 15 / 30 / 45 / 60 / 80 sec |
  | Rounds | `dottedCircle.gif` | 1–10 |
  | Game mode | (any) | Normal / Fast |
  | Starting cards | `twoBars.gif` | 5 / 7 / 9 |
  | House rules | `whiteQmark.gif` | 0–3 (stacking, jump-in, 7-0, …) |

- Below the settings: a **"Custom rules"** area styled like skribbl's "Custom words" (bold label left, checkbox "Use custom rules only" right, large white textarea with a grey placeholder). Optional; hide if not implemented.
- Bottom of the panel: two buttons side by side — big green **Start!** (~75% width) and blue **Invite** with `link.svg` (~25%). Only the owner sees Start and editable selects; other players see disabled selects and a "Waiting for the owner to start…" line.
- Right: chat panel with a system line such as `<name> is now the room owner!` in `--msg-owner`.
- **Invite** copies the room URL to the clipboard and briefly changes its label to "Copied!".

### 5.3 Game screen (main screen)

```
[logo.gif — top-left, ~250px wide, sits above the header bar]

┌─[clock]─ Round 2 of 3 ────────── YOUR TURN ─────────────── [⚙] ┐  white bar, 50px
├────────────┬───────────────────────────────┬─────────────────┤
│ #1 name  🙂│                               │                 │
│    pts     │        STAGE 800 × 600        │   CHAT 300px    │
│ #2 …       │   (draw pile, discard pile,   │                 │
│ #3 …       │    current color, your hand)  │  messages…      │
│ …          │                               │                 │
│ 200px      │                               │ [Type here…   ] │
└────────────┴───────────────────────────────┴─────────────────┘
```

- Outer wrapper is `width: var(--game-w)`, centered, `display: grid; grid-template-columns: var(--players-w) var(--stage-w) var(--chat-w); gap: var(--gap);`.
- Every panel is exactly 600px tall (matches `--stage-h`).
- **Stage** (`--surface-slate`, no border, no radius):
  - Center: **draw pile** (card back) and **discard pile** (top card, slightly rotated per play), ~30px apart. A colored ring/glow-free flat border in the *current active color* frames the discard pile so color is obvious after wilds.
  - Play direction: small `arrow.gif` next to the piles, flipped when direction reverses.
  - Bottom: **your hand**, fanned or in a single row with overlap (see §6.11).
  - Bottom-right: **UNO!** button (see §6.12).
  - Overlays (full-stage, semi-transparent slate): "Jimmy is choosing a color!" with the player's 64px avatar under the text — this mirrors skribbl's "Jimmy is choosing a word!" screen exactly.
- **Header center status** (mono, uppercase): `WAITING`, `YOUR TURN`, `<NAME>'S TURN`, or `CHOOSE A COLOR`. Under it, a small line can show a pending penalty such as `+4 STACKED`.
- **Timer:** `clock.gif` with the seconds remaining as a number centered over it. When ≤10s, add the shake animation (§7).
- **Gear button** (top right of header): opens a small settings popover (mute sounds, mute voice, leave room). Plain white panel, same style as other panels.

### 5.4 Game-over screen

- Stage shows the ranking: winner's avatar large (96px) with `crown.gif`, name, and points; runners-up smaller beneath in a simple vertical list. White text on slate.
- Player list keeps the final `#n` ranks.
- Two buttons below: green **Play again** and blue **Back to lobby**.
- Confetti is allowed but must be flat colored squares (no images).

---

## 6. Components

### 6.1 Buttons
- Primary: `--btn-primary`, white bold label, `border: 0`, `border-radius: var(--radius-sm)`, full width of its container.
- Secondary: `--btn-secondary`, same shape.
- Hover: swap to the `-hover` color. Active: `transform: translateY(1px)`. Disabled: `opacity: .5; cursor: not-allowed`.
- Focus: `outline: 3px solid #fff; outline-offset: 2px`.
- No borders, no box-shadows, no gradients.

### 6.2 Text inputs & selects
- White background, black text, `border: 0` (or 1px `#ccc`), `border-radius: 0`–`2px`, height 32–38px, padding `0 8px`.
- Placeholder color `#888`.

### 6.3 Panels
- **Info panel** (landing cards): `--surface-panel-blue`, white text, padding 12–16px, `border-radius: var(--radius-md)`.
- **Game panel** (players, chat): `--surface-white`, no radius.
- **Stage / settings panel**: `--surface-slate`, no radius.

### 6.4 Header bar
- Height `--header-h`, white, spans the full game width, directly under the logo (the logo overlaps/sits just above it).
- The **clock** icon (~56px) overlaps the left end of the bar and pokes above it, with the countdown number centered on it in bold black.
- Layout: `[clock] [Round X of Y]  ……… [status, centered] ………  [gear]`.

### 6.5 Player list row
- 200 × 48px. White background; every second row `--surface-stripe`.
- Left: rank `#n` small, top-left. Center: name (bold, centered) with points below (`530 points`). Right: 48px avatar, flush to the right edge.
- The local player's name uses `--text-you` and has ` (You)` appended.
- Crown on the owner's avatar.
- **Current-turn indicator:** the active player's row gets a small marker on the avatar in the place skribbl shows its pencil (use `arrow.gif` rotated to point at the avatar, or a small colored card icon).
- **UNO extras:** show hand size as `7 cards` in place of, or beside, points. Show a small red `UNO!` tag at the row's left when a player has exactly 1 card.
- Sort by points descending; recompute `#n` after each round.
- A muted/disconnected player is shown at 50% opacity.

### 6.6 Chat
- White panel, 300px wide, 600px tall. Messages stack from the **bottom**; older messages scroll up.
- Each message is a full-width row, padding `2px 6px`, alternating white / `--surface-stripe`.
- Normal message: `<b>name:</b> text` in black.
- System/game events are a single colored line, bold, no name prefix:
  - info (`--msg-info`): "Jimmy played a Skip.", "Jimmy is choosing a color!"
  - negative (`--msg-negative`): "Ligma drew 4 cards!", "kenchoi was skipped."
  - owner (`--msg-owner`): "dirty is now the room owner!"
  - success (`--msg-success`): "bigfat0327 said UNO!"
- Bottom input: full width, white, 32px tall, placeholder `Type your message here...`, Enter to send, `maxlength=100`.

### 6.7 Avatar picker (landing)
- Box ~370 × 110px, slightly darker than the panel behind it.
- Center: 96px avatar. Left: a column of three `<` buttons; right: a column of three `>` buttons (one pair each for color, eyes, mouth), using `arrow.gif`.
- Top-right corner: dice button (`randomize.gif`, ~24px).

### 6.8 Settings row (lobby)
See §5.2. Label and icon are white on `--surface-slate`; select is a white native `<select>` styled with `appearance: auto` (keep native arrow).

### 6.9 Stage announcement overlay
- Centered white text, 32px, on `--surface-slate`, with a 64px avatar centered below. Used for "X is choosing a color!", "Round 2 starts!", "X wins!".

### 6.10 Color chooser (after Wild / Wild Draw 4)
- Shown as a stage overlay, like skribbl's word-choice screen: title "Choose a color!" and **four big flat squares** (120 × 120px) in `--uno-red`, `--uno-yellow`, `--uno-green`, `--uno-blue`, 12px apart, 4px black border. Hover: scale 1.05.

### 6.11 UNO cards
Cards must look like skribbl drew them: flat, thick black outline, no gloss.

- Size: **96 × 144px** in hand, **120 × 180px** on the discard pile. Radius 10px. Border **4px solid #000**.
- Fill: the card's color variable. Wild and card back: `--uno-black` with a 4px black border and a white inner edge.
- Center: a white tilted oval (`border-radius: 50%; transform: rotate(-25deg)`, ~70% width) with the number or symbol on top.
- Number/symbol: Nunito 900, **white fill with black outline** (`-webkit-text-stroke: 3px #000; paint-order: stroke fill;`). Small copies of the number in the top-left and bottom-right corners (rotated 180° on the bottom-right).
- Action symbols (Skip, Reverse, +2, Wild, +4) drawn as simple bold CSS/SVG shapes, thick strokes, no thin lines.
- Card back: black card, red oval, "UNO" in white outlined letters.
- **In hand:** overlap cards by ~40% (`margin-left: -40px`). Hover → `translateY(-18px)` and bring to front. Playable cards are full color; unplayable cards get `filter: brightness(.55)` and `cursor: not-allowed`.
- **Played card:** animate from the hand to the discard pile (200ms) and settle with a random rotation between −8° and 8°.

### 6.12 UNO! button
- Bottom-right of the stage. 90 × 90px circle-ish (`border-radius: 50%`), `--btn-danger` fill, 4px black border, "UNO!" in white outlined Nunito 900.
- Only enabled when the player has 2 cards (about to play down to 1) or exactly 1 card. Otherwise 40% opacity.
- Pressed: `translateY(2px)` + short shake.

### 6.13 Emoji/reaction buttons (optional)
- Small thumbs-style reaction buttons at the top-right of the stage, like skribbl's like/dislike: 40px, no background, 60% opacity, 100% on hover. Reactions show as system chat lines (e.g. "Ligma reacted 👍").

### 6.14 Voice chat indicators (optional, if WebRTC is added)
- Mic toggle in the gear popover.
- When a player is speaking, show a 2px `--btn-primary` outline (or `dottedCircle.gif` if it looks right) around their avatar in the player list.
- Muted players show a small red "muted" tag on the row.

### 6.15 Loading / connecting
- Centered `load.gif` on the stage with text "Connecting…" in white. Same slate surface.

---

## 7. Motion

Keep it short, snappy and simple. Respect `prefers-reduced-motion` by disabling everything below except the GIFs.

| Element | Animation |
|---|---|
| Landing avatars | 1s ease-in-out infinite bounce (`translateY(-6px)`), 80ms stagger between avatars |
| Buttons | `transform` 80ms on `:active` |
| Card hover | 120ms `transform` |
| Card played | 200ms slide to discard pile |
| Timer ≤10s | `clock.gif` wrapper does a 0.4s infinite tiny rotate wiggle (±6°) |
| Screen change | Instant swap; optional 150ms opacity fade on the stage only |
| New chat message | none (appear instantly) |

Sound (optional): short cartoony effects for play card, draw card, skip, UNO!, and win. Every sound must be mutable from the gear popover, and the mute state saved in `localStorage`.

---

## 8. Responsive behavior

- **≥ 1340px wide:** exact 3-column layout, 1312px wide, centered.
- **900–1339px:** keep 3 columns but scale the whole `.game` wrapper with CSS `zoom`/`transform: scale()` (computed in JS from `window.innerWidth / 1340`). Do not reflow.
- **< 900px (mobile/tablet):**
  1. Header bar (full width, smaller clock).
  2. Stage on top, full width, 4:3 aspect ratio.
  3. Player list becomes a horizontal, scrollable strip of avatars with points/cards under each.
  4. Chat becomes a collapsible bottom sheet with a floating chat button.
  5. Hand becomes a horizontally scrollable row pinned to the bottom of the stage; cards 72 × 108px.
- Landing page: form panel max 400px, cards stack vertically below 900px.
- Touch targets ≥ 44px.

---

## 9. Accessibility

- Every color-coded card also shows its number/symbol; add a `data-color` label and `aria-label="Red 7"` on each card so color is never the only signal. Consider a small optional "color-blind mode" toggle that adds a letter (R/Y/G/B) to card corners.
- Buttons are real `<button>` elements; inputs have `<label>` (visually hidden is OK).
- Keyboard: `Tab` through hand cards, `Enter` to play, `D` to draw, `U` to say UNO, `/` to focus chat.
- Contrast: white text on `--surface-slate`, `--bg-royal-blue`, and the green/blue buttons must stay at least 4.5:1 (bold 20px+ text needs 3:1). If `--btn-primary` fails with white text, keep the text shadow and bold weight, or switch that label to black.

---

## 10. CSS / file organization

- `index.html`: one `<div id="app">` with one `<section data-screen="...">` per screen. No inline styles.
- `src/style.css`, in this order: tokens → reset/global → layout (`.game`, `.players`, `.stage`, `.chat`) → components (§6) → screens → utilities → media queries.
- `src/main.js`: game state + websocket + rendering. Split UI helpers into `src/ui/*.js` (avatar, cards, chat) as the file grows.
- Delete the Vite starter leftovers (`counter.js` and its usage) if unused.
- Import assets through Vite so they're bundled and hashed, e.g. `new URL('./assets/clock.gif', import.meta.url).href` in JS, or `url("./assets/background.png")` in CSS.
- Class naming: simple BEM-ish (`.player-row`, `.player-row--you`, `.chat__message--system`).

---

## 11. Do / Don't

**Do**
- Reuse the three-column frame on lobby and game screens.
- Keep white panels for information and dark slate for the "playing surface".
- Use bold, outlined text on cards and big buttons.
- Keep everything square-ish with tiny radii.

**Don't**
- Don't use box-shadow blur, gradients, glass/blur effects, or large border radii.
- Don't use thin, light-weight fonts or grey-on-grey text.
- Don't introduce new colors outside §2; add a token first if truly needed.
- Don't scale pixel-art assets by non-integer factors.
- Don't use icon libraries (Font Awesome, Material Icons) — use the provided assets or plain CSS shapes.

---

## 12. Asset licensing note

The skribbl.io images (logo, avatars, icons, background) belong to skribbl.io's creators. Using them locally for a class/lab project or a private prototype is one thing; publishing a public site with them is another. Before any public deployment:

1. Replace `logo.gif` with your own UNO logo (same rainbow hand-drawn style).
2. Replace or redraw the avatar atlases, icons, and `background.png` with your own art, keeping the same file names and sprite grid so no code changes are needed.
3. Keep the layout, colors and interaction patterns from this file — those are the part you can freely make your own.

---

## 13. Acceptance checklist

- [ ] Landing screen: logo, name input, language select, avatar picker with 3 arrow pairs and dice, green Play!, blue Create Private Room, and 3 info cards on a royal-blue slanted section.
- [ ] `background.png` tiles behind every screen.
- [ ] Lobby: settings rows with icons and selects, custom rules area, green Start! + blue Invite (with `link.svg`), owner crown on avatar, `WAITING` status.
- [ ] Game: white header bar with clock, round text, mono status, gear; 200 / 800 / 300 column layout, all 600px tall.
- [ ] Player rows: rank, name, points/cards, 48px avatar, striped rows, "(You)" in blue, turn marker.
- [ ] Chat: striped rows, colored system lines, bottom input.
- [ ] Stage overlay for "X is choosing a color!" matches skribbl's word-choosing screen.
- [ ] UNO cards look flat with thick black outline; hand hover lifts card; unplayable cards dimmed.
- [ ] Only tokens from §2 are used; only integer scaling on pixel art; no gradients or blurred shadows.
- [ ] Layout doesn't break at 1340px, 1024px and 390px widths.
