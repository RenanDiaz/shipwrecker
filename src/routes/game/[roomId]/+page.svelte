<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { gameStore } from '$lib/stores/gameState.svelte';
	import Board from '$lib/components/Board.svelte';
	import ShipPlacement from '$lib/components/ShipPlacement.svelte';
	import GameControls from '$lib/components/GameControls.svelte';
	import GameStatus from '$lib/components/GameStatus.svelte';
	import WinnerModal from '$lib/components/WinnerModal.svelte';
	import type { Coord, Orientation, ShipType } from '../../../../shared/types';
	import { TOTAL_SHIPS } from '../../../../shared/constants';

	// Get room ID from URL
	let roomId = $derived($page.params.roomId ?? '');

	// Local state for ship placement preview
	let previewCoords = $state<Coord[]>([]);
	let isValidPreview = $state(true);

	// Selected target for firing
	let selectedTarget = $state<Coord | null>(null);

	// Reference to ShipPlacement component
	let shipPlacement = $state<ShipPlacement | null>(null);

	// Connect to room on mount
	onMount(() => {
		if (roomId) {
			gameStore.connect(roomId);
		}
	});

	// Disconnect on unmount
	onDestroy(() => {
		gameStore.disconnect();
	});

	// Derived values from store
	let connectionState = $derived(gameStore.connectionState);
	let gameState = $derived(gameStore.gameState);
	let lastShotResult = $derived(gameStore.lastShotResult);
	let lastOpponentShot = $derived(gameStore.lastOpponentShot);
	let rematchRequestedBy = $derived(gameStore.rematchRequestedBy);
	let linkCopied = $derived(gameStore.linkCopied);

	// Computed values
	let isSetupPhase = $derived(gameState?.phase === 'setup');
	let isPlayingPhase = $derived(gameState?.phase === 'playing');
	let isFinished = $derived(gameState?.phase === 'finished');
	let isYourTurn = $derived(gameState?.isYourTurn ?? false);
	let yourBoard = $derived(gameState?.yourBoard);
	let opponentBoard = $derived(gameState?.opponentBoard);
	let allShipsPlaced = $derived((yourBoard?.ships.length ?? 0) === TOTAL_SHIPS);
	let canFire = $derived(isYourTurn && selectedTarget !== null);

	// Ship placement handlers
	function handlePlaceShip(shipType: ShipType, coord: Coord, orientation: Orientation): void {
		gameStore.placeShip({
			shipType,
			startCoord: coord,
			orientation
		});
		previewCoords = [];
	}

	function handleRemoveShip(shipType: ShipType): void {
		gameStore.removeShip(shipType);
	}

	function handleReady(): void {
		gameStore.setReady();
	}

	function handlePreviewChange(coords: Coord[], isValid: boolean): void {
		previewCoords = coords;
		isValidPreview = isValid;
	}

	// Board interaction handlers for setup
	function handleYourBoardHover(coord: Coord): void {
		if (isSetupPhase && shipPlacement !== null) {
			shipPlacement.handleCellHover(coord);
		}
	}

	function handleYourBoardLeave(): void {
		if (isSetupPhase && shipPlacement !== null) {
			shipPlacement.handleCellLeave();
		}
	}

	function handleYourBoardClick(coord: Coord): void {
		if (isSetupPhase && shipPlacement !== null) {
			shipPlacement.handleCellClick(coord);
		}
	}

	// Opponent board handlers for playing
	function handleOpponentBoardClick(coord: Coord): void {
		if (isPlayingPhase && isYourTurn) {
			// Check if cell is already shot
			const cellState = opponentBoard?.grid[coord.row][coord.col];
			if (cellState === 'empty' || cellState === 'ship') {
				selectedTarget = coord;
			}
		}
	}

	function handleFire(): void {
		if (selectedTarget && isYourTurn) {
			gameStore.fire(selectedTarget);
			selectedTarget = null;
		}
	}

	// Winner modal handlers
	function handlePlayAgain(): void {
		gameStore.requestRematch();
	}

	function handleCloseModal(): void {
		goto('/');
	}

	// Calculate last shot coordinate for animation
	let lastShotCoordForYourBoard = $derived(
		lastOpponentShot ? lastOpponentShot.coord : null
	);
	let lastShotCoordForOpponentBoard = $derived(
		lastShotResult ? lastShotResult.coord : null
	);
