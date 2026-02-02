<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

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
	<title>Log In - Freeform</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>Welcome Back</h1>
		<p class="subtitle">Log in to your Freeform account</p>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="email">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					placeholder="you@example.com"
					required
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					placeholder="Your password"
					required
					disabled={loading}
				/>
			</div>

			<button type="submit" class="submit-btn" disabled={loading}>
				{loading ? 'Logging in...' : 'Log In'}
			</button>
		</form>

		<p class="auth-link">
			Don't have an account? <a href="/auth/signup">Sign up</a>
		</p>
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background-color: #f5f5f5;
	}

	.auth-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 400px;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin: 0 0 1.5rem 0;
	}

	.error-message {
		background-color: #fee2e2;
		border: 1px solid #ef4444;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
		color: #333;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	input:disabled {
		background-color: #f3f4f6;
		cursor: not-allowed;
	}

	.submit-btn {
		width: 100%;
		padding: 0.75rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		margin-top: 0.5rem;
	}

	.submit-btn:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.submit-btn:disabled {
		background-color: #93c5fd;
		cursor: not-allowed;
	}

	.auth-link {
		text-align: center;
		margin-top: 1.5rem;
		color: #666;
	}

	.auth-link a {
		color: #3b82f6;
		text-decoration: none;
	}

	.auth-link a:hover {
		text-decoration: underline;
	}
</style>
