<script lang="ts">
	import { enhance } from '$app/forms';

	type FieldErrors = {
		name?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
	};

	type ActionData = {
		error?: string;
		name?: string;
		email?: string;
		fieldErrors?: FieldErrors;
	};

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
	let fieldErrors = $derived(form?.fieldErrors ?? {});
</script>

<svelte:head>
	<title>Initial Setup — Freeform</title>
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
			Freeform
		</a>

		<div class="rounded-2xl border border-ink-100 bg-white p-8 shadow-card">
			<h1 class="text-2xl font-bold tracking-tight text-ink-900">Set up Freeform</h1>
			<p class="mt-1 text-sm text-ink-500">Create your admin account to get started</p>

			{#if form?.error}
				<div
					class="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
				class="mt-6 space-y-4"
			>
				<div>
					<label for="name" class="mb-1.5 block text-sm font-medium text-ink-700">Name</label>
					<input
						type="text"
						id="name"
						name="name"
						value={form?.name ?? ''}
						placeholder="Your name"
						required
						disabled={loading}
						class="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30 disabled:cursor-not-allowed disabled:bg-ink-50"
					/>
					{#if fieldErrors.name}
						<p class="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p>
					{/if}
				</div>

				<div>
					<label for="email" class="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						value={form?.email ?? ''}
						placeholder="you@example.com"
						required
						disabled={loading}
						class="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30 disabled:cursor-not-allowed disabled:bg-ink-50"
					/>
					{#if fieldErrors.email}
						<p class="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
					{/if}
				</div>

				<div>
					<label for="password" class="mb-1.5 block text-sm font-medium text-ink-700">
						Password
					</label>
					<input
						type="password"
						id="password"
						name="password"
						placeholder="Create a password"
						required
						disabled={loading}
						class="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30 disabled:cursor-not-allowed disabled:bg-ink-50"
					/>
					{#if fieldErrors.password}
						<p class="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
					{/if}
				</div>

				<div>
					<label
						for="confirmPassword"
						class="mb-1.5 block text-sm font-medium text-ink-700"
					>
						Confirm password
					</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						placeholder="Repeat your password"
						required
						disabled={loading}
						class="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30 disabled:cursor-not-allowed disabled:bg-ink-50"
					/>
					{#if fieldErrors.confirmPassword}
						<p class="mt-1.5 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={loading}
					class="inline-flex w-full items-center justify-center rounded-lg bg-mint-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
				>
					{loading ? 'Creating account…' : 'Create account'}
				</button>
			</form>
		</div>
	</div>
</div>
