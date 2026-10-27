<script lang="ts">
	import type { Snippet } from 'svelte';
	import Brand from './Brand.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	// Split screen for login and setup: a forest slab with the mark's bars on wide screens,
	// the form card on the right. On phones only the form shows.
	let { children, kicker, title }: { children: Snippet; kicker: string; title: string } = $props();
</script>

<div class="grid min-h-screen bg-bg lg:grid-cols-[1fr_minmax(480px,1fr)]">
	<aside
		class="relative hidden overflow-hidden bg-inverse p-12 text-on-inverse lg:flex lg:flex-col lg:justify-between"
		aria-hidden="true"
	>
		<div class="flex items-center gap-3 font-display text-xl font-extrabold tracking-[-0.03em] text-[#e4f6ec]">
			<svg viewBox="0 0 128 128" width="36" height="36">
				<rect width="128" height="128" rx="32" fill="var(--brand-mint)" />
				<g fill="var(--brand-forest)">
					<rect x="32" y="32" width="64" height="16" rx="8" />
					<rect x="32" y="56" width="46" height="16" rx="8" />
					<rect x="32" y="80" width="24" height="16" rx="8" />
					<circle cx="74" cy="88" r="8" />
				</g>
			</svg>
			Formlite
		</div>

		<!-- The mark's bars, blown up as decoration -->
		<div class="pointer-events-none absolute -right-16 top-1/2 w-[440px] -translate-y-1/2">
			<div class="absolute -inset-10 rounded-[56px] bg-brand-mint opacity-[.08]"></div>
			<div class="relative grid gap-6">
				<i class="block h-14 w-full rounded-full bg-brand-mint"></i>
				<i class="block h-14 w-[72%] rounded-full bg-brand-mint opacity-80"></i>
				<div class="flex items-center gap-6">
					<i class="block h-14 w-[36%] rounded-full bg-amber"></i>
					<i class="block h-14 w-14 rounded-full bg-brand-mint"></i>
				</div>
			</div>
		</div>

		<div class="relative max-w-sm">
			<p class="m-0 font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#e4f6ec]">
				The form backend <span class="text-brand-mint">you actually own.</span>
			</p>
			<p class="mt-4 text-[15px] text-[#a3c2b3]">
				Point an HTML form at an endpoint. Get submissions by email and webhook. Keep the data on your
				server.
			</p>
		</div>
	</aside>

	<main class="flex flex-col px-4 py-6 sm:px-8">
		<div class="flex items-center justify-between">
			<span class="lg:hidden"><Brand href="/" /></span>
			<span class="ml-auto"><ThemeToggle /></span>
		</div>
		<div class="flex flex-1 items-center justify-center py-10">
			<div class="w-full max-w-[420px]">
				<span class="fl-overline">{kicker}</span>
				<h1 class="fl-h1 mt-1.5">{title}</h1>
				{@render children()}
			</div>
		</div>
	</main>
</div>
