<script lang="ts">
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

<section class="bg-white">
	<div class="mx-auto max-w-6xl px-6 py-24 sm:py-32">
		{#if eyebrow || title || subhead}
			<div class="mx-auto max-w-3xl text-center">
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
				{#if title}
					<h2
						class="mt-8 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl"
					>
						{title}
					</h2>
				{/if}
				{#if subhead}
					<p class="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-600 sm:text-xl">
						{subhead}
					</p>
				{/if}
			</div>
		{/if}

		<div class="mx-auto mt-16 grid max-w-5xl gap-12 sm:grid-cols-3 sm:gap-10">
			{#each items as review}
				<figure class="flex flex-col border-t border-ink-200 pt-6">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="h-6 w-6 text-mint-500"
						aria-hidden="true"
					>
						<path
							d="M7 7h4v4H7v3a4 4 0 0 0 4 4v-2a2 2 0 0 1-2-2h2V7H7zm10 0h4v4h-4v3a4 4 0 0 0 4 4v-2a2 2 0 0 1-2-2h2V7h-4z"
						/>
					</svg>
					<blockquote class="mt-4 text-base leading-relaxed text-ink-800">
						{review.quote}
					</blockquote>
					<figcaption class="mt-6">
						<p class="font-semibold text-ink-900">{review.author}</p>
						{#if review.role}
							<p class="mt-1 font-mono text-xs uppercase tracking-wider text-ink-500">
								{review.role}
							</p>
						{/if}
					</figcaption>
				</figure>
			{/each}
		</div>
	</div>
</section>
