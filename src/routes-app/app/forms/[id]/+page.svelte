<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	type FormActionData = ActionData & { allowedDomainError?: string };

	type BlockedRequest = {
		id: number;
		origin: string | null;
		reason: string;
		data: Record<string, unknown>;
		createdAt: string;
	};

	type BlockedPagination = {
		page: number;
		totalPages: number;
		totalBlockedRequests: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};

	type FormPageData = PageData & {
		blockedRequests: BlockedRequest[];
		blockedPagination: BlockedPagination;
	};

	let { data, form }: { data: FormPageData; form: FormActionData } = $props();
	let activeTab = $state<'integration' | 'submissions' | 'spam' | 'settings'>('integration');
	let copied = $state(false);
	let redirectUrl = $state(data.form.redirectUrl ?? '');
	let redirectSaving = $state(false);
	let redirectSaved = $state(false);
	let newEmail = $state('');
	let emailSaving = $state(false);
	let newDomain = $state('');
	let domainSaving = $state(false);
	let spamClearing = $state(false);
	let spamCleared = $state(false);
	let newWebhookUrl = $state('');
	let webhookSaving = $state(false);
	let revealedSecrets = $state<Set<string>>(new Set());
	let showDeleteConfirm = $state(false);
	let deleteConfirmName = $state('');
	let expandedSubmissions = $state<Set<number>>(new Set());
	let expandedBlockedRequests = $state<Set<number>>(new Set());

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

	const inputClass =
		'block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30';
	const tabs = [
		{ id: 'integration', label: 'Integration' },
		{ id: 'submissions', label: 'Submissions' },
		{ id: 'spam', label: 'Spam' },
		{ id: 'settings', label: 'Settings' }
	] as const;
</script>

