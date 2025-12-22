import { browser } from '$app/environment';

/**
 * Sound effects for ShipWrecker using Web Audio API
 * No external audio files required - all sounds are synthesized
 */

let audioContext: AudioContext | null = null;
let soundEnabled = true;

// Initialize audio context lazily (must be triggered by user interaction)
function getAudioContext(): AudioContext | null {
	if (!browser) return null;

	if (!audioContext) {
		try {
			audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		} catch {
			console.warn('Web Audio API not supported');
			return null;
		}
	}

	// Resume context if suspended (required by browsers)
	if (audioContext.state === 'suspended') {
		audioContext.resume();
	}

	return audioContext;
}

// Create an oscillator-based sound
function playTone(
	frequency: number,
	duration: number,
	type: OscillatorType = 'sine',
	volume: number = 0.3,
	fadeOut: boolean = true
): void {
	const ctx = getAudioContext();
	if (!ctx || !soundEnabled) return;

	const oscillator = ctx.createOscillator();
	const gainNode = ctx.createGain();

	oscillator.connect(gainNode);
	gainNode.connect(ctx.destination);

	oscillator.type = type;
	oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
	gainNode.gain.setValueAtTime(volume, ctx.currentTime);

	if (fadeOut) {
		gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
	}

	oscillator.start(ctx.currentTime);
	oscillator.stop(ctx.currentTime + duration);
}

// Play noise burst (for explosions/splashes)
function playNoise(duration: number, volume: number = 0.2, lowpass: number = 1000): void {
	const ctx = getAudioContext();
	if (!ctx || !soundEnabled) return;

	const bufferSize = ctx.sampleRate * duration;
	const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < bufferSize; i++) {
		data[i] = Math.random() * 2 - 1;
	}

	const noise = ctx.createBufferSource();
	noise.buffer = buffer;

	const filter = ctx.createBiquadFilter();
	filter.type = 'lowpass';
	filter.frequency.value = lowpass;

	const gainNode = ctx.createGain();
	gainNode.gain.setValueAtTime(volume, ctx.currentTime);
	gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

	noise.connect(filter);
	filter.connect(gainNode);
	gainNode.connect(ctx.destination);

	noise.start();
	noise.stop(ctx.currentTime + duration);
}

/**
 * Play hit sound - sharp impact
 */
export function playHitSound(): void {
	const ctx = getAudioContext();
	if (!ctx || !soundEnabled) return;

	// Sharp attack with metallic ring
	playTone(440, 0.15, 'square', 0.2);
	setTimeout(() => playTone(220, 0.1, 'triangle', 0.15), 50);
	playNoise(0.1, 0.15, 2000);
}

/**
 * Play miss sound - water splash
 */
export function playMissSound(): void {
	const ctx = getAudioContext();
	if (!ctx || !soundEnabled) return;

	// Soft splash sound
	playNoise(0.25, 0.12, 800);
	playTone(180, 0.15, 'sine', 0.08);
}

/**
 * Play sink sound - dramatic explosion
 */
export function playSinkSound(): void {
	const ctx = getAudioContext();
	if (!ctx || !soundEnabled) return;

	// Deep explosion with rumble
	playTone(80, 0.4, 'sawtooth', 0.25);
	playTone(60, 0.5, 'triangle', 0.2);
	playNoise(0.5, 0.25, 500);

	// Secondary hit sounds
	setTimeout(() => {
		playTone(120, 0.2, 'square', 0.15);
		playNoise(0.2, 0.15, 600);
	}, 100);

	setTimeout(() => {
		playTone(100, 0.15, 'triangle', 0.1);
	}, 200);
}

/**
 * Play turn notification - subtle chime
 */
export function playTurnSound(): void {
	const ctx = getAudioContext();
	if (!ctx || !soundEnabled) return;

	// Gentle two-note chime
	playTone(523.25, 0.15, 'sine', 0.12); // C5
	setTimeout(() => {
		playTone(659.25, 0.2, 'sine', 0.1); // E5
	}, 100);
}

/**
 * Play opponent shot sound - incoming attack
 */
export function playIncomingSound(): void {
	const ctx = getAudioContext();
	if (!ctx || !soundEnabled) return;

	// Whistle-down sound
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.type = 'sine';
	osc.frequency.setValueAtTime(600, ctx.currentTime);
	osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);

	gain.gain.setValueAtTime(0.1, ctx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

	osc.start();
	osc.stop(ctx.currentTime + 0.2);
}

/**
 * Enable or disable all sounds
 */
export function setSoundEnabled(enabled: boolean): void {
	soundEnabled = enabled;
	if (browser) {
		localStorage.setItem('shipwrecker_soundEnabled', String(enabled));
	}
}

/**
 * Check if sounds are enabled
 */
export function isSoundEnabled(): boolean {
	return soundEnabled;
}

/**
 * Initialize sound preferences from storage
 */
export function initializeSounds(): void {
	if (browser) {
		const stored = localStorage.getItem('shipwrecker_soundEnabled');
		soundEnabled = stored !== 'false';
	}
}

/**
 * Toggle sounds on/off
 */
export function toggleSound(): boolean {
	setSoundEnabled(!soundEnabled);
	return soundEnabled;
}
