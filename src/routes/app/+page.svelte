<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data } = $props();

	function handleCreateForm() {
		goto('/app/forms/new');
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Dashboard - Freeform</title>
</svelte:head>

<div class="dashboard">
	<div class="dashboard-header">
		<h1>Your Forms</h1>
		<button class="create-btn" onclick={handleCreateForm}>
			<span class="plus-icon">+</span>
			Create New Form
		</button>
	</div>

	<div class="forms-container">
		{#if data.forms.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📝</div>
				<h2>No forms yet</h2>
				<p>Create your first form to start collecting submissions.</p>
				<button class="create-btn-large" onclick={handleCreateForm}>
					<span class="plus-icon">+</span>
					Create Your First Form
				</button>
			</div>
		{:else}
			<div class="forms-grid">
				{#each data.forms as form}
					<div class="form-card-wrapper">
						<a href="/app/forms/{form.id}" class="form-card">
							<div class="form-card-header">
								<h3 class="form-name">{form.name}</h3>
								<span class="status-badge" class:active={form.is_active === 1} class:inactive={form.is_active === 0}>
									{form.is_active === 1 ? 'Active' : 'Inactive'}
								</span>
							</div>
							<div class="form-card-body">
								<p class="submission-count">
									{form.submission_count === 0 
										? 'No submissions yet' 
										: form.submission_count === 1 
											? '1 submission' 
											: `${form.submission_count} submissions`}
								</p>
								<p class="form-date">Created {formatDate(form.created_at)}</p>
							</div>
						</a>
						<div class="form-card-footer">
							<form method="POST" action="?/toggleActive" use:enhance>
								<input type="hidden" name="formId" value={form.id} />
								<input type="hidden" name="isActive" value={form.is_active === 1 ? '0' : '1'} />
								<label class="toggle-switch">
									<input 
										type="checkbox" 
										checked={form.is_active === 1}
										onchange={(e) => e.currentTarget.form?.requestSubmit()}
									/>
									<span class="toggle-slider"></span>
									<span class="toggle-label">{form.is_active === 1 ? 'Active' : 'Inactive'}</span>
								</label>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.dashboard {
		width: 100%;
	}

	.dashboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.dashboard-header h1 {
		margin: 0;
		font-size: 1.75rem;
		color: #1f2937;
		font-weight: 600;
	}

	.create-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.create-btn:hover {
		background-color: #2563eb;
	}

	.plus-icon {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.forms-container {
		width: 100%;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 4rem 2rem;
		background-color: white;
		border-radius: 12px;
		border: 2px dashed #e5e7eb;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		color: #374151;
		font-weight: 600;
	}

	.empty-state p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
		font-size: 0.9375rem;
	}

	.create-btn-large {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.create-btn-large:hover {
		background-color: #2563eb;
	}

	.forms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.form-card-wrapper {
		background-color: white;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
		overflow: hidden;
		transition: box-shadow 0.2s, border-color 0.2s;
	}

	.form-card-wrapper:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border-color: #d1d5db;
	}

	.form-card {
		display: block;
		padding: 1.5rem;
		text-decoration: none;
		color: inherit;
	}

	.form-card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-name {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		line-height: 1.3;
	}

	.status-badge {
		flex-shrink: 0;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.status-badge.active {
		background-color: #d1fae5;
		color: #065f46;
	}

	.status-badge.inactive {
		background-color: #f3f4f6;
		color: #6b7280;
	}

	.form-card-body {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.submission-count {
		margin: 0;
		font-size: 0.9375rem;
		color: #374151;
	}

	.form-date {
		margin: 0;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	.form-card-footer {
		padding: 0.75rem 1.5rem;
		background-color: #f9fafb;
		border-top: 1px solid #e5e7eb;
	}

	.form-card-footer form {
		margin: 0;
	}

	.toggle-switch {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		user-select: none;
	}

	.toggle-switch input {
		display: none;
	}

	.toggle-slider {
		position: relative;
		width: 44px;
		height: 24px;
		background-color: #d1d5db;
		border-radius: 9999px;
		transition: background-color 0.2s;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background-color: white;
		border-radius: 50%;
		transition: transform 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.toggle-switch input:checked + .toggle-slider {
		background-color: #22c55e;
	}

	.toggle-switch input:checked + .toggle-slider::before {
		transform: translateX(20px);
	}

	.toggle-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	@media (max-width: 640px) {
		.dashboard-header {
			flex-direction: column;
			align-items: stretch;
		}

		.dashboard-header h1 {
			font-size: 1.5rem;
		}

		.create-btn {
			justify-content: center;
		}

		.empty-state {
			padding: 3rem 1.5rem;
		}

		.forms-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
