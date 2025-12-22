import type { Coord, Orientation, CellState } from '../../../shared/types';
import { BOARD_SIZE, COLUMN_LABELS, ROW_LABELS } from '../../../shared/constants';

// Convert coordinate to display format (e.g., "A1")
export function coordToLabel(coord: Coord): string {
	return `${COLUMN_LABELS[coord.col]}${ROW_LABELS[coord.row]}`;
}

// Parse label back to coordinate
export function labelToCoord(label: string): Coord | null {
	if (label.length < 2) return null;

	const col = COLUMN_LABELS.indexOf(label[0].toUpperCase());
	const row = parseInt(label.slice(1), 10) - 1;

	if (col === -1 || isNaN(row) || row < 0 || row >= BOARD_SIZE) {
		return null;
	}

	return { row, col };
}

// Get preview coordinates for ship placement
export function getShipPreviewCoords(
	startCoord: Coord,
	length: number,
	orientation: Orientation
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

// Check if coordinates are within bounds
export function isWithinBounds(coord: Coord): boolean {
	return coord.row >= 0 && coord.row < BOARD_SIZE && coord.col >= 0 && coord.col < BOARD_SIZE;
}

// Get cell display class based on state
export function getCellClass(
	state: CellState,
	isPreview: boolean = false,
	isValidPreview: boolean = true
): string {
	if (isPreview) {
		return isValidPreview ? 'cell-valid' : 'cell-invalid';
	}

	switch (state) {
		case 'ship':
			return 'cell-ship';
		case 'hit':
			return 'cell-hit';
		case 'miss':
			return 'cell-miss';
		case 'sunk':
			return 'cell-sunk';
		default:
			return 'cell-water';
	}
}

// Check if a shot can be fired at a cell
export function canFireAt(state: CellState): boolean {
	return state === 'empty' || state === 'ship';
}
