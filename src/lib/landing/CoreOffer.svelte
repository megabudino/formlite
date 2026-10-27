<script lang="ts">
	import { Icon, type IconName } from '$lib/ui';
	import SectionHead from './SectionHead.svelte';

	type CtaProps = {
		label: string;
		href: string;
		external?: boolean;
	};

	type Feature = string | { label: string; icon: IconName };

	type Props = {
		eyebrow?: string;
		title: string;
		body: string;
		features?: Feature[];
		primaryCta: CtaProps;
		secondaryCta?: CtaProps;
		note?: string;
	};

	let { eyebrow, title, body, features = [], primaryCta, secondaryCta, note }: Props = $props();

	const items = $derived(
		features.map((f) => (typeof f === 'string' ? { label: f, icon: 'check' as IconName } : f))
	);
</script>

<section class="mt-20 border-y border-line bg-surface sm:mt-28">
	<div class="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
		<div class="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
			<div class="min-w-0">
				<SectionHead {eyebrow} {title} />
				<p class="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">{body}</p>

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
							class="fl-btn fl-btn--secondary fl-btn--lg"
						>
							{secondaryCta.label}
						</a>
					{/if}
				</div>

				{#if note}
					<p
						class="mt-6 inline-flex max-w-xl items-start gap-3 rounded-md bg-amber-tint px-4 py-3 text-sm leading-5 font-medium text-on-amber-tint"
					>
						<span class="mt-1.5 h-2 w-2 flex-none rounded-full bg-amber" aria-hidden="true"></span>
						{note}
					</p>
				{/if}
			</div>

			{#if items.length > 0}
				<div class="min-w-0">
					<ul class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-1">
						{#each items as item}
							<li
								class="flex items-center gap-4 rounded-lg border border-line bg-bg p-4 text-[15px] leading-5 font-semibold"
							>
								<span class="fl-card__tile !h-10 !w-10 flex-none"><Icon name={item.icon} /></span>
								<span>{item.label}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
</section>
