<script lang="ts">
	import type { Coord } from '../../../shared/types';
	import { _ } from 'svelte-i18n';
	import { playClickSound } from '$lib/utils/sounds';

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

	function handleFire() {
		if (canFire) {
			playClickSound();
			onFire();
		}
	}
</script>

<div class="bg-navy-800/50 rounded-lg p-3 sm:p-4">
	<div class="text-center">
		<!-- Turn indicator - enhanced visibility -->
		<div
			class="inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-3 sm:mb-4 transition-all duration-300 {isYourTurn ? 'bg-green-600 shadow-lg shadow-green-500/50 scale-105' : 'bg-orange-600/80'}"
		>
			<span class="font-bold text-white text-sm sm:text-lg tracking-wide">
				{isYourTurn ? $_('game.yourTurn') : $_('game.opponentTurn')}
			</span>
		</div>

		<!-- Fire button container - fixed height to prevent layout shift -->
		<div class="h-[72px] sm:h-[88px] flex flex-col justify-start">
			<button
				type="button"
				class="w-full py-3 sm:py-4 px-6 rounded-lg font-bold text-base sm:text-lg transition-all duration-200 touch-manipulation text-white {isYourTurn && canFire ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-lg shadow-red-500/40' : ''} {isYourTurn && !canFire ? 'bg-gray-600 cursor-not-allowed' : ''} {!isYourTurn ? 'bg-navy-700 opacity-50 cursor-default' : ''}"
				disabled={!canFire || !isYourTurn}
				onclick={handleFire}
			>
				{$_('game.fire')}
			</button>
			<p class="text-xs sm:text-sm text-gray-400 mt-2 h-5 transition-opacity duration-200 {isYourTurn && !selectedTarget ? 'opacity-100' : 'opacity-0'}">
				{$_('game.selectTarget')}
			</p>
		</div>
	</div>
</div>
