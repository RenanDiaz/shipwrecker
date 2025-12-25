// Cell states for the game board
export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

// Coordinates on the board
export interface Coord {
	row: number;
	col: number;
}

// Ship orientation
export type Orientation = 'horizontal' | 'vertical';

// Ship types
export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

// Ship definition
export interface Ship {
	id: string;
	type: ShipType;
	length: number;
	coords: Coord[];
	hits: number;
	sunk: boolean;
}

// Ship placement request
export interface ShipPlacement {
	shipType: ShipType;
	startCoord: Coord;
	orientation: Orientation;
}

// A player's board state
export interface PlayerBoard {
	grid: CellState[][];
	ships: Ship[];
	allShipsSunk: boolean;
}

// Game phases
export type GamePhase = 'waiting' | 'setup' | 'playing' | 'finished';

// Game mode
export type GameMode = 'multiplayer' | 'singlePlayer';

// AI difficulty levels
export type AIDifficulty = 'easy' | 'medium' | 'hard';

// Player info
export interface PlayerInfo {
	id: string;
	ready: boolean;
	connected: boolean;
}

// Complete game state
export interface GameState {
	roomId: string;
	phase: GamePhase;
	gameMode: GameMode;
	aiDifficulty?: AIDifficulty;
	player1: PlayerInfo | null;
	player2: PlayerInfo | null;
	currentTurn: string | null;
	winner: string | null;
	boards: {
		[playerId: string]: PlayerBoard;
	};
}

// Client view of game state (hides opponent ship positions)
export interface ClientGameState {
	roomId: string;
	phase: GamePhase;
	gameMode: GameMode;
	aiDifficulty?: AIDifficulty;
	playerId: string;
	playerNumber: 1 | 2;
	isYourTurn: boolean;
	yourBoard: PlayerBoard;
	opponentBoard: PlayerBoard; // ships hidden, only hits/misses shown
	opponentReady: boolean;
	opponentConnected: boolean;
	isAIOpponent: boolean;
	winner: 'you' | 'opponent' | null;
}

// --- Messages from client to server ---

// Chat message types
export type ChatMessageType = 'preset' | 'reaction';

// Preset chat message IDs
export type PresetMessageId =
	| 'gl'      // Good luck!
	| 'gg'      // Good game!
	| 'ns'      // Nice shot!
	| 'oops'    // Oops!
	| 'wow'     // Wow!
	| 'hurry'   // Hurry up!
	| 'rematch' // Rematch?
	| 'bye';    // Goodbye!

// Quick reaction emojis
export type ReactionId = '👍' | '👏' | '😄' | '😮' | '😅' | '🔥' | '💀' | '🎯';

// Chat message from a player
export interface ChatMessage {
	id: string;
	from: 1 | 2;
	messageType: ChatMessageType;
	content: PresetMessageId | ReactionId;
	timestamp: number;
}

export type ClientMessage =
	| { type: 'join'; playerId: string; gameMode?: GameMode; aiDifficulty?: AIDifficulty }
	| { type: 'placeShip'; placement: ShipPlacement }
	| { type: 'removeShip'; shipType: ShipType }
	| { type: 'ready' }
	| { type: 'fire'; coord: Coord }
	| { type: 'rematch' }
	| { type: 'chat'; messageType: ChatMessageType; content: PresetMessageId | ReactionId };

// --- Messages from server to client ---

export type ServerMessage =
	| { type: 'gameState'; state: ClientGameState }
	| { type: 'error'; message: string }
	| { type: 'shotResult'; result: ShotResult }
	| { type: 'opponentShot'; coord: Coord; result: 'hit' | 'miss' | 'sunk'; sunkShip?: ShipType }
	| { type: 'playerJoined'; playerNumber: 1 | 2 }
	| { type: 'playerLeft'; playerNumber: 1 | 2 }
	| { type: 'phaseChange'; phase: GamePhase }
	| { type: 'turnChange'; isYourTurn: boolean }
	| { type: 'gameOver'; winner: 'you' | 'opponent' }
	| { type: 'rematchRequested'; byPlayer: 1 | 2 }
	| { type: 'rematchStarted' }
	| { type: 'chatMessage'; message: ChatMessage };

// Shot result
export interface ShotResult {
	coord: Coord;
	result: 'hit' | 'miss' | 'sunk';
	sunkShip?: ShipType;
	gameOver: boolean;
}
