<script lang="ts">
	import type { LayoutData } from './$types';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Brand, Icon, ThemeToggle } from '$lib/ui';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
	let loggingOut = $state(false);

	const initials = $derived(
		(data.user?.name || data.user?.email || '?')
			.split(/\s+/)
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);

	async function handleLogout() {
		loggingOut = true;
		try {
			await authClient.signOut();
			goto('/auth/login');
		} catch (err) {
			console.error('Logout failed:', err);
			loggingOut = false;
		}
	}
</script>

<div class="flex min-h-screen flex-col bg-bg">
	<header class="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
		<div class="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
			<Brand href="/" />
			<div class="flex items-center gap-1 sm:gap-2">
				<ThemeToggle />
				{#if data.user}
					<div class="hidden items-center gap-2.5 pl-2 pr-1 sm:flex" title={data.user.email}>
						<span
							class="grid h-8 w-8 place-items-center rounded-full bg-accent-tint font-mono text-xs font-medium text-on-accent-tint"
							aria-hidden="true">{initials}</span
						>
						<span class="max-w-40 truncate text-sm font-semibold">{data.user.name}</span>
					</div>
				{/if}
				<button
					type="button"
					onclick={handleLogout}
					disabled={loggingOut}
					aria-label="Log out"
					class="fl-btn fl-btn--ghost fl-btn--sm"
				>
					<Icon name="log-out" size={16} />
					<span class="hidden sm:inline">{loggingOut ? 'Logging out…' : 'Log out'}</span>
				</button>
			</div>
		</div>
	</header>

	<main class="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-8 sm:px-6">
		{@render children()}
	</main>
</div>
