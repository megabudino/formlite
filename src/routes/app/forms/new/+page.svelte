<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let name = $state(form?.name ?? '');
	let targetEmail = $state(form?.targetEmail ?? data.userEmail);
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Create New Form - Freeform</title>
</svelte:head>

<div class="create-form-page">
	<div class="page-header">
		<a href="/app" class="back-link">← Back to Dashboard</a>
		<h1>Create New Form</h1>
	</div>

	<div class="form-card">
		<form method="POST" onsubmit={() => (submitting = true)}>
			{#if form?.error}
				<div class="error-message">{form.error}</div>
			{/if}

			<div class="form-group">
				<label for="name">Form Name</label>
				<input
					type="text"
					id="name"
					name="name"
					bind:value={name}
					placeholder="e.g., Contact Form, Newsletter Signup"
					required
					maxlength="100"
				/>
			</div>

			<div class="form-group">
				<label for="targetEmail">Target Email</label>
				<input
					type="email"
					id="targetEmail"
					name="targetEmail"
					bind:value={targetEmail}
					placeholder="Where to send submissions"
					required
				/>
				<span class="hint">Submissions will be sent to this email address.</span>
			</div>

			<div class="form-actions">
				<a href="/app" class="cancel-btn">Cancel</a>
				<button type="submit" class="submit-btn" disabled={submitting}>
					{#if submitting}
						Creating...
					{:else}
						Create Form
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.create-form-page {
		max-width: 600px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-block;
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.back-link:hover {
		color: #374151;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.75rem;
		color: #1f2937;
		font-weight: 600;
	}

	.form-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.error-message {
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.hint {
		display: block;
		color: #6b7280;
		font-size: 0.8125rem;
		margin-top: 0.375rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		background-color: white;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.cancel-btn:hover {
		background-color: #f9fafb;
	}

	.submit-btn {
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.form-card {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column-reverse;
		}

		.cancel-btn,
		.submit-btn {
			width: 100%;
			text-align: center;
		}
	}
</style>
