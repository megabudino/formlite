<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AuthShell, Icon } from '$lib/ui';

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

			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Log in — Formlite</title>
</svelte:head>

<AuthShell kicker="Formlite" title="Welcome back">
	<p class="fl-muted mt-1.5">Log in to see your forms and submissions.</p>

	<div class="mt-8 grid gap-5">
		{#if setupSuccess}
			<div class="fl-alert fl-alert--success" role="status">
				<Icon name="check-circle" size={20} class="fl-alert__icon" />
				<div><strong>Your account is ready.</strong> Log in with the email and password you just set.</div>
			</div>
		{/if}

		{#if error}
			<div class="fl-alert fl-alert--error" role="alert">
				<Icon name="alert" size={20} class="fl-alert__icon" />
				<div><strong>Couldn't log you in.</strong> {error}</div>
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="grid gap-5">
			<div class="fl-field">
				<label for="email" class="fl-label">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					placeholder="you@example.com"
					autocomplete="email"
					required
					disabled={loading}
					class="fl-input"
				/>
			</div>

			<div class="fl-field">
				<label for="password" class="fl-label">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					placeholder="Your password"
					autocomplete="current-password"
					required
					disabled={loading}
					class="fl-input"
				/>
			</div>

			<button type="submit" disabled={loading} class="fl-btn fl-btn--primary fl-btn--block mt-1">
				{#if loading}
					Logging in…
				{:else}
					Log in
					<Icon name="arrow-right" />
				{/if}
			</button>
		</form>
	</div>
</AuthShell>
