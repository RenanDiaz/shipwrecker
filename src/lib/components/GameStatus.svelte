<script lang="ts">
	import type { Ship, GamePhase, ShotResult } from '../../../shared/types';
	import { _ } from 'svelte-i18n';
	import ShipComponent from './Ship.svelte';
	import { toggleSound, isSoundEnabled } from '$lib/utils/sounds';

	interface Props {
		phase: GamePhase;
		yourShips: Ship[];
		opponentShips: Ship[];
		opponentConnected: boolean;
		opponentReady: boolean;
		isYourTurn: boolean;
		lastShotResult: ShotResult | null;
		roomId: string;
		linkCopied: boolean;
		onCopyLink: () => void;
	}

	let {
		phase,
		yourShips,
		opponentShips,
		opponentConnected,
		opponentReady,
		isYourTurn,
		lastShotResult,
		roomId,
		linkCopied,
		onCopyLink
	}: Props = $props();

	// Sound state
	let soundOn = $state(isSoundEnabled());

	function handleToggleSound() {
		soundOn = toggleSound();
	}

	// Count remaining ships
	let yourRemainingShips = $derived(yourShips.filter((s) => !s.sunk).length);
	let opponentSunkShips = $derived(opponentShips.filter((s) => s.sunk).length);
</script>

<div class="bg-navy-800/50 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
	<!-- Room info and controls -->
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-2 min-w-0 flex-1">
			<span class="text-xs sm:text-sm text-gray-400 whitespace-nowrap">{$_('game.roomId')}:</span>
			<code class="bg-navy-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-ocean-300 font-mono text-xs sm:text-sm truncate">{roomId}</code>
		</div>
		<div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
			<button
				type="button"
				class="text-xs px-2 py-1.5 sm:py-1 rounded bg-ocean-600 hover:bg-ocean-500 active:bg-ocean-700 text-white transition-colors touch-manipulation"
				onclick={onCopyLink}
			>
				{linkCopied ? $_('game.linkCopied') : $_('game.copyRoomLink')}
			</button>
			<button
				type="button"
				class="text-lg sm:text-xl px-2 py-1 rounded bg-navy-700 hover:bg-navy-600 active:bg-navy-800 text-white transition-colors touch-manipulation"
				onclick={handleToggleSound}
				aria-label={soundOn ? 'Mute sounds' : 'Unmute sounds'}
				title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
			>
				{soundOn ? '🔊' : '🔇'}
			</button>
		</div>
	</div>

	<!-- Connection status -->
	{#if phase === 'waiting'}
		<div class="text-center py-3 sm:py-4">
			<div class="animate-pulse text-yellow-400 text-sm sm:text-base">
				{$_('game.waitingForOpponent')}
			</div>
		</div>
	{:else if !opponentConnected}
		<div class="text-center py-1.5 sm:py-2">
			<span class="text-red-400 text-sm">{$_('game.opponentDisconnected')}</span>
		</div>
	{/if}

	<!-- Setup phase status -->
	{#if phase === 'setup'}
		<div class="text-xs sm:text-sm">
			{#if opponentReady}
				<span class="text-green-400">{$_('game.waitingForReady')}</span>
			{:else}
				<span class="text-gray-400">Opponent is placing ships...</span>
			{/if}
		</div>
	{/if}

	<!-- Shot result feedback -->
	{#if lastShotResult}
		<div
			class="text-center py-1.5 sm:py-2 rounded-lg font-bold text-base sm:text-lg animate-pulse"
			class:bg-red-600={lastShotResult.result === 'hit' || lastShotResult.result === 'sunk'}
			class:bg-gray-600={lastShotResult.result === 'miss'}
		>
			{#if lastShotResult.result === 'sunk'}
				{$_('game.shipSunk')} ({$_(`ships.${lastShotResult.sunkShip}`)})
			{:else if lastShotResult.result === 'hit'}
				{$_('game.hit')}
			{:else}
				{$_('game.miss')}
			{/if}
		</div>
	{/if}

	<!-- Ships status during play - hidden on very small screens for more board space -->
	{#if phase === 'playing'}
		<div class="hidden xs:grid grid-cols-2 gap-2 sm:gap-4">
			<div>
				<h4 class="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Your Ships ({yourRemainingShips}/5)</h4>
				<div class="space-y-0.5 sm:space-y-1">
					{#each yourShips as ship}
						<ShipComponent {ship} compact={true} />
					{/each}
				</div>
			</div>
			<div>
				<h4 class="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Sunk Ships ({opponentSunkShips}/5)</h4>
				<div class="space-y-0.5 sm:space-y-1">
					{#each opponentShips.filter(s => s.sunk) as ship}
						<ShipComponent {ship} compact={true} />
					{/each}
				</div>
			</div>
		</div>
		<!-- Compact version for very small screens -->
		<div class="xs:hidden flex justify-center gap-4 text-xs">
			<span class="text-gray-400">Your Ships: <span class="text-white font-medium">{yourRemainingShips}/5</span></span>
			<span class="text-gray-400">Sunk: <span class="text-red-400 font-medium">{opponentSunkShips}/5</span></span>
		</div>
	{/if}
</div>
