<script lang="ts">
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
	};

	let {
		eyebrow,
		headline,
		highlight,
		subhead,
		primaryCta,
		secondaryCta,
		note
	}: Props = $props();
</script>

<section class="relative overflow-hidden">
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--color-mint-200),transparent_55%)]"
	></div>
	<div
		class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-mint-300 to-transparent"
	></div>

	<div class="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pb-32 sm:pt-28">
		<div class="mx-auto max-w-4xl text-center">
			{#if eyebrow}
				<div class="flex items-center justify-center gap-4">
					<span class="h-px w-10 bg-mint-500"></span>
					<span
						class="font-mono text-xs uppercase tracking-[0.25em] text-mint-700"
					>
						{eyebrow}
					</span>
					<span class="h-px w-10 bg-mint-500"></span>
				</div>
			{/if}

			<h1
				class="mt-8 text-balance text-6xl font-extrabold leading-[0.95] tracking-tight text-ink-900 sm:text-7xl lg:text-[7.5rem]"
			>
				{headline}
				{#if highlight}
					{' '}
					<span class="relative inline-block whitespace-nowrap">
						<span
							class="relative z-10 bg-gradient-to-br from-mint-400 via-mint-500 to-mint-700 bg-clip-text text-transparent"
							>{highlight}</span
						>
						<span
							class="absolute inset-x-0 bottom-1 -z-0 h-3 bg-mint-300/70 sm:h-4 lg:h-5"
						></span>
					</span>
				{/if}
			</h1>

			<p
				class="mx-auto mt-8 max-w-2xl text-balance text-xl leading-relaxed text-ink-700 sm:text-2xl"
			>
				{subhead}
			</p>

			{#if primaryCta || secondaryCta}
				<div
					class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
				>
					{#if primaryCta}
						<a
							href={primaryCta.href}
							target={primaryCta.external ? '_blank' : undefined}
							rel={primaryCta.external ? 'noopener' : undefined}
							class="group inline-flex items-center justify-center gap-2 rounded-lg bg-ink-900 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-ink-900/10 transition hover:-translate-y-0.5 hover:bg-ink-800 hover:shadow-xl hover:shadow-ink-900/20 sm:text-lg"
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
								class="h-4 w-4 transition group-hover:translate-x-0.5"
								aria-hidden="true"
							>
								<path d="M5 12h14" />
								<path d="m13 5 7 7-7 7" />
							</svg>
						</a>
					{/if}
					{#if secondaryCta}
						<a
							href={secondaryCta.href}
							target={secondaryCta.external ? '_blank' : undefined}
							rel={secondaryCta.external ? 'noopener' : undefined}
							class="inline-flex items-center justify-center rounded-lg border-2 border-ink-900 bg-transparent px-7 py-4 text-base font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-white sm:text-lg"
						>
							{secondaryCta.label}
						</a>
					{/if}
				</div>
			{/if}

			{#if note}
				<p class="mt-5 font-mono text-xs uppercase tracking-wider text-ink-500">
					{note}
				</p>
			{/if}
		</div>
	</div>
</section>
