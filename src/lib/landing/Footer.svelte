<script lang="ts">
	import { Icon, Mark, type IconName } from '$lib/ui';

	type FooterLink = {
		label: string;
		href: string;
		external?: boolean;
		icon?: IconName;
	};

	type ByLine = {
		text: string;
		linkLabel: string;
		linkHref: string;
	};

	type Props = {
		tagline?: string;
		byline?: ByLine;
		links?: FooterLink[];
		legal?: string;
	};

	let { tagline, byline, links = [], legal }: Props = $props();
</script>

<footer class="border-t border-line bg-surface">
	<div class="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-16">
		<div class="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-end">
			<div class="min-w-0">
				<Mark size={40} />
				{#if tagline}
					<p
						class="mt-5 max-w-md font-display text-2xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-3xl"
					>
						{tagline}
					</p>
				{/if}
				{#if byline}
					<p class="mt-4 text-sm text-fg-muted">
						{byline.text}{' '}
						<a
							href={byline.linkHref}
							target="_blank"
							rel="noopener"
							class="font-semibold text-accent-text underline decoration-2 underline-offset-4 hover:text-fg"
						>
							{byline.linkLabel}
						</a>
					</p>
				{/if}
			</div>

			{#if links.length > 0}
				<nav class="flex flex-wrap items-center gap-2 sm:justify-end" aria-label="Footer">
					{#each links as link}
						<a
							href={link.href}
							target={link.external ? '_blank' : undefined}
							rel={link.external ? 'noopener' : undefined}
							class="fl-btn fl-btn--secondary fl-btn--sm"
						>
							{#if link.icon}<Icon name={link.icon} size={16} />{/if}
							{link.label}
						</a>
					{/each}
				</nav>
			{/if}
		</div>

		{#if legal}
			<p class="mt-12 border-t border-line pt-6 font-mono text-[11px] leading-5 tracking-[0.08em] text-fg-subtle uppercase">
				{legal}
			</p>
		{/if}
	</div>
</footer>
