import type {
	GameState,
	PlayerBoard,
	ShipPlacement,
	Coord,
	Ship,
	ClientGameState,
	ShipType
} from '../shared/types';
import { SHIP_CONFIGS, TOTAL_SHIPS } from '../shared/constants';
import {
	createEmptyBoard,
	validateShipPlacement,
	processShot,
	createOpponentView
} from '../shared/validation';

// Create initial game state
export function createGameState(roomId: string): GameState {
	return {
		roomId,
		phase: 'waiting',
		player1: null,
		player2: null,
		currentTurn: null,
		winner: null,
		boards: {}
	};
}

// Add a player to the game
export function addPlayer(
	state: GameState,
	playerId: string
): { success: boolean; playerNumber?: 1 | 2; error?: string } {
	// Check if player is already in the game
	if (state.player1?.id === playerId) {
		state.player1.connected = true;
		return { success: true, playerNumber: 1 };
	}
	if (state.player2?.id === playerId) {
		state.player2.connected = true;
		return { success: true, playerNumber: 2 };
	}

	// Add new player
	if (!state.player1) {
		state.player1 = { id: playerId, ready: false, connected: true };
		state.boards[playerId] = createEmptyBoard();
		return { success: true, playerNumber: 1 };
	}

	if (!state.player2) {
		state.player2 = { id: playerId, ready: false, connected: true };
		state.boards[playerId] = createEmptyBoard();
		// Both players joined, move to setup phase
		state.phase = 'setup';
		return { success: true, playerNumber: 2 };
	}

	return { success: false, error: 'Room is full' };
}

// Remove a player from the game
export function removePlayer(state: GameState, playerId: string): void {
	if (state.player1?.id === playerId) {
		state.player1.connected = false;
	}
	if (state.player2?.id === playerId) {
		state.player2.connected = false;
	}
}

// Place a ship on a player's board
export function placeShip(
	state: GameState,
	playerId: string,
	placement: ShipPlacement
): { success: boolean; error?: string } {
	if (state.phase !== 'setup') {
		return { success: false, error: 'Not in setup phase' };
	}

	const board = state.boards[playerId];
	if (!board) {
		return { success: false, error: 'Player not found' };
	}

	const { valid, coords, error } = validateShipPlacement(
		placement.shipType,
		placement.startCoord,
		placement.orientation,
		board.ships
	);

	if (!valid) {
		return { success: false, error };
	}

	// Create the ship
	const ship: Ship = {
		id: `${playerId}_${placement.shipType}`,
		type: placement.shipType,
		length: SHIP_CONFIGS[placement.shipType].length,
		coords,
		hits: 0,
		sunk: false
	};

	// Add ship to board
	board.ships.push(ship);

	// Update grid
	for (const coord of coords) {
		board.grid[coord.row][coord.col] = 'ship';
	}

	// Mark player ready if all ships placed
	const player = state.player1?.id === playerId ? state.player1 : state.player2;
	if (player && board.ships.length === TOTAL_SHIPS) {
		player.ready = true;
	}

	return { success: true };
}

// Remove a ship from a player's board
export function removeShip(
	state: GameState,
	playerId: string,
	shipType: ShipType
): { success: boolean; error?: string } {
	if (state.phase !== 'setup') {
		return { success: false, error: 'Not in setup phase' };
	}

	const board = state.boards[playerId];
	if (!board) {
		return { success: false, error: 'Player not found' };
	}

	const shipIndex = board.ships.findIndex((s) => s.type === shipType);
	if (shipIndex === -1) {
		return { success: false, error: 'Ship not found' };
	}

	const ship = board.ships[shipIndex];

	// Remove ship from grid
	for (const coord of ship.coords) {
		board.grid[coord.row][coord.col] = 'empty';
	}

	// Remove ship from array
	board.ships.splice(shipIndex, 1);

	// Unmark player as ready
	const player = state.player1?.id === playerId ? state.player1 : state.player2;
	if (player) {
		player.ready = false;
	}

	return { success: true };
}

