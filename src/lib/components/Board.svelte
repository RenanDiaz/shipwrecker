<script lang="ts">
	import type { PlayerBoard, Coord, CellState } from '../../../shared/types';
	import { BOARD_SIZE, COLUMN_LABELS, ROW_LABELS } from '../../../shared/constants';
	import { onMount } from 'svelte';
	import Cell from './Cell.svelte';

	interface Props {
		board: PlayerBoard;
		title: string;
		isOpponentBoard?: boolean;
		isClickable?: boolean;
		previewCoords?: Coord[];
		isValidPreview?: boolean;
		lastShotCoord?: Coord | null;
		onCellClick?: (coord: Coord) => void;
		onCellHover?: (coord: Coord) => void;
		onCellLeave?: () => void;
	}

	let {
		board,
		title,
		isOpponentBoard = false,
		isClickable = false,
		previewCoords = [],
		isValidPreview = true,
		lastShotCoord = null,
		onCellClick,
		onCellHover,
		onCellLeave
	}: Props = $props();

	// Animation state for board entrance
	let boardVisible = $state(false);

	onMount(() => {
		// Trigger entrance animation
		requestAnimationFrame(() => {
			boardVisible = true;
		});
	});

	// Check if a coordinate is in the preview (selected target)
	function isPreviewCell(row: number, col: number): boolean {
		return previewCoords.some((c) => c.row === row && c.col === col);
	}

	// Check if a cell can be clicked
	function canClickCell(state: CellState): boolean {
		if (!isClickable) return false;
		if (isOpponentBoard) {
			return state === 'empty' || state === 'ship';
		}
		return true;
	}

	// Check if this is the last shot location
	function isLastShot(row: number, col: number): boolean {
		return lastShotCoord?.row === row && lastShotCoord?.col === col;
	}

	// Calculate stagger delay for each cell (wave effect from top-left)
	function getCellDelay(row: number, col: number): number {
		return (row + col) * 15; // 15ms stagger per diagonal
	}
</script>

<div class="flex flex-col items-center w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
	<h3 class="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2 transition-opacity duration-300"
		class:opacity-0={!boardVisible}
		class:opacity-100={boardVisible}
	>{title}</h3>

	<div class="bg-navy-900/50 p-1.5 sm:p-2 rounded-lg shadow-lg w-full transition-all duration-300"
		class:opacity-0={!boardVisible}
		class:opacity-100={boardVisible}
		class:scale-95={!boardVisible}
		class:scale-100={boardVisible}
	>
		<!-- Column labels -->
		<div class="flex justify-center">
			<div class="w-5 sm:w-6 h-5 sm:h-6 flex-shrink-0"></div>
			{#each COLUMN_LABELS as label}
				<div class="board-cell-label flex items-center justify-center text-[10px] sm:text-xs text-ocean-300 font-medium">
					{label}
				</div>
			{/each}
		</div>

		<!-- Board grid -->
		{#each Array(BOARD_SIZE) as _, row}
			<div class="flex justify-center">
				<!-- Row label -->
				<div class="w-5 sm:w-6 board-cell-height flex items-center justify-center text-[10px] sm:text-xs text-ocean-300 font-medium flex-shrink-0">
					{ROW_LABELS[row]}
				</div>

				<!-- Cells -->
				{#each Array(BOARD_SIZE) as _, col}
					{@const state = board.grid[row][col]}
					{@const isPreview = isPreviewCell(row, col)}
					{@const isTarget = isOpponentBoard && isPreview}
					<Cell
						coord={{ row, col }}
						state={state}
						{isPreview}
						{isValidPreview}
						isClickable={canClickCell(state)}
						isLastShot={isLastShot(row, col)}
						showShip={!isOpponentBoard}
						{isTarget}
						animationDelay={getCellDelay(row, col)}
						{boardVisible}
						onclick={onCellClick}
						onmouseenter={onCellHover}
						onmouseleave={onCellLeave}
					/>
				{/each}
			</div>
		{/each}
	</div>
</div>
