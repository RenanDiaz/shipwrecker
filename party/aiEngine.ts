import type {
	Coord,
	Orientation,
	PlayerBoard,
	ShipPlacement,
	ShipType,
	AIDifficulty,
	CellState
} from '../shared/types';
import { BOARD_SIZE, SHIP_TYPES, SHIP_CONFIGS } from '../shared/constants';
import { validateShipPlacement } from '../shared/validation';

// AI player ID constant
export const AI_PLAYER_ID = 'ai_opponent';

// Generate random ship placements for AI
export function generateAIShipPlacements(): ShipPlacement[] {
	const placements: ShipPlacement[] = [];
	const placedShips: { type: ShipType; coords: Coord[] }[] = [];

	for (const shipType of SHIP_TYPES) {
		let placed = false;
		let attempts = 0;
		const maxAttempts = 100;

		while (!placed && attempts < maxAttempts) {
			attempts++;

			const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
			const shipLength = SHIP_CONFIGS[shipType].length;

			// Generate random starting position
			const maxRow = orientation === 'vertical' ? BOARD_SIZE - shipLength : BOARD_SIZE - 1;
			const maxCol = orientation === 'horizontal' ? BOARD_SIZE - shipLength : BOARD_SIZE - 1;

			const startCoord: Coord = {
				row: Math.floor(Math.random() * (maxRow + 1)),
				col: Math.floor(Math.random() * (maxCol + 1))
			};

			// Validate placement using existing validation
			const existingShips = placedShips.map((s, i) => ({
				id: `ai_${s.type}`,
				type: s.type,
				length: SHIP_CONFIGS[s.type].length,
				coords: s.coords,
				hits: 0,
				sunk: false
			}));

			const { valid, coords } = validateShipPlacement(
				shipType,
				startCoord,
				orientation,
				existingShips
			);

			if (valid) {
				placements.push({ shipType, startCoord, orientation });
				placedShips.push({ type: shipType, coords });
				placed = true;
			}
		}

		if (!placed) {
			console.error(`Failed to place ${shipType} for AI after ${maxAttempts} attempts`);
		}
	}

	return placements;
}

// Track AI state for hunt/target mode
interface AIState {
	mode: 'hunt' | 'target';
	hitStack: Coord[]; // Cells to investigate (hits that might lead to more)
	lastHit: Coord | null;
	hitDirection: 'horizontal' | 'vertical' | null;
	triedDirections: Set<string>; // Track which directions we've tried from a hit
}

// Create initial AI state
export function createAIState(): AIState {
	return {
		mode: 'hunt',
		hitStack: [],
		lastHit: null,
		hitDirection: null,
		triedDirections: new Set()
	};
}

// Get all cells that haven't been shot
function getUntriedCells(opponentBoard: PlayerBoard): Coord[] {
	const untried: Coord[] = [];
	for (let row = 0; row < BOARD_SIZE; row++) {
		for (let col = 0; col < BOARD_SIZE; col++) {
			const cell = opponentBoard.grid[row][col];
			if (cell === 'empty' || cell === 'ship') {
				untried.push({ row, col });
			}
		}
	}
	return untried;
}

// Check if a cell is valid and untried
function isValidTarget(coord: Coord, opponentBoard: PlayerBoard): boolean {
	if (coord.row < 0 || coord.row >= BOARD_SIZE || coord.col < 0 || coord.col >= BOARD_SIZE) {
		return false;
	}
	const cell = opponentBoard.grid[coord.row][coord.col];
	return cell === 'empty' || cell === 'ship';
}

// Get adjacent cells (up, down, left, right)
function getAdjacentCells(coord: Coord): Coord[] {
	return [
		{ row: coord.row - 1, col: coord.col }, // up
		{ row: coord.row + 1, col: coord.col }, // down
		{ row: coord.row, col: coord.col - 1 }, // left
		{ row: coord.row, col: coord.col + 1 } // right
	];
}

