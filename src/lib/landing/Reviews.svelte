<script lang="ts">
	import SectionHead from './SectionHead.svelte';

	type Review = {
		quote: string;
		author: string;
		role?: string;
	};

	type Props = {
		eyebrow?: string;
		title?: string;
		subhead?: string;
		items: Review[];
	};

	let { eyebrow, title, subhead, items }: Props = $props();
</script>

<section>
	<div class="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
		<SectionHead {eyebrow} {title} {subhead} />

		<div class="mt-12 grid gap-4 sm:mt-16 md:grid-cols-3">
			{#each items as review}
				<figure class="fl-card m-0 !flex flex-col">
					<span class="fl-card__tile" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
							<path
								d="M7 7h4v4H7v3a4 4 0 0 0 4 4v-2a2 2 0 0 1-2-2h2V7H7zm10 0h4v4h-4v3a4 4 0 0 0 4 4v-2a2 2 0 0 1-2-2h2V7h-4z"
							/>
						</svg>
					</span>
					<blockquote class="mt-5 flex-1 text-base leading-relaxed">
						{review.quote}
					</blockquote>
					<figcaption class="mt-6 border-t border-line pt-4">
						<p class="font-semibold">{review.author}</p>
						{#if review.role}
							<p class="fl-overline mt-1">{review.role}</p>
						{/if}
					</figcaption>
				</figure>
			{/each}
		</div>
	</div>
</section>
