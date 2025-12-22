<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { waitLocale } from 'svelte-i18n';
	import '$lib/stores/i18n';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let ready = $state(false);

	onMount(async () => {
		if (browser) {
			await waitLocale();
			ready = true;
		}
	});
</script>

<svelte:head>
	<title>ShipWrecker</title>
</svelte:head>

{#if ready}
	<div class="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-ocean-950">
		<!-- Header -->
		<header class="p-4 flex items-center justify-between border-b border-navy-700/50">
			<a href="/" class="text-2xl font-bold text-white hover:text-ocean-300 transition-colors">
				⚓ {$_('app.title')}
			</a>
			<LanguageSelector />
		</header>

		<!-- Main content -->
		<main class="container mx-auto px-4 py-8">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-ocean-950 flex items-center justify-center">
		<div class="text-white text-xl animate-pulse">Loading...</div>
	</div>
{/if}
