<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	function validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		// Validation
		if (!name.trim()) {
			error = 'Name is required';
			return;
		}

		if (!validateEmail(email)) {
			error = 'Please enter a valid email address';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;

		try {
			const result = await authClient.signUp.email({
				email,
				password,
				name
			});

			if (result.error) {
				error = result.error.message || 'Registration failed';
				loading = false;
				return;
			}

			// Automatically log in after registration
			const loginResult = await authClient.signIn.email({
				email,
				password
			});

			if (loginResult.error) {
				error = loginResult.error.message || 'Auto-login failed';
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
	<title>Sign Up - Freeform</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>Create Account</h1>
		<p class="subtitle">Sign up to start using Freeform</p>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="name">Name</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					placeholder="Your name"
					required
					disabled={loading}
				/>
			</div>

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
					placeholder="At least 8 characters"
					required
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="confirmPassword">Confirm Password</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					placeholder="Confirm your password"
					required
					disabled={loading}
				/>
			</div>

			<button type="submit" class="submit-btn" disabled={loading}>
				{loading ? 'Creating account...' : 'Create Account'}
			</button>
		</form>

		<p class="auth-link">
			Already have an account? <a href="/auth/login">Log in</a>
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
