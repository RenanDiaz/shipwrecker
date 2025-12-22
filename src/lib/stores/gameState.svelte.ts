import { browser } from '$app/environment';
import PartySocket from 'partysocket';
import type {
	ClientGameState,
	ClientMessage,
	ServerMessage,
	Coord,
	ShipPlacement,
	ShipType,
	ShotResult
} from '../../../shared/types';
import { generatePlayerId } from '../../../shared/constants';

// Game connection state
interface ConnectionState {
	connected: boolean;
	error: string | null;
}

// Create game state store
function createGameStore() {
	// State using Svelte 5 runes
	let socket: PartySocket | null = $state(null);
	let connectionState = $state<ConnectionState>({ connected: false, error: null });
	let gameState = $state<ClientGameState | null>(null);
	let playerId = $state<string>('');
	let lastShotResult = $state<ShotResult | null>(null);
	let lastOpponentShot = $state<{ coord: Coord; result: 'hit' | 'miss' | 'sunk' } | null>(null);
	let rematchRequestedBy = $state<1 | 2 | null>(null);
	let linkCopied = $state(false);

	// Initialize player ID
	if (browser) {
		const stored = localStorage.getItem('shipwrecker_playerId');
		if (stored) {
			playerId = stored;
		} else {
			playerId = generatePlayerId();
			localStorage.setItem('shipwrecker_playerId', playerId);
		}
	}

	// Connect to a room
	function connect(roomId: string): void {
		if (socket) {
			socket.close();
		}

		connectionState = { connected: false, error: null };

		const host = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999';
		const protocol = host.startsWith('localhost') ? 'ws' : 'wss';

		socket = new PartySocket({
			host,
			room: roomId,
			protocol
		});

		socket.addEventListener('open', () => {
			connectionState = { connected: true, error: null };
			// Join the room
			sendMessage({ type: 'join', playerId });
		});

		socket.addEventListener('message', (event) => {
			try {
				const message = JSON.parse(event.data) as ServerMessage;
				handleServerMessage(message);
			} catch (e) {
				console.error('Failed to parse message:', e);
			}
		});

		socket.addEventListener('close', () => {
			connectionState = { connected: false, error: 'Connection closed' };
		});

		socket.addEventListener('error', () => {
			connectionState = { connected: false, error: 'Connection error' };
		});
	}

	// Disconnect
	function disconnect(): void {
		if (socket) {
			socket.close();
			socket = null;
		}
		connectionState = { connected: false, error: null };
		gameState = null;
	}

	// Send message to server
	function sendMessage(message: ClientMessage): void {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(message));
		}
	}

	// Handle incoming server messages
	function handleServerMessage(message: ServerMessage): void {
		switch (message.type) {
			case 'gameState':
				gameState = message.state;
				break;
			case 'error':
				console.error('Server error:', message.message);
				connectionState = { ...connectionState, error: message.message };
				break;
			case 'shotResult':
				lastShotResult = message.result;
				// Clear after animation
				setTimeout(() => {
					lastShotResult = null;
				}, 2000);
				break;
			case 'opponentShot':
				lastOpponentShot = {
					coord: message.coord,
					result: message.result
				};
				// Clear after animation
				setTimeout(() => {
					lastOpponentShot = null;
				}, 2000);
				break;
			case 'turnChange':
				if (gameState) {
					gameState = { ...gameState, isYourTurn: message.isYourTurn };
				}
				break;
			case 'phaseChange':
				if (gameState) {
					gameState = { ...gameState, phase: message.phase };
				}
				break;
			case 'gameOver':
				if (gameState) {
					gameState = { ...gameState, winner: message.winner };
				}
				break;
			case 'rematchRequested':
				rematchRequestedBy = message.byPlayer;
				break;
			case 'rematchStarted':
				rematchRequestedBy = null;
				lastShotResult = null;
				lastOpponentShot = null;
				break;
			case 'playerJoined':
			case 'playerLeft':
				// State will be updated via gameState message
				break;
		}
	}

	// Game actions
	function placeShip(placement: ShipPlacement): void {
		sendMessage({ type: 'placeShip', placement });
	}

	function removeShip(shipType: ShipType): void {
		sendMessage({ type: 'removeShip', shipType });
	}

	function setReady(): void {
		sendMessage({ type: 'ready' });
	}

	function fire(coord: Coord): void {
		sendMessage({ type: 'fire', coord });
	}

	function requestRematch(): void {
		sendMessage({ type: 'rematch' });
	}

	function copyRoomLink(): void {
		if (gameState && browser) {
			const url = `${window.location.origin}/game/${gameState.roomId}`;
			navigator.clipboard.writeText(url);
			linkCopied = true;
			setTimeout(() => {
				linkCopied = false;
			}, 2000);
		}
	}

	return {
		// Getters
		get socket() {
			return socket;
		},
		get connectionState() {
			return connectionState;
		},
		get gameState() {
			return gameState;
		},
		get playerId() {
			return playerId;
		},
		get lastShotResult() {
			return lastShotResult;
		},
		get lastOpponentShot() {
			return lastOpponentShot;
		},
		get rematchRequestedBy() {
			return rematchRequestedBy;
		},
		get linkCopied() {
			return linkCopied;
		},
		// Actions
		connect,
		disconnect,
		placeShip,
		removeShip,
		setReady,
		fire,
		requestRematch,
		copyRoomLink
	};
}

// Export singleton
export const gameStore = createGameStore();
