<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let setupSuccess = $derived($page.url.searchParams.get('setup') === 'success');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const result = await authClient.signIn.email({
				email,
				password
			});

			if (result.error) {
				error = result.error.message || 'Invalid email or password';
				loading = false;
				return;
			}

			goto('/app');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Log In — Formlite</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-mint-50/30 to-white p-4"
>
	<div class="w-full max-w-md">
		<a
			href="/"
			class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition hover:text-ink-700"
		>
			<span
				class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-mint-500 text-white"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-3.5 w-3.5"
				>
					<path d="M4 6h16" />
					<path d="M4 12h10" />
					<path d="M4 18h7" />
				</svg>
			</span>
			Formlite
		</a>

		<div class="rounded-2xl border border-ink-100 bg-white p-8 shadow-card">
			<h1 class="text-2xl font-bold tracking-tight text-ink-900">Welcome back</h1>
			<p class="mt-1 text-sm text-ink-500">Log in to your Formlite account</p>

			{#if setupSuccess}
				<div
					class="mt-6 rounded-lg border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-800"
				>
					Account created. Please log in.
				</div>
			{/if}

			{#if error}
				<div
					class="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					{error}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="mt-6 space-y-4">
				<div>
					<label for="email" class="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						placeholder="you@example.com"
						required
						disabled={loading}
						class="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30 disabled:cursor-not-allowed disabled:bg-ink-50"
					/>
				</div>

				<div>
					<label for="password" class="mb-1.5 block text-sm font-medium text-ink-700">
						Password
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="Your password"
						required
						disabled={loading}
						class="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30 disabled:cursor-not-allowed disabled:bg-ink-50"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="inline-flex w-full items-center justify-center rounded-lg bg-mint-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
				>
					{loading ? 'Logging in…' : 'Log in'}
				</button>
			</form>
		</div>
	</div>
</div>
