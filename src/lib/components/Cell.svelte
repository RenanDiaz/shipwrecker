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
		isTarget?: boolean;
		animationDelay?: number;
		boardVisible?: boolean;
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
		isTarget = false,
		animationDelay = 0,
		boardVisible = true,
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
	class="board-cell border border-navy-700/30 rounded-sm transition-all duration-150 relative {cellClass}"
	class:cell-hover={isClickable}
	class:cell-clickable={isClickable}
	class:cursor-not-allowed={!isClickable && state !== 'empty' && state !== 'ship'}
	class:animate-shake={isLastShot && (state === 'hit' || state === 'sunk')}
	class:animate-sunk={state === 'sunk' && isLastShot}
	class:cell-entrance={true}
	class:cell-target={isTarget}
	style="--delay: {animationDelay}ms"
	style:opacity={boardVisible ? 1 : 0}
	style:transform={boardVisible ? 'scale(1)' : 'scale(0.8)'}
	style:transition-delay={`${animationDelay}ms`}
	disabled={!isClickable}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	aria-label="Cell {coord.col + 1}, {coord.row + 1}"
>
	{#if state === 'hit'}
		<span class="absolute inset-0 flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg drop-shadow-md">✕</span>
	{:else if state === 'miss'}
		<span class="absolute inset-0 flex items-center justify-center text-gray-500 text-sm sm:text-base md:text-lg">•</span>
	{:else if state === 'sunk'}
		<span class="absolute inset-0 flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg drop-shadow-md">✕</span>
	{/if}

	<!-- Target lock effect -->
	{#if isTarget}
		<span class="absolute inset-0 rounded-sm border-2 border-red-400 animate-target-pulse"></span>
		<span class="absolute inset-0 flex items-center justify-center text-red-400 text-lg font-bold animate-pulse">⊕</span>
	{/if}

	<!-- Last shot ripple effect -->
	{#if isLastShot}
		<span class="absolute inset-0 rounded-sm bg-white/30 animate-ripple"></span>
	{/if}
</button>