// EASY: Pure random targeting
function getEasyMove(opponentBoard: PlayerBoard): Coord {
	const untried = getUntriedCells(opponentBoard);
	if (untried.length === 0) {
		// Fallback (shouldn't happen in normal gameplay)
		return { row: 0, col: 0 };
	}
	return untried[Math.floor(Math.random() * untried.length)];
}

// MEDIUM: Hunt mode + Target mode when hit
function getMediumMove(opponentBoard: PlayerBoard, aiState: AIState): Coord {
	// If we have cells to investigate from previous hits, try them
	while (aiState.hitStack.length > 0) {
		const target = aiState.hitStack.pop()!;
		if (isValidTarget(target, opponentBoard)) {
			return target;
		}
	}

	// Hunt mode: random selection with checkerboard pattern for efficiency
	const untried = getUntriedCells(opponentBoard);
	if (untried.length === 0) {
		return { row: 0, col: 0 };
	}

	// Prefer checkerboard pattern (like a chess board's one color)
	const checkerboard = untried.filter((c) => (c.row + c.col) % 2 === 0);
	const candidates = checkerboard.length > 0 ? checkerboard : untried;

	return candidates[Math.floor(Math.random() * candidates.length)];
}

// Update AI state after a shot result
export function updateAIState(
	aiState: AIState,
	coord: Coord,
	result: 'hit' | 'miss' | 'sunk',
	opponentBoard: PlayerBoard
): void {
	if (result === 'hit') {
		aiState.mode = 'target';

		// Add adjacent cells to investigate
		const adjacent = getAdjacentCells(coord);
		for (const adj of adjacent) {
			if (isValidTarget(adj, opponentBoard)) {
				// Add to front of stack so we investigate this area first
				aiState.hitStack.unshift(adj);
			}
		}

		// If we had a previous hit, determine direction
		if (aiState.lastHit) {
			if (aiState.lastHit.row === coord.row) {
				aiState.hitDirection = 'horizontal';
				// Prioritize cells in this direction
				const leftRight = [
					{ row: coord.row, col: coord.col - 1 },
					{ row: coord.row, col: coord.col + 1 }
				].filter((c) => isValidTarget(c, opponentBoard));
				aiState.hitStack = [...leftRight, ...aiState.hitStack];
			} else if (aiState.lastHit.col === coord.col) {
				aiState.hitDirection = 'vertical';
				// Prioritize cells in this direction
				const upDown = [
					{ row: coord.row - 1, col: coord.col },
					{ row: coord.row + 1, col: coord.col }
				].filter((c) => isValidTarget(c, opponentBoard));
				aiState.hitStack = [...upDown, ...aiState.hitStack];
			}
		}

		aiState.lastHit = coord;
	} else if (result === 'sunk') {
		// Ship sunk! Clear targeting state and go back to hunting
		aiState.mode = 'hunt';
		aiState.hitStack = [];
		aiState.lastHit = null;
		aiState.hitDirection = null;
		aiState.triedDirections.clear();
	}
	// On miss, just continue with current strategy
}

// HARD: Probability-based targeting
function getHardMove(opponentBoard: PlayerBoard, aiState: AIState): Coord {
	// First, handle target mode if we have hits to follow
	if (aiState.hitStack.length > 0) {
		// Prioritize based on direction if known
		if (aiState.hitDirection && aiState.lastHit) {
			const priorityCells: Coord[] = [];
			if (aiState.hitDirection === 'horizontal') {
				priorityCells.push(
					{ row: aiState.lastHit.row, col: aiState.lastHit.col - 1 },
					{ row: aiState.lastHit.row, col: aiState.lastHit.col + 1 }
				);
			} else {
				priorityCells.push(
					{ row: aiState.lastHit.row - 1, col: aiState.lastHit.col },
					{ row: aiState.lastHit.row + 1, col: aiState.lastHit.col }
				);
			}

			for (const cell of priorityCells) {
				if (isValidTarget(cell, opponentBoard)) {
					return cell;
				}
			}
		}

		// Fall back to hit stack
		while (aiState.hitStack.length > 0) {
			const target = aiState.hitStack.pop()!;
			if (isValidTarget(target, opponentBoard)) {
				return target;
			}
		}
	}

	// Hunt mode: Use probability density map
	const probabilityMap = calculateProbabilityMap(opponentBoard);

	// Find the cell(s) with highest probability
	let maxProb = 0;
	let bestCells: Coord[] = [];

	for (let row = 0; row < BOARD_SIZE; row++) {
		for (let col = 0; col < BOARD_SIZE; col++) {
			const prob = probabilityMap[row][col];
			if (prob > maxProb) {
				maxProb = prob;
				bestCells = [{ row, col }];
			} else if (prob === maxProb && prob > 0) {
				bestCells.push({ row, col });
			}
		}
	}

	if (bestCells.length === 0) {
		// Fallback to random
		return getEasyMove(opponentBoard);
	}

	// Pick randomly among best cells
	return bestCells[Math.floor(Math.random() * bestCells.length)];
}

