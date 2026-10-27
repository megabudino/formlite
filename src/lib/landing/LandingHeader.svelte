<script lang="ts">
	import { Icon, Mark } from '$lib/ui';

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

<header class="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
	<div class="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
		<a href={brandHref} class="fl-brand" aria-label="{brand} home">
			<Mark size={32} />
			<span>{brand}</span>
		</a>

		<div class="flex items-center gap-1 sm:gap-2">
			{#if cta}
				<a
					href={cta.href}
					target={cta.external ? '_blank' : undefined}
					rel={cta.external ? 'noopener' : undefined}
					class="fl-btn fl-btn--secondary fl-btn--sm"
				>
					<Icon name="github" size={16} />
					{cta.label}
				</a>
			{/if}
		</div>
	</div>
</header>
