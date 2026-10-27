<script lang="ts">
	import { Icon } from '$lib/ui';

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

	let { eyebrow, title, body, primaryCta, secondaryCta, note }: Props = $props();
</script>

<section class="px-4 pb-20 sm:px-6 sm:pb-28">
	<div
		class="relative mx-auto max-w-[1200px] overflow-hidden rounded-xl border border-line bg-inverse px-6 py-16 text-on-inverse sm:px-12 sm:py-24"
	>
		<!-- Decoration: the mark's bars and dot, mint on the dark slab, plus an amber block -->
		<div class="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] lg:block" aria-hidden="true">
			<div class="absolute top-16 right-14 left-8">
				<div class="grid gap-4">
					<i class="block h-8 w-full rounded-full bg-accent"></i>
					<i class="block h-8 w-[70%] rounded-full bg-accent"></i>
					<div class="flex items-center gap-4">
						<i class="block h-8 w-[36%] rounded-full bg-accent"></i>
						<i class="block h-8 w-8 rounded-full bg-accent"></i>
					</div>
				</div>
			</div>
			<div class="absolute right-14 -bottom-8 h-32 w-32 rounded-lg bg-amber"></div>
			<div class="absolute right-52 -bottom-10 h-20 w-40 rounded-lg bg-accent opacity-20"></div>
		</div>

		<div class="relative max-w-2xl lg:max-w-[58%]">
			{#if eyebrow}
				<p class="fl-overline inline-flex items-center gap-2 !text-on-inverse">
					<span class="h-2 w-2 rounded-full bg-accent" aria-hidden="true"></span>
					{eyebrow}
				</p>
			{/if}

			<h2
				class="mt-5 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-white"
			>
				{title}
			</h2>

			{#if body}
				<p class="mt-6 max-w-xl text-lg leading-relaxed opacity-85">{body}</p>
			{/if}

			<div class="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
				<a
					href={primaryCta.href}
					target={primaryCta.external ? '_blank' : undefined}
					rel={primaryCta.external ? 'noopener' : undefined}
					class="fl-btn fl-btn--primary fl-btn--lg"
				>
					<Icon name="github" />
					{primaryCta.label}
					<Icon name="arrow-right" />
				</a>
				{#if secondaryCta}
					<a
						href={secondaryCta.href}
						target={secondaryCta.external ? '_blank' : undefined}
						rel={secondaryCta.external ? 'noopener' : undefined}
						class="fl-btn fl-btn--lg !border-on-inverse/30 text-on-inverse hover:bg-white/5"
					>
						{secondaryCta.label}
					</a>
				{/if}
			</div>

			{#if note}
				<p class="mt-6 font-mono text-[11px] font-medium tracking-[0.12em] uppercase opacity-70">
					{note}
				</p>
			{/if}
		</div>
	</div>
</section>
