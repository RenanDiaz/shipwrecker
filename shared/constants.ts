import type { ShipType } from './types';

// Board dimensions
export const BOARD_SIZE = 10;

// Ship configurations
export const SHIP_CONFIGS: Record<ShipType, { length: number; name: string }> = {
	carrier: { length: 5, name: 'Carrier' },
	battleship: { length: 4, name: 'Battleship' },
	cruiser: { length: 3, name: 'Cruiser' },
	submarine: { length: 3, name: 'Submarine' },
	destroyer: { length: 2, name: 'Destroyer' }
};

// Ship placement order
export const SHIP_TYPES: ShipType[] = [
	'carrier',
	'battleship',
	'cruiser',
	'submarine',
	'destroyer'
];

// Total ships to place
export const TOTAL_SHIPS = SHIP_TYPES.length;

// Column labels (A-J)
export const COLUMN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Row labels (1-10)
export const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Generate a unique room ID
export function generateRoomId(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

// Generate a unique player ID
export function generatePlayerId(): string {
	return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
