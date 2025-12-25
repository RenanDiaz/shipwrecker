import type * as Party from 'partykit/server';
import type { ClientMessage, ServerMessage, GameState, ChatMessage, ChatMessageType, PresetMessageId, ReactionId, AIDifficulty, GameMode } from '../shared/types';
import {
	createGameState,
	addPlayer,
	removePlayer,
	placeShip,
	removeShip,
	setPlayerReady,
	fireShot,
	resetGame,
	getClientGameState,
	addAIPlayer,
	setupAIBoard,
	isAITurn
} from './gameEngine';
import { AI_PLAYER_ID, getAIMove, createAIState, updateAIState, type AIState } from './aiEngine';

// Store player connections
interface ConnectionInfo {
	playerId: string;
}

export default class ShipWreckerServer implements Party.Server {
	private gameState: GameState;
	private connections: Map<string, ConnectionInfo> = new Map();
	private rematchRequests: Set<string> = new Set();
	private chatMessageCounter: number = 0;
	private aiState: AIState | null = null;
	private aiTurnTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor(readonly room: Party.Room) {
		this.gameState = createGameState(room.id);
	}

	// Handle new connection
	onConnect(conn: Party.Connection, ctx: Party.ConnectionContext): void {
		console.log(`[${this.room.id}] Connection established: ${conn.id}`);
	}

	// Handle disconnection
	onClose(conn: Party.Connection): void {
		const info = this.connections.get(conn.id);
		if (info) {
			console.log(`[${this.room.id}] Player disconnected: ${info.playerId}`);
			removePlayer(this.gameState, info.playerId);
			this.connections.delete(conn.id);

			// Clear AI turn timeout if player disconnects
			if (this.aiTurnTimeout) {
				clearTimeout(this.aiTurnTimeout);
				this.aiTurnTimeout = null;
			}

			// Notify other players (but not for AI games since AI never disconnects)
			if (this.gameState.gameMode !== 'singlePlayer') {
				const playerNumber =
					this.gameState.player1?.id === info.playerId
						? 1
						: this.gameState.player2?.id === info.playerId
							? 2
							: null;

				if (playerNumber) {
					this.broadcast({ type: 'playerLeft', playerNumber });
				}
			}

			// Send updated state to remaining player
			this.broadcastGameState();
		}
	}

	// Handle incoming messages
	onMessage(message: string, sender: Party.Connection): void {
		let parsed: ClientMessage;
		try {
			parsed = JSON.parse(message) as ClientMessage;
		} catch (e) {
			this.sendToConnection(sender, {
				type: 'error',
				message: 'Invalid message format'
			});
			return;
		}

		console.log(`[${this.room.id}] Received message:`, parsed.type);

		switch (parsed.type) {
			case 'join':
				this.handleJoin(sender, parsed.playerId, parsed.gameMode, parsed.aiDifficulty);
				break;
			case 'placeShip':
				this.handlePlaceShip(sender, parsed.placement);
				break;
			case 'removeShip':
				this.handleRemoveShip(sender, parsed.shipType);
				break;
			case 'ready':
				this.handleReady(sender);
				break;
			case 'fire':
				this.handleFire(sender, parsed.coord);
				break;
			case 'rematch':
				this.handleRematch(sender);
				break;
			case 'chat':
				this.handleChat(sender, parsed.messageType, parsed.content);
				break;
		}
	}

	private handleJoin(
		conn: Party.Connection,
		playerId: string,
		gameMode?: GameMode,
		aiDifficulty?: AIDifficulty
	): void {
		// Check if already connected
		const existingConn = Array.from(this.connections.entries()).find(
			([, info]) => info.playerId === playerId
		);

		if (existingConn) {
			// Reconnection - update connection ID
			this.connections.delete(existingConn[0]);
		}

		// If this is a new single player game, reinitialize the game state
		if (gameMode === 'singlePlayer' && !this.gameState.player1) {
			this.gameState = createGameState(this.room.id, 'singlePlayer', aiDifficulty);
			this.aiState = createAIState();
		}

		const { success, playerNumber, error } = addPlayer(this.gameState, playerId);

		if (!success) {
			this.sendToConnection(conn, { type: 'error', message: error || 'Failed to join' });
			return;
		}

		// Store connection info
		this.connections.set(conn.id, { playerId });

		// Notify about join
		this.broadcast({ type: 'playerJoined', playerNumber: playerNumber! });

		// If single player mode, add AI player immediately
		if (this.gameState.gameMode === 'singlePlayer' && !this.gameState.player2) {
			const aiResult = addAIPlayer(this.gameState);
			if (aiResult.success) {
				console.log(`[${this.room.id}] AI opponent added`);
				this.broadcast({ type: 'playerJoined', playerNumber: 2 });
			}
		}

		// Send game state to all
		this.broadcastGameState();
	}

