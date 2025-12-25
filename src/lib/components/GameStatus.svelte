<script lang="ts">
	import type { Ship, GamePhase, ShotResult } from '../../../shared/types';
	import { _ } from 'svelte-i18n';
	import ShipComponent from './Ship.svelte';
	import { toggleSound, isSoundEnabled, getVolume, setVolume, playClickSound } from '$lib/utils/sounds';

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
		isAIGame?: boolean;
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
		isAIGame = false,
		onCopyLink
	}: Props = $props();

	// Sound state
	let soundOn = $state(isSoundEnabled());
	let volume = $state(getVolume());
	let showVolumeControl = $state(false);

	function handleToggleSound() {
		soundOn = toggleSound();
		if (soundOn) {
			playClickSound();
		}
	}

	function handleVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		volume = parseFloat(target.value);
		setVolume(volume);
	}

	function toggleVolumePanel() {
		showVolumeControl = !showVolumeControl;
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
			{#if !isAIGame}
				<button
					type="button"
					class="text-xs px-2 py-1.5 sm:py-1 rounded bg-ocean-600 hover:bg-ocean-500 active:bg-ocean-700 text-white transition-colors touch-manipulation active:scale-95"
					onclick={onCopyLink}
				>
					{linkCopied ? $_('game.linkCopied') : $_('game.copyRoomLink')}
				</button>
			{/if}
			<!-- Sound control with volume dropdown -->
			<div class="relative">
				<button
					type="button"
					class="text-lg sm:text-xl px-2 py-1 rounded bg-navy-700 hover:bg-navy-600 active:bg-navy-800 text-white transition-colors touch-manipulation"
					onclick={toggleVolumePanel}
					aria-label="Sound settings"
					title="Sound settings"
				>
					{soundOn ? '🔊' : '🔇'}
				</button>
				{#if showVolumeControl}
					<div class="absolute right-0 top-full mt-2 bg-navy-800 rounded-lg p-3 shadow-xl border border-navy-600 z-50 min-w-[160px]">
						<div class="flex items-center justify-between gap-3 mb-3">
							<span class="text-xs text-gray-300">Sound</span>
							<button
								type="button"
								class="px-2 py-1 text-xs rounded transition-colors"
								class:bg-green-600={soundOn}
								class:bg-gray-600={!soundOn}
								onclick={handleToggleSound}
							>
								{soundOn ? 'ON' : 'OFF'}
							</button>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs text-gray-400">🔈</span>
							<input
								type="range"
								min="0"
								max="1"
								step="0.1"
								value={volume}
								oninput={handleVolumeChange}
								class="flex-1 h-2 bg-navy-600 rounded-lg appearance-none cursor-pointer accent-ocean-500"
								disabled={!soundOn}
							/>
							<span class="text-xs text-gray-400">🔊</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Connection status (only for multiplayer) -->
	{#if !isAIGame}
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
	{/if}

	<!-- Setup phase status -->
	{#if phase === 'setup' && !isAIGame}
		<div class="text-xs sm:text-sm">
			{#if opponentReady}
				<span class="text-green-400">{$_('game.waitingForReady')}</span>
			{:else}
				<span class="text-gray-400">Opponent is placing ships...</span>
			{/if}
		</div>
	{/if}

	<!-- Shot result feedback - fixed height container to prevent layout shifts -->
	{#if phase === 'playing'}
		<div class="min-h-[40px] sm:min-h-[44px] flex items-center justify-center">
			{#if lastShotResult}
				<div
					class="w-full text-center py-1.5 sm:py-2 rounded-lg font-bold text-base sm:text-lg animate-pulse"
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
