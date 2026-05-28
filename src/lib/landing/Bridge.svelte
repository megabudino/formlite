<script lang="ts">
	type Props = {
		quote: string;
		attribution?: string;
	};

	let { quote, attribution }: Props = $props();
</script>

<section class="relative overflow-hidden bg-ink-900">
	<div
		class="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_20%,var(--color-mint-700),transparent_40%),radial-gradient(circle_at_85%_85%,var(--color-mint-800),transparent_45%)] opacity-40"
	></div>
	<div
		class="pointer-events-none absolute -top-12 left-0 -z-0 font-mono text-[18rem] font-extrabold leading-none text-white/5 select-none sm:text-[24rem]"
		aria-hidden="true"
	>
		&ldquo;
	</div>

	<div class="relative mx-auto max-w-5xl px-6 py-28 sm:py-36">
		<p
			class="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
		>
			{quote}
		</p>
		{#if attribution}
			<div class="mt-8 flex items-center gap-4">
				<span class="h-px w-10 bg-mint-400"></span>
				<span class="font-mono text-xs uppercase tracking-[0.25em] text-mint-300">
					{attribution}
				</span>
			</div>
		{/if}
	</div>
</section>
