import type { Coord, Orientation, Ship, CellState } from '../../../shared/types';
import { BOARD_SIZE, SHIP_CONFIGS } from '../../../shared/constants';
import type { ShipType } from '../../../shared/types';

// Validate ship placement client-side
export function validatePlacement(
	shipType: ShipType,
	startCoord: Coord,
	orientation: Orientation,
	existingShips: Ship[],
	grid: CellState[][]
): { valid: boolean; coords: Coord[]; error?: string } {
	const config = SHIP_CONFIGS[shipType];
	if (!config) {
		return { valid: false, coords: [], error: 'Invalid ship type' };
	}

	const length = config.length;
	const coords: Coord[] = [];

	// Generate coordinates
	for (let i = 0; i < length; i++) {
		if (orientation === 'horizontal') {
			coords.push({ row: startCoord.row, col: startCoord.col + i });
		} else {
			coords.push({ row: startCoord.row + i, col: startCoord.col });
		}
	}

	// Check bounds
	for (const coord of coords) {
		if (coord.row < 0 || coord.row >= BOARD_SIZE || coord.col < 0 || coord.col >= BOARD_SIZE) {
			return { valid: false, coords, error: 'Out of bounds' };
		}
	}

	// Check if ship already placed
	if (existingShips.some((s) => s.type === shipType)) {
		return { valid: false, coords, error: 'Ship already placed' };
	}

	// Check overlap with existing ships
	const occupiedCells = new Set<string>();
	for (const ship of existingShips) {
		for (const c of ship.coords) {
			occupiedCells.add(`${c.row},${c.col}`);
		}
	}

	for (const coord of coords) {
		if (occupiedCells.has(`${coord.row},${coord.col}`)) {
			return { valid: false, coords, error: 'Overlaps another ship' };
		}
	}

	return { valid: true, coords };
}

// Get the next ship to place
export function getNextShipToPlace(placedShips: Ship[]): ShipType | null {
	const shipTypes: ShipType[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
	const placedTypes = new Set(placedShips.map((s) => s.type));

	for (const type of shipTypes) {
		if (!placedTypes.has(type)) {
			return type;
		}
	}

	return null;
}

// Count remaining ships
export function countRemainingShips(ships: Ship[]): number {
	return ships.filter((s) => !s.sunk).length;
}

// Count hits on opponent's board
export function countHits(grid: CellState[][]): number {
	let hits = 0;
	for (const row of grid) {
		for (const cell of row) {
			if (cell === 'hit' || cell === 'sunk') {
				hits++;
			}
		}
	}
	return hits;
}

// Count misses on opponent's board
export function countMisses(grid: CellState[][]): number {
	let misses = 0;
	for (const row of grid) {
		for (const cell of row) {
			if (cell === 'miss') {
				misses++;
			}
		}
	}
	return misses;
}