// Mark a player as ready
export function setPlayerReady(
	state: GameState,
	playerId: string
): { success: boolean; bothReady: boolean; error?: string } {
	if (state.phase !== 'setup') {
		return { success: false, bothReady: false, error: 'Not in setup phase' };
	}

	const board = state.boards[playerId];
	if (!board || board.ships.length !== TOTAL_SHIPS) {
		return { success: false, bothReady: false, error: 'Not all ships placed' };
	}

	const player = state.player1?.id === playerId ? state.player1 : state.player2;
	if (!player) {
		return { success: false, bothReady: false, error: 'Player not found' };
	}

	player.ready = true;

	// Check if both players ready
	const bothReady = Boolean(state.player1?.ready && state.player2?.ready);
	if (bothReady) {
		state.phase = 'playing';
		// Player 1 goes first
		state.currentTurn = state.player1!.id;
	}

	return { success: true, bothReady };
}

// Fire at opponent's board
export function fireShot(
	state: GameState,
	playerId: string,
	coord: Coord
): { success: boolean; result?: 'hit' | 'miss' | 'sunk'; sunkShip?: ShipType; gameOver?: boolean; error?: string } {
	if (state.phase !== 'playing') {
		return { success: false, error: 'Not in playing phase' };
	}

	if (state.currentTurn !== playerId) {
		return { success: false, error: 'Not your turn' };
	}

	// Get opponent's board
	const opponentId =
		state.player1?.id === playerId ? state.player2?.id : state.player1?.id;
	if (!opponentId) {
		return { success: false, error: 'Opponent not found' };
	}

	const opponentBoard = state.boards[opponentId];
	if (!opponentBoard) {
		return { success: false, error: 'Opponent board not found' };
	}

	// Check if cell already shot
	const cellState = opponentBoard.grid[coord.row][coord.col];
	if (cellState === 'hit' || cellState === 'miss' || cellState === 'sunk') {
		return { success: false, error: 'Cell already targeted' };
	}

	// Process the shot
	const { result, sunkShip, updatedBoard } = processShot(opponentBoard, coord);
	state.boards[opponentId] = updatedBoard;

	// Check for game over
	const gameOver = updatedBoard.allShipsSunk;
	if (gameOver) {
		state.phase = 'finished';
		state.winner = playerId;
	} else {
		// Switch turn
		state.currentTurn = opponentId;
	}

	return { success: true, result, sunkShip, gameOver };
}

// Reset game for rematch
export function resetGame(state: GameState): void {
	state.phase = 'setup';
	state.currentTurn = null;
	state.winner = null;

	// Reset boards
	if (state.player1) {
		state.player1.ready = false;
		state.boards[state.player1.id] = createEmptyBoard();
	}
	if (state.player2) {
		state.player2.ready = false;
		state.boards[state.player2.id] = createEmptyBoard();
	}
}

// Get client view of game state
export function getClientGameState(
	state: GameState,
	playerId: string
): ClientGameState | null {
	const isPlayer1 = state.player1?.id === playerId;
	const isPlayer2 = state.player2?.id === playerId;

	if (!isPlayer1 && !isPlayer2) {
		return null;
	}

	const playerNumber = isPlayer1 ? 1 : 2;
	const player = isPlayer1 ? state.player1 : state.player2;
	const opponent = isPlayer1 ? state.player2 : state.player1;

	const yourBoard = state.boards[playerId] || createEmptyBoard();
	const opponentId = opponent?.id;
	const opponentBoard = opponentId
		? createOpponentView(state.boards[opponentId] || createEmptyBoard())
		: createEmptyBoard();

	return {
		roomId: state.roomId,
		phase: state.phase,
		playerId,
		playerNumber,
		isYourTurn: state.currentTurn === playerId,
		yourBoard,
		opponentBoard,
		opponentReady: opponent?.ready || false,
		opponentConnected: opponent?.connected || false,
		winner:
			state.winner === null
				? null
				: state.winner === playerId
					? 'you'
					: 'opponent'
	};
}
