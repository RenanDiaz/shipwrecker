# CLAUDE.md - ShipWrecker Codebase Guide

## Project Overview

ShipWrecker is a real-time multiplayer Battleship game built with SvelteKit (frontend) and PartyKit (WebSocket backend). Players create or join rooms, place ships on a 10x10 grid, and take turns firing at the opponent's board.

## Tech Stack

- **Frontend**: SvelteKit with Svelte 5 runes (`$state`, `$derived`, `$props`)
- **Backend**: PartyKit (WebSocket server for real-time multiplayer)
- **Styling**: Tailwind CSS with custom `navy` and `ocean` color palettes
- **i18n**: svelte-i18n with English and Spanish translations
- **Language**: TypeScript throughout

## Project Structure

```
shipwrecker/
├── src/                           # SvelteKit frontend
│   ├── lib/
│   │   ├── components/            # Svelte components (Board, Cell, Ship, etc.)
│   │   ├── stores/
│   │   │   ├── gameState.svelte.ts   # Main game state (Svelte 5 runes)
│   │   │   └── i18n.ts               # Internationalization setup
│   │   ├── utils/
│   │   │   ├── boardUtils.ts         # Board helper functions
│   │   │   ├── gameLogic.ts          # Client-side game logic/validation
│   │   │   └── sounds.ts             # Web Audio API sound effects
│   │   └── i18n/                  # Translation JSON files (en.json, es.json)
│   └── routes/
│       ├── +page.svelte           # Landing page (create/join game)
│       ├── +layout.svelte         # Root layout with i18n init
│       └── game/[roomId]/         # Game room page
├── party/                         # PartyKit backend
│   ├── server.ts                  # WebSocket server (message handling)
│   └── gameEngine.ts              # Server-side game logic
├── shared/                        # Code shared between frontend and backend
│   ├── types.ts                   # TypeScript interfaces and types
│   ├── constants.ts               # Game constants (board size, ships)
│   └── validation.ts              # Shared validation logic
├── static/                        # Static assets (favicon)
├── partykit.json                  # PartyKit configuration
└── tailwind.config.js             # Tailwind with custom colors
```

## Development Commands

```bash
npm run dev           # Start SvelteKit dev server (http://localhost:5173)
npm run dev:party     # Start PartyKit dev server (http://localhost:1999)
npm run dev:all       # Start both servers concurrently (recommended)
npm run build         # Build SvelteKit for production
npm run check         # Run Svelte type checking
npm run deploy:party  # Deploy PartyKit to production
```

## Key Architectural Patterns

### State Management (Svelte 5 Runes)

The game uses Svelte 5's rune-based reactivity in `src/lib/stores/gameState.svelte.ts`:

```typescript
// State variables use $state
let gameState = $state<ClientGameState | null>(null);

// Computed values use $derived
let isYourTurn = $derived(gameState?.isYourTurn ?? false);

// Components use $props for type-safe props
let { board, title, isClickable }: Props = $props();
```

### WebSocket Communication

Client-server messages are strongly typed in `shared/types.ts`:

- **ClientMessage**: `join`, `placeShip`, `removeShip`, `ready`, `fire`, `rematch`
- **ServerMessage**: `gameState`, `error`, `shotResult`, `opponentShot`, `turnChange`, `gameOver`, etc.

### Game Phases

The game progresses through these phases:

1. `waiting` - Only one player in room
2. `setup` - Both players placing ships
3. `playing` - Taking turns firing
4. `finished` - Game over, winner determined

### Ship Configuration

Ships are defined in `shared/constants.ts`:

| Ship       | Length |
|------------|--------|
| Carrier    | 5      |
| Battleship | 4      |
| Cruiser    | 3      |
| Submarine  | 3      |
| Destroyer  | 2      |

## Important Files

| File | Purpose |
|------|---------|
| `party/server.ts` | Main WebSocket server - handles all multiplayer logic |
| `party/gameEngine.ts` | Game state mutations (addPlayer, placeShip, fireShot) |
| `shared/types.ts` | All TypeScript types - modify here when adding features |
| `shared/validation.ts` | Ship placement and shot validation logic |
| `src/lib/stores/gameState.svelte.ts` | Client-side state and WebSocket connection |
| `src/routes/game/[roomId]/+page.svelte` | Main game UI component |

## Code Conventions

### TypeScript

- All files use TypeScript with strict mode
- Types are centralized in `shared/types.ts`
- Import types explicitly: `import type { GameState } from './types'`

### Svelte Components

- Use `.svelte` extension
- Props interface defined at top of script block
- Use `$props()` for component props (Svelte 5)
- Event handlers passed as props (e.g., `onCellClick`, `onFire`)

### CSS/Styling

- Tailwind CSS for utility classes
- Custom CSS variables for game colors in `src/app.css`
- Responsive cell sizing with `--cell-size` CSS variable
- Mobile-first design with `xs`, `sm`, `md`, `lg` breakpoints

### Internationalization

- All user-facing strings in `src/lib/i18n/{en,es}.json`
- Use `$_('key.path')` in templates
- Interpolation: `$_('game.placeNextShip', { values: { ship: shipName } })`

## Environment Variables

```bash
VITE_PARTYKIT_HOST=localhost:1999      # Development
VITE_PARTYKIT_HOST=your-app.partykit.dev  # Production
```

## Testing Locally

1. Run `npm run dev:all` to start both servers
2. Open two browser windows to `http://localhost:5173`
3. Create a game in one window, copy the room link
4. Join from the second window

## Common Tasks

### Adding a New Translation Key

1. Add key to `src/lib/i18n/en.json`
2. Add corresponding key to `src/lib/i18n/es.json`
3. Use in component: `{$_('your.new.key')}`

### Adding a New Message Type

1. Add to `ClientMessage` or `ServerMessage` union in `shared/types.ts`
2. Handle in `party/server.ts` (for client messages)
3. Handle in `gameState.svelte.ts` `handleServerMessage` (for server messages)

### Modifying Game Logic

- Validation logic goes in `shared/validation.ts` (shared by client/server)
- Server-side state changes in `party/gameEngine.ts`
- Client-side preview/helper logic in `src/lib/utils/gameLogic.ts`

## Sound System

Sounds are synthesized using Web Audio API (no external files needed). Sound functions are in `src/lib/utils/sounds.ts`:

- `playHitSound()` - Sharp metallic impact
- `playMissSound()` - Water splash
- `playSinkSound()` - Dramatic explosion
- `playTurnSound()` - Subtle chime for turn notification
- `playIncomingSound()` - Whistle-down for opponent's shot

## Deployment

### PartyKit (Backend)

```bash
npm run deploy:party
# Note the URL: your-app.username.partykit.dev
```

### Frontend (Vercel/Netlify)

1. Set `VITE_PARTYKIT_HOST` environment variable to your PartyKit URL
2. Build command: `npm run build`
3. Publish directory: `build`
