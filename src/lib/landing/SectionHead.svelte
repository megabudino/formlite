<script lang="ts">
	type Props = {
		eyebrow?: string;
		title?: string;
		subhead?: string;
		align?: 'left' | 'center';
		tone?: 'default' | 'inverse';
	};

	let { eyebrow, title, subhead, align = 'left', tone = 'default' }: Props = $props();
</script>

{#if eyebrow || title || subhead}
	<div class={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
		{#if eyebrow}
			<p
				class="fl-overline inline-flex items-center gap-2 {align === 'center' ? 'justify-center' : ''}"
				class:!text-on-inverse={tone === 'inverse'}
			>
				<span class="h-2 w-2 rounded-full bg-accent" aria-hidden="true"></span>
				{eyebrow}
			</p>
		{/if}
		{#if title}
			<h2
				class="{eyebrow ? 'mt-4' : ''} font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.04] font-bold tracking-[-0.03em]"
			>
				{title}
			</h2>
		{/if}
		{#if subhead}
			<p
				class="mt-5 text-lg leading-relaxed {tone === 'inverse' ? 'text-on-inverse/80' : 'text-fg-muted'}"
				class:mx-auto={align === 'center'}
			>
				{subhead}
			</p>
		{/if}
	</div>
{/if}