</script>

<div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-4">
	{#if !connectionState.connected}
		<!-- Loading state -->
		<div class="flex items-center justify-center min-h-[400px]">
			<div class="text-center">
				<div class="text-xl text-white animate-pulse mb-4">
					{$_('game.connecting')}
				</div>
				{#if connectionState.error}
					<p class="text-red-400">{connectionState.error}</p>
					<button
						type="button"
						class="mt-4 px-4 py-2 bg-ocean-600 hover:bg-ocean-500 text-white rounded-lg"
						onclick={() => { if (roomId) gameStore.connect(roomId); }}
					>
						Retry
					</button>
				{/if}
			</div>
		</div>
	{:else if gameState}
		<!-- Game status bar -->
		<div class="mb-3 sm:mb-6">
			<GameStatus
				phase={gameState.phase}
				yourShips={yourBoard?.ships ?? []}
				opponentShips={opponentBoard?.ships ?? []}
				opponentConnected={gameState.opponentConnected}
				opponentReady={gameState.opponentReady}
				{isYourTurn}
				{lastShotResult}
				{roomId}
				{linkCopied}
				onCopyLink={() => gameStore.copyRoomLink()}
			/>
		</div>

		<!-- Main game area - mobile first: opponent at top, you at bottom -->
		<div class="flex flex-col gap-4 sm:gap-6 items-center justify-center">
			<!-- Opponent board (always at top - like real Battleship) -->
			<div class="flex flex-col items-center gap-2 sm:gap-4 w-full">
				{#if opponentBoard}
					<Board
						board={opponentBoard}
						title={$_('game.opponentBoard')}
						isOpponentBoard={true}
						isClickable={isPlayingPhase && isYourTurn}
						previewCoords={selectedTarget ? [selectedTarget] : []}
						isValidPreview={true}
						lastShotCoord={lastShotCoordForOpponentBoard}
						onCellClick={handleOpponentBoardClick}
					/>
				{/if}
			</div>

			<!-- Game controls (between boards on mobile) -->
			{#if isPlayingPhase}
				<div class="flex flex-col items-center gap-2 w-full max-w-xs px-4">
					<GameControls
						{isYourTurn}
						{selectedTarget}
						{canFire}
						onFire={handleFire}
					/>
				</div>
			{/if}

			<!-- Your board (at bottom - where you sit in real Battleship) -->
			<div class="flex flex-col items-center gap-2 sm:gap-4 w-full">
				{#if yourBoard}
					<Board
						board={yourBoard}
						title={$_('game.yourBoard')}
						isOpponentBoard={false}
						isClickable={isSetupPhase}
						{previewCoords}
						{isValidPreview}
						lastShotCoord={lastShotCoordForYourBoard}
						onCellClick={handleYourBoardClick}
						onCellHover={handleYourBoardHover}
						onCellLeave={handleYourBoardLeave}
					/>
				{/if}

				<!-- Ship placement controls (setup phase only) -->
				{#if isSetupPhase && yourBoard}
					<ShipPlacement
						bind:this={shipPlacement}
						placedShips={yourBoard.ships}
						grid={yourBoard.grid}
						onPlaceShip={handlePlaceShip}
						onRemoveShip={handleRemoveShip}
						onReady={handleReady}
						onPreviewChange={handlePreviewChange}
					/>
				{/if}
			</div>
		</div>

		<!-- Winner modal -->
		{#if isFinished && gameState.winner}
			<WinnerModal
				winner={gameState.winner}
				rematchRequested={rematchRequestedBy === gameState.playerNumber}
				opponentWantsRematch={rematchRequestedBy !== null && rematchRequestedBy !== gameState.playerNumber}
				onPlayAgain={handlePlayAgain}
				onClose={handleCloseModal}
			/>
		{/if}
	{:else}
		<!-- Waiting for game state -->
		<div class="flex items-center justify-center min-h-[400px]">
			<div class="text-xl text-white animate-pulse">
				{$_('game.waitingForOpponent')}
			</div>
		</div>
	{/if}
</div>
