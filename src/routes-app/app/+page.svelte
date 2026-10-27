<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { Icon } from '$lib/ui';
	import OverviewPanel from '$lib/ui/dash/OverviewPanel.svelte';
	import RangeSelect from '$lib/ui/dash/RangeSelect.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateForm = $state(false);
	let workspaceName = $state('');
	let creating = $state(false);
	let greeting = $state('Welcome back');

	const firstName = $derived(data.user?.name?.split(/\s+/)[0] ?? '');
	const totalForms = $derived(data.workspaces.reduce((sum, w) => sum + w.formCount, 0));

	onMount(() => {
		// Greet in the viewer's own time zone, so this runs in the browser only.
		const h = new Date().getHours();
		greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
	});

	function countForms(n: number) {
		return n === 0 ? 'No forms yet' : n === 1 ? '1 form' : `${n} forms`;
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Dashboard — Formlite</title>
</svelte:head>

<div class="grid grid-cols-[minmax(0,1fr)] gap-8">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<span class="fl-overline">
				{data.workspaces.length === 1 ? '1 workspace' : `${data.workspaces.length} workspaces`} · {countForms(
					totalForms
				).toLowerCase()}
			</span>
			<h1 class="fl-h1 mt-1.5">{greeting}{firstName ? `, ${firstName}` : ''}</h1>
		</div>
		{#if data.workspaces.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				{#if data.overview && totalForms > 0}
					<RangeSelect value={data.overview.range} />
				{/if}
				<a href="/app/forms/new" class="fl-btn fl-btn--primary">
					<Icon name="plus" />
					New form
				</a>
			</div>
		{/if}
	</div>

	{#if data.overview && totalForms > 0}
		<OverviewPanel overview={data.overview} />
	{/if}

	<section class="grid grid-cols-[minmax(0,1fr)] gap-4">
		{#if data.workspaces.length > 0}
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="fl-h2">Workspaces</h2>
					<p class="fl-muted m-0 mt-1 text-sm">Workspaces keep related forms together.</p>
				</div>
				<button
					type="button"
					onclick={() => (showCreateForm = !showCreateForm)}
					class="fl-btn fl-btn--secondary fl-btn--sm"
					aria-expanded={showCreateForm}
				>
					<Icon name="plus" size={16} />
					New workspace
				</button>
			</div>
		{/if}

		{#if showCreateForm}
			<form
				method="POST"
				action="?/createWorkspace"
				use:enhance={() => {
					creating = true;
					return async ({ update }) => {
						await update({ reset: true });
						workspaceName = '';
						creating = false;
						showCreateForm = false;
					};
				}}
				class="fl-card grid gap-4"
			>
				<div class="fl-field">
					<label class="fl-label" for="workspace-name">Workspace name</label>
					<div class="flex flex-col gap-2 sm:flex-row">
						<input
							id="workspace-name"
							type="text"
							name="name"
							bind:value={workspaceName}
							placeholder="Acme Inc."
							maxlength="100"
							required
							autofocus
							class="fl-input sm:flex-1"
							class:fl-input--error={form?.workspaceError}
						/>
						<div class="flex gap-2">
							<button
								type="submit"
								disabled={creating || !workspaceName.trim()}
								class="fl-btn fl-btn--primary flex-1 sm:flex-none"
							>
								{creating ? 'Creating…' : 'Create workspace'}
							</button>
							<button
								type="button"
								onclick={() => {
									showCreateForm = false;
									workspaceName = '';
								}}
								class="fl-btn fl-btn--ghost"
							>
								Cancel
							</button>
						</div>
					</div>
					{#if form?.workspaceError}
						<span class="fl-error"><Icon name="alert" size={14} />{form.workspaceError}</span>
					{:else}
						<span class="fl-help">For example a client, a project or "Personal".</span>
					{/if}
				</div>
			</form>
		{/if}

		{#if data.workspaces.length === 0 && !showCreateForm}
			<div class="fl-empty">
				<div class="fl-card__tile" style="width:56px;height:56px"><Icon name="folder" size={24} /></div>
				<h2 class="fl-h2 mt-5">No workspaces yet</h2>
				<p class="fl-muted mt-2 max-w-sm">
					Create your first workspace, then add forms to it. Each form gets its own endpoint.
				</p>
				<button type="button" onclick={() => (showCreateForm = true)} class="fl-btn fl-btn--primary mt-6">
					<Icon name="plus" />
					Create your first workspace
				</button>
			</div>
		{:else if data.workspaces.length > 0}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.workspaces as workspace (workspace.id)}
					<a href="/app/workspaces/{workspace.id}" class="fl-card fl-card--link">
						<div class="fl-card__head">
							<span class="fl-card__tile"><Icon name="folder" /></span>
							<span class="fl-card__arrow"><Icon name="arrow-right" size={16} /></span>
						</div>
						<h3 class="fl-card__title truncate">{workspace.name}</h3>
						<p class="fl-card__meta">
							{countForms(workspace.formCount)}
							<span class="fl-subtle" aria-hidden="true">·</span>
							<span class="fl-subtle">Created {formatDate(workspace.createdAt)}</span>
						</p>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>
