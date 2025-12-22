<script lang="ts">
	import type { CellState, Coord } from '../../../shared/types';
	import { getCellClass } from '$lib/utils/boardUtils';

	interface Props {
		coord: Coord;
		state: CellState;
		isPreview?: boolean;
		isValidPreview?: boolean;
		isClickable?: boolean;
		isLastShot?: boolean;
		showShip?: boolean;
		onclick?: (coord: Coord) => void;
		onmouseenter?: (coord: Coord) => void;
		onmouseleave?: () => void;
	}

	let {
		coord,
		state,
		isPreview = false,
		isValidPreview = true,
		isClickable = false,
		isLastShot = false,
		showShip = true,
		onclick,
		onmouseenter,
		onmouseleave
	}: Props = $props();

	function handleClick() {
		if (isClickable && onclick) {
			onclick(coord);
		}
	}

	function handleMouseEnter() {
		if (onmouseenter) {
			onmouseenter(coord);
		}
	}

	function handleMouseLeave() {
		if (onmouseleave) {
			onmouseleave();
		}
	}

	// Determine visual state
	let displayState = $derived(showShip ? state : (state === 'ship' ? 'empty' : state));
	let cellClass = $derived(getCellClass(displayState, isPreview, isValidPreview));
</script>

<button
	type="button"
	class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border border-navy-700/30 rounded-sm transition-all duration-150 relative {cellClass}"
	class:cell-hover={isClickable}
	class:cursor-not-allowed={!isClickable && state !== 'empty' && state !== 'ship'}
	class:animate-shake={isLastShot && (state === 'hit' || state === 'sunk')}
	disabled={!isClickable}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	aria-label="Cell {coord.col + 1}, {coord.row + 1}"
>
	{#if state === 'hit'}
		<span class="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">✕</span>
	{:else if state === 'miss'}
		<span class="absolute inset-0 flex items-center justify-center text-gray-500 text-lg">•</span>
	{:else if state === 'sunk'}
		<span class="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">✕</span>
	{/if}

	{#if isLastShot}
		<span class="absolute inset-0 rounded-sm bg-white/30 animate-ripple"></span>
	{/if}
</button>
