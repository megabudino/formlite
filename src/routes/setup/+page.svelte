<script lang="ts">
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

	let name = $state(form?.name ?? '');
	let email = $state(form?.email ?? '');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let fieldErrors = $state<FieldErrors>(form?.fieldErrors ?? {});

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	function validate() {
		const errors: typeof fieldErrors = {};

		if (!name.trim()) {
			errors.name = 'Name is required';
		}

		if (!email.trim()) {
			errors.email = 'Email is required';
		} else if (!emailPattern.test(email)) {
			errors.email = 'Enter a valid email address';
		}

		if (!password) {
			errors.password = 'Password is required';
		} else if (password.length < 8) {
			errors.password = 'Password must be at least 8 characters';
		}

		if (!confirmPassword) {
			errors.confirmPassword = 'Confirm your password';
		} else if (password !== confirmPassword) {
			errors.confirmPassword = 'Passwords do not match';
		}

		return errors;
	}

	function handleSubmit(event: SubmitEvent) {
		fieldErrors = {};

		const errors = validate();
		if (Object.keys(errors).length > 0) {
			event.preventDefault();
			fieldErrors = errors;
			loading = false;
			return;
		}

		loading = true;
	}
</script>

<svelte:head>
	<title>Initial Setup - Freeform</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<h1>Initial Setup</h1>
		<p class="subtitle">Create your admin account</p>

		{#if form?.error}
			<div class="error-message">{form.error}</div>
		{/if}

		<form method="POST" onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="name">Name</label>
				<input
					type="text"
					id="name"
					name="name"
					bind:value={name}
					placeholder="Your name"
					required
					disabled={loading}
				/>
				{#if fieldErrors.name}
					<p class="field-error">{fieldErrors.name}</p>
				{/if}
			</div>

			<div class="form-group">
				<label for="email">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					bind:value={email}
					placeholder="you@example.com"
					required
					disabled={loading}
				/>
				{#if fieldErrors.email}
					<p class="field-error">{fieldErrors.email}</p>
				{/if}
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					bind:value={password}
					placeholder="Create a password"
					required
					disabled={loading}
				/>
				{#if fieldErrors.password}
					<p class="field-error">{fieldErrors.password}</p>
				{/if}
			</div>

			<div class="form-group">
				<label for="confirmPassword">Confirm Password</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					bind:value={confirmPassword}
					placeholder="Repeat your password"
					required
					disabled={loading}
				/>
				{#if fieldErrors.confirmPassword}
					<p class="field-error">{fieldErrors.confirmPassword}</p>
				{/if}
			</div>

			<button type="submit" class="submit-btn" disabled={loading}>
				{loading ? 'Creating account...' : 'Create account'}
			</button>
		</form>
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
		max-width: 420px;
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

	.field-error {
		margin: 0.5rem 0 0 0;
		color: #dc2626;
		font-size: 0.875rem;
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
</style>
