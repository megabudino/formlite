<script lang="ts">
	type Props = {
		quote: string;
		attribution?: string;
	};

	let { quote, attribution }: Props = $props();
</script>

<section class="px-4 sm:px-6">
	<div
		class="relative mx-auto max-w-[1200px] overflow-hidden rounded-xl bg-accent px-6 py-16 text-on-accent sm:px-12 sm:py-24"
	>
		<!-- The mark's bars and submit dot, oversized, bleeding off the right edge -->
		<div
			class="pointer-events-none absolute top-1/2 -right-12 hidden w-[34%] max-w-[380px] -translate-y-1/2 lg:block"
			aria-hidden="true"
		>
			<div class="grid gap-5">
				<i class="block h-10 w-full rounded-full bg-on-accent opacity-90"></i>
				<i class="block h-10 w-[70%] rounded-full bg-on-accent opacity-90"></i>
				<div class="flex items-center gap-5">
					<i class="block h-10 w-[36%] rounded-full bg-on-accent opacity-90"></i>
					<i class="block h-10 w-10 rounded-full bg-amber"></i>
				</div>
			</div>
		</div>

		<blockquote class="relative max-w-3xl lg:max-w-[60%]">
			<p
				class="font-display text-[clamp(2rem,5.2vw,3.5rem)] leading-[1.06] font-bold tracking-[-0.03em] text-balance"
			>
				{quote}
			</p>
			{#if attribution}
				<footer class="mt-8 font-mono text-xs font-medium tracking-[0.12em] uppercase">
					{attribution}
				</footer>
			{/if}
		</blockquote>
	</div>
</section>
