<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { setLocale } from '$lib/stores/i18n';
	import { _ } from 'svelte-i18n';

	const languages = [
		{ code: 'en', flag: '🇺🇸' },
		{ code: 'es', flag: '🇪🇸' }
	] as const;

	function handleChange(code: string): void {
		setLocale(code);
	}
</script>

<div class="flex items-center gap-2">
	{#each languages as lang}
		<button
			type="button"
			class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
			class:bg-ocean-600={$locale === lang.code}
			class:text-white={$locale === lang.code}
			class:bg-navy-700={$locale !== lang.code}
			class:text-gray-300={$locale !== lang.code}
			class:hover:bg-navy-600={$locale !== lang.code}
			onclick={() => handleChange(lang.code)}
		>
			<span>{lang.flag}</span>
			<span>{$_(`language.${lang.code}`)}</span>
		</button>
	{/each}
</div>
