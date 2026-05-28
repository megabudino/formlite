<script lang="ts">
	type FooterLink = {
		label: string;
		href: string;
		external?: boolean;
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
	};

	let { tagline, byline, links = [] }: Props = $props();
</script>

<footer class="border-t border-ink-100 bg-white">
	<div class="mx-auto max-w-6xl px-6 py-14 sm:py-16">
		<div class="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-end">
			<div>
				{#if tagline}
					<p
						class="max-w-md text-balance text-2xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-3xl"
					>
						{tagline}
					</p>
				{/if}
				{#if byline}
					<p class="mt-5 text-sm text-ink-600">
						{byline.text}{' '}
						<a
							href={byline.linkHref}
							target="_blank"
							rel="noopener"
							class="relative font-semibold text-ink-900 transition hover:text-mint-700"
						>
							<span class="relative">
								{byline.linkLabel}
								<span class="absolute inset-x-0 -bottom-0.5 h-0.5 bg-mint-500"></span>
							</span>
						</a>
					</p>
				{/if}
			</div>

			{#if links.length > 0}
				<nav class="flex flex-wrap items-center gap-x-6 gap-y-3 sm:justify-end">
					{#each links as link}
						<a
							href={link.href}
							target={link.external ? '_blank' : undefined}
							rel={link.external ? 'noopener' : undefined}
							class="font-mono text-xs uppercase tracking-[0.2em] text-ink-700 transition hover:text-mint-700"
						>
							{link.label}
						</a>
					{/each}
				</nav>
			{/if}
		</div>
	</div>
</footer>
