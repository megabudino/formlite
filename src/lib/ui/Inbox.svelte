<script lang="ts" module>
	export interface InboxItem {
		id: number;
		createdAt: string;
		data: Record<string, unknown>;
		meta?: Record<string, unknown>;
		/** Blocked requests only */
		origin?: string | null;
		reason?: string | null;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import Icon from './Icon.svelte';
	import { parseUtc, reasonLabel } from '$lib/stats';

	// Inbox-style list of submissions (or blocked requests): select, read, delete.
	let {
		items,
		kind,
		total,
		formName,
		deleteAction,
		empty,
		toolbar,
		pager
	}: {
		items: InboxItem[];
		kind: 'submission' | 'blocked';
		total: number;
		formName: string;
		deleteAction: string;
		empty: Snippet;
		toolbar?: Snippet;
		pager?: Snippet;
	} = $props();

	const noun = $derived(kind === 'submission' ? ['submission', 'submissions'] : ['request', 'requests']);

	let selected = $state<Set<number>>(new Set());
	let activeId = $state<number | null>(null);
	let lastClicked = $state<number | null>(null);
	let pendingIds = $state<number[]>([]);
	let deleting = $state(false);
	let notice = $state<string | null>(null);
	let copied = $state(false);
	let confirmDialog = $state<HTMLDialogElement | null>(null);
	let detailDialog = $state<HTMLDialogElement | null>(null);

	// Forget selections and the open item when the page of items changes (pagination, deletes).
	$effect(() => {
		const ids = new Set(items.map((i) => i.id));
		const kept = [...selected].filter((id) => ids.has(id));
		if (kept.length !== selected.size) selected = new Set(kept);
		if (activeId === null || !ids.has(activeId)) activeId = items[0]?.id ?? null;
	});

	const active = $derived(items.find((i) => i.id === activeId) ?? null);
	const allSelected = $derived(items.length > 0 && selected.size === items.length);
	const someSelected = $derived(selected.size > 0 && !allSelected);

	function plural(n: number) {
		return `${n.toLocaleString()} ${n === 1 ? noun[0] : noun[1]}`;
	}

	function str(v: unknown) {
		return typeof v === 'string' ? v.trim() : v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
	}

	function emailOf(item: InboxItem): string | null {
		for (const k of ['reply_to', 'email', '_replyto']) {
			const v = str(item.data[k]);
			if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return v;
		}
		return null;
	}

	function titleOf(item: InboxItem) {
		if (kind === 'blocked') return item.origin || 'Unknown origin';
		const name = str(item.data.name);
		return name || emailOf(item) || str(Object.values(item.data)[0]) || `Submission #${item.id}`;
	}

	function previewOf(item: InboxItem) {
		const title = titleOf(item);
		const preferred = ['message', 'comment', 'body', 'text', 'subject'];
		for (const k of preferred) {
			const v = str(item.data[k]);
			if (v) return v;
		}
		const rest = Object.entries(item.data)
			.map(([k, v]) => [k, str(v)] as const)
			.filter(([, v]) => v && v !== title);
		return rest.length ? rest.map(([k, v]) => `${k}: ${v}`).join(' · ') : kind === 'blocked' ? 'No payload captured' : 'No other fields';
	}

	function initial(item: InboxItem) {
		return (titleOf(item).replace(/^https?:\/\//, '')[0] ?? '?').toUpperCase();
	}

	function shortTime(value: string) {
		const d = parseUtc(value);
		const now = new Date();
		if (d.toDateString() === now.toDateString()) {
			return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
		}
		const sameYear = d.getFullYear() === now.getFullYear();
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
	}

	function fullTime(value: string) {
		return parseUtc(value).toLocaleString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function toggle(id: number, index: number, shift: boolean) {
		const next = new Set(selected);
		const on = !next.has(id);
		if (shift && lastClicked !== null) {
			// Shift-click selects (or clears) the whole range since the last click
			const from = items.findIndex((i) => i.id === lastClicked);
			const [a, b] = from < index ? [from, index] : [index, from];
			for (const it of items.slice(a, b + 1)) on ? next.add(it.id) : next.delete(it.id);
		} else {
			on ? next.add(id) : next.delete(id);
		}
		lastClicked = id;
		selected = next;
	}

	function toggleAll() {
		selected = allSelected ? new Set() : new Set(items.map((i) => i.id));
	}

	function open(id: number) {
		activeId = id;
		copied = false;
		if (!matchMedia('(min-width: 1024px)').matches) detailDialog?.showModal();
	}

	function askDelete(ids: number[]) {
		pendingIds = ids;
		confirmDialog?.showModal();
	}

	async function copyJson(item: InboxItem) {
		try {
			await navigator.clipboard.writeText(
				JSON.stringify({ id: item.id, created_at: item.createdAt, data: item.data, meta: item.meta ?? {} }, null, 2)
			);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<section class="fl-card fl-inbox">
	<!-- Toolbar -->
	<div class="fl-inbox__bar" data-selecting={selected.size > 0}>
		<label class="flex items-center gap-3">
			<input
				type="checkbox"
				class="fl-check"
				checked={allSelected}
				indeterminate={someSelected}
				disabled={items.length === 0}
				onchange={toggleAll}
				aria-label={allSelected ? 'Clear selection' : `Select all ${plural(items.length)} on this page`}
			/>
			{#if selected.size > 0}
				<span class="text-sm font-semibold">{selected.size} selected</span>
			{:else}
				<span class="text-sm text-fg-muted">
					{total > 0 ? plural(total) : `No ${noun[1]}`}
				</span>
			{/if}
		</label>
		<div class="flex items-center gap-2">
			{#if selected.size > 0}
				<button type="button" class="fl-btn fl-btn--ghost fl-btn--sm" onclick={() => (selected = new Set())}>
					Cancel
				</button>
				<button type="button" class="fl-btn fl-btn--danger-soft fl-btn--sm" onclick={() => askDelete([...selected])}>
					<Icon name="trash" size={16} />
					Delete {selected.size}
				</button>
			{:else if toolbar}
				{@render toolbar()}
			{/if}
		</div>
	</div>

	{#if notice}
		<div class="fl-alert fl-alert--success mx-4 mt-4" role="status">
			<Icon name="check-circle" size={20} class="fl-alert__icon" />
			<div class="flex-1"><strong>{notice}</strong></div>
			<button type="button" class="opacity-70 hover:opacity-100" aria-label="Dismiss" onclick={() => (notice = null)}>
				<Icon name="x" size={16} />
			</button>
		</div>
	{/if}

	{#if items.length === 0}
		<div class="p-4">{@render empty()}</div>
	{:else}
		<div class="fl-inbox__body">
			<!-- List -->
			<ul class="fl-inbox__list" aria-label="{noun[1]} list">
				{#each items as item, index (item.id)}
					{@const isSelected = selected.has(item.id)}
					<li class="fl-msg" data-active={item.id === activeId} data-selected={isSelected}>
						<input
							type="checkbox"
							class="fl-check"
							checked={isSelected}
							onclick={(e) => toggle(item.id, index, e.shiftKey)}
							aria-label="Select {titleOf(item)}"
						/>
						<button type="button" class="fl-msg__open" onclick={() => open(item.id)} aria-current={item.id === activeId}>
							<span class="fl-msg__avatar" data-kind={kind} aria-hidden="true">
								{#if kind === 'blocked'}<Icon name="shield" size={16} />{:else}{initial(item)}{/if}
							</span>
							<span class="block min-w-0 flex-1">
								<span class="flex min-w-0 items-baseline justify-between gap-3">
									<span class="min-w-0 truncate font-semibold {kind === 'blocked' ? 'font-mono text-[13px]' : ''}">
										{titleOf(item)}
									</span>
									<span class="flex-none font-mono text-xs text-fg-subtle">{shortTime(item.createdAt)}</span>
								</span>
								<span class="mt-0.5 flex min-w-0 items-center gap-2">
									{#if kind === 'blocked'}
										<span class="fl-badge fl-badge--spam flex-none !h-5 !text-[11px]">{reasonLabel(item.reason ?? null)}</span>
									{/if}
									<span class="min-w-0 truncate text-sm text-fg-muted">{previewOf(item)}</span>
								</span>
							</span>
						</button>
					</li>
				{/each}
			</ul>

			<!-- Detail (wide screens) -->
			<div class="fl-inbox__detail">
				{#if active}
					{@render detail(active)}
				{/if}
			</div>
		</div>
	{/if}

	{#if pager}
		<div class="px-4 pb-4">{@render pager()}</div>
	{/if}
</section>

{#snippet detail(item: InboxItem)}
	{@const email = emailOf(item)}
	<div class="grid gap-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="min-w-0">
				<h3 class="fl-h2 break-words {kind === 'blocked' ? 'font-mono !text-lg' : ''}">{titleOf(item)}</h3>
				<p class="m-0 mt-1 font-mono text-xs text-fg-muted">{fullTime(item.createdAt)}</p>
				{#if kind === 'blocked'}
					<span class="fl-badge fl-badge--spam mt-3">{reasonLabel(item.reason ?? null)}</span>
				{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				{#if email && kind === 'submission'}
					<a
						class="fl-btn fl-btn--secondary fl-btn--sm"
						href="mailto:{email}?subject={encodeURIComponent(`Re: ${formName}`)}"
					>
						<Icon name="mail" size={16} />
						Reply
					</a>
				{/if}
				<button type="button" class="fl-btn fl-btn--ghost fl-btn--sm" onclick={() => copyJson(item)}>
					<Icon name={copied ? 'check' : 'copy'} size={16} />
					{copied ? 'Copied' : 'Copy JSON'}
				</button>
				<button
					type="button"
					class="fl-btn fl-btn--ghost fl-btn--sm fl-btn--icon !w-9 hover:!bg-danger-tint hover:!text-on-danger-tint"
					aria-label="Delete this {noun[0]}"
					title="Delete"
					onclick={() => askDelete([item.id])}
				>
					<Icon name="trash" size={16} />
				</button>
			</div>
		</div>

		<div>
			<span class="fl-overline">{kind === 'blocked' ? 'Blocked payload' : 'Fields'}</span>
			{#if Object.keys(item.data).length === 0}
				<p class="fl-subtle m-0 mt-2 text-sm">No payload captured.</p>
			{:else}
				<dl class="fl-fields mt-2">
					{#each Object.entries(item.data) as [key, value] (key)}
						<div>
							<dt>{key}</dt>
							<dd>{str(value) || '—'}</dd>
						</div>
					{/each}
				</dl>
			{/if}
		</div>

		{#if item.meta && Object.keys(item.meta).length > 0}
			<div>
				<span class="fl-overline">Metadata</span>
				<dl class="fl-dl mt-2 text-fg-muted">
					{#each Object.entries(item.meta) as [key, value] (key)}
						<dt>{key}</dt>
						<dd class="font-mono !text-[13px]">{str(value) || '—'}</dd>
					{/each}
				</dl>
			</div>
		{/if}
	</div>
{/snippet}

<!-- Detail (phones and tablets) -->
<dialog
	bind:this={detailDialog}
	class="fl-dialog lg:hidden"
	aria-label="{noun[0]} details"
	onclick={(e) => {
		if (e.target === detailDialog) detailDialog?.close();
	}}
>
	<div class="fl-dialog__head !py-3">
		<span class="fl-overline self-center">{kind === 'blocked' ? 'Blocked request' : 'Submission'}</span>
		<button type="button" class="fl-btn fl-btn--ghost fl-btn--icon fl-btn--sm !w-9" aria-label="Close" onclick={() => detailDialog?.close()}>
			<Icon name="x" />
		</button>
	</div>
	<div class="fl-dialog__body">
		{#if active}{@render detail(active)}{/if}
	</div>
</dialog>

<!-- Delete confirmation -->
<dialog
	bind:this={confirmDialog}
	class="fl-dialog !w-[min(440px,calc(100vw-32px))]"
	aria-labelledby="confirm-delete-{kind}"
	onclick={(e) => {
		if (e.target === confirmDialog) confirmDialog?.close();
	}}
>
	<form
		method="POST"
		action={deleteAction}
		class="grid gap-5 p-6"
		use:enhance={() => {
			deleting = true;
			const count = pendingIds.length;
			return async ({ result, update }) => {
				deleting = false;
				confirmDialog?.close();
				if (result.type === 'success') {
					selected = new Set();
					detailDialog?.close();
					notice = `${plural(count)} deleted.`;
					setTimeout(() => (notice = null), 4000);
				}
				await update();
			};
		}}
	>
		<div class="flex items-start gap-4">
			<span class="grid h-11 w-11 flex-none place-items-center rounded-full bg-danger-tint text-on-danger-tint">
				<Icon name="trash" />
			</span>
			<div>
				<h2 class="fl-h3" id="confirm-delete-{kind}">
					Delete {pendingIds.length === 1 ? `this ${noun[0]}` : plural(pendingIds.length)}?
				</h2>
				<p class="fl-muted m-0 mt-1 text-sm">
					{pendingIds.length === 1 ? 'It' : 'They'}'ll be removed for good. Emails and webhooks already sent
					aren't affected.
				</p>
			</div>
		</div>
		{#each pendingIds as id (id)}
			<input type="hidden" name="id" value={id} />
		{/each}
		<div class="flex flex-col-reverse justify-end gap-2 sm:flex-row">
			<button type="button" class="fl-btn fl-btn--secondary" onclick={() => confirmDialog?.close()}>Cancel</button>
			<button type="submit" class="fl-btn fl-btn--danger" disabled={deleting}>
				{deleting ? 'Deleting…' : 'Delete'}
			</button>
		</div>
	</form>
</dialog>
