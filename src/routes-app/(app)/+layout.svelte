<script lang="ts">
	import type { LayoutData } from './$types';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Brand, Icon, ThemeToggle } from '$lib/ui';
	import { workspaceMenu } from '$lib/ui/workspace-menu.svelte';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
	let loggingOut = $state(false);
	let userMenuOpen = $state(false);
	let userMenu = $state<HTMLElement | null>(null);

	// Close the user menu on a click outside it or on Escape.
	function onWindowClick(e: MouseEvent) {
		if (userMenuOpen && userMenu && !userMenu.contains(e.target as Node)) userMenuOpen = false;
	}
	function onWindowKey(e: KeyboardEvent) {
		if (e.key === 'Escape') userMenuOpen = false;
	}

	// Workspace pages (overview, forms, guide) use the full width with their own sidebar.
	const wide = $derived(
		/^\/\(app\)\/(workspaces\/|forms\/\[id\])/.test($page.route.id ?? '')
	);

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

<svelte:window onclick={onWindowClick} onkeydown={onWindowKey} />

<div class="flex min-h-screen flex-col bg-bg">
	<header class="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
		<div
			class="mx-auto flex h-[68px] items-center justify-between gap-4 px-4 sm:px-6 {wide
				? 'max-w-none'
				: 'max-w-[1200px]'}"
		>
			<div class="flex items-center gap-2">
				{#if workspaceMenu.shells > 0}
					<button
						type="button"
						class="fl-btn fl-btn--ghost fl-btn--icon fl-btn--sm -ml-2 !w-10 min-[900px]:hidden"
						aria-label="Open workspace menu"
						aria-haspopup="dialog"
						aria-expanded={workspaceMenu.open}
						onclick={() => (workspaceMenu.open = true)}
					>
						<Icon name="menu" />
					</button>
				{/if}
				<Brand href="/" />
			</div>
			<div class="flex items-center gap-1 sm:gap-2">
				<ThemeToggle />
				{#if data.user}
					<div class="relative" bind:this={userMenu}>
						<button
							type="button"
							class="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-surface-hover sm:pr-3"
							aria-haspopup="menu"
							aria-expanded={userMenuOpen}
							aria-label="Account menu for {data.user.name}"
							onclick={() => (userMenuOpen = !userMenuOpen)}
						>
							<span
								class="grid h-8 w-8 place-items-center rounded-full bg-accent-tint font-mono text-xs font-medium text-on-accent-tint"
								aria-hidden="true">{initials}</span
							>
							<span class="hidden max-w-40 truncate text-sm font-semibold sm:inline">{data.user.name}</span>
							<Icon
								name="chevron-right"
								size={14}
								class="hidden text-fg-subtle transition-transform sm:block {userMenuOpen ? '-rotate-90' : 'rotate-90'}"
							/>
						</button>
						{#if userMenuOpen}
							<div class="fl-menu" role="menu" aria-label="Account">
								<div class="fl-menu__head">
									<p class="m-0 truncate text-sm font-semibold">{data.user.name}</p>
									<p class="m-0 truncate text-xs text-fg-muted">{data.user.email}</p>
								</div>
								<button type="button" role="menuitem" class="fl-menu__item" onclick={handleLogout} disabled={loggingOut}>
									<Icon name="log-out" size={16} />
									{loggingOut ? 'Logging out…' : 'Log out'}
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</header>

	<main class={wide ? 'w-full flex-1' : 'mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-8 sm:px-6'}>
		{@render children()}
	</main>
</div>
