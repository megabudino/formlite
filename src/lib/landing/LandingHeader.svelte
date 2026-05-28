<script lang="ts">
	type CtaProps = {
		label: string;
		href: string;
		external?: boolean;
	};

	type Props = {
		brand: string;
		brandHref?: string;
		cta?: CtaProps;
	};

	let { brand, brandHref = '/', cta }: Props = $props();
</script>

<header class="relative z-10">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:py-8">
		<a
			href={brandHref}
			class="flex items-center gap-3 text-xl font-extrabold tracking-tight text-ink-900"
		>
			<span
				class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-mint-400"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-5 w-5"
				>
					<path d="M4 6h16" />
					<path d="M4 12h10" />
					<path d="M4 18h7" />
				</svg>
			</span>
			{brand}
		</a>

		{#if cta}
			<a
				href={cta.href}
				target={cta.external ? '_blank' : undefined}
				rel={cta.external ? 'noopener' : undefined}
				class="inline-flex items-center gap-2 rounded-lg border-2 border-ink-900 bg-transparent px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-white"
			>
				{cta.label}
			</a>
		{/if}
	</div>
</header>
