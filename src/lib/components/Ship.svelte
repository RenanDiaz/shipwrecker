<script lang="ts">
	import type { Ship as ShipType, ShipType as ShipTypeName } from '../../../shared/types';
	import { SHIP_CONFIGS } from '../../../shared/constants';
	import { _ } from 'svelte-i18n';

	interface Props {
		ship?: ShipType;
		shipType?: ShipTypeName;
		isPlaced?: boolean;
		isSunk?: boolean;
		isSelected?: boolean;
		onclick?: () => void;
	}

	let {
		ship,
		shipType,
		isPlaced = false,
		isSunk = false,
		isSelected = false,
		onclick
	}: Props = $props();

	// Get ship info from either prop
	let type = $derived(ship?.type ?? shipType ?? 'destroyer');
	let config = $derived(SHIP_CONFIGS[type]);
	let sunk = $derived(ship?.sunk ?? isSunk);
	let placed = $derived(ship ? true : isPlaced);
</script>

<button
	type="button"
	class="flex items-center gap-2 p-2 rounded-lg transition-all w-full text-left {sunk ? 'bg-red-900/50' : isSelected ? 'bg-ocean-600' : 'bg-navy-700'} {placed && !isSelected ? 'opacity-50' : ''} {!isSelected && !sunk && !placed ? 'hover:bg-navy-600' : ''}"
	class:cursor-pointer={onclick && !placed}
	class:cursor-default={!onclick || placed}
	disabled={placed || sunk}
	onclick={onclick}
>
	<!-- Ship visual representation -->
	<div class="flex gap-0.5">
		{#each Array(config.length) as _, i}
			<div
				class="w-4 h-4 rounded-sm"
				class:bg-gray-500={!sunk}
				class:bg-red-800={sunk}
			></div>
		{/each}
	</div>

	<!-- Ship name -->
	<span class="text-sm font-medium" class:text-white={!sunk} class:text-red-300={sunk} class:line-through={sunk}>
		{$_(`ships.${type}`)}
	</span>

	<!-- Length indicator -->
	<span class="text-xs text-gray-400 ml-auto">
		({config.length})
	</span>
</button>
