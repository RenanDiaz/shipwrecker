import { browser } from '$app/environment';
import { init, register, locale } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('$lib/i18n/en.json'));
register('es', () => import('$lib/i18n/es.json'));

init({
	fallbackLocale: defaultLocale,
	initialLocale: browser ? window.localStorage.getItem('locale') ?? defaultLocale : defaultLocale
});

// Function to change locale
export function setLocale(newLocale: string): void {
	locale.set(newLocale);
	if (browser) {
		window.localStorage.setItem('locale', newLocale);
	}
}

export { locale };