	private handlePlaceShip(
		conn: Party.Connection,
		placement: ClientMessage & { type: 'placeShip' }['placement']
	): void {
		const info = this.connections.get(conn.id);
		if (!info) {
			this.sendToConnection(conn, { type: 'error', message: 'Not connected' });
			return;
		}

		const { success, error } = placeShip(this.gameState, info.playerId, placement);

		if (!success) {
			this.sendToConnection(conn, { type: 'error', message: error || 'Failed to place ship' });
			return;
		}

		// Send updated state to player
		this.sendGameState(conn, info.playerId);
	}

	private handleRemoveShip(
		conn: Party.Connection,
		shipType: ClientMessage & { type: 'removeShip' }['shipType']
	): void {
		const info = this.connections.get(conn.id);
		if (!info) {
			this.sendToConnection(conn, { type: 'error', message: 'Not connected' });
			return;
		}

		const { success, error } = removeShip(this.gameState, info.playerId, shipType);

		if (!success) {
			this.sendToConnection(conn, { type: 'error', message: error || 'Failed to remove ship' });
			return;
		}

		// Send updated state to player
		this.sendGameState(conn, info.playerId);
	}

	private handleReady(conn: Party.Connection): void {
		const info = this.connections.get(conn.id);
		if (!info) {
			this.sendToConnection(conn, { type: 'error', message: 'Not connected' });
			return;
		}

		const { success, bothReady, error } = setPlayerReady(
			this.gameState,
			info.playerId
		);

		if (!success) {
			this.sendToConnection(conn, { type: 'error', message: error || 'Failed to set ready' });
			return;
		}

		// In single player mode, set up AI board when human is ready
		if (this.gameState.gameMode === 'singlePlayer' && !this.gameState.player2?.ready) {
			const aiSetupResult = setupAIBoard(this.gameState);
			if (!aiSetupResult.success) {
				console.error(`[${this.room.id}] Failed to setup AI board:`, aiSetupResult.error);
			}
		}

		// Check if both are now ready (including AI)
		const nowBothReady = this.gameState.player1?.ready && this.gameState.player2?.ready;

		if (nowBothReady && this.gameState.phase === 'setup') {
			// Start the game
			this.gameState.phase = 'playing';
			this.gameState.currentTurn = this.gameState.player1!.id;
			this.broadcast({ type: 'phaseChange', phase: 'playing' });
		}

		// Send updated state to all
		this.broadcastGameState();
	}

	private handleFire(
		conn: Party.Connection,
		coord: ClientMessage & { type: 'fire' }['coord']
	): void {
		const info = this.connections.get(conn.id);
		if (!info) {
			this.sendToConnection(conn, { type: 'error', message: 'Not connected' });
			return;
		}

		const { success, result, sunkShip, gameOver, error } = fireShot(
			this.gameState,
			info.playerId,
			coord
		);

		if (!success) {
			this.sendToConnection(conn, { type: 'error', message: error || 'Failed to fire' });
			return;
		}

		// Send shot result to firing player
		this.sendToConnection(conn, {
			type: 'shotResult',
			result: { coord, result: result!, sunkShip, gameOver: gameOver || false }
		});

		// Notify opponent (only for multiplayer, AI doesn't need notifications)
		if (this.gameState.gameMode !== 'singlePlayer') {
			const opponentConn = this.getOpponentConnection(conn.id);
			if (opponentConn) {
				this.sendToConnection(opponentConn, {
					type: 'opponentShot',
					coord,
					result: result!,
					sunkShip
				});
			}
		}

		if (gameOver) {
			this.broadcast({ type: 'phaseChange', phase: 'finished' });

			// Send game over to each player
			for (const [connId, connInfo] of this.connections) {
				const c = this.room.getConnection(connId);
				if (c) {
					this.sendToConnection(c, {
						type: 'gameOver',
						winner: connInfo.playerId === info.playerId ? 'you' : 'opponent'
					});
				}
			}
		} else {
			// Notify turn change
			this.broadcastTurnChange();

			// If it's now AI's turn, schedule AI move
			if (isAITurn(this.gameState)) {
				this.scheduleAITurn();
			}
		}

		// Send updated state to all
		this.broadcastGameState();
	}

	// Schedule AI turn with a delay for natural feel
	private scheduleAITurn(): void {
		if (this.aiTurnTimeout) {
			clearTimeout(this.aiTurnTimeout);
		}

		// Random delay between 1-2 seconds
		const delay = 1000 + Math.random() * 1000;

		this.aiTurnTimeout = setTimeout(() => {
			this.processAITurn();
		}, delay);
	}

