<script lang="ts">
	import type { PlayerBoard, Coord, CellState } from '../../../shared/types';
	import { BOARD_SIZE, COLUMN_LABELS, ROW_LABELS } from '../../../shared/constants';
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

	// Check if a coordinate is in the preview
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
</script>

<div class="flex flex-col items-center">
	<h3 class="text-lg font-semibold text-white mb-2">{title}</h3>

	<div class="bg-navy-900/50 p-2 rounded-lg shadow-lg">
		<!-- Column labels -->
		<div class="flex">
			<div class="w-6 h-6"></div>
			{#each COLUMN_LABELS as label}
				<div class="w-8 h-6 sm:w-9 md:w-10 flex items-center justify-center text-xs text-ocean-300 font-medium">
					{label}
				</div>
			{/each}
		</div>

		<!-- Board grid -->
		{#each Array(BOARD_SIZE) as _, row}
			<div class="flex">
				<!-- Row label -->
				<div class="w-6 h-8 sm:h-9 md:h-10 flex items-center justify-center text-xs text-ocean-300 font-medium">
					{ROW_LABELS[row]}
				</div>

				<!-- Cells -->
				{#each Array(BOARD_SIZE) as _, col}
					{@const state = board.grid[row][col]}
					{@const isPreview = isPreviewCell(row, col)}
					<Cell
						coord={{ row, col }}
						state={state}
						{isPreview}
						{isValidPreview}
						isClickable={canClickCell(state)}
						isLastShot={isLastShot(row, col)}
						showShip={!isOpponentBoard}
						onclick={onCellClick}
						onmouseenter={onCellHover}
						onmouseleave={onCellLeave}
					/>
				{/each}
			</div>
		{/each}
	</div>
</div>
