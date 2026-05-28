<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let { children } = $props();
	let loggingOut = $state(false);

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

<div class="flex min-h-screen flex-col bg-ink-50">
	<header class="sticky top-0 z-20 border-b border-ink-100 bg-white/85 backdrop-blur">
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
			<a
				href="/app"
				class="flex items-center gap-2 text-base font-semibold tracking-tight text-ink-900"
			>
				<span
					class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500 text-white shadow-sm"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-4 w-4"
					>
						<path d="M4 6h16" />
						<path d="M4 12h10" />
						<path d="M4 18h7" />
					</svg>
				</span>
				Formlite
			</a>
			<button
				type="button"
				onclick={handleLogout}
				disabled={loggingOut}
				class="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 transition hover:border-ink-300 hover:bg-ink-50 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loggingOut ? 'Logging out…' : 'Log out'}
			</button>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
		{@render children()}
	</main>
</div>