<svelte:head>
	<title>{data.form.name} — Freeform</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6">
	<div>
		{#if data.workspace}
			<a
				href="/app/workspaces/{data.workspace.id}"
				class="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-ink-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-3.5 w-3.5"
				>
					<polyline points="15 18 9 12 15 6" />
				</svg>
				{data.workspace.name}
			</a>
		{:else}
			<a
				href="/app"
				class="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-ink-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-3.5 w-3.5"
				>
					<polyline points="15 18 9 12 15 6" />
				</svg>
				Back to dashboard
			</a>
		{/if}
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{data.form.name}</h1>
			<span
				class="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider {data
					.form.isActive
					? 'bg-mint-100 text-mint-700'
					: 'bg-ink-100 text-ink-500'}"
			>
				{data.form.isActive ? 'Active' : 'Inactive'}
			</span>
		</div>
	</div>

	<nav class="flex gap-1 overflow-x-auto border-b border-ink-200">
		{#each tabs as tab}
			<button
				type="button"
				class="-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition {activeTab ===
				tab.id
					? 'border-mint-500 text-mint-700'
					: 'border-transparent text-ink-500 hover:border-ink-200 hover:text-ink-700'}"
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	<div class="rounded-xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
		{#if activeTab === 'integration'}
			<section>
				<h2 class="text-lg font-semibold text-ink-900">Integration guide</h2>
				<p class="mt-1 text-sm text-ink-500">
					Add this form to your website using the HTML snippet below.
				</p>

				<div class="mt-6">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-medium text-ink-700">HTML form snippet</span>
						<button
							type="button"
							onclick={copyToClipboard}
							class="inline-flex items-center gap-1.5 rounded-md bg-mint-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-mint-600"
						>
							{#if copied}
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
									<polyline points="20 6 9 17 4 12" />
								</svg>
								Copied!
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="h-3.5 w-3.5"
								>
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
								</svg>
								Copy to clipboard
							{/if}
						</button>
					</div>
					<div class="overflow-x-auto rounded-lg bg-ink-900 p-4">
						<pre class="m-0"><code class="font-mono text-[13px] leading-relaxed text-ink-100"
								>{htmlSnippet}</code
							></pre>
					</div>
				</div>

				<div class="mt-8 border-t border-ink-100 pt-6">
					<h3 class="text-base font-semibold text-ink-900">Form endpoint</h3>
					<p class="mt-2">
						<code
							class="inline-block break-all rounded-md bg-ink-100 px-2.5 py-1 font-mono text-sm text-ink-900"
							>{actionUrl}</code
						>
					</p>

					<h3 class="mt-6 text-base font-semibold text-ink-900">How it works</h3>
					<ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-600">
						<li>
							Point your form's <code class="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs text-ink-900">action</code>
							attribute to the endpoint above
						</li>
						<li>
							Use <code class="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs text-ink-900">method="POST"</code>
							for form submission
						</li>
						<li>
							The <code class="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs text-ink-900">_gotcha</code>
							honeypot field helps prevent spam
						</li>
						<li>All form fields will be captured and sent to your target emails</li>
					</ul>
				</div>
			</section>
		{:else if activeTab === 'submissions'}
			<section>
				<h2 class="text-lg font-semibold text-ink-900">Submissions</h2>
				<p class="mt-1 text-sm text-ink-500">
					{#if data.pagination.totalSubmissions > 0}
						{data.pagination.totalSubmissions} submission{data.pagination.totalSubmissions !== 1
							? 's'
							: ''} received.
					{:else}
						View and manage form submissions.
					{/if}
				</p>

				{#if data.submissions.length === 0}
					<div class="py-12 text-center text-sm text-ink-400">No submissions yet.</div>
				{:else}
					<div class="mt-5 flex flex-col gap-2">
						{#each data.submissions as submission}
							{@const dataKeys = Object.keys(submission.data)}
							{@const previewKeys = dataKeys.slice(0, 3)}
							{@const isExpanded = expandedSubmissions.has(submission.id)}
							<div class="overflow-hidden rounded-lg border border-ink-100">
								<button
									type="button"
									class="flex w-full flex-col items-stretch gap-2 bg-ink-50/60 px-4 py-3 text-left transition hover:bg-ink-100/60 sm:flex-row sm:items-center sm:gap-4"
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
									<div class="text-xs text-ink-500 sm:min-w-32">
										{new Date(submission.createdAt).toLocaleString()}
									</div>
									<div class="flex min-w-0 flex-1 flex-wrap gap-2">
										{#each previewKeys as key}
											<span class="flex max-w-[200px] gap-1 text-sm">
												<span class="shrink-0 text-ink-500">{key}:</span>
												<span class="truncate text-ink-800"
													>{String(submission.data[key]).slice(0, 50)}{String(
														submission.data[key]
													).length > 50
														? '…'
														: ''}</span
												>
											</span>
										{/each}
										{#if dataKeys.length > 3}
											<span class="text-xs italic text-ink-400"
												>+{dataKeys.length - 3} more</span
											>
										{/if}
									</div>
									<span class="shrink-0 text-xs text-ink-400">{isExpanded ? '▼' : '▶'}</span>
								</button>

								{#if isExpanded}
									<div class="border-t border-ink-100 bg-white p-4">
										<h4 class="mb-2 text-sm font-semibold text-ink-700">Form data</h4>
										<dl class="grid gap-2">
											{#each Object.entries(submission.data) as [key, value]}
												<div class="flex gap-2 text-sm">
													<dt class="min-w-20 shrink-0 font-medium text-ink-500">{key}</dt>
													<dd class="m-0 break-words text-ink-900">{String(value)}</dd>
												</div>
											{/each}
										</dl>

										{#if Object.keys(submission.meta).length > 0}
											<h4 class="mb-2 mt-4 text-sm font-semibold text-ink-700">Metadata</h4>
											<dl class="grid gap-2">
												{#each Object.entries(submission.meta) as [key, value]}
													<div class="flex gap-2 text-xs">
														<dt class="min-w-20 shrink-0 font-medium text-ink-500">{key}</dt>
														<dd class="m-0 break-words text-ink-500">{String(value)}</dd>
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
						<nav class="mt-6 flex items-center justify-center gap-4 border-t border-ink-100 pt-4">
							{#if data.pagination.hasPrevPage}
								<a
									href="?page={data.pagination.page - 1}"
									class="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
								>
									← Previous
								</a>
							{:else}
								<span
									class="cursor-not-allowed rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-300"
									>← Previous</span
								>
							{/if}
							<span class="text-sm text-ink-500">
								Page {data.pagination.page} of {data.pagination.totalPages}
							</span>
							{#if data.pagination.hasNextPage}
								<a
									href="?page={data.pagination.page + 1}"
									class="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
								>
									Next →
								</a>
							{:else}
								<span
									class="cursor-not-allowed rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-300"
									>Next →</span
								>
							{/if}
						</nav>
					{/if}
				{/if}
			</section>
		{:else if activeTab === 'spam'}
			<section>
				<div class="flex items-start justify-between gap-4">
					<div>
						<h2 class="text-lg font-semibold text-ink-900">Spam</h2>
						<p class="mt-1 text-sm text-ink-500">
							{#if data.blockedPagination.totalBlockedRequests > 0}
								{data.blockedPagination.totalBlockedRequests} blocked request{data
									.blockedPagination.totalBlockedRequests !== 1
									? 's'
									: ''}.
							{:else}
								Review blocked requests for this form.
							{/if}
						</p>
					</div>
					{#if data.blockedPagination.totalBlockedRequests > 0}
						<form
							method="POST"
							action="?/clearBlockedRequests"
							use:enhance={() => {
								spamClearing = true;
								spamCleared = false;
								return async ({ update, result }) => {
									spamClearing = false;
									if (result.type === 'success') {
										spamCleared = true;
										setTimeout(() => {
											spamCleared = false;
										}, 3000);
									}
									await update();
								};
							}}
							class="shrink-0"
						>
							<button
								type="submit"
								disabled={spamClearing}
								onclick={(event) => {
									if (!confirm('Clear all blocked requests?')) {
										event.preventDefault();
									}
								}}
								class="whitespace-nowrap rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{#if spamClearing}
									Clearing…
								{:else if spamCleared}
									✓ Cleared
								{:else}
									Clear all
								{/if}
							</button>
						</form>
					{/if}
				</div>

				{#if data.blockedRequests.length === 0}
					<div class="py-12 text-center text-sm text-ink-400">No blocked requests yet.</div>
				{:else}
					<div class="mt-5 flex flex-col gap-2">
						{#each data.blockedRequests as blocked}
							{@const dataEntries = Object.entries(blocked.data)}
							{@const isExpanded = expandedBlockedRequests.has(blocked.id)}
							<div class="overflow-hidden rounded-lg border border-ink-100">
								<button
									type="button"
									class="flex w-full flex-col items-stretch gap-2 bg-red-50/70 px-4 py-3 text-left transition hover:bg-red-100/60 sm:flex-row sm:items-center sm:gap-4"
									onclick={() => {
										const newSet = new Set(expandedBlockedRequests);
										if (isExpanded) {
											newSet.delete(blocked.id);
										} else {
											newSet.add(blocked.id);
										}
										expandedBlockedRequests = newSet;
									}}
								>
									<div class="text-xs text-ink-500 sm:min-w-32">
										{new Date(blocked.createdAt).toLocaleString()}
									</div>
									<div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
										<span class="break-all text-sm font-medium text-ink-900">
											{blocked.origin ?? 'Unknown origin'}
										</span>
										<span
											class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
										>
											{blocked.reason.replace(/_/g, ' ')}
										</span>
									</div>
									<span class="shrink-0 text-xs text-ink-400">{isExpanded ? '▼' : '▶'}</span>
								</button>

								{#if isExpanded}
									<div class="border-t border-ink-100 bg-white p-4">
										<h4 class="mb-2 text-sm font-semibold text-ink-700">Blocked data</h4>
										{#if dataEntries.length === 0}
											<p class="text-xs italic text-ink-400">No payload captured.</p>
										{:else}
											<dl class="grid gap-2">
												{#each dataEntries as [key, value]}
													<div class="flex gap-2 text-sm">
														<dt class="min-w-20 shrink-0 font-medium text-ink-500">{key}</dt>
														<dd class="m-0 break-words text-ink-900">{String(value)}</dd>
													</div>
												{/each}
											</dl>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>

					{#if data.blockedPagination.totalPages > 1}
						<nav class="mt-6 flex items-center justify-center gap-4 border-t border-ink-100 pt-4">
							{#if data.blockedPagination.hasPrevPage}
								<a
									href="?spam_page={data.blockedPagination.page - 1}"
									class="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
								>
									← Previous
								</a>
							{:else}
								<span
									class="cursor-not-allowed rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-300"
									>← Previous</span
								>
							{/if}
							<span class="text-sm text-ink-500">
								Page {data.blockedPagination.page} of {data.blockedPagination.totalPages}
							</span>
							{#if data.blockedPagination.hasNextPage}
								<a
									href="?spam_page={data.blockedPagination.page + 1}"
									class="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
								>
									Next →
								</a>
							{:else}
								<span
									class="cursor-not-allowed rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-300"
									>Next →</span
								>
							{/if}
						</nav>
					{/if}
				{/if}
			</section>
		{:else if activeTab === 'settings'}
			<section class="space-y-8">
				<div>
					<h2 class="text-lg font-semibold text-ink-900">Form settings</h2>
					<p class="mt-1 text-sm text-ink-500">
						Configure your form behavior and notifications.
					</p>
				</div>

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
								setTimeout(() => {
									redirectSaved = false;
								}, 3000);
							}
							await update();
						};
					}}
					class="border-b border-ink-100 pb-8"
				>
					<label for="redirect_url" class="block text-sm font-semibold text-ink-900">
						Redirect URL
					</label>
					<p class="mt-1 text-xs text-ink-500">
						Where to send users after form submission. Leave empty for the default thank-you page.
					</p>
					<input
						type="url"
						id="redirect_url"
						name="redirect_url"
						bind:value={redirectUrl}
						placeholder="https://example.com/thank-you"
						class={`${inputClass} mt-3`}
					/>
					{#if form?.redirectUrlError}
						<p class="mt-1.5 text-xs text-red-600">{form.redirectUrlError}</p>
					{/if}
					<div class="mt-4">
						<button
							type="submit"
							disabled={redirectSaving}
							class="inline-flex items-center justify-center rounded-md bg-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
						>
							{#if redirectSaving}
								Saving…
							{:else if redirectSaved}
								✓ Saved
							{:else}
								Save redirect URL
							{/if}
						</button>
					</div>
				</form>

				<div class="border-b border-ink-100 pb-8">
					<span class="block text-sm font-semibold text-ink-900">Target emails</span>
					<p class="mt-1 text-xs text-ink-500">
						Submission notifications will be sent to these email addresses.
					</p>

					{#if form?.emailError}
						<p class="mt-2 text-xs text-red-600">{form.emailError}</p>
					{/if}

					<div class="mt-3 flex flex-wrap gap-2">
						{#each data.form.targetEmails as email}
							<div
								class="inline-flex items-center gap-2 rounded-md bg-mint-50 px-2.5 py-1 text-sm text-mint-800 ring-1 ring-inset ring-mint-200"
							>
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
										class="inline"
									>
										<input type="hidden" name="email" value={email} />
										<button
											type="submit"
											title="Remove email"
											class="inline-flex h-5 w-5 items-center justify-center rounded-full text-mint-700 transition hover:bg-red-100 hover:text-red-600"
										>
											×
										</button>
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
						class="mt-4 flex gap-2"
					>
						<input
							type="email"
							name="new_email"
							bind:value={newEmail}
							placeholder="Add email address"
							class={`${inputClass} flex-1`}
						/>
						<button
							type="submit"
							disabled={emailSaving || !newEmail.trim()}
							class="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
						>
							{emailSaving ? 'Adding…' : 'Add email'}
						</button>
					</form>
				</div>

				<div class="border-b border-ink-100 pb-8">
					<span class="block text-sm font-semibold text-ink-900">Allowed domains</span>
					<p class="mt-1 text-xs text-ink-500">
						Restrict submissions to specific origins. Leave empty to allow all origins.
					</p>
					<p class="mt-1 text-xs text-ink-500">
						Supports exact origins, domains, and wildcards. Examples:
						<code class="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-900"
							>example.com</code
						>,
						<code class="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-900"
							>https://example.com</code
						>,
						<code class="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-900"
							>*.example.com</code
						>.
					</p>

					{#if form?.allowedDomainError}
						<p class="mt-2 text-xs text-red-600">{form.allowedDomainError}</p>
					{/if}

					{#if data.form.allowedDomains.length > 0}
						<div class="mt-3 flex flex-wrap gap-2">
							{#each data.form.allowedDomains as domain}
								<div
									class="inline-flex items-center gap-2 rounded-md bg-mint-50 px-2.5 py-1 text-sm text-mint-800 ring-1 ring-inset ring-mint-200"
								>
									<span>{domain}</span>
									<form
										method="POST"
										action="?/removeAllowedDomain"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
											};
										}}
										class="inline"
									>
										<input type="hidden" name="domain" value={domain} />
										<button
											type="submit"
											title="Remove domain"
											class="inline-flex h-5 w-5 items-center justify-center rounded-full text-mint-700 transition hover:bg-red-100 hover:text-red-600"
										>
											×
										</button>
									</form>
								</div>
							{/each}
						</div>
					{:else}
						<p class="mt-3 text-xs italic text-ink-400">No allowed domains configured.</p>
					{/if}

					<form
						method="POST"
						action="?/addAllowedDomain"
						use:enhance={() => {
							domainSaving = true;
							return async ({ update, result }) => {
								domainSaving = false;
								if (result.type === 'success') {
									newDomain = '';
								}
								await update();
							};
						}}
						class="mt-4 flex gap-2"
					>
						<input
							type="text"
							name="new_domain"
							bind:value={newDomain}
							placeholder="Add domain or origin"
							class={`${inputClass} flex-1`}
						/>
						<button
							type="submit"
							disabled={domainSaving || !newDomain.trim()}
							class="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
						>
							{domainSaving ? 'Adding…' : 'Add domain'}
						</button>
					</form>
				</div>

				<div class="border-b border-ink-100 pb-8">
					<span class="block text-sm font-semibold text-ink-900">Webhooks</span>
					<p class="mt-1 text-xs text-ink-500">
						Receive submission data at your own endpoints.
					</p>

					{#if form?.webhookError}
						<p class="mt-2 text-xs text-red-600">{form.webhookError}</p>
					{/if}

					{#if data.webhooks.length > 0}
						<div class="mt-3 flex flex-col gap-2">
							{#each data.webhooks as webhook}
								<div
									class="flex items-start justify-between gap-3 rounded-lg border border-ink-100 bg-ink-50/60 p-3"
								>
									<div class="min-w-0 flex-1">
										<div class="break-all text-sm font-medium text-ink-900">{webhook.url}</div>
										<div class="mt-2 flex flex-wrap items-center gap-2">
											<span class="text-xs text-ink-500">Secret:</span>
											{#if revealedSecrets.has(webhook.id)}
												<code
													class="break-all rounded bg-ink-200 px-2 py-0.5 font-mono text-xs text-ink-900"
													>{webhook.secret}</code
												>
												<button
													type="button"
													onclick={() => {
														const newSet = new Set(revealedSecrets);
														newSet.delete(webhook.id);
														revealedSecrets = newSet;
													}}
													class="rounded border border-ink-200 px-2 py-0.5 text-xs text-ink-600 transition hover:bg-white"
												>
													Hide
												</button>
											{:else}
												<code
													class="rounded bg-ink-200 px-2 py-0.5 font-mono text-xs text-ink-400"
													>••••••••••••••••</code
												>
												<button
													type="button"
													onclick={() => {
														const newSet = new Set(revealedSecrets);
														newSet.add(webhook.id);
														revealedSecrets = newSet;
													}}
													class="rounded border border-ink-200 px-2 py-0.5 text-xs text-ink-600 transition hover:bg-white"
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
										class="shrink-0"
									>
										<input type="hidden" name="webhook_id" value={webhook.id} />
										<button
											type="submit"
											title="Delete webhook"
											class="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
										>
											Delete
										</button>
									</form>
								</div>
							{/each}
						</div>
					{:else}
						<p class="mt-3 text-xs italic text-ink-400">No webhooks configured.</p>
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
						class="mt-4 flex gap-2"
					>
						<input
							type="url"
							name="webhook_url"
							bind:value={newWebhookUrl}
							placeholder="https://example.com/webhook"
							class={`${inputClass} flex-1`}
						/>
						<button
							type="submit"
							disabled={webhookSaving || !newWebhookUrl.trim()}
							class="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
						>
							{webhookSaving ? 'Adding…' : 'Add webhook'}
						</button>
					</form>
				</div>

				<div class="rounded-xl border-2 border-red-100 bg-red-50/40 p-5">
					<span class="block text-sm font-semibold text-red-700">Danger zone</span>
					<p class="mt-1 text-xs text-red-600/80">
						Permanently delete this form and all its data.
					</p>

					{#if !showDeleteConfirm}
						<button
							type="button"
							onclick={() => {
								showDeleteConfirm = true;
							}}
							class="mt-3 inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
						>
							Delete form
						</button>
					{:else}
						<div class="mt-3 rounded-lg border border-red-200 bg-white p-4">
							<p class="text-sm text-red-800">
								This will permanently delete <strong>{data.form.name}</strong> and all its
								submissions and webhooks.
							</p>
							<p class="mt-3 text-sm text-ink-600">
								Type <strong class="text-ink-900">{data.form.name}</strong> to confirm:
							</p>
							<input
								type="text"
								bind:value={deleteConfirmName}
								placeholder="Form name"
								class="mt-2 block w-full rounded-md border border-red-200 bg-white px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300/40"
							/>
							<div class="mt-4 flex gap-2">
								<button
									type="button"
									onclick={() => {
										showDeleteConfirm = false;
										deleteConfirmName = '';
									}}
									class="inline-flex items-center justify-center rounded-md border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
								>
									Cancel
								</button>
								<form method="POST" action="?/deleteForm" use:enhance>
									<button
										type="submit"
										disabled={deleteConfirmName !== data.form.name}
										class="inline-flex items-center justify-center rounded-md bg-red-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
									>
										Delete forever
									</button>
								</form>
							</div>
						</div>
					{/if}
				</div>
			</section>
		{/if}
	</div>
</div>
