# ⚓ ShipWrecker

A multiplayer naval combat game built with SvelteKit and PartyKit. Challenge your friends to a classic battleship game with real-time multiplayer support!

## Features

- **Real-time Multiplayer**: Play against friends with instant synchronization
- **Room-based System**: Create or join games with shareable room links
- **Internationalization**: Available in English and Spanish
- **Responsive Design**: Works on both desktop and mobile devices
- **Modern UI**: Clean naval-themed interface with smooth animations

## Tech Stack

- **Frontend**: [SvelteKit](https://kit.svelte.dev/) with Svelte 5 runes
- **Backend**: [PartyKit](https://partykit.io/) for WebSocket real-time multiplayer
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **i18n**: [svelte-i18n](https://github.com/kaisermann/svelte-i18n)
- **Language**: TypeScript throughout

## How to Play

1. **Create or Join**: Create a new game or enter a room ID to join an existing game
2. **Place Ships**: Arrange your 5 ships on your board:
   - Carrier (5 cells)
   - Battleship (4 cells)
   - Cruiser (3 cells)
   - Submarine (3 cells)
   - Destroyer (2 cells)
3. **Battle**: Take turns firing at your opponent's grid
4. **Win**: First player to sink all enemy ships wins!

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/shipwrecker.git
   cd shipwrecker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Start both development servers:
   ```bash
   npm run dev:all
   ```

   This runs:
   - SvelteKit dev server at `http://localhost:5173`
   - PartyKit dev server at `http://localhost:1999`

5. Open `http://localhost:5173` in your browser

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start SvelteKit development server |
| `npm run dev:party` | Start PartyKit development server |
| `npm run dev:all` | Start both servers concurrently |
| `npm run build` | Build the SvelteKit application |
| `npm run preview` | Preview the built application |
| `npm run check` | Run Svelte type checking |
| `npm run deploy:party` | Deploy PartyKit to production |

## Project Structure

```
shipwrecker/
├── src/                           # Frontend (SvelteKit)
│   ├── lib/
│   │   ├── components/            # Svelte components
│   │   ├── stores/                # Svelte stores and state
│   │   ├── utils/                 # Utility functions
│   │   └── i18n/                  # Translation files
│   └── routes/                    # SvelteKit routes
├── party/                         # Backend (PartyKit)
│   ├── server.ts                  # Main WebSocket server
│   └── gameEngine.ts              # Game logic
├── shared/                        # Shared code
│   ├── types.ts                   # TypeScript interfaces
│   ├── constants.ts               # Game constants
│   └── validation.ts              # Shared validation
└── static/                        # Static assets
```

## Deployment

### PartyKit Backend

1. Sign up at [partykit.io](https://partykit.io)
2. Deploy with:
   ```bash
   npm run deploy:party
   ```
3. Note your PartyKit URL (e.g., `shipwrecker.your-username.partykit.dev`)

### Frontend (Vercel)

1. Connect your repository to [Vercel](https://vercel.com)
2. Add environment variable:
   - `VITE_PARTYKIT_HOST`: Your PartyKit production URL
3. Deploy!

### Frontend (Netlify)

1. Connect your repository to [Netlify](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `build`
4. Add environment variable:
   - `VITE_PARTYKIT_HOST`: Your PartyKit production URL

## Game Rules

- Each player has a 10x10 grid
- Ships cannot overlap or go out of bounds
- Ships can be placed horizontally or vertically
- Players take turns firing at the opponent's grid
- A "hit" is registered when a shot lands on a ship
- A ship is "sunk" when all its cells are hit
- The game ends when all ships of one player are sunk

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.
