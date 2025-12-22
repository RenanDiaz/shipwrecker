<script lang="ts">
	import { _ } from 'svelte-i18n';

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
</script>

<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
	<div
		class="bg-navy-800 rounded-xl p-8 max-w-md w-full text-center shadow-2xl border-2"
		class:border-green-500={isWin}
		class:border-red-500={!isWin}
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
				class="py-3 px-6 rounded-lg font-semibold text-white transition-colors"
				class:bg-green-600={!rematchRequested}
				class:hover:bg-green-500={!rematchRequested}
				class:bg-gray-600={rematchRequested}
				disabled={rematchRequested}
				onclick={onPlayAgain}
			>
				{$_('game.playAgain')}
			</button>

			<button
				type="button"
				class="py-2 px-4 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-navy-700 transition-colors"
				onclick={onClose}
			>
				Back to Lobby
			</button>
		</div>
	</div>
</div>