	// Process AI's turn
	private processAITurn(): void {
		if (!isAITurn(this.gameState) || !this.aiState) {
			return;
		}

		// Get human player's board to shoot at
		const humanPlayerId = this.gameState.player1?.id;
		if (!humanPlayerId) {
			return;
		}

		const humanBoard = this.gameState.boards[humanPlayerId];
		if (!humanBoard) {
			return;
		}

		// Get AI's move based on difficulty
		const difficulty = this.gameState.aiDifficulty || 'medium';
		const coord = getAIMove(humanBoard, difficulty, this.aiState);

		// Process the shot
		const { success, result, sunkShip, gameOver } = fireShot(
			this.gameState,
			AI_PLAYER_ID,
			coord
		);

		if (!success) {
			console.error(`[${this.room.id}] AI fire failed`);
			return;
		}

		// Update AI state based on result
		updateAIState(this.aiState, coord, result!, humanBoard);

		// Notify human player about the shot
		for (const [connId, connInfo] of this.connections) {
			const c = this.room.getConnection(connId);
			if (c && connInfo.playerId === humanPlayerId) {
				this.sendToConnection(c, {
					type: 'opponentShot',
					coord,
					result: result!,
					sunkShip
				});
			}
		}

		if (gameOver) {
			this.broadcast({ type: 'phaseChange', phase: 'finished' });

			// Send game over to human player (AI won)
			for (const [connId, connInfo] of this.connections) {
				const c = this.room.getConnection(connId);
				if (c) {
					this.sendToConnection(c, {
						type: 'gameOver',
						winner: 'opponent'
					});
				}
			}
		} else {
			// Notify turn change
			this.broadcastTurnChange();
		}

		// Send updated state
		this.broadcastGameState();
	}

	private handleRematch(conn: Party.Connection): void {
		const info = this.connections.get(conn.id);
		if (!info) return;

		if (this.gameState.phase !== 'finished') {
			this.sendToConnection(conn, { type: 'error', message: 'Game not finished' });
			return;
		}

		this.rematchRequests.add(info.playerId);

		// Notify players
		const playerNumber =
			this.gameState.player1?.id === info.playerId ? 1 : 2;
		this.broadcast({ type: 'rematchRequested', byPlayer: playerNumber });

		// In single player mode, AI auto-accepts rematch
		if (this.gameState.gameMode === 'singlePlayer') {
			this.rematchRequests.add(AI_PLAYER_ID);
			// Reset AI state for new game
			this.aiState = createAIState();
		}

		// Check if both requested
		const bothRequested =
			this.gameState.player1 &&
			this.gameState.player2 &&
			this.rematchRequests.has(this.gameState.player1.id) &&
			this.rematchRequests.has(this.gameState.player2.id);

		if (bothRequested) {
			this.rematchRequests.clear();
			resetGame(this.gameState);
			this.broadcast({ type: 'rematchStarted' });
			this.broadcast({ type: 'phaseChange', phase: 'setup' });
			this.broadcastGameState();
		}
	}

	private handleChat(
		conn: Party.Connection,
		messageType: ChatMessageType,
		content: PresetMessageId | ReactionId
	): void {
		const info = this.connections.get(conn.id);
		if (!info) return;

		// Determine player number
		const playerNumber: 1 | 2 =
			this.gameState.player1?.id === info.playerId ? 1 : 2;

		// Create chat message
		const chatMessage: ChatMessage = {
			id: `msg_${++this.chatMessageCounter}`,
			from: playerNumber,
			messageType,
			content,
			timestamp: Date.now()
		};

		// Broadcast to all players
		this.broadcast({ type: 'chatMessage', message: chatMessage });
	}

	private sendToConnection(conn: Party.Connection, message: ServerMessage): void {
		conn.send(JSON.stringify(message));
	}

	private broadcast(message: ServerMessage): void {
		for (const connId of this.connections.keys()) {
			const conn = this.room.getConnection(connId);
			if (conn) {
				this.sendToConnection(conn, message);
			}
		}
	}

	private broadcastGameState(): void {
		for (const [connId, info] of this.connections) {
			const conn = this.room.getConnection(connId);
			if (conn) {
				this.sendGameState(conn, info.playerId);
			}
		}
	}

	private sendGameState(conn: Party.Connection, playerId: string): void {
		const clientState = getClientGameState(this.gameState, playerId);
		if (clientState) {
			this.sendToConnection(conn, { type: 'gameState', state: clientState });
		}
	}

	private broadcastTurnChange(): void {
		for (const [connId, info] of this.connections) {
			const conn = this.room.getConnection(connId);
			if (conn) {
				this.sendToConnection(conn, {
					type: 'turnChange',
					isYourTurn: this.gameState.currentTurn === info.playerId
				});
			}
		}
	}

	private getOpponentConnection(connId: string): Party.Connection | null {
		const info = this.connections.get(connId);
		if (!info) return null;

		for (const [otherId, otherInfo] of this.connections) {
			if (otherId !== connId && otherInfo.playerId !== info.playerId) {
				return this.room.getConnection(otherId) || null;
			}
		}
		return null;
	}
}