// Calculate probability density for each cell
function calculateProbabilityMap(opponentBoard: PlayerBoard): number[][] {
	const probMap: number[][] = Array.from({ length: BOARD_SIZE }, () =>
		Array.from({ length: BOARD_SIZE }, () => 0)
	);

	// Get remaining ship lengths (ships that haven't been sunk)
	const sunkShipTypes = new Set(
		opponentBoard.ships.filter((s) => s.sunk).map((s) => s.type)
	);

	const remainingShipLengths: number[] = [];
	for (const shipType of SHIP_TYPES) {
		if (!sunkShipTypes.has(shipType)) {
			remainingShipLengths.push(SHIP_CONFIGS[shipType].length);
		}
	}

	// For each remaining ship length, count possible placements
	for (const length of remainingShipLengths) {
		// Try horizontal placements
		for (let row = 0; row < BOARD_SIZE; row++) {
			for (let col = 0; col <= BOARD_SIZE - length; col++) {
				if (canPlaceShipAt(opponentBoard, row, col, length, 'horizontal')) {
					for (let i = 0; i < length; i++) {
						probMap[row][col + i]++;
					}
				}
			}
		}

		// Try vertical placements
		for (let row = 0; row <= BOARD_SIZE - length; row++) {
			for (let col = 0; col < BOARD_SIZE; col++) {
				if (canPlaceShipAt(opponentBoard, row, col, length, 'vertical')) {
					for (let i = 0; i < length; i++) {
						probMap[row + i][col]++;
					}
				}
			}
		}
	}

	// Zero out cells that have already been shot
	for (let row = 0; row < BOARD_SIZE; row++) {
		for (let col = 0; col < BOARD_SIZE; col++) {
			const cell = opponentBoard.grid[row][col];
			if (cell === 'hit' || cell === 'miss' || cell === 'sunk') {
				probMap[row][col] = 0;
			}
		}
	}

	return probMap;
}

// Check if a ship of given length can be placed at position
function canPlaceShipAt(
	board: PlayerBoard,
	startRow: number,
	startCol: number,
	length: number,
	orientation: 'horizontal' | 'vertical'
): boolean {
	for (let i = 0; i < length; i++) {
		const row = orientation === 'vertical' ? startRow + i : startRow;
		const col = orientation === 'horizontal' ? startCol + i : startCol;

		if (row >= BOARD_SIZE || col >= BOARD_SIZE) {
			return false;
		}

		const cell = board.grid[row][col];
		// Can't place if cell is already a miss or sunk
		if (cell === 'miss' || cell === 'sunk') {
			return false;
		}
	}
	return true;
}

// Main function to get AI's next move
export function getAIMove(
	opponentBoard: PlayerBoard,
	difficulty: AIDifficulty,
	aiState: AIState
): Coord {
	switch (difficulty) {
		case 'easy':
			return getEasyMove(opponentBoard);
		case 'medium':
			return getMediumMove(opponentBoard, aiState);
		case 'hard':
			return getHardMove(opponentBoard, aiState);
		default:
			return getEasyMove(opponentBoard);
	}
}
