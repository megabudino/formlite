<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Icon } from '$lib/ui';

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

	type TabId = 'integration' | 'submissions' | 'spam' | 'settings';

	let { data, form }: { data: FormPageData; form: FormActionData } = $props();

	// Open the tab the URL points at, so pagination links don't bounce back to "Integration".
	function initialTab(): TabId {
		const params = $page.url.searchParams;
		const tab = params.get('tab');
		if (tab === 'integration' || tab === 'submissions' || tab === 'spam' || tab === 'settings') {
			return tab;
		}
		if (params.has('spam_page')) return 'spam';
		if (params.has('page')) return 'submissions';
		return 'integration';
	}

	let activeTab = $state<TabId>(initialTab());
	let copied = $state(false);
	let endpointCopied = $state(false);
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
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">

  <button type="submit">Send</button>
</form>`);

	function escapeHtml(s: string) {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	// Minimal HTML highlighter for the snippet: tags in mint, strings in amber, comments dimmed.
	const highlightedSnippet = $derived(
		htmlSnippet.replace(
			/(<!--[\s\S]*?-->)|(<\/?[a-zA-Z]+)|(\/?>)|("[^"]*")|([^<>"]+)/g,
			(_m, comment, tagOpen, tagClose, str, text) => {
				if (comment) return `<span style="opacity:.55">${escapeHtml(comment)}</span>`;
				if (tagOpen) return `<span class="k">${escapeHtml(tagOpen)}</span>`;
				if (tagClose) return `<span class="k">${escapeHtml(tagClose)}</span>`;
				if (str) return `<span class="s">${escapeHtml(str)}</span>`;
				return escapeHtml(text ?? '');
			}
		)
	);

	async function copyText(text: string, which: 'snippet' | 'endpoint') {
		try {
			await navigator.clipboard.writeText(text);
			if (which === 'snippet') {
				copied = true;
				setTimeout(() => (copied = false), 2000);
			} else {
				endpointCopied = true;
				setTimeout(() => (endpointCopied = false), 2000);
			}
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
		const next = new Set(set);
		if (next.has(value)) next.delete(value);
		else next.add(value);
		return next;
	}

	function formatDateTime(dateStr: string) {
		return new Date(dateStr).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function plural(n: number, one: string, many: string) {
		return `${n.toLocaleString()} ${n === 1 ? one : many}`;
	}

	function selectTab(id: TabId) {
		activeTab = id;
		// Keep the tab in the URL without a navigation, so a reload stays here.
		const url = new URL($page.url);
		url.searchParams.set('tab', id);
		history.replaceState(history.state, '', url);
	}

	const tabs = [
		{ id: 'integration', label: 'Integration', icon: 'code' },
		{ id: 'submissions', label: 'Submissions', icon: 'inbox' },
		{ id: 'spam', label: 'Spam', icon: 'shield' },
		{ id: 'settings', label: 'Settings', icon: 'settings' }
	] as const;
</script>

<svelte:head>
	<title>{data.form.name} — Formlite</title>
</svelte:head>

<div class="grid grid-cols-[minmax(0,1fr)] gap-8">
	<!-- Header -->
	<div>
		{#if data.workspace}
			<a href="/app/workspaces/{data.workspace.id}" class="fl-back">
				<Icon name="chevron-left" size={16} />{data.workspace.name}
			</a>
		{:else}
			<a href="/app" class="fl-back"><Icon name="chevron-left" size={16} />All workspaces</a>
		{/if}
		<div class="mt-3 flex flex-wrap items-center gap-3">
			<h1 class="fl-h1 min-w-0 break-words">{data.form.name}</h1>
			<span class="fl-badge {data.form.isActive ? 'fl-badge--live' : 'fl-badge--paused'}">
				{data.form.isActive ? 'Live' : 'Paused'}
			</span>
		</div>
		<p class="fl-muted mt-1.5 text-sm">
			Created {formatDate(data.form.createdAt)}{data.form.isActive
				? ''
				: ' · Not accepting submissions right now'}
		</p>

		<div class="fl-endpoint mt-5 max-w-[720px]">
			<span class="fl-endpoint__verb">POST</span>
			<span class="fl-endpoint__url" title={actionUrl}>{actionUrl}</span>
			<button
				type="button"
				class="fl-btn fl-btn--primary fl-btn--sm"
				onclick={() => copyText(actionUrl, 'endpoint')}
			>
				<Icon name={endpointCopied ? 'check' : 'copy'} size={16} />
				{endpointCopied ? 'Copied' : 'Copy'}
			</button>
		</div>
	</div>

	<!-- Summary -->
	<div class="fl-grid-stats gap-4">
		<button
			type="button"
			class="fl-card fl-card--accent fl-stat cursor-pointer text-left"
			onclick={() => selectTab('submissions')}
		>
			<span class="fl-overline">Submissions · all time</span>
			<span class="fl-stat__value fl-stat__value--xl">
				{data.pagination.totalSubmissions.toLocaleString()}
			</span>
			<span class="fl-delta">
				View inbox <Icon name="arrow-right" size={12} />
			</span>
		</button>
		<button type="button" class="fl-card fl-stat cursor-pointer text-left" onclick={() => selectTab('spam')}>
			<span class="fl-overline">Spam blocked</span>
			<span class="fl-stat__value">{data.blockedPagination.totalBlockedRequests.toLocaleString()}</span>
			<span class="fl-help">Honeypot, origin checks and rate limits</span>
		</button>
		<button
			type="button"
			class="fl-card fl-stat cursor-pointer text-left"
			onclick={() => selectTab('settings')}
		>
			<span class="fl-overline">Delivery</span>
			<span class="fl-stat__value">
				{data.form.targetEmails.length + data.webhooks.length}
			</span>
			<span class="fl-help">
				{plural(data.form.targetEmails.length, 'email', 'emails')} · {plural(
					data.webhooks.length,
					'webhook',
					'webhooks'
				)}
			</span>
		</button>
	</div>

	<!-- Tabs -->
	<div class="grid grid-cols-[minmax(0,1fr)] gap-6">
		<div class="fl-tabs" role="tablist" aria-label="Form sections">
			{#each tabs as tab (tab.id)}
				<button
					type="button"
					role="tab"
					id="tab-{tab.id}"
					aria-selected={activeTab === tab.id}
					aria-controls="panel-{tab.id}"
					class="fl-tab"
					onclick={() => selectTab(tab.id)}
				>
					<Icon name={tab.icon} size={16} />
					{tab.label}
				</button>
			{/each}
		</div>

		<div id="panel-{activeTab}" role="tabpanel" aria-labelledby="tab-{activeTab}">
			{#if activeTab === 'integration'}
				<section class="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
					<div class="fl-card grid content-start gap-5">
						<div>
							<h2 class="fl-h2">Add it to your site</h2>
							<p class="fl-muted mt-1">Paste this snippet, or point your own form at the endpoint.</p>
						</div>
						<div class="fl-codeblock">
							<div class="fl-codeblock__bar">
								<span class="fl-codeblock__name">index.html</span>
								<button
									type="button"
									class="fl-btn fl-btn--sm"
									style="background:var(--brand-mint);color:var(--brand-forest)"
									onclick={() => copyText(htmlSnippet, 'snippet')}
								>
									<Icon name={copied ? 'check' : 'copy'} size={16} />
									{copied ? 'Copied' : 'Copy snippet'}
								</button>
							</div>
							<pre><code>{@html highlightedSnippet}</code></pre>
						</div>
					</div>

					<div class="fl-card grid content-start gap-5">
						<h2 class="fl-h2">How it works</h2>
						<ol class="m-0 grid list-none gap-5 p-0">
							{#each [
								{ t: 'Point the action at your endpoint', d: 'Set the form\'s action attribute to the URL above.' },
								{ t: 'Send it with POST', d: 'Use method="POST". Every named field is captured.' },
								{ t: 'Keep the honeypot', d: 'Leave the hidden _gotcha field empty. Bots fill it and get blocked.' },
								{ t: 'Get notified', d: 'Each submission goes to your emails and webhooks.' }
							] as step, i}
								<li class="flex gap-3">
									<span
										class="grid h-7 w-7 flex-none place-items-center rounded-full bg-accent-tint font-mono text-xs font-medium text-on-accent-tint"
										>{i + 1}</span
									>
									<div>
										<p class="m-0 text-sm font-semibold">{step.t}</p>
										<p class="fl-muted m-0 mt-0.5 text-sm">{step.d}</p>
									</div>
								</li>
							{/each}
						</ol>
					</div>
				</section>
			{:else if activeTab === 'submissions'}
				<section class="fl-card grid gap-5">
					<div>
						<h2 class="fl-h2">Submissions</h2>
						<p class="fl-muted mt-1">
							{#if data.pagination.totalSubmissions > 0}
								{plural(data.pagination.totalSubmissions, 'submission', 'submissions')} received, newest
								first.
							{:else}
								Everything people send through this form shows up here.
							{/if}
						</p>
					</div>

					{#if data.submissions.length === 0}
						<div class="grid place-items-center rounded-md bg-surface-2 px-6 py-12 text-center">
							<span class="fl-card__tile"><Icon name="inbox" /></span>
							<p class="mt-3 font-semibold">No submissions yet</p>
							<p class="fl-muted mt-1 max-w-xs text-sm">
								Send a test from your site, or copy the snippet from the Integration tab.
							</p>
						</div>
					{:else}
						<div class="grid gap-2">
							{#each data.submissions as submission (submission.id)}
								{@const dataKeys = Object.keys(submission.data)}
								{@const previewKeys = dataKeys.slice(0, 3)}
								{@const isExpanded = expandedSubmissions.has(submission.id)}
								<div class="fl-row" data-open={isExpanded}>
									<button
										type="button"
										class="fl-row__head"
										aria-expanded={isExpanded}
										onclick={() => (expandedSubmissions = toggleInSet(expandedSubmissions, submission.id))}
									>
										<span class="fl-row__chev"><Icon name="chevron-right" size={16} /></span>
										<div class="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-5">
											<span class="flex-none font-mono text-xs font-medium text-fg-muted sm:w-40">
												{formatDateTime(submission.createdAt)}
											</span>
											<span class="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1 text-sm">
												{#each previewKeys as key}
													<span class="flex min-w-0 max-w-[240px] gap-1.5">
														<span class="flex-none text-fg-subtle">{key}</span>
														<span class="truncate">{String(submission.data[key])}</span>
													</span>
												{/each}
												{#if dataKeys.length > 3}
													<span class="fl-badge fl-badge--off fl-badge--plain">+{dataKeys.length - 3}</span>
												{/if}
											</span>
										</div>
									</button>

									{#if isExpanded}
										<div class="fl-row__body grid gap-5">
											<div>
												<span class="fl-overline">Form data</span>
												<dl class="fl-dl mt-2">
													{#each Object.entries(submission.data) as [key, value]}
														<dt>{key}</dt>
														<dd>{String(value)}</dd>
													{/each}
												</dl>
											</div>
											{#if Object.keys(submission.meta).length > 0}
												<div>
													<span class="fl-overline">Metadata</span>
													<dl class="fl-dl mt-2 text-fg-muted">
														{#each Object.entries(submission.meta) as [key, value]}
															<dt>{key}</dt>
															<dd class="font-mono !text-[13px]">{String(value)}</dd>
														{/each}
													</dl>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>

						{#if data.pagination.totalPages > 1}
							{@render pager(data.pagination.page, data.pagination.totalPages, data.pagination.hasPrevPage, data.pagination.hasNextPage, 'page')}
						{/if}
					{/if}
				</section>
			{:else if activeTab === 'spam'}
				<section class="fl-card grid gap-5">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h2 class="fl-h2">Spam</h2>
							<p class="fl-muted mt-1">
								{#if data.blockedPagination.totalBlockedRequests > 0}
									{plural(data.blockedPagination.totalBlockedRequests, 'request', 'requests')} blocked.
									They never reached your inbox.
								{:else}
									Requests that fail the honeypot, origin or rate-limit checks land here.
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
							>
								<button
									type="submit"
									disabled={spamClearing}
									onclick={(event) => {
										if (!confirm('Clear all blocked requests?')) {
											event.preventDefault();
										}
									}}
									class="fl-btn fl-btn--danger-soft fl-btn--sm"
								>
									<Icon name="trash" size={16} />
									{#if spamClearing}
										Clearing…
									{:else}
										Clear spam
									{/if}
								</button>
							</form>
						{/if}
					</div>

					{#if spamCleared}
						<div class="fl-alert fl-alert--success" role="status">
							<Icon name="check-circle" size={20} class="fl-alert__icon" />
							<div><strong>Spam cleared.</strong> New blocked requests will show up here.</div>
						</div>
					{/if}

					{#if data.blockedRequests.length === 0}
						<div class="grid place-items-center rounded-md bg-surface-2 px-6 py-12 text-center">
							<span class="fl-card__tile"><Icon name="shield" /></span>
							<p class="mt-3 font-semibold">No blocked requests</p>
							<p class="fl-muted mt-1 max-w-xs text-sm">Nothing suspicious so far.</p>
						</div>
					{:else}
						<div class="grid gap-2">
							{#each data.blockedRequests as blocked (blocked.id)}
								{@const dataEntries = Object.entries(blocked.data)}
								{@const isExpanded = expandedBlockedRequests.has(blocked.id)}
								<div class="fl-row" data-open={isExpanded}>
									<button
										type="button"
										class="fl-row__head"
										aria-expanded={isExpanded}
										onclick={() => (expandedBlockedRequests = toggleInSet(expandedBlockedRequests, blocked.id))}
									>
										<span class="fl-row__chev"><Icon name="chevron-right" size={16} /></span>
										<div class="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-5">
											<span class="flex-none font-mono text-xs font-medium text-fg-muted sm:w-40">
												{formatDateTime(blocked.createdAt)}
											</span>
											<span class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
												<span class="min-w-0 truncate font-mono text-[13px]">
													{blocked.origin ?? 'Unknown origin'}
												</span>
												<span class="fl-badge fl-badge--spam">
													{blocked.reason.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())}
												</span>
											</span>
										</div>
									</button>

									{#if isExpanded}
										<div class="fl-row__body">
											<span class="fl-overline">Blocked payload</span>
											{#if dataEntries.length === 0}
												<p class="fl-subtle mt-2 text-sm">No payload captured.</p>
											{:else}
												<dl class="fl-dl mt-2">
													{#each dataEntries as [key, value]}
														<dt>{key}</dt>
														<dd>{String(value)}</dd>
													{/each}
												</dl>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>

						{#if data.blockedPagination.totalPages > 1}
							{@render pager(data.blockedPagination.page, data.blockedPagination.totalPages, data.blockedPagination.hasPrevPage, data.blockedPagination.hasNextPage, 'spam_page')}
						{/if}
					{/if}
				</section>
			{:else if activeTab === 'settings'}
				<section class="grid gap-4">
					<div class="fl-card">
						<!-- Redirect -->
						<div class="fl-setting">
							<div>
								<h2 class="fl-h3">Redirect after submit</h2>
								<p class="fl-muted mt-1 text-sm">
									Where people land after sending the form. Leave empty for the built-in thank-you page.
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
										await update({ reset: false });
									};
								}}
								class="fl-field"
							>
								<label for="redirect_url" class="fl-label">Redirect URL</label>
								<div class="flex flex-col gap-2 sm:flex-row">
									<input
										type="url"
										id="redirect_url"
										name="redirect_url"
										bind:value={redirectUrl}
										placeholder="https://example.com/thank-you"
										class="fl-input fl-input--mono sm:flex-1"
										class:fl-input--error={form?.redirectUrlError}
									/>
									<button type="submit" disabled={redirectSaving} class="fl-btn fl-btn--secondary">
										{#if redirectSaving}
											Saving…
										{:else if redirectSaved}
											<Icon name="check" size={16} /> Saved
										{:else}
											Save
										{/if}
									</button>
								</div>
								{#if form?.redirectUrlError}
									<span class="fl-error"><Icon name="alert" size={14} />{form.redirectUrlError}</span>
								{/if}
							</form>
						</div>

						<!-- Emails -->
						<div class="fl-setting">
							<div>
								<h2 class="fl-h3">Email notifications</h2>
								<p class="fl-muted mt-1 text-sm">Every submission is sent to these addresses.</p>
							</div>
							<div class="grid gap-3">
								<div class="flex flex-wrap gap-2">
									{#each data.form.targetEmails as email (email)}
										<span class="fl-chip">
											<Icon name="mail" size={14} class="text-fg-subtle" />
											<span class="break-all">{email}</span>
											{#if data.form.targetEmails.length > 1}
												<form method="POST" action="?/removeEmail" use:enhance class="contents">
													<input type="hidden" name="email" value={email} />
													<button type="submit" class="fl-chip__x" aria-label="Remove {email}">
														<Icon name="x" size={12} />
													</button>
												</form>
											{:else}
												<span class="w-1.5"></span>
											{/if}
										</span>
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
									class="fl-field"
								>
									<label for="new_email" class="sr-only">Add an email address</label>
									<div class="flex flex-col gap-2 sm:flex-row">
										<input
											type="email"
											id="new_email"
											name="new_email"
											bind:value={newEmail}
											placeholder="team@example.com"
											class="fl-input sm:flex-1"
											class:fl-input--error={form?.emailError}
										/>
										<button
											type="submit"
											disabled={emailSaving || !newEmail.trim()}
											class="fl-btn fl-btn--secondary"
										>
											<Icon name="plus" size={16} />
											{emailSaving ? 'Adding…' : 'Add email'}
										</button>
									</div>
									{#if form?.emailError}
										<span class="fl-error"><Icon name="alert" size={14} />{form.emailError}</span>
									{/if}
								</form>
							</div>
						</div>

						<!-- Domains -->
						<div class="fl-setting">
							<div>
								<h2 class="fl-h3">Allowed domains</h2>
								<p class="fl-muted mt-1 text-sm">
									Only accept submissions from these sites. Leave empty to accept from anywhere.
								</p>
							</div>
							<div class="grid gap-3">
								{#if data.form.allowedDomains.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each data.form.allowedDomains as domain (domain)}
											<span class="fl-chip fl-chip--mono">
												<Icon name="globe" size={14} class="text-fg-subtle" />
												<span class="break-all">{domain}</span>
												<form method="POST" action="?/removeAllowedDomain" use:enhance class="contents">
													<input type="hidden" name="domain" value={domain} />
													<button type="submit" class="fl-chip__x" aria-label="Remove {domain}">
														<Icon name="x" size={12} />
													</button>
												</form>
											</span>
										{/each}
									</div>
								{:else}
									<p class="m-0 text-sm text-fg-subtle">All origins are accepted.</p>
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
									class="fl-field"
								>
									<label for="new_domain" class="sr-only">Add a domain or origin</label>
									<div class="flex flex-col gap-2 sm:flex-row">
										<input
											type="text"
											id="new_domain"
											name="new_domain"
											bind:value={newDomain}
											placeholder="example.com"
											class="fl-input fl-input--mono sm:flex-1"
											class:fl-input--error={form?.allowedDomainError}
										/>
										<button
											type="submit"
											disabled={domainSaving || !newDomain.trim()}
											class="fl-btn fl-btn--secondary"
										>
											<Icon name="plus" size={16} />
											{domainSaving ? 'Adding…' : 'Add domain'}
										</button>
									</div>
									{#if form?.allowedDomainError}
										<span class="fl-error"><Icon name="alert" size={14} />{form.allowedDomainError}</span>
									{:else}
										<span class="fl-help">
											Use <code class="fl-code">example.com</code>,
											<code class="fl-code">https://example.com</code> or
											<code class="fl-code">*.example.com</code>. A domain also covers its www. variant;
											wildcards match subdomains only.
										</span>
									{/if}
								</form>
							</div>
						</div>

						<!-- Webhooks -->
						<div class="fl-setting">
							<div>
								<h2 class="fl-h3">Webhooks</h2>
								<p class="fl-muted mt-1 text-sm">
									We POST each submission as JSON to these URLs, signed with the secret.
								</p>
							</div>
							<div class="grid gap-3">
								{#if data.webhooks.length > 0}
									<div class="grid gap-2">
										{#each data.webhooks as webhook (webhook.id)}
											{@const revealed = revealedSecrets.has(webhook.id)}
											<div class="flex items-start gap-3 rounded-md bg-surface-2 p-4">
												<span
													class="grid h-9 w-9 flex-none place-items-center rounded-sm bg-surface text-fg-muted"
													><Icon name="webhook" size={16} /></span
												>
												<div class="min-w-0 flex-1">
													<div class="break-all font-mono text-[13px] font-medium">{webhook.url}</div>
													<div class="mt-2 flex flex-wrap items-center gap-2">
														<span class="text-xs font-semibold text-fg-muted">Secret</span>
														<code class="fl-code break-all !bg-surface !text-xs">
															{revealed ? webhook.secret : '••••••••••••••••'}
														</code>
														<button
															type="button"
															class="fl-btn fl-btn--ghost fl-btn--sm !h-7 !px-2.5 !text-xs"
															onclick={() => (revealedSecrets = toggleInSet(revealedSecrets, webhook.id))}
														>
															<Icon name={revealed ? 'eye-off' : 'eye'} size={14} />
															{revealed ? 'Hide' : 'Reveal'}
														</button>
													</div>
												</div>
												<form method="POST" action="?/deleteWebhook" use:enhance class="flex-none">
													<input type="hidden" name="webhook_id" value={webhook.id} />
													<button
														type="submit"
														class="fl-btn fl-btn--ghost fl-btn--sm fl-btn--icon !w-9 hover:!bg-danger-tint hover:!text-on-danger-tint"
														aria-label="Delete webhook {webhook.url}"
														title="Delete webhook"
													>
														<Icon name="trash" size={16} />
													</button>
												</form>
											</div>
										{/each}
									</div>
								{:else}
									<p class="m-0 text-sm text-fg-subtle">No webhooks yet.</p>
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
									class="fl-field"
								>
									<label for="webhook_url" class="sr-only">Webhook URL</label>
									<div class="flex flex-col gap-2 sm:flex-row">
										<input
											type="url"
											id="webhook_url"
											name="webhook_url"
											bind:value={newWebhookUrl}
											placeholder="https://example.com/webhook"
											class="fl-input fl-input--mono sm:flex-1"
											class:fl-input--error={form?.webhookError}
										/>
										<button
											type="submit"
											disabled={webhookSaving || !newWebhookUrl.trim()}
											class="fl-btn fl-btn--secondary"
										>
											<Icon name="plus" size={16} />
											{webhookSaving ? 'Adding…' : 'Add webhook'}
										</button>
									</div>
									{#if form?.webhookError}
										<span class="fl-error"><Icon name="alert" size={14} />{form.webhookError}</span>
									{/if}
								</form>
							</div>
						</div>
					</div>

					<!-- Danger zone -->
					<div class="fl-card !border-danger-tint">
						<div class="fl-setting">
							<div>
								<h2 class="fl-h3 text-danger">Delete this form</h2>
								<p class="fl-muted mt-1 text-sm">
									Removes the form, every submission and its webhooks. This can't be undone.
								</p>
							</div>
							<div>
								{#if !showDeleteConfirm}
									<button
										type="button"
										onclick={() => (showDeleteConfirm = true)}
										class="fl-btn fl-btn--danger-soft"
									>
										<Icon name="trash" size={16} />
										Delete form
									</button>
								{:else}
									<div class="grid gap-4 rounded-md bg-danger-tint p-4 text-on-danger-tint">
										<p class="m-0 text-sm">
											<strong>This deletes {data.form.name} for good.</strong>
											Type its name to confirm.
										</p>
										<input
											type="text"
											bind:value={deleteConfirmName}
											placeholder={data.form.name}
											aria-label="Type the form name to confirm"
											class="fl-input"
										/>
										<div class="flex flex-wrap gap-2">
											<form method="POST" action="?/deleteForm" use:enhance>
												<button
													type="submit"
													disabled={deleteConfirmName !== data.form.name}
													class="fl-btn fl-btn--danger"
												>
													Delete forever
												</button>
											</form>
											<button
												type="button"
												onclick={() => {
													showDeleteConfirm = false;
													deleteConfirmName = '';
												}}
												class="fl-btn fl-btn--secondary"
											>
												Cancel
											</button>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>

{#snippet pager(current: number, total: number, hasPrev: boolean, hasNext: boolean, param: string)}
	<nav class="flex items-center justify-between gap-4 border-t border-line pt-5" aria-label="Pagination">
		{#if hasPrev}
			<a href="?{param}={current - 1}" class="fl-btn fl-btn--secondary fl-btn--sm">
				<Icon name="chevron-left" size={16} />Previous
			</a>
		{:else}
			<span class="fl-btn fl-btn--secondary fl-btn--sm opacity-45" aria-disabled="true">
				<Icon name="chevron-left" size={16} />Previous
			</span>
		{/if}
		<span class="font-mono text-xs text-fg-muted">Page {current} of {total}</span>
		{#if hasNext}
			<a href="?{param}={current + 1}" class="fl-btn fl-btn--secondary fl-btn--sm">
				Next<Icon name="chevron-right" size={16} />
			</a>
		{:else}
			<span class="fl-btn fl-btn--secondary fl-btn--sm opacity-45" aria-disabled="true">
				Next<Icon name="chevron-right" size={16} />
			</span>
		{/if}
	</nav>
{/snippet}
