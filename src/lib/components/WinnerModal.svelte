<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { playVictorySound, playDefeatSound, playClickSound } from '$lib/utils/sounds';

	interface Props {
		winner: 'you' | 'opponent';
		rematchRequested: boolean;
		opponentWantsRematch: boolean;
		onPlayAgain: () => void;
		onClose: () => void;
	}

	let {
		winner,
		rematchRequested,
		opponentWantsRematch,
		onPlayAgain,
		onClose
	}: Props = $props();

	let isWin = $derived(winner === 'you');
	let visible = $state(false);

	onMount(() => {
		// Trigger entrance animation
		requestAnimationFrame(() => {
			visible = true;
		});
		// Play victory or defeat sound
		if (isWin) {
			playVictorySound();
		} else {
			playDefeatSound();
		}
	});

	function handlePlayAgain() {
		playClickSound();
		onPlayAgain();
	}

	function handleClose() {
		playClickSound();
		onClose();
	}
</script>

<div
	class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
	class:opacity-0={!visible}
	class:opacity-100={visible}
>
	<div
		class="bg-navy-800 rounded-xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-2 transition-all duration-300"
		class:border-green-500={isWin}
		class:border-red-500={!isWin}
		class:scale-90={!visible}
		class:scale-100={visible}
		class:opacity-0={!visible}
		class:opacity-100={visible}
	>
		<!-- Trophy or skull icon -->
		<div class="text-6xl mb-4">
			{isWin ? '🏆' : '💀'}
		</div>

		<!-- Result message -->
		<h2
			class="text-3xl font-bold mb-4"
			class:text-green-400={isWin}
			class:text-red-400={!isWin}
		>
			{isWin ? $_('game.youWin') : $_('game.youLose')}
		</h2>

		<!-- Rematch status -->
		{#if rematchRequested}
			<p class="text-yellow-400 mb-4 animate-pulse">
				{$_('game.rematchRequested')}
			</p>
		{:else if opponentWantsRematch}
			<p class="text-green-400 mb-4">
				{$_('game.opponentWantsRematch')}
			</p>
		{/if}

		<!-- Actions -->
		<div class="flex flex-col gap-3">
			<button
				type="button"
				class="py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 touch-manipulation active:scale-95 {!rematchRequested ? 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/30' : 'bg-gray-600'}"
				disabled={rematchRequested}
				onclick={handlePlayAgain}
			>
				{$_('game.playAgain')}
			</button>

			<button
				type="button"
				class="py-2 px-4 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-navy-700 transition-all duration-200 touch-manipulation active:scale-95"
				onclick={handleClose}
			>
				{$_('game.backToLobby')}
			</button>
		</div>
	</div>
</div>
