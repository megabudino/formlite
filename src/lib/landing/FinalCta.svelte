<script lang="ts">
	type CtaProps = {
		label: string;
		href: string;
		external?: boolean;
	};

	type Props = {
		eyebrow?: string;
		title: string;
		body?: string;
		primaryCta: CtaProps;
		secondaryCta?: CtaProps;
		note?: string;
	};

	let {
		eyebrow,
		title,
		body,
		primaryCta,
		secondaryCta,
		note
	}: Props = $props();
</script>

<section class="relative overflow-hidden bg-ink-900">
	<div
		class="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_15%_85%,var(--color-mint-700),transparent_45%),radial-gradient(circle_at_85%_15%,var(--color-mint-600),transparent_45%)] opacity-50"
	></div>

	<div class="relative mx-auto max-w-5xl px-6 py-28 sm:py-36 text-center">
		{#if eyebrow}
			<div class="flex items-center justify-center gap-4">
				<span class="h-px w-10 bg-mint-400"></span>
				<span
					class="font-mono text-xs uppercase tracking-[0.25em] text-mint-300"
				>
					{eyebrow}
				</span>
				<span class="h-px w-10 bg-mint-400"></span>
			</div>
		{/if}

		<h2
			class="mt-8 text-balance text-5xl font-extrabold leading-[1.0] tracking-tight text-white sm:text-6xl lg:text-7xl"
		>
			{title}
		</h2>

		{#if body}
			<p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-300 sm:text-xl">
				{body}
			</p>
		{/if}

		<div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
			<a
				href={primaryCta.href}
				target={primaryCta.external ? '_blank' : undefined}
				rel={primaryCta.external ? 'noopener' : undefined}
				class="group inline-flex items-center justify-center gap-2 rounded-lg bg-mint-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-mint-500/20 transition hover:-translate-y-0.5 hover:bg-mint-400 hover:shadow-xl hover:shadow-mint-500/30"
			>
				{primaryCta.label}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-5 w-5 transition group-hover:translate-x-0.5"
					aria-hidden="true"
				>
					<path d="M5 12h14" />
					<path d="m13 5 7 7-7 7" />
				</svg>
			</a>
			{#if secondaryCta}
				<a
					href={secondaryCta.href}
					target={secondaryCta.external ? '_blank' : undefined}
					rel={secondaryCta.external ? 'noopener' : undefined}
					class="inline-flex items-center justify-center rounded-lg border-2 border-white/30 bg-transparent px-8 py-4 text-lg font-semibold text-white transition hover:border-white hover:bg-white/5"
				>
					{secondaryCta.label}
				</a>
			{/if}
		</div>

		{#if note}
			<p class="mt-6 font-mono text-xs uppercase tracking-wider text-ink-400">
				{note}
			</p>
		{/if}
	</div>
</section>
