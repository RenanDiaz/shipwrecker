/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		screens: {
			'xs': '400px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		extend: {
			colors: {
				navy: {
					50: '#e7f1ff',
					100: '#d3e5ff',
					200: '#b0cdff',
					300: '#7aacff',
					400: '#4180ff',
					500: '#1850ff',
					600: '#0035ff',
					700: '#0031ff',
					800: '#002bcd',
					900: '#001d6b',
					950: '#001040'
				},
				ocean: {
					50: '#effcfb',
					100: '#d6f7f5',
					200: '#b2efeb',
					300: '#7ce2dd',
					400: '#3fccc7',
					500: '#24b0ac',
					600: '#1f8e8d',
					700: '#1e7273',
					800: '#1e5b5d',
					900: '#1d4c4d',
					950: '#0b2e30'
				}
			}
		}
	},
	plugins: []
};
