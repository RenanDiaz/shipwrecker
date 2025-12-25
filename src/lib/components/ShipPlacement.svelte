<script lang="ts">
	import type { Coord, Orientation, ShipType, Ship, CellState, ShipPlacement as ShipPlacementData } from '../../../shared/types';
	import { SHIP_TYPES, SHIP_CONFIGS } from '../../../shared/constants';
	import { _ } from 'svelte-i18n';
	import { validatePlacement, getNextShipToPlace, generateRandomPlacements } from '$lib/utils/gameLogic';
	import { getShipPreviewCoords } from '$lib/utils/boardUtils';
	import ShipComponent from './Ship.svelte';
	import { playPlaceShipSound, playReadySound, playClickSound } from '$lib/utils/sounds';

	interface Props {
		placedShips: Ship[];
		grid: CellState[][];
		onPlaceShip: (shipType: ShipType, coord: Coord, orientation: Orientation) => void;
		onRemoveShip: (shipType: ShipType) => void;
		onReady: () => void;
		onPreviewChange: (coords: Coord[], isValid: boolean) => void;
		onRandomPlace: (placements: ShipPlacementData[]) => void;
	}

	let {
		placedShips,
		grid,
		onPlaceShip,
		onRemoveShip,
		onReady,
		onPreviewChange,
		onRandomPlace
	}: Props = $props();

	// Local state
	let selectedShipType = $state<ShipType | null>(null);
	let orientation = $state<Orientation>('horizontal');

	// Derived values
	let nextShip = $derived(getNextShipToPlace(placedShips));
	let allShipsPlaced = $derived(placedShips.length === SHIP_TYPES.length);
	let placedShipTypes = $derived(new Set(placedShips.map((s) => s.type)));

	// Auto-select next ship
	$effect(() => {
		if (!selectedShipType && nextShip) {
			selectedShipType = nextShip;
		}
	});

	// Select a ship to place
	function selectShip(type: ShipType): void {
		if (!placedShipTypes.has(type)) {
			selectedShipType = type;
		}
	}

	// Toggle orientation
	function toggleOrientation(): void {
		orientation = orientation === 'horizontal' ? 'vertical' : 'horizontal';
	}

	// Handle cell hover for preview
	export function handleCellHover(coord: Coord): void {
		if (!selectedShipType) return;

		const length = SHIP_CONFIGS[selectedShipType].length;
		const coords = getShipPreviewCoords(coord, length, orientation);
		const { valid } = validatePlacement(selectedShipType, coord, orientation, placedShips, grid);
		onPreviewChange(coords, valid);
	}

	// Handle cell leave
	export function handleCellLeave(): void {
		onPreviewChange([], true);
	}

	// Handle cell click to place ship
	export function handleCellClick(coord: Coord): void {
		if (!selectedShipType) return;

		const { valid } = validatePlacement(selectedShipType, coord, orientation, placedShips, grid);
		if (valid) {
			playPlaceShipSound();
			onPlaceShip(selectedShipType, coord, orientation);
			selectedShipType = null;
		}
	}

	// Handle ready button click
	function handleReady(): void {
		playReadySound();
		onReady();
	}

	// Remove a placed ship
	function handleRemoveShip(type: ShipType): void {
		onRemoveShip(type);
		selectedShipType = type;
	}

	// Handle random placement
	function handleRandomPlace(): void {
		playClickSound();
		const placements = generateRandomPlacements();
		onRandomPlace(placements);
		selectedShipType = null;
	}
</script>

<div class="bg-navy-800/50 rounded-lg p-3 sm:p-4 w-full max-w-xs mx-auto">
	<h3 class="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">{$_('game.placeYourShips')}</h3>

	<!-- Ship list -->
	<div class="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
		{#each SHIP_TYPES as type}
			{@const isPlaced = placedShipTypes.has(type)}
			{@const isSelected = selectedShipType === type}
			<div class="flex items-center gap-1.5 sm:gap-2">
				<div class="flex-1 min-w-0">
					<ShipComponent
						shipType={type}
						{isPlaced}
						{isSelected}
						onclick={() => !isPlaced && selectShip(type)}
					/>
				</div>
				{#if isPlaced}
					<button
						type="button"
						class="text-[10px] sm:text-xs text-red-400 hover:text-red-300 active:text-red-200 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded bg-red-900/30 hover:bg-red-900/50 active:bg-red-900/70 touch-manipulation flex-shrink-0"
						onclick={() => handleRemoveShip(type)}
					>
						{$_('game.removeShip')}
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Orientation toggle and Random button -->
	{#if selectedShipType}
		<div class="mb-3 sm:mb-4 flex gap-2">
			<button
				type="button"
				class="flex-1 py-2.5 sm:py-2 px-4 bg-ocean-600 hover:bg-ocean-500 active:bg-ocean-700 text-white rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
				onclick={toggleOrientation}
			>
				{$_('game.rotate')} ({orientation === 'horizontal' ? '↔' : '↕'})
			</button>
			<button
				type="button"
				class="flex-1 py-2.5 sm:py-2 px-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
				onclick={handleRandomPlace}
			>
				🎲 {$_('game.random')}
			</button>
		</div>
		<p class="text-xs sm:text-sm text-ocean-300 text-center">
			{$_('game.placeNextShip', { values: { ship: $_(`ships.${selectedShipType}`) } })}
		</p>
	{:else if !allShipsPlaced}
		<!-- Show random button when no ship is selected but ships remain -->
		<div class="mb-3 sm:mb-4">
			<button
				type="button"
				class="w-full py-2.5 sm:py-2 px-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
				onclick={handleRandomPlace}
			>
				🎲 {$_('game.random')}
			</button>
		</div>
	{/if}

	<!-- Ready button -->
	{#if allShipsPlaced}
		<div class="mt-3 sm:mt-4">
			<p class="text-xs sm:text-sm text-green-400 text-center mb-2">{$_('game.allShipsPlaced')}</p>
			<button
				type="button"
				class="w-full py-3 sm:py-3 px-4 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
				onclick={handleReady}
			>
				{$_('game.ready')}
			</button>
		</div>
	{/if}
</div>
