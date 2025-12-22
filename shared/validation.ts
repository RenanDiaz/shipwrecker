import type { Coord, Orientation, PlayerBoard, ShipType, Ship } from './types';
import { BOARD_SIZE, SHIP_CONFIGS } from './constants';

// Check if a coordinate is within board bounds
export function isValidCoord(coord: Coord): boolean {
	return coord.row >= 0 && coord.row < BOARD_SIZE && coord.col >= 0 && coord.col < BOARD_SIZE;
}

// Get all coordinates for a ship placement
export function getShipCoords(
	startCoord: Coord,
	orientation: Orientation,
	length: number
): Coord[] {
	const coords: Coord[] = [];
	for (let i = 0; i < length; i++) {
		if (orientation === 'horizontal') {
			coords.push({ row: startCoord.row, col: startCoord.col + i });
		} else {
			coords.push({ row: startCoord.row + i, col: startCoord.col });
		}
	}
	return coords;
}

// Check if all ship coordinates are valid (within bounds)
export function areShipCoordsValid(coords: Coord[]): boolean {
	return coords.every(isValidCoord);
}

// Check if a ship overlaps with existing ships
export function doesShipOverlap(coords: Coord[], existingShips: Ship[]): boolean {
	const occupiedCoords = new Set<string>();

	for (const ship of existingShips) {
		for (const coord of ship.coords) {
			occupiedCoords.add(`${coord.row},${coord.col}`);
		}
	}

	return coords.some((coord) => occupiedCoords.has(`${coord.row},${coord.col}`));
}

// Validate a ship placement
export function validateShipPlacement(
	shipType: ShipType,
	startCoord: Coord,
	orientation: Orientation,
	existingShips: Ship[]
): { valid: boolean; coords: Coord[]; error?: string } {
	const shipConfig = SHIP_CONFIGS[shipType];
	if (!shipConfig) {
		return { valid: false, coords: [], error: 'Invalid ship type' };
	}

	const coords = getShipCoords(startCoord, orientation, shipConfig.length);

	// Check if ship is already placed
	if (existingShips.some((s) => s.type === shipType)) {
		return { valid: false, coords: [], error: 'Ship already placed' };
	}

	// Check bounds
	if (!areShipCoordsValid(coords)) {
		return { valid: false, coords, error: 'Ship goes out of bounds' };
	}

	// Check overlap
	if (doesShipOverlap(coords, existingShips)) {
		return { valid: false, coords, error: 'Ship overlaps with another ship' };
	}

	return { valid: true, coords };
}

// Create an empty board grid
export function createEmptyGrid(): ('empty' | 'ship' | 'hit' | 'miss' | 'sunk')[][] {
	return Array.from({ length: BOARD_SIZE }, () =>
		Array.from({ length: BOARD_SIZE }, () => 'empty' as const)
	);
}

// Create an empty player board
export function createEmptyBoard(): PlayerBoard {
	return {
		grid: createEmptyGrid(),
		ships: [],
		allShipsSunk: false
	};
}

// Check if all ships are sunk
export function areAllShipsSunk(ships: Ship[]): boolean {
	return ships.length > 0 && ships.every((ship) => ship.sunk);
}

// Process a shot on a board
export function processShot(
	board: PlayerBoard,
	coord: Coord
): { result: 'hit' | 'miss' | 'sunk'; sunkShip?: ShipType; updatedBoard: PlayerBoard } {
	const { row, col } = coord;

	// Check if already shot
	if (board.grid[row][col] === 'hit' || board.grid[row][col] === 'miss' || board.grid[row][col] === 'sunk') {
		return { result: 'miss', updatedBoard: board }; // Treat as miss for invalid shot
	}

	// Check if hit a ship
	const hitShip = board.ships.find((ship) =>
		ship.coords.some((c) => c.row === row && c.col === col)
	);

	if (hitShip) {
		// Update ship hits
		hitShip.hits++;
		hitShip.sunk = hitShip.hits >= hitShip.length;

		if (hitShip.sunk) {
			// Mark all ship cells as sunk
			for (const c of hitShip.coords) {
				board.grid[c.row][c.col] = 'sunk';
			}
			board.allShipsSunk = areAllShipsSunk(board.ships);
			return { result: 'sunk', sunkShip: hitShip.type, updatedBoard: board };
		} else {
			board.grid[row][col] = 'hit';
			return { result: 'hit', updatedBoard: board };
		}
	} else {
		board.grid[row][col] = 'miss';
		return { result: 'miss', updatedBoard: board };
	}
}

// Create opponent's view of a board (hide ship positions)
export function createOpponentView(board: PlayerBoard): PlayerBoard {
	const viewGrid = board.grid.map((row) =>
		row.map((cell) => {
			if (cell === 'ship') return 'empty' as const;
			return cell;
		})
	);

	return {
		grid: viewGrid,
		ships: board.ships.map((ship) => ({
			...ship,
			coords: ship.sunk ? ship.coords : [] // Only show coords of sunk ships
		})),
		allShipsSunk: board.allShipsSunk
	};
}
