<script lang="ts">
	type PainPoint = {
		icon: string;
		title: string;
		body: string;
	};

	type Props = {
		eyebrow?: string;
		title?: string;
		subhead?: string;
		items: PainPoint[];
	};

	let { eyebrow, title, subhead, items }: Props = $props();
</script>

<section class="border-y border-ink-100 bg-white">
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
						class="mt-8 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl"
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

		<div class="mx-auto mt-20 grid max-w-5xl gap-12 sm:grid-cols-3 sm:gap-10">
			{#each items as item, i}
				<article class="flex flex-col">
					<div class="flex items-baseline gap-3">
						<span
							class="font-mono text-xs uppercase tracking-[0.25em] text-mint-700"
						>
							{String(i + 1).padStart(2, '0')}
						</span>
						<span class="h-px flex-1 bg-mint-200"></span>
					</div>
					<span class="mt-8 text-4xl">{item.icon}</span>
					<h3
						class="mt-6 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
					>
						{item.title}
					</h3>
					<p class="mt-4 text-base leading-relaxed text-ink-600">{item.body}</p>
				</article>
			{/each}
		</div>
	</div>
</section>
