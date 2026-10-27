<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { onMount, tick } from 'svelte';
	import { Icon } from '$lib/ui';
	import { spark } from '$lib/charts';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let createDialog = $state<HTMLDialogElement | null>(null);
	let nameInput = $state<HTMLInputElement | null>(null);
	let workspaceName = $state('');
	let creating = $state(false);
	let greeting = $state('Welcome back');

	const firstName = $derived(data.user?.name?.split(/\s+/)[0] ?? '');

	onMount(() => {
		// Greet in the viewer's own time zone, so this runs in the browser only.
		const h = new Date().getHours();
		greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
	});

	async function openCreate() {
		createDialog?.showModal();
		await tick();
		nameInput?.focus();
	}

	function closeCreate() {
		createDialog?.close();
		workspaceName = '';
	}

	function countForms(n: number) {
		return n === 0 ? 'No forms yet' : n === 1 ? '1 form' : `${n} forms`;
	}

	function countSubmissions(n: number) {
		return n === 0 ? 'no submissions yet' : n === 1 ? '1 submission' : `${n.toLocaleString()} submissions`;
	}
</script>

<svelte:head>
	<title>Dashboard — Formlite</title>
</svelte:head>

<div class="grid grid-cols-[minmax(0,1fr)] gap-8">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="fl-h1">{greeting}{firstName ? `, ${firstName}` : ''}</h1>
		</div>
		{#if data.workspaces.length > 0}
			<button type="button" onclick={openCreate} class="fl-btn fl-btn--primary">
				<Icon name="plus" />
				New workspace
			</button>
		{/if}
	</div>

	{#if data.workspaces.length === 0}
		<div class="fl-empty">
			<div class="fl-card__tile" style="width:56px;height:56px"><Icon name="folder" size={24} /></div>
			<h2 class="fl-h2 mt-5">No workspaces yet</h2>
			<p class="fl-muted mt-2 max-w-sm">
				Create your first workspace, then add forms to it. Each form gets its own endpoint.
			</p>
			<button type="button" onclick={openCreate} class="fl-btn fl-btn--primary mt-6">
				<Icon name="plus" />
				Create your first workspace
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.workspaces as workspace (workspace.id)}
				{@const act = data.activity[workspace.id]}
				<a href="/workspaces/{workspace.id}" class="fl-card fl-card--link">
					<div class="fl-card__head">
						<span class="fl-card__tile"><Icon name="folder" /></span>
						<span class="fl-card__arrow"><Icon name="arrow-right" size={16} /></span>
					</div>
					<h3 class="fl-card__title truncate">{workspace.name}</h3>
					<p class="fl-card__meta">
						{countForms(workspace.formCount)}
						<span class="fl-subtle" aria-hidden="true">·</span>
						{countSubmissions(act?.total ?? 0)}
					</p>
					<div class="mt-5 border-t border-line pt-4">
						<div class="mb-2 flex items-baseline justify-between gap-3">
							<span class="fl-overline">Last 30 days</span>
							<span class="font-display text-lg font-bold tracking-[-0.02em]">
								{(act?.recent ?? 0).toLocaleString()}
							</span>
						</div>
						<svg
							class="fl-spark"
							style="color: var(--chart-1); height: 40px"
							use:spark={act?.daily ?? new Array(30).fill(0)}
							role="img"
							aria-label="{(act?.recent ?? 0).toLocaleString()} submissions in the last 30 days"
						></svg>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- New workspace -->
<dialog
	bind:this={createDialog}
	class="fl-dialog !w-[min(480px,calc(100vw-32px))]"
	aria-labelledby="new-workspace-title"
	onclick={(e) => {
		if (e.target === createDialog) closeCreate();
	}}
	onclose={() => (workspaceName = '')}
>
	<form
		method="POST"
		action="?/createWorkspace"
		use:enhance={() => {
			creating = true;
			return async ({ update }) => {
				// Success redirects to the new workspace; on an error the dialog stays open with the message.
				await update({ reset: false });
				creating = false;
			};
		}}
	>
		<div class="fl-dialog__head">
			<div class="flex items-start gap-4">
				<span class="fl-card__tile flex-none"><Icon name="folder" /></span>
				<div>
					<h2 class="fl-h2" id="new-workspace-title">New workspace</h2>
					<p class="fl-muted m-0 mt-1 text-sm">A workspace keeps related forms together.</p>
				</div>
			</div>
			<button
				type="button"
				class="fl-btn fl-btn--ghost fl-btn--icon fl-btn--sm !w-9"
				aria-label="Close"
				onclick={closeCreate}
			>
				<Icon name="x" />
			</button>
		</div>
		<div class="fl-dialog__body grid gap-6">
			<div class="fl-field">
				<label class="fl-label" for="workspace-name">Name</label>
				<input
					bind:this={nameInput}
					id="workspace-name"
					type="text"
					name="name"
					bind:value={workspaceName}
					placeholder="Acme Inc."
					maxlength="100"
					required
					class="fl-input"
					class:fl-input--error={form?.workspaceError}
				/>
				{#if form?.workspaceError}
					<span class="fl-error"><Icon name="alert" size={14} />{form.workspaceError}</span>
				{:else}
					<span class="fl-help">For example a client, a project or "Personal".</span>
				{/if}
			</div>
			<div class="flex flex-col-reverse justify-end gap-2 sm:flex-row">
				<button type="button" class="fl-btn fl-btn--ghost" onclick={closeCreate}>Cancel</button>
				<button type="submit" disabled={creating || !workspaceName.trim()} class="fl-btn fl-btn--primary">
					{creating ? 'Creating…' : 'Create workspace'}
				</button>
			</div>
		</div>
	</form>
</dialog>
