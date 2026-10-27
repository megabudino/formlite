<script lang="ts">
	import { Icon } from '$lib/ui';

	type CtaProps = {
		label: string;
		href: string;
		external?: boolean;
	};

	type Props = {
		eyebrow?: string;
		headline: string;
		highlight?: string;
		subhead: string;
		primaryCta?: CtaProps;
		secondaryCta?: CtaProps;
		note?: string;
		/** Small mono line under the call to action */
		footnote?: string;
		endpoint?: string;
	};

	let {
		eyebrow,
		headline,
		highlight,
		subhead,
		primaryCta,
		secondaryCta,
		note,
		footnote,
		endpoint = 'https://forms.example.com/s/f_8k2m1q'
	}: Props = $props();
</script>

<!-- Fills the first screen below the 68px header (+1px border). On desktop the content sits a little
     above the true middle (more padding below than above), which reads as optically centred. -->
<section class="relative flex min-h-[calc(100svh-69px)] items-center overflow-hidden">
	<div
		class="mx-auto grid w-full max-w-[1200px] items-center gap-14 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_1fr] lg:gap-16 lg:pt-10 lg:pb-[6.5rem]"
	>
		<div class="min-w-0">
			{#if eyebrow}
				<span class="fl-badge fl-badge--live">{eyebrow}</span>
			{/if}
			{#if note}
				<p
					class="m-0 inline-flex max-w-xl rounded-full bg-amber-tint px-4 py-2 text-sm leading-5 font-semibold text-on-amber-tint {eyebrow
						? 'mt-3'
						: ''}"
				>
					{note}
				</p>
			{/if}

			<h1
				class="{eyebrow || note ? 'mt-7' : ''} font-display text-[clamp(3.25rem,10vw,5.25rem)] leading-[0.94] font-extrabold tracking-[-0.04em]"
			>
				{headline}
				{#if highlight}
					{' '}<span
						class="inline-block -rotate-2 rounded-[0.2em] bg-accent px-[0.14em] pb-[0.04em] whitespace-nowrap text-on-accent"
						>{highlight}</span
					>
				{/if}
			</h1>

			<p class="mt-7 max-w-xl text-lg leading-relaxed text-fg-muted sm:text-xl sm:leading-relaxed">
				{subhead}
			</p>

			<!-- Call to action and its footnote share one column: the footnote sits centred under the button -->
			<div class="mt-9 flex flex-col sm:inline-flex">
			{#if primaryCta || secondaryCta}
				<div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
					{#if primaryCta}
						<a
							href={primaryCta.href}
							target={primaryCta.external ? '_blank' : undefined}
							rel={primaryCta.external ? 'noopener' : undefined}
							class="fl-btn fl-btn--primary fl-btn--lg group sm:flex-1"
						>
							<Icon name="github" />
							{primaryCta.label}
							<Icon name="arrow-right" class="transition-transform duration-140 group-hover:translate-x-0.5" />
						</a>
					{/if}

					{#if secondaryCta}
						<a
							href={secondaryCta.href}
							target={secondaryCta.external ? '_blank' : undefined}
							rel={secondaryCta.external ? 'noopener' : undefined}
							class="fl-btn fl-btn--secondary fl-btn--lg"
						>
							{secondaryCta.label}
						</a>
					{/if}
				</div>
			{/if}

			{#if footnote}
				<p class="fl-overline m-0 mt-5 text-center sm:whitespace-nowrap">{footnote}</p>
			{/if}
			</div>


		</div>

		<!-- Product glimpse: the endpoint and the snippet, staged on the mark's own shapes -->
		<div class="relative min-w-0 pt-8 pr-4 pb-10 sm:pt-12 sm:pr-10 sm:pb-14">
			<div aria-hidden="true">
				<div class="slab absolute top-0 right-0 h-56 w-[72%] rounded-xl px-7 pt-7 sm:h-64">
					<div class="fl-bars ml-auto w-[55%] opacity-90">
						<i class="w-full bg-accent"></i>
						<i class="w-[70%] bg-accent"></i>
						<i class="w-[36%] bg-accent"></i>
					</div>
				</div>
				<div class="absolute bottom-0 left-6 h-24 w-28 rounded-lg bg-amber sm:left-10"></div>
				<div class="absolute right-0 bottom-4 h-14 w-32 rounded-lg bg-accent-tint sm:right-2"></div>
			</div>

			<div class="fl-card relative !grid grid-cols-1 gap-4 !p-4 !shadow-lift sm:!p-6">
				<div class="fl-endpoint !pr-4">
					<span class="fl-endpoint__verb">POST</span>
					<span class="fl-endpoint__url">{endpoint}</span>
				</div>
				<div class="fl-codeblock hero-code">
					<div class="fl-codeblock__bar">
						<span class="fl-codeblock__name">index.html</span>
					</div>
					<pre><span class="k">&lt;form</span> action=<span class="s">"{endpoint}"</span>
      method=<span class="s">"POST"</span><span class="k">&gt;</span>
  <span class="k">&lt;input</span> type=<span class="s">"email"</span> name=<span class="s">"email"</span> required<span class="k">&gt;</span>
  <span class="k">&lt;textarea</span> name=<span class="s">"message"</span><span class="k">&gt;&lt;/textarea&gt;</span>
  <span class="k">&lt;input</span> type=<span class="s">"text"</span> name=<span class="s">"_gotcha"</span> hidden<span class="k">&gt;</span>
  <span class="k">&lt;button&gt;</span>Send<span class="k">&lt;/button&gt;</span>
<span class="k">&lt;/form&gt;</span></pre>
				</div>
				<div class="flex flex-wrap gap-2">
					<span class="fl-chip !pr-3"><Icon name="mail" size={16} />Email sent</span>
					<span class="fl-chip !pr-3"><Icon name="webhook" size={16} />Webhook signed</span>
					<span class="fl-chip !pr-3"><Icon name="shield" size={16} />Spam filtered</span>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.hero-code :global(pre) {
		scrollbar-width: thin;
		scrollbar-color: color-mix(in srgb, var(--on-inverse) 30%, transparent) transparent;
	}
	.slab {
		background: var(--brand-forest);
	}
	:global([data-theme='dark']) .slab {
		background: var(--accent-tint);
	}
</style>
