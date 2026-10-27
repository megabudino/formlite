<script lang="ts">
	import Icon from './Icon.svelte';
	import { aiPrompt, highlight, snippetFor, type SnippetLang } from '$lib/integration';

	// Everything needed to connect a site to a form: the endpoint, a prompt for AI assistants
	// and copy-ready code examples.
	let { actionUrl, showEndpoint = true }: { actionUrl: string; showEndpoint?: boolean } = $props();

	let copied = $state<string | null>(null);
	let promptOpen = $state(false);
	let lang = $state<SnippetLang>('html');

	const prompt = $derived(aiPrompt(actionUrl));
	const snippet = $derived(snippetFor(lang, actionUrl));
	const highlighted = $derived(highlight(snippet));

	const langs: { id: SnippetLang; label: string; file: string }[] = [
		{ id: 'html', label: 'HTML', file: 'index.html' },
		{ id: 'js', label: 'JavaScript', file: 'index.html' },
		{ id: 'react', label: 'React', file: 'ContactForm.jsx' }
	];

	async function copy(text: string, key: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = key;
			setTimeout(() => {
				if (copied === key) copied = null;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<div class="grid grid-cols-[minmax(0,1fr)] gap-8">
	{#if showEndpoint}
		<section class="grid grid-cols-[minmax(0,1fr)] gap-3">
			<h3 class="fl-h3">Form endpoint</h3>
			<div class="fl-endpoint">
				<span class="fl-endpoint__verb">POST</span>
				<span class="fl-endpoint__url" title={actionUrl}>{actionUrl}</span>
				<button type="button" class="fl-btn fl-btn--primary fl-btn--sm" onclick={() => copy(actionUrl, 'url')}>
					<Icon name={copied === 'url' ? 'check' : 'copy'} size={16} />
					{copied === 'url' ? 'Copied' : 'Copy'}
				</button>
			</div>
			<p class="fl-muted m-0 text-sm">
				Put this URL in your form's <code class="fl-code">action</code> attribute, set the method to
				<code class="fl-code">POST</code> and give every input a <code class="fl-code">name</code>.
			</p>
		</section>
	{/if}

	<section class="grid grid-cols-[minmax(0,1fr)] gap-3">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div class="flex items-start gap-3">
				<span class="fl-card__tile !h-10 !w-10 flex-none"><Icon name="sparkles" /></span>
				<div>
					<h3 class="fl-h3">Use with AI assistants</h3>
					<p class="fl-muted m-0 text-sm">
						Paste this prompt into ChatGPT, Claude, Cursor or Copilot and let it wire up your form.
					</p>
				</div>
			</div>
			<button type="button" class="fl-btn fl-btn--primary fl-btn--sm" onclick={() => copy(prompt, 'prompt')}>
				<Icon name={copied === 'prompt' ? 'check' : 'copy'} size={16} />
				{copied === 'prompt' ? 'Copied' : 'Copy prompt'}
			</button>
		</div>
		<div class="fl-codeblock">
			<div class="relative">
				<pre
					class="!pt-4 transition-[max-height] {promptOpen ? 'max-h-[60vh] overflow-y-auto' : 'max-h-[176px] overflow-hidden'}"
					style="white-space: pre-wrap; overflow-wrap: anywhere;"><code>{prompt}</code></pre>
				{#if !promptOpen}
					<div
						class="pointer-events-none absolute inset-x-0 bottom-0 h-20"
						style="background: linear-gradient(to bottom, transparent, var(--inverse));"
					></div>
				{/if}
			</div>
			<div class="flex justify-center px-4 pb-3 pt-1">
				<button
					type="button"
					class="fl-btn fl-btn--sm !h-8 !bg-transparent !text-[13px] !text-on-inverse opacity-80 hover:opacity-100"
					aria-expanded={promptOpen}
					onclick={() => (promptOpen = !promptOpen)}
				>
					<Icon name="chevron-right" size={14} class="transition-transform {promptOpen ? '-rotate-90' : 'rotate-90'}" />
					{promptOpen ? 'Show less' : 'Show full prompt'}
				</button>
			</div>
		</div>
	</section>

	<section class="grid grid-cols-[minmax(0,1fr)] gap-3">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h3 class="fl-h3">Code examples</h3>
			<div class="fl-tabs" role="tablist" aria-label="Code example language">
				{#each langs as l (l.id)}
					<button
						type="button"
						role="tab"
						class="fl-tab !h-8 !px-3 !text-[13px]"
						aria-selected={lang === l.id}
						onclick={() => (lang = l.id)}
					>
						{l.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="fl-codeblock">
			<div class="fl-codeblock__bar">
				<span class="fl-codeblock__name">{langs.find((l) => l.id === lang)?.file}</span>
				<button
					type="button"
					class="fl-btn fl-btn--sm"
					style="background:var(--brand-mint);color:var(--brand-forest)"
					onclick={() => copy(snippet, 'code')}
				>
					<Icon name={copied === 'code' ? 'check' : 'copy'} size={16} />
					{copied === 'code' ? 'Copied' : 'Copy code'}
				</button>
			</div>
			<pre class="max-h-[420px] overflow-y-auto"><code>{@html highlighted}</code></pre>
		</div>
	</section>

	<section class="grid grid-cols-[minmax(0,1fr)] gap-3">
		<h3 class="fl-h3">Good to know</h3>
		<ul class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
			{#each [
				{ icon: 'shield', t: 'Honeypot', d: 'Keep the hidden _gotcha field empty. Bots fill it and get dropped.' },
				{ icon: 'mail', t: 'Reply-To', d: 'A field named email (or reply_to) becomes the Reply-To of your notification.' },
				{ icon: 'code', t: 'JSON responses', d: 'Send Accept: application/json to get {"ok": true} instead of a redirect.' },
				{ icon: 'globe', t: 'Allowed domains', d: 'Lock the endpoint to your own sites in Settings.' }
			] as tip (tip.t)}
				<li class="flex gap-3 rounded-md bg-surface-2 p-4">
					<Icon name={tip.icon as 'shield'} size={18} class="mt-0.5 text-accent-text" />
					<div>
						<p class="m-0 text-sm font-semibold">{tip.t}</p>
						<p class="fl-muted m-0 mt-0.5 text-sm">{tip.d}</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>
</div>
