<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { AuthShell, Icon } from '$lib/ui';

	let { data } = $props();

	// Errors the SSO callback sends back as ?error=...
	const SSO_ERRORS: Record<string, string> = {
		signup_disabled:
			'There is no Formlite account for this email. Ask the person who runs this Formlite to add you.',
		account_not_linked:
			'Your identity provider did not confirm this email address, so it could not be linked to your account.',
		email_is_missing: 'Your identity provider did not share an email address.',
		access_denied: 'Sign-in was cancelled.',
		oauth_code_verification_failed:
			'The identity provider rejected Formlite. Check the client ID, secret and OIDC_TOKEN_AUTH_METHOD.'
	};

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let ssoLoading = $state(false);
	let setupSuccess = $derived($page.url.searchParams.get('setup') === 'success');
	let ssoError = $derived.by(() => {
		const code = $page.url.searchParams.get('error');
		if (!code) return '';
		return SSO_ERRORS[code] ?? 'Single sign-on failed. Please try again.';
	});

	async function handleSso() {
		if (!data.sso) return;
		error = '';
		ssoLoading = true;

		try {
			const result = await authClient.signIn.oauth2({
				providerId: data.sso.providerId,
				callbackURL: '/',
				errorCallbackURL: '/auth/login'
			});

			if (result.error) {
				error = result.error.message || 'Single sign-on is not available right now';
				ssoLoading = false;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
			ssoLoading = false;
		}
	}

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
				<div>
					<strong>Your account is ready.</strong>
					{#if data.passwordLogin}
						Log in with the email and password you just set.
					{:else}
						Continue with {data.sso?.label} using the email you just set.
					{/if}
				</div>
			</div>
		{/if}

		{#if error || ssoError}
			<div class="fl-alert fl-alert--error" role="alert">
				<Icon name="alert" size={20} class="fl-alert__icon" />
				<div><strong>Couldn't log you in.</strong> {error || ssoError}</div>
			</div>
		{/if}

		{#if data.sso}
			<button
				type="button"
				onclick={handleSso}
				disabled={loading || ssoLoading}
				class="fl-btn fl-btn--block {data.passwordLogin ? 'fl-btn--secondary' : 'fl-btn--primary'}"
			>
				<Icon name="key" />
				{ssoLoading ? 'Redirecting…' : `Continue with ${data.sso.label}`}
			</button>

			{#if data.passwordLogin}
				<div class="flex items-center gap-3 text-sm fl-muted" aria-hidden="true">
					<span class="h-px flex-1 bg-line"></span>
					or with your password
					<span class="h-px flex-1 bg-line"></span>
				</div>
			{/if}
		{/if}

		{#if data.passwordLogin}
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
						disabled={loading || ssoLoading}
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
						disabled={loading || ssoLoading}
						class="fl-input"
					/>
				</div>

				<button type="submit" disabled={loading || ssoLoading} class="fl-btn fl-btn--primary fl-btn--block mt-1">
					{#if loading}
						Logging in…
					{:else}
						Log in
						<Icon name="arrow-right" />
					{/if}
				</button>
			</form>
		{/if}
	</div>
</AuthShell>
