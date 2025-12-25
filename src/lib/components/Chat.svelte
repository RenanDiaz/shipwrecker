<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { ChatMessage, PresetMessageId, ReactionId, ChatMessageType } from '../../../shared/types';
	import { playClickSound } from '$lib/utils/sounds';

	interface Props {
		messages: ChatMessage[];
		playerNumber: 1 | 2;
		onSendMessage: (messageType: ChatMessageType, content: PresetMessageId | ReactionId) => void;
	}

	let { messages, playerNumber, onSendMessage }: Props = $props();

	// Preset messages
	const presetMessages: { id: PresetMessageId; emoji: string }[] = [
		{ id: 'gl', emoji: '🍀' },
		{ id: 'gg', emoji: '🎮' },
		{ id: 'ns', emoji: '🎯' },
		{ id: 'oops', emoji: '😅' },
		{ id: 'wow', emoji: '😮' },
		{ id: 'hurry', emoji: '⏰' },
		{ id: 'rematch', emoji: '🔄' },
		{ id: 'bye', emoji: '👋' }
	];

	// Quick reactions
	const reactions: ReactionId[] = ['👍', '👏', '😄', '😮', '😅', '🔥', '💀', '🎯'];

	// UI state
	let isExpanded = $state(false);
	let showReactions = $state(false);

	// Track recent messages for animation
	let recentMessageIds = $state<Set<string>>(new Set());

	// Auto-scroll chat container
	let chatContainer: HTMLDivElement | null = null;

	$effect(() => {
		if (messages.length > 0 && chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
		// Mark new messages as recent for animation
		const latestMessage = messages[messages.length - 1];
		if (latestMessage && !recentMessageIds.has(latestMessage.id)) {
			recentMessageIds = new Set([...recentMessageIds, latestMessage.id]);
			// Remove from recent after animation
			setTimeout(() => {
				recentMessageIds = new Set([...recentMessageIds].filter(id => id !== latestMessage.id));
			}, 500);
		}
	});

	function sendPresetMessage(id: PresetMessageId): void {
		playClickSound();
		onSendMessage('preset', id);
	}

	function sendReaction(reaction: ReactionId): void {
		playClickSound();
		onSendMessage('reaction', reaction);
		showReactions = false;
	}

	function getMessageDisplay(msg: ChatMessage): string {
		if (msg.messageType === 'reaction') {
			return msg.content;
		}
		// Get translated preset message
		return $_(`chat.messages.${msg.content}`);
	}

	function getPresetEmoji(id: PresetMessageId): string {
		return presetMessages.find(p => p.id === id)?.emoji ?? '';
	}

	function toggleExpanded(): void {
		playClickSound();
		isExpanded = !isExpanded;
		if (!isExpanded) {
			showReactions = false;
		}
	}

	function toggleReactions(): void {
		playClickSound();
		showReactions = !showReactions;
	}
</script>

<div class="bg-navy-800/50 rounded-lg overflow-hidden w-full max-w-xs mx-auto">
	<!-- Header - always visible, clickable to expand -->
	<button
		type="button"
		class="w-full flex items-center justify-between px-3 py-2 bg-navy-700/50 hover:bg-navy-700 transition-colors"
		onclick={toggleExpanded}
	>
		<span class="text-sm font-medium text-white flex items-center gap-2">
			💬 {$_('chat.title')}
			{#if messages.length > 0}
				<span class="bg-ocean-600 text-xs px-1.5 py-0.5 rounded-full">{messages.length}</span>
			{/if}
		</span>
		<span class="text-ocean-400 text-sm">
			{isExpanded ? '▼' : '▲'}
		</span>
	</button>

	{#if isExpanded}
		<!-- Messages area -->
		<div
			bind:this={chatContainer}
			class="max-h-32 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-navy-600 scrollbar-track-navy-800"
		>
			{#if messages.length === 0}
				<p class="text-xs text-gray-500 text-center py-2">{$_('chat.noMessages')}</p>
			{:else}
				{#each messages as msg (msg.id)}
					{@const isYou = msg.from === playerNumber}
					{@const isRecent = recentMessageIds.has(msg.id)}
					<div
						class="flex {isYou ? 'justify-end' : 'justify-start'}"
						class:animate-bounce-in={isRecent}
					>
						<div
							class="max-w-[80%] px-2 py-1 rounded-lg text-sm {isYou
								? 'bg-ocean-600 text-white'
								: 'bg-navy-600 text-gray-200'}"
						>
							{#if msg.messageType === 'reaction'}
								<span class="text-lg">{msg.content}</span>
							{:else}
								<span class="mr-1">{getPresetEmoji(msg.content as PresetMessageId)}</span>
								{getMessageDisplay(msg)}
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Quick reactions toggle -->
		{#if showReactions}
			<div class="p-2 bg-navy-900/50 border-t border-navy-700">
				<div class="flex flex-wrap gap-1 justify-center">
					{#each reactions as reaction}
						<button
							type="button"
							class="text-xl p-1 hover:bg-navy-700 rounded transition-colors active:scale-90"
							onclick={() => sendReaction(reaction)}
						>
							{reaction}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Preset messages -->
		<div class="p-2 bg-navy-900/50 border-t border-navy-700">
			<div class="flex items-center gap-1 mb-1.5">
				<button
					type="button"
					class="text-lg p-1 hover:bg-navy-700 rounded transition-colors {showReactions ? 'bg-navy-700' : ''}"
					onclick={toggleReactions}
					title={$_('chat.reactions')}
				>
					😀
				</button>
				<div class="flex-1 h-px bg-navy-600"></div>
			</div>
			<div class="grid grid-cols-4 gap-1">
				{#each presetMessages as preset}
					<button
						type="button"
						class="text-[10px] sm:text-xs px-1.5 py-1.5 bg-navy-700 hover:bg-navy-600 active:bg-navy-500 text-gray-300 rounded transition-colors truncate"
						onclick={() => sendPresetMessage(preset.id)}
						title={$_(`chat.messages.${preset.id}`)}
					>
						{preset.emoji} {$_(`chat.messages.${preset.id}`)}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes bounce-in {
		0% {
			opacity: 0;
			transform: scale(0.8);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.animate-bounce-in {
		animation: bounce-in 0.3s ease-out;
	}

	.scrollbar-thin::-webkit-scrollbar {
		width: 4px;
	}

	.scrollbar-thumb-navy-600::-webkit-scrollbar-thumb {
		background-color: rgb(55 65 81);
		border-radius: 2px;
	}

	.scrollbar-track-navy-800::-webkit-scrollbar-track {
		background-color: rgb(31 41 55);
	}
</style>
