<script lang="ts">
	import type { Coord } from '../../../shared/types';
	import { _ } from 'svelte-i18n';

	interface Props {
		isYourTurn: boolean;
		selectedTarget: Coord | null;
		canFire: boolean;
		onFire: () => void;
	}

	let {
		isYourTurn,
		selectedTarget,
		canFire,
		onFire
	}: Props = $props();
</script>

<div class="bg-navy-800/50 rounded-lg p-3 sm:p-4">
	<div class="text-center">
		<!-- Turn indicator -->
		<div
			class="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4"
			class:bg-green-600={isYourTurn}
			class:animate-pulse={isYourTurn}
			class:bg-orange-600={!isYourTurn}
		>
			<span class="font-semibold text-white text-sm sm:text-base">
				{isYourTurn ? $_('game.yourTurn') : $_('game.opponentTurn')}
			</span>
		</div>

		<!-- Fire button -->
		{#if isYourTurn}
			<button
				type="button"
				class="w-full py-3 sm:py-4 px-6 rounded-lg font-bold text-base sm:text-lg transition-all touch-manipulation"
				class:bg-red-600={canFire}
				class:hover:bg-red-500={canFire}
				class:active:bg-red-700={canFire}
				class:bg-gray-600={!canFire}
				class:cursor-not-allowed={!canFire}
				class:text-white={true}
				disabled={!canFire}
				onclick={onFire}
			>
				{$_('game.fire')}
			</button>
			{#if !selectedTarget}
				<p class="text-xs sm:text-sm text-gray-400 mt-2">
					Tap opponent's board to select target
				</p>
			{/if}
		{/if}
	</div>
</div>
