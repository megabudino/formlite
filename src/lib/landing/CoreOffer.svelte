<script lang="ts">
	type CtaProps = {
		label: string;
		href: string;
		external?: boolean;
	};

	type Props = {
		eyebrow?: string;
		title: string;
		body: string;
		features?: string[];
		primaryCta: CtaProps;
		secondaryCta?: CtaProps;
		note?: string;
	};

	let {
		eyebrow,
		title,
		body,
		features = [],
		primaryCta,
		secondaryCta,
		note
	}: Props = $props();
</script>

<section class="relative overflow-hidden bg-ink-50">
	<div
		class="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_20%,var(--color-mint-200),transparent_60%)] opacity-70"
	></div>

	<div class="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
		<div class="grid items-start gap-12 lg:grid-cols-[3fr_2fr] lg:gap-20">
			<div>
				{#if eyebrow}
					<div class="flex items-center gap-4">
						<span class="h-px w-10 bg-mint-500"></span>
						<span
							class="font-mono text-xs uppercase tracking-[0.25em] text-mint-700"
						>
							{eyebrow}
						</span>
					</div>
				{/if}

				<h2
					class="mt-8 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl"
				>
					{title}
				</h2>
				<p class="mt-6 max-w-xl text-lg leading-relaxed text-ink-700 sm:text-xl">
					{body}
				</p>

				<div class="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
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

				{#if note}
					<p class="mt-5 font-mono text-xs uppercase tracking-wider text-ink-500">
						{note}
					</p>
				{/if}
			</div>

			{#if features.length > 0}
				<div>
					<p
						class="font-mono text-xs uppercase tracking-[0.25em] text-mint-700"
					>
						What you get
					</p>
					<ul class="mt-6 divide-y divide-ink-200">
						{#each features as feature}
							<li class="flex items-start gap-3 py-4 text-base font-medium text-ink-800">
								<span
									class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-mint-500 text-white"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="h-3.5 w-3.5"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								</span>
								<span>{feature}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
</section>
