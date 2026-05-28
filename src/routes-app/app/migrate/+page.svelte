<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let workspaceName = $state('');
	let creatingWorkspace = $state(false);
	let assigning = $state(false);

	let assignments = $state<Record<string, string>>(
		Object.fromEntries(data.orphanForms.map((f) => [f.id, '']))
	);

	const allAssigned = $derived(
		data.orphanForms.length > 0 &&
			data.orphanForms.every((f) => assignments[f.id] && assignments[f.id].length > 0)
	);

	const hasWorkspaces = $derived(data.workspaces.length > 0);

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Organize your forms — Freeform</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-6">
	<header class="text-center">
		<span
			class="inline-flex items-center gap-2 rounded-full border border-mint-200 bg-mint-50 px-3 py-1 text-xs font-medium text-mint-700"
		>
			<span class="h-1.5 w-1.5 rounded-full bg-mint-500"></span>
			One-time migration
		</span>
		<h1 class="mt-4 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
			Organize your forms into workspaces
		</h1>
		<p class="mx-auto mt-2 max-w-xl text-sm text-ink-500">
			Forms are now grouped by workspace. To continue, please assign each existing form to a
			workspace. Create as many workspaces as you need.
		</p>
	</header>

	<section class="rounded-xl border border-ink-100 bg-white p-6 shadow-card">
		<h2 class="text-lg font-semibold text-ink-900">1. Create a workspace</h2>
		<p class="mt-1 text-sm text-ink-500">
			Workspaces are folders that group related forms (e.g. "Personal", "Acme Inc.", "Side
			Project").
		</p>

		<form
			method="POST"
			action="?/createWorkspace"
			use:enhance={() => {
				creatingWorkspace = true;
				return async ({ update }) => {
					await update({ reset: true });
					workspaceName = '';
					creatingWorkspace = false;
				};
			}}
			class="mt-4 flex flex-wrap gap-2"
		>
			<input
				type="text"
				name="name"
				bind:value={workspaceName}
				placeholder="Workspace name"
				maxlength="100"
				required
				class="min-w-52 flex-1 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30"
			/>
			<button
				type="submit"
				disabled={creatingWorkspace || !workspaceName.trim()}
				class="inline-flex items-center justify-center rounded-lg bg-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
			>
				{creatingWorkspace ? 'Creating…' : 'Create workspace'}
			</button>
		</form>

		{#if form && 'workspaceError' in form && form.workspaceError}
			<p class="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
				{form.workspaceError}
			</p>
		{/if}

		{#if hasWorkspaces}
			<ul class="mt-4 space-y-2">
				{#each data.workspaces as workspace}
					<li
						class="flex items-center justify-between rounded-lg border border-ink-100 bg-ink-50/60 px-4 py-2.5"
					>
						<span class="text-sm font-medium text-ink-900">{workspace.name}</span>
						<span class="text-xs text-ink-500">
							{workspace.formCount === 1 ? '1 form' : `${workspace.formCount} forms`}
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-4 text-sm italic text-ink-400">
				No workspaces yet. Create one above to start assigning forms.
			</p>
		{/if}
	</section>

	<section class="rounded-xl border border-ink-100 bg-white p-6 shadow-card">
		<h2 class="text-lg font-semibold text-ink-900">2. Assign each form to a workspace</h2>
		<p class="mt-1 text-sm text-ink-500">
			All {data.orphanForms.length} forms below need to be assigned before you can continue.
		</p>

		<form
			method="POST"
			action="?/assignAll"
			use:enhance={() => {
				assigning = true;
				return async ({ update }) => {
					await update();
					assigning = false;
				};
			}}
			class="mt-4"
		>
			{#if form && 'assignError' in form && form.assignError}
				<p class="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
					{form.assignError}
				</p>
			{/if}

			<div class="flex flex-col gap-2">
				{#each data.orphanForms as orphanForm}
					<div
						class="flex flex-col items-stretch gap-3 rounded-lg border border-ink-100 bg-ink-50/60 p-3 sm:flex-row sm:items-center sm:p-4"
					>
						<div class="min-w-0 flex-1">
							<div class="truncate text-sm font-medium text-ink-900">{orphanForm.name}</div>
							<div class="mt-0.5 text-xs text-ink-500">
								Created {formatDate(orphanForm.createdAt)} ·
								{orphanForm.submissionCount === 1
									? '1 submission'
									: `${orphanForm.submissionCount} submissions`}
							</div>
						</div>
						<select
							name={`assign__${orphanForm.id}`}
							bind:value={assignments[orphanForm.id]}
							disabled={!hasWorkspaces}
							required
							class="min-w-44 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<option value="" disabled>
								{hasWorkspaces ? 'Choose workspace…' : 'Create a workspace first'}
							</option>
							{#each data.workspaces as workspace}
								<option value={workspace.id}>{workspace.name}</option>
							{/each}
						</select>
					</div>
				{/each}
			</div>

			<div class="mt-5 flex justify-end border-t border-ink-100 pt-4">
				<button
					type="submit"
					disabled={assigning || !allAssigned || !hasWorkspaces}
					class="inline-flex items-center justify-center rounded-lg bg-mint-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
				>
					{assigning ? 'Moving…' : 'Move all forms and continue'}
				</button>
			</div>
		</form>
	</section>
</div>
