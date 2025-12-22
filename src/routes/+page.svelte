<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { generateRoomId } from '../../shared/constants';

	let joinRoomId = $state('');
	let joinError = $state('');

	function createGame(): void {
		const roomId = generateRoomId();
		goto(`/game/${roomId}`);
	}

	function joinGame(): void {
		const id = joinRoomId.trim().toUpperCase();
		if (!id) {
			joinError = 'Please enter a room ID';
			return;
		}
		if (id.length < 4) {
			joinError = 'Room ID must be at least 4 characters';
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

<div class="max-w-2xl mx-auto">
	<!-- Hero section -->
	<div class="text-center mb-12">
		<h1 class="text-5xl md:text-6xl font-bold text-white mb-4">
			⚓ ShipWrecker
		</h1>
		<p class="text-xl text-ocean-300">
			{$_('app.description')}
		</p>
	</div>

	<!-- Game actions -->
	<div class="grid md:grid-cols-2 gap-6 mb-12">
		<!-- Create game -->
		<div class="bg-navy-800/50 rounded-xl p-6 border border-navy-700/50">
			<h2 class="text-xl font-semibold text-white mb-4">{$_('landing.createGame')}</h2>
			<p class="text-gray-400 mb-4 text-sm">
				Start a new game and invite a friend to join
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
		<div class="bg-navy-800/50 rounded-xl p-6 border border-navy-700/50">
			<h2 class="text-xl font-semibold text-white mb-4">{$_('landing.joinGame')}</h2>
			<p class="text-gray-400 mb-4 text-sm">
				Enter the room ID shared by your friend
			</p>
			<div class="flex gap-2">
				<input
					type="text"
					class="flex-1 px-4 py-3 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ocean-500 uppercase"
					placeholder={$_('landing.enterRoomId')}
					bind:value={joinRoomId}
					onkeydown={handleKeydown}
					maxlength="10"
				/>
				<button
					type="button"
					class="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
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
