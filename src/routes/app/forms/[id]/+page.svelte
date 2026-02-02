<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let activeTab = $state<'integration' | 'submissions' | 'settings'>('integration');
	let copied = $state(false);
	let redirectUrl = $state(data.form.redirectUrl ?? '');
	let redirectSaving = $state(false);
	let redirectSaved = $state(false);
	let newEmail = $state('');
	let emailSaving = $state(false);
	let newWebhookUrl = $state('');
	let webhookSaving = $state(false);
	let revealedSecrets = $state<Set<string>>(new Set());
	let showDeleteConfirm = $state(false);
	let deleteConfirmName = $state('');
	let expandedSubmissions = $state<Set<number>>(new Set());

	const actionUrl = $derived(`${$page.url.origin}/s/${data.form.id}`);

	const htmlSnippet = $derived(`<form action="${actionUrl}" method="POST">
  <input type="email" name="email" placeholder="Your email" required>
  <textarea name="message" placeholder="Your message" required></textarea>

  <!-- Honeypot field - do not remove -->
  <input type="text" name="_gotcha" style="display:none">

  <button type="submit">Send</button>
</form>`);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(htmlSnippet);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<svelte:head>
	<title>{data.form.name} - Freeform</title>
</svelte:head>

<div class="form-detail-page">
	<div class="page-header">
		<a href="/app" class="back-link">← Back to Dashboard</a>
		<div class="title-row">
			<h1>{data.form.name}</h1>
			<span class="status-badge" class:active={data.form.isActive}>
				{data.form.isActive ? 'Active' : 'Inactive'}
			</span>
		</div>
	</div>

	<nav class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'integration'}
			onclick={() => (activeTab = 'integration')}
		>
			Integration
		</button>
		<button
			class="tab"
			class:active={activeTab === 'submissions'}
			onclick={() => (activeTab = 'submissions')}
		>
			Submissions
		</button>
		<button
			class="tab"
			class:active={activeTab === 'settings'}
			onclick={() => (activeTab = 'settings')}
		>
			Settings
		</button>
	</nav>

	<div class="tab-content">
		{#if activeTab === 'integration'}
			<div class="section">
				<h2>Integration Guide</h2>
				<p class="section-description">Add this form to your website using the HTML snippet below.</p>
				
				<div class="snippet-header">
					<span class="snippet-label">HTML Form Snippet</span>
					<button class="copy-button" onclick={copyToClipboard}>
						{copied ? '✓ Copied!' : 'Copy to Clipboard'}
					</button>
				</div>
				<div class="code-block">
					<pre><code>{htmlSnippet}</code></pre>
				</div>

				<div class="integration-info">
					<h3>Form Endpoint</h3>
					<p class="endpoint-url"><code>{actionUrl}</code></p>
					
					<h3>How it works</h3>
					<ul>
						<li>Point your form's <code>action</code> attribute to the endpoint above</li>
						<li>Use <code>method="POST"</code> for form submission</li>
						<li>The <code>_gotcha</code> honeypot field helps prevent spam</li>
						<li>All form fields will be captured and sent to your target emails</li>
					</ul>
				</div>
			</div>
		{:else if activeTab === 'submissions'}
			<div class="section">
				<h2>Submissions</h2>
				<p class="section-description">
					{#if data.pagination.totalSubmissions > 0}
						{data.pagination.totalSubmissions} submission{data.pagination.totalSubmissions !== 1 ? 's' : ''} received.
					{:else}
						View and manage form submissions.
					{/if}
				</p>
				
				{#if data.submissions.length === 0}
					<div class="empty-state">
						<p>No submissions yet.</p>
					</div>
				{:else}
					<div class="submissions-list">
						{#each data.submissions as submission}
							{@const dataKeys = Object.keys(submission.data)}
							{@const previewKeys = dataKeys.slice(0, 3)}
							{@const isExpanded = expandedSubmissions.has(submission.id)}
							<div class="submission-item">
								<button 
									class="submission-header"
									onclick={() => {
										const newSet = new Set(expandedSubmissions);
										if (isExpanded) {
											newSet.delete(submission.id);
										} else {
											newSet.add(submission.id);
										}
										expandedSubmissions = newSet;
									}}
								>
									<div class="submission-date">
										{new Date(submission.createdAt).toLocaleString()}
									</div>
									<div class="submission-preview">
										{#each previewKeys as key}
											<span class="preview-field">
												<span class="preview-key">{key}:</span>
												<span class="preview-value">{String(submission.data[key]).slice(0, 50)}{String(submission.data[key]).length > 50 ? '...' : ''}</span>
											</span>
										{/each}
										{#if dataKeys.length > 3}
											<span class="more-fields">+{dataKeys.length - 3} more</span>
										{/if}
									</div>
									<span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
								</button>
								
								{#if isExpanded}
									<div class="submission-details">
										<h4>Form Data</h4>
										<dl class="data-list">
											{#each Object.entries(submission.data) as [key, value]}
												<div class="data-row">
													<dt>{key}</dt>
													<dd>{String(value)}</dd>
												</div>
											{/each}
										</dl>
										
										{#if Object.keys(submission.meta).length > 0}
											<h4>Metadata</h4>
											<dl class="data-list meta-list">
												{#each Object.entries(submission.meta) as [key, value]}
													<div class="data-row">
														<dt>{key}</dt>
														<dd>{String(value)}</dd>
													</div>
												{/each}
											</dl>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
					
					{#if data.pagination.totalPages > 1}
						<nav class="pagination">
							{#if data.pagination.hasPrevPage}
								<a href="?page={data.pagination.page - 1}" class="pagination-btn">← Previous</a>
							{:else}
								<span class="pagination-btn disabled">← Previous</span>
							{/if}
							
							<span class="pagination-info">
								Page {data.pagination.page} of {data.pagination.totalPages}
							</span>
							
							{#if data.pagination.hasNextPage}
								<a href="?page={data.pagination.page + 1}" class="pagination-btn">Next →</a>
							{:else}
								<span class="pagination-btn disabled">Next →</span>
							{/if}
						</nav>
					{/if}
				{/if}
			</div>
		{:else if activeTab === 'settings'}
			<div class="section">
				<h2>Form Settings</h2>
				<p class="section-description">Configure your form behavior and notifications.</p>
				
				<form 
					method="POST" 
					action="?/updateRedirectUrl"
					use:enhance={() => {
						redirectSaving = true;
						redirectSaved = false;
						return async ({ update, result }) => {
							redirectSaving = false;
							if (result.type === 'success') {
								redirectSaved = true;
								setTimeout(() => { redirectSaved = false; }, 3000);
							}
							await update();
						};
					}}
					class="settings-form"
				>
					<div class="settings-group">
						<label class="setting-label" for="redirect_url">
							Redirect URL
						</label>
						<p class="setting-help">Where to send users after form submission. Leave empty for default thank you page.</p>
						<input 
							type="url" 
							id="redirect_url"
							name="redirect_url"
							bind:value={redirectUrl}
							placeholder="https://example.com/thank-you"
						/>
						{#if form?.redirectUrlError}
							<p class="field-error">{form.redirectUrlError}</p>
						{/if}
					</div>
					<div class="settings-actions">
						<button type="submit" class="save-button" disabled={redirectSaving}>
							{#if redirectSaving}
								Saving...
							{:else if redirectSaved}
								✓ Saved
							{:else}
								Save Redirect URL
							{/if}
						</button>
					</div>
				</form>

				<div class="settings-group">
					<span class="setting-label">Target Emails</span>
					<p class="setting-help">Submission notifications will be sent to these email addresses.</p>
					
					{#if form?.emailError}
						<p class="field-error">{form.emailError}</p>
					{/if}

					<div class="email-list">
						{#each data.form.targetEmails as email}
							<div class="email-tag">
								<span>{email}</span>
								{#if data.form.targetEmails.length > 1}
									<form 
										method="POST" 
										action="?/removeEmail"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
											};
										}}
										class="remove-email-form"
									>
										<input type="hidden" name="email" value={email} />
										<button type="submit" class="remove-email-btn" title="Remove email">×</button>
									</form>
								{/if}
							</div>
						{/each}
					</div>

					<form 
						method="POST" 
						action="?/addEmail"
						use:enhance={() => {
							emailSaving = true;
							return async ({ update, result }) => {
								emailSaving = false;
								if (result.type === 'success') {
									newEmail = '';
								}
								await update();
							};
						}}
						class="add-email-form"
					>
						<input 
							type="email" 
							name="new_email"
							bind:value={newEmail}
							placeholder="Add email address"
							class="add-email-input"
						/>
						<button type="submit" class="add-email-btn" disabled={emailSaving || !newEmail.trim()}>
							{emailSaving ? 'Adding...' : 'Add Email'}
						</button>
					</form>
				</div>

				<div class="settings-group webhooks-section">
					<span class="setting-label">Webhooks</span>
					<p class="setting-help">Receive submission data at your own endpoints.</p>
					
					{#if form?.webhookError}
						<p class="field-error">{form.webhookError}</p>
					{/if}

					{#if data.webhooks.length > 0}
						<div class="webhook-list">
							{#each data.webhooks as webhook}
								<div class="webhook-item">
									<div class="webhook-info">
										<div class="webhook-url">{webhook.url}</div>
										<div class="webhook-secret-row">
											<span class="secret-label">Secret:</span>
											{#if revealedSecrets.has(webhook.id)}
												<code class="secret-value">{webhook.secret}</code>
												<button 
													type="button" 
													class="reveal-btn"
													onclick={() => {
														const newSet = new Set(revealedSecrets);
														newSet.delete(webhook.id);
														revealedSecrets = newSet;
													}}
												>
													Hide
												</button>
											{:else}
												<code class="secret-value secret-hidden">••••••••••••••••</code>
												<button 
													type="button" 
													class="reveal-btn"
													onclick={() => {
														const newSet = new Set(revealedSecrets);
														newSet.add(webhook.id);
														revealedSecrets = newSet;
													}}
												>
													Reveal
												</button>
											{/if}
										</div>
									</div>
									<form 
										method="POST" 
										action="?/deleteWebhook"
										use:enhance
										class="delete-webhook-form"
									>
										<input type="hidden" name="webhook_id" value={webhook.id} />
										<button type="submit" class="delete-webhook-btn" title="Delete webhook">
											Delete
										</button>
									</form>
								</div>
							{/each}
						</div>
					{:else}
						<p class="no-webhooks">No webhooks configured.</p>
					{/if}

					<form 
						method="POST" 
						action="?/addWebhook"
						use:enhance={() => {
							webhookSaving = true;
							return async ({ update, result }) => {
								webhookSaving = false;
								if (result.type === 'success') {
									newWebhookUrl = '';
								}
								await update();
							};
						}}
						class="add-webhook-form"
					>
						<input 
							type="url" 
							name="webhook_url"
							bind:value={newWebhookUrl}
							placeholder="https://example.com/webhook"
							class="add-webhook-input"
						/>
						<button type="submit" class="add-webhook-btn" disabled={webhookSaving || !newWebhookUrl.trim()}>
							{webhookSaving ? 'Adding...' : 'Add Webhook'}
						</button>
					</form>
				</div>

				<div class="settings-group danger-zone">
					<span class="setting-label danger-label">Danger Zone</span>
					<p class="setting-help">Permanently delete this form and all its data.</p>
					
					{#if !showDeleteConfirm}
						<button 
							type="button" 
							class="delete-form-btn"
							onclick={() => { showDeleteConfirm = true; }}
						>
							Delete Form
						</button>
					{:else}
						<div class="delete-confirm">
							<p class="confirm-warning">
								This will permanently delete <strong>{data.form.name}</strong> and all its submissions and webhooks.
							</p>
							<p class="confirm-instruction">
								Type <strong>{data.form.name}</strong> to confirm:
							</p>
							<input 
								type="text" 
								bind:value={deleteConfirmName}
								placeholder="Form name"
								class="confirm-input"
							/>
							<div class="confirm-actions">
								<button 
									type="button" 
									class="cancel-delete-btn"
									onclick={() => { showDeleteConfirm = false; deleteConfirmName = ''; }}
								>
									Cancel
								</button>
								<form 
									method="POST" 
									action="?/deleteForm"
									use:enhance
								>
									<button 
										type="submit" 
										class="confirm-delete-btn"
										disabled={deleteConfirmName !== data.form.name}
									>
										Delete Forever
									</button>
								</form>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.form-detail-page {
		max-width: 900px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 1.5rem;
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

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.title-row h1 {
		margin: 0;
		font-size: 1.75rem;
		color: #1f2937;
		font-weight: 600;
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		background-color: #e5e7eb;
		color: #6b7280;
	}

	.status-badge.active {
		background-color: #d1fae5;
		color: #059669;
	}

	.tabs {
		display: flex;
		gap: 0;
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 1.5rem;
	}

	.tab {
		padding: 0.75rem 1.25rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: #6b7280;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.tab:hover {
		color: #374151;
		background-color: #f9fafb;
	}

	.tab.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
	}

	.tab-content {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		color: #1f2937;
		font-weight: 600;
	}

	.section-description {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
		font-size: 0.9375rem;
	}

	.snippet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.snippet-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.copy-button {
		padding: 0.5rem 1rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.copy-button:hover {
		background-color: #2563eb;
	}

	.code-block {
		background-color: #1f2937;
		border-radius: 8px;
		padding: 1rem;
		overflow-x: auto;
	}

	.code-block pre {
		margin: 0;
	}

	.code-block code {
		color: #e5e7eb;
		font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
		font-size: 0.8125rem;
		line-height: 1.6;
		white-space: pre;
	}

	.integration-info {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.integration-info h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
	}

	.integration-info h3:not(:first-child) {
		margin-top: 1.25rem;
	}

	.endpoint-url {
		margin: 0;
	}

	.endpoint-url code {
		display: inline-block;
		background-color: #f3f4f6;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
		font-size: 0.875rem;
		color: #1f2937;
		word-break: break-all;
	}

	.integration-info ul {
		margin: 0;
		padding-left: 1.25rem;
		color: #6b7280;
		font-size: 0.9375rem;
		line-height: 1.75;
	}

	.integration-info li code {
		background-color: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
		font-size: 0.8125rem;
		color: #1f2937;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #9ca3af;
	}

	.empty-state p {
		margin: 0;
	}

	.settings-group {
		margin-bottom: 1.5rem;
	}

	.setting-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.settings-form {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.settings-group input[type="url"] {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9375rem;
		margin-top: 0.375rem;
	}

	.settings-group input[type="url"]:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.setting-help {
		margin: 0.25rem 0 0.5rem 0;
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.field-error {
		margin: 0.375rem 0 0 0;
		font-size: 0.8125rem;
		color: #dc2626;
	}

	.settings-actions {
		margin-top: 1rem;
	}

	.save-button {
		padding: 0.5rem 1rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.save-button:hover:not(:disabled) {
		background-color: #2563eb;
	}

	.save-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.email-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.email-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		background-color: #eff6ff;
		color: #1d4ed8;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.remove-email-form {
		display: inline;
	}

	.remove-email-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		background: none;
		border: none;
		color: #6b7280;
		font-size: 1rem;
		cursor: pointer;
		border-radius: 50%;
		transition: all 0.15s;
	}

	.remove-email-btn:hover {
		background-color: #fee2e2;
		color: #dc2626;
	}

	.add-email-form {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.add-email-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.add-email-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.add-email-btn {
		padding: 0.5rem 1rem;
		background-color: #10b981;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s;
		white-space: nowrap;
	}

	.add-email-btn:hover:not(:disabled) {
		background-color: #059669;
	}

	.add-email-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.webhooks-section {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.webhook-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.webhook-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem;
		background-color: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
	}

	.webhook-info {
		flex: 1;
		min-width: 0;
	}

	.webhook-url {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1f2937;
		word-break: break-all;
	}

	.webhook-secret-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		flex-wrap: wrap;
	}

	.secret-label {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.secret-value {
		font-size: 0.75rem;
		font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
		background-color: #e5e7eb;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		color: #1f2937;
		word-break: break-all;
	}

	.secret-hidden {
		color: #9ca3af;
	}

	.reveal-btn {
		padding: 0.25rem 0.5rem;
		background: none;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}

	.reveal-btn:hover {
		background-color: #f3f4f6;
		color: #374151;
	}

	.delete-webhook-form {
		flex-shrink: 0;
	}

	.delete-webhook-btn {
		padding: 0.375rem 0.75rem;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 4px;
		font-size: 0.75rem;
		color: #dc2626;
		cursor: pointer;
		transition: all 0.15s;
	}

	.delete-webhook-btn:hover {
		background-color: #fee2e2;
		border-color: #f87171;
	}

	.no-webhooks {
		margin: 0.75rem 0 0 0;
		font-size: 0.875rem;
		color: #9ca3af;
		font-style: italic;
	}

	.add-webhook-form {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.add-webhook-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.add-webhook-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.add-webhook-btn {
		padding: 0.5rem 1rem;
		background-color: #8b5cf6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s;
		white-space: nowrap;
	}

	.add-webhook-btn:hover:not(:disabled) {
		background-color: #7c3aed;
	}

	.add-webhook-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.danger-zone {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 2px solid #fecaca;
	}

	.danger-label {
		color: #dc2626;
	}

	.delete-form-btn {
		margin-top: 0.75rem;
		padding: 0.5rem 1rem;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		color: #dc2626;
		cursor: pointer;
		transition: all 0.15s;
	}

	.delete-form-btn:hover {
		background-color: #fee2e2;
		border-color: #f87171;
	}

	.delete-confirm {
		margin-top: 0.75rem;
		padding: 1rem;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
	}

	.confirm-warning {
		margin: 0 0 0.75rem 0;
		color: #991b1b;
		font-size: 0.875rem;
	}

	.confirm-instruction {
		margin: 0 0 0.5rem 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.confirm-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #fecaca;
		border-radius: 6px;
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

	.confirm-input:focus {
		outline: none;
		border-color: #f87171;
		box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.2);
	}

	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}

	.cancel-delete-btn {
		padding: 0.5rem 1rem;
		background-color: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		color: #374151;
		cursor: pointer;
		transition: all 0.15s;
	}

	.cancel-delete-btn:hover {
		background-color: #f9fafb;
	}

	.confirm-delete-btn {
		padding: 0.5rem 1rem;
		background-color: #dc2626;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		cursor: pointer;
		transition: all 0.15s;
	}

	.confirm-delete-btn:hover:not(:disabled) {
		background-color: #b91c1c;
	}

	.confirm-delete-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Submissions styles */
	.submissions-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.submission-item {
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		overflow: hidden;
	}

	.submission-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background-color: #f9fafb;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.submission-header:hover {
		background-color: #f3f4f6;
	}

	.submission-date {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: #6b7280;
		min-width: 130px;
	}

	.submission-preview {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		min-width: 0;
	}

	.preview-field {
		display: inline-flex;
		gap: 0.25rem;
		font-size: 0.875rem;
		max-width: 200px;
		overflow: hidden;
	}

	.preview-key {
		color: #6b7280;
		flex-shrink: 0;
	}

	.preview-value {
		color: #1f2937;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.more-fields {
		font-size: 0.75rem;
		color: #9ca3af;
		font-style: italic;
	}

	.expand-icon {
		flex-shrink: 0;
		color: #9ca3af;
		font-size: 0.75rem;
	}

	.submission-details {
		padding: 1rem;
		border-top: 1px solid #e5e7eb;
		background-color: white;
	}

	.submission-details h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	.submission-details h4:not(:first-child) {
		margin-top: 1rem;
	}

	.data-list {
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}

	.data-row {
		display: flex;
		gap: 0.5rem;
	}

	.data-row dt {
		flex-shrink: 0;
		font-weight: 500;
		color: #6b7280;
		font-size: 0.875rem;
		min-width: 80px;
	}

	.data-row dd {
		margin: 0;
		color: #1f2937;
		font-size: 0.875rem;
		word-break: break-word;
	}

	.meta-list {
		font-size: 0.75rem;
	}

	.meta-list .data-row dt,
	.meta-list .data-row dd {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.pagination-btn {
		padding: 0.5rem 1rem;
		background-color: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		color: #374151;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.15s;
	}

	.pagination-btn:hover:not(.disabled) {
		background-color: #f9fafb;
		border-color: #9ca3af;
	}

	.pagination-btn.disabled {
		color: #9ca3af;
		cursor: not-allowed;
	}

	.pagination-info {
		font-size: 0.875rem;
		color: #6b7280;
	}

	@media (max-width: 640px) {
		.tabs {
			overflow-x: auto;
		}

		.tab {
			padding: 0.625rem 1rem;
			font-size: 0.875rem;
			white-space: nowrap;
		}

		.tab-content {
			padding: 1rem;
		}

		.submission-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.submission-date {
			min-width: auto;
		}

		.expand-icon {
			position: absolute;
			right: 1rem;
			top: 0.75rem;
		}

		.submission-header {
			position: relative;
		}

		.data-row {
			flex-direction: column;
			gap: 0.125rem;
		}

		.data-row dt {
			min-width: auto;
		}
	}
</style>
