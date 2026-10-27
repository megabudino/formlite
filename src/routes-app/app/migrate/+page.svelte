<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Icon } from '$lib/ui';

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
	const assignedCount = $derived(data.orphanForms.filter((f) => assignments[f.id]).length);
	const hasWorkspaces = $derived(data.workspaces.length > 0);

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Organize your forms — Formlite</title>
</svelte:head>

<div class="mx-auto grid max-w-[760px] grid-cols-[minmax(0,1fr)] gap-6">
	<header class="mb-2">
		<span class="fl-badge fl-badge--paused">One-time step</span>
		<h1 class="fl-h1 mt-4">Move your forms into workspaces</h1>
		<p class="fl-muted mt-2 max-w-xl">
			Forms now live inside workspaces. Create at least one, assign every form to it, and you're
			done. Your endpoints don't change.
		</p>
	</header>

	<section class="fl-card grid gap-5">
		<div class="flex items-start gap-4">
			<span
				class="grid h-9 w-9 flex-none place-items-center rounded-full font-mono text-sm font-medium {hasWorkspaces
					? 'bg-accent text-on-accent'
					: 'bg-accent-tint text-on-accent-tint'}"
			>
				{#if hasWorkspaces}<Icon name="check" size={16} />{:else}1{/if}
			</span>
			<div>
				<h2 class="fl-h2">Create a workspace</h2>
				<p class="fl-muted mt-1 text-sm">
					A workspace groups related forms, for example "Personal", "Acme Inc." or a side project.
				</p>
			</div>
		</div>

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
			class="fl-field"
		>
			<label for="ws-name" class="sr-only">Workspace name</label>
			<div class="flex flex-col gap-2 sm:flex-row">
				<input
					id="ws-name"
					type="text"
					name="name"
					bind:value={workspaceName}
					placeholder="Workspace name"
					maxlength="100"
					required
					class="fl-input sm:flex-1"
				/>
				<button
					type="submit"
					disabled={creatingWorkspace || !workspaceName.trim()}
					class="fl-btn {hasWorkspaces ? 'fl-btn--secondary' : 'fl-btn--primary'}"
				>
					<Icon name="plus" size={16} />
					{creatingWorkspace ? 'Creating…' : 'Create workspace'}
				</button>
			</div>
			{#if form && 'workspaceError' in form && form.workspaceError}
				<span class="fl-error"><Icon name="alert" size={14} />{form.workspaceError}</span>
			{/if}
		</form>

		{#if hasWorkspaces}
			<div class="flex flex-wrap gap-2">
				{#each data.workspaces as workspace (workspace.id)}
					<span class="fl-chip !pr-3">
						<Icon name="folder" size={14} class="text-fg-subtle" />
						{workspace.name}
						<span class="font-mono text-xs text-fg-subtle">
							{workspace.formCount === 1 ? '1 form' : `${workspace.formCount} forms`}
						</span>
					</span>
				{/each}
			</div>
		{/if}
	</section>

	<section class="fl-card grid gap-5" class:opacity-60={!hasWorkspaces}>
		<div class="flex items-start gap-4">
			<span
				class="grid h-9 w-9 flex-none place-items-center rounded-full bg-accent-tint font-mono text-sm font-medium text-on-accent-tint"
				>2</span
			>
			<div class="flex-1">
				<h2 class="fl-h2">Assign each form</h2>
				<p class="fl-muted mt-1 text-sm">
					{hasWorkspaces
						? `${assignedCount} of ${data.orphanForms.length} assigned.`
						: 'Create a workspace first.'}
				</p>
			</div>
		</div>

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
			class="grid gap-5"
		>
			{#if form && 'assignError' in form && form.assignError}
				<div class="fl-alert fl-alert--error" role="alert">
					<Icon name="alert" size={20} class="fl-alert__icon" />
					<div><strong>Forms weren't moved.</strong> {form.assignError}</div>
				</div>
			{/if}

			<div class="grid gap-2">
				{#each data.orphanForms as orphanForm (orphanForm.id)}
					<div
						class="flex flex-col items-stretch gap-3 rounded-md bg-surface-2 p-4 sm:flex-row sm:items-center"
					>
						<div class="min-w-0 flex-1">
							<div class="truncate font-semibold">{orphanForm.name}</div>
							<div class="mt-0.5 font-mono text-xs text-fg-muted">
								{formatDate(orphanForm.createdAt)} ·
								{orphanForm.submissionCount === 1
									? '1 submission'
									: `${orphanForm.submissionCount} submissions`}
							</div>
						</div>
						<label class="sr-only" for="assign-{orphanForm.id}">Workspace for {orphanForm.name}</label>
						<select
							id="assign-{orphanForm.id}"
							name={`assign__${orphanForm.id}`}
							bind:value={assignments[orphanForm.id]}
							disabled={!hasWorkspaces}
							required
							class="fl-input sm:!w-56"
						>
							<option value="" disabled>
								{hasWorkspaces ? 'Choose a workspace…' : 'Create a workspace first'}
							</option>
							{#each data.workspaces as workspace (workspace.id)}
								<option value={workspace.id}>{workspace.name}</option>
							{/each}
						</select>
					</div>
				{/each}
			</div>

			<div class="flex justify-end border-t border-line pt-5">
				<button
					type="submit"
					disabled={assigning || !allAssigned || !hasWorkspaces}
					class="fl-btn fl-btn--primary"
				>
					{#if assigning}
						Moving…
					{:else}
						Move forms and continue
						<Icon name="arrow-right" />
					{/if}
				</button>
			</div>
		</form>
	</section>
</div>
