<script lang="ts">
	import type { Coord, Orientation, ShipType, Ship, CellState } from '../../../shared/types';
	import { SHIP_TYPES, SHIP_CONFIGS } from '../../../shared/constants';
	import { _ } from 'svelte-i18n';
	import { validatePlacement, getNextShipToPlace } from '$lib/utils/gameLogic';
	import { getShipPreviewCoords } from '$lib/utils/boardUtils';
	import ShipComponent from './Ship.svelte';

	interface Props {
		placedShips: Ship[];
		grid: CellState[][];
		onPlaceShip: (shipType: ShipType, coord: Coord, orientation: Orientation) => void;
		onRemoveShip: (shipType: ShipType) => void;
		onReady: () => void;
		onPreviewChange: (coords: Coord[], isValid: boolean) => void;
	}

	let {
		placedShips,
		grid,
		onPlaceShip,
		onRemoveShip,
		onReady,
		onPreviewChange
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
			onPlaceShip(selectedShipType, coord, orientation);
			selectedShipType = null;
		}
	}

	// Remove a placed ship
	function handleRemoveShip(type: ShipType): void {
		onRemoveShip(type);
		selectedShipType = type;
	}
</script>

<div class="bg-navy-800/50 rounded-lg p-4 w-full max-w-xs">
	<h3 class="text-lg font-semibold text-white mb-3">{$_('game.placeYourShips')}</h3>

	<!-- Ship list -->
	<div class="space-y-2 mb-4">
		{#each SHIP_TYPES as type}
			{@const isPlaced = placedShipTypes.has(type)}
			{@const isSelected = selectedShipType === type}
			<div class="flex items-center gap-2">
				<div class="flex-1">
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
						class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-900/30 hover:bg-red-900/50"
						onclick={() => handleRemoveShip(type)}
					>
						{$_('game.removeShip')}
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Orientation toggle -->
	{#if selectedShipType}
		<div class="mb-4">
			<button
				type="button"
				class="w-full py-2 px-4 bg-ocean-600 hover:bg-ocean-500 text-white rounded-lg transition-colors"
				onclick={toggleOrientation}
			>
				{$_('game.rotate')} ({orientation === 'horizontal' ? '↔' : '↕'})
			</button>
		</div>
		<p class="text-sm text-ocean-300 text-center">
			{$_('game.placeNextShip', { values: { ship: $_(`ships.${selectedShipType}`) } })}
		</p>
	{/if}

	<!-- Ready button -->
	{#if allShipsPlaced}
		<div class="mt-4">
			<p class="text-sm text-green-400 text-center mb-2">{$_('game.allShipsPlaced')}</p>
			<button
				type="button"
				class="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
				onclick={onReady}
			>
				{$_('game.ready')}
			</button>
		</div>
	{/if}
</div>
