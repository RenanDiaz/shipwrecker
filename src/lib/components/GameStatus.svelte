<script lang="ts">
	import type { Ship, GamePhase, ShotResult } from '../../../shared/types';
	import { _ } from 'svelte-i18n';
	import ShipComponent from './Ship.svelte';

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

	// Count remaining ships
	let yourRemainingShips = $derived(yourShips.filter((s) => !s.sunk).length);
	let opponentSunkShips = $derived(opponentShips.filter((s) => s.sunk).length);
</script>

<div class="bg-navy-800/50 rounded-lg p-4 space-y-4">
	<!-- Room info -->
	<div class="flex items-center justify-between">
		<span class="text-sm text-gray-400">{$_('game.roomId')}:</span>
		<div class="flex items-center gap-2">
			<code class="bg-navy-900 px-2 py-1 rounded text-ocean-300 font-mono text-sm">{roomId}</code>
			<button
				type="button"
				class="text-xs px-2 py-1 rounded bg-ocean-600 hover:bg-ocean-500 text-white transition-colors"
				onclick={onCopyLink}
			>
				{linkCopied ? $_('game.linkCopied') : $_('game.copyRoomLink')}
			</button>
		</div>
	</div>

	<!-- Connection status -->
	{#if phase === 'waiting'}
		<div class="text-center py-4">
			<div class="animate-pulse text-yellow-400">
				{$_('game.waitingForOpponent')}
			</div>
		</div>
	{:else if !opponentConnected}
		<div class="text-center py-2">
			<span class="text-red-400">{$_('game.opponentDisconnected')}</span>
		</div>
	{/if}

	<!-- Setup phase status -->
	{#if phase === 'setup'}
		<div class="text-sm">
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
			class="text-center py-2 rounded-lg font-bold text-lg animate-pulse"
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

	<!-- Ships status during play -->
	{#if phase === 'playing'}
		<div class="grid grid-cols-2 gap-4">
			<div>
				<h4 class="text-sm font-medium text-gray-400 mb-2">Your Ships ({yourRemainingShips}/5)</h4>
				<div class="space-y-1">
					{#each yourShips as ship}
						<ShipComponent {ship} />
					{/each}
				</div>
			</div>
			<div>
				<h4 class="text-sm font-medium text-gray-400 mb-2">Sunk Ships ({opponentSunkShips}/5)</h4>
				<div class="space-y-1">
					{#each opponentShips.filter(s => s.sunk) as ship}
						<ShipComponent {ship} />
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
