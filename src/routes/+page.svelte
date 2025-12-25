<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { generateRoomId } from '../../shared/constants';
	import type { AIDifficulty } from '../../shared/types';

	let joinRoomId = $state('');
	let joinError = $state('');
	let selectedDifficulty = $state<AIDifficulty>('medium');

	function createGame(): void {
		const roomId = generateRoomId();
		goto(`/game/${roomId}`);
	}

	function startSinglePlayer(): void {
		const roomId = generateRoomId();
		goto(`/game/${roomId}?mode=single&difficulty=${selectedDifficulty}`);
	}

	function joinGame(): void {
		const id = joinRoomId.trim().toUpperCase();
		if (!id) {
			joinError = $_('landing.enterRoomIdError');
			return;
		}
		if (id.length < 4) {
			joinError = $_('landing.roomIdTooShort');
			return;
		}
		joinError = '';
		goto(`/game/${id}`);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			joinGame();
		}
	}
</script>

<div class="max-w-2xl mx-auto px-4 sm:px-0 overflow-hidden">
	<!-- Hero section -->
	<div class="text-center mb-12">
		<h1 class="text-5xl md:text-6xl font-bold text-white mb-4">
			⚓ ShipWrecker
		</h1>
		<p class="text-xl text-ocean-300">
			{$_('app.description')}
		</p>
	</div>

	<!-- Single Player -->
	<div class="bg-navy-800/50 rounded-xl p-4 sm:p-6 border border-navy-700/50 mb-6">
		<h2 class="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{$_('landing.singlePlayer')}</h2>
		<p class="text-gray-400 mb-3 sm:mb-4 text-sm">
			{$_('landing.singlePlayerDescription')}
		</p>
		<div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
			<div class="flex gap-2 flex-1">
				<button
					type="button"
					class="flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm {selectedDifficulty === 'easy' ? 'bg-green-600 text-white' : 'bg-navy-700 text-gray-300 hover:bg-navy-600'}"
					onclick={() => selectedDifficulty = 'easy'}
				>
					{$_('landing.easy')}
				</button>
				<button
					type="button"
					class="flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm {selectedDifficulty === 'medium' ? 'bg-yellow-600 text-white' : 'bg-navy-700 text-gray-300 hover:bg-navy-600'}"
					onclick={() => selectedDifficulty = 'medium'}
				>
					{$_('landing.medium')}
				</button>
				<button
					type="button"
					class="flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm {selectedDifficulty === 'hard' ? 'bg-red-600 text-white' : 'bg-navy-700 text-gray-300 hover:bg-navy-600'}"
					onclick={() => selectedDifficulty = 'hard'}
				>
					{$_('landing.hard')}
				</button>
			</div>
			<button
				type="button"
				class="py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
				onclick={startSinglePlayer}
			>
				{$_('landing.playVsAI')}
			</button>
		</div>
	</div>

	<!-- Multiplayer Game actions -->
	<div class="grid md:grid-cols-2 gap-6 mb-12">
		<!-- Create game -->
		<div class="bg-navy-800/50 rounded-xl p-4 sm:p-6 border border-navy-700/50 min-w-0">
			<h2 class="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{$_('landing.createGame')}</h2>
			<p class="text-gray-400 mb-3 sm:mb-4 text-sm">
				{$_('landing.createGameDescription')}
			</p>
			<button
				type="button"
				class="w-full py-3 px-4 bg-ocean-600 hover:bg-ocean-500 text-white font-semibold rounded-lg transition-colors"
				onclick={createGame}
			>
				{$_('landing.createGame')}
			</button>
		</div>

		<!-- Join game -->
		<div class="bg-navy-800/50 rounded-xl p-4 sm:p-6 border border-navy-700/50 min-w-0">
			<h2 class="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{$_('landing.joinGame')}</h2>
			<p class="text-gray-400 mb-3 sm:mb-4 text-sm">
				{$_('landing.joinGameDescription')}
			</p>
			<div class="flex flex-col sm:flex-row gap-2">
				<input
					type="text"
					class="flex-1 px-4 py-3 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ocean-500 uppercase min-w-0"
					placeholder={$_('landing.enterRoomId')}
					bind:value={joinRoomId}
					onkeydown={handleKeydown}
					maxlength="10"
				/>
				<button
					type="button"
					class="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
					onclick={joinGame}
				>
					{$_('landing.join')}
				</button>
			</div>
			{#if joinError}
				<p class="text-red-400 text-sm mt-2">{joinError}</p>
			{/if}
		</div>
	</div>

	<!-- Instructions -->
	<div class="bg-navy-800/30 rounded-xl p-6 border border-navy-700/30">
		<h2 class="text-xl font-semibold text-white mb-4">{$_('landing.howToPlay')}</h2>
		<ol class="space-y-3">
			<li class="flex items-start gap-3">
				<span class="flex-shrink-0 w-8 h-8 bg-ocean-600 rounded-full flex items-center justify-center text-white font-bold">1</span>
				<span class="text-gray-300 pt-1">{$_('landing.step1')}</span>
			</li>
			<li class="flex items-start gap-3">
				<span class="flex-shrink-0 w-8 h-8 bg-ocean-600 rounded-full flex items-center justify-center text-white font-bold">2</span>
				<span class="text-gray-300 pt-1">{$_('landing.step2')}</span>
			</li>
			<li class="flex items-start gap-3">
				<span class="flex-shrink-0 w-8 h-8 bg-ocean-600 rounded-full flex items-center justify-center text-white font-bold">3</span>
				<span class="text-gray-300 pt-1">{$_('landing.step3')}</span>
			</li>
			<li class="flex items-start gap-3">
				<span class="flex-shrink-0 w-8 h-8 bg-ocean-600 rounded-full flex items-center justify-center text-white font-bold">4</span>
				<span class="text-gray-300 pt-1">{$_('landing.step4')}</span>
			</li>
		</ol>
	</div>

	<!-- Ship legend -->
	<div class="mt-8 bg-navy-800/30 rounded-xl p-6 border border-navy-700/30">
		<h3 class="text-lg font-semibold text-white mb-4">{$_('landing.instructions')}</h3>
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<div class="text-center">
				<div class="flex justify-center gap-0.5 mb-2">
					{#each Array(5) as _}
						<div class="w-4 h-4 bg-gray-500 rounded-sm"></div>
					{/each}
				</div>
				<span class="text-sm text-gray-400">{$_('ships.carrier')} (5)</span>
			</div>
			<div class="text-center">
				<div class="flex justify-center gap-0.5 mb-2">
					{#each Array(4) as _}
						<div class="w-4 h-4 bg-gray-500 rounded-sm"></div>
					{/each}
				</div>
				<span class="text-sm text-gray-400">{$_('ships.battleship')} (4)</span>
			</div>
			<div class="text-center">
				<div class="flex justify-center gap-0.5 mb-2">
					{#each Array(3) as _}
						<div class="w-4 h-4 bg-gray-500 rounded-sm"></div>
					{/each}
				</div>
				<span class="text-sm text-gray-400">{$_('ships.cruiser')} (3)</span>
			</div>
			<div class="text-center">
				<div class="flex justify-center gap-0.5 mb-2">
					{#each Array(3) as _}
						<div class="w-4 h-4 bg-gray-500 rounded-sm"></div>
					{/each}
				</div>
				<span class="text-sm text-gray-400">{$_('ships.submarine')} (3)</span>
			</div>
			<div class="text-center">
				<div class="flex justify-center gap-0.5 mb-2">
					{#each Array(2) as _}
						<div class="w-4 h-4 bg-gray-500 rounded-sm"></div>
					{/each}
				</div>
				<span class="text-sm text-gray-400">{$_('ships.destroyer')} (2)</span>
			</div>
		</div>
	</div>
</div>
