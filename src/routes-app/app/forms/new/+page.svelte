<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Icon } from '$lib/ui';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let name = $state(form?.name ?? '');
	let targetEmail = $state(form?.targetEmail ?? data.userEmail);
	let workspaceId = $state(form?.workspaceId ?? data.preselectedWorkspaceId);
	let submitting = $state(false);

	const backHref = $derived(workspaceId ? `/app/workspaces/${workspaceId}` : '/app');
	const backLabel = $derived(
		data.workspaces.find((w) => w.id === workspaceId)?.name ?? 'All workspaces'
	);
</script>

<svelte:head>
	<title>New form — Formlite</title>
</svelte:head>

<div class="mx-auto grid max-w-[640px] grid-cols-[minmax(0,1fr)] gap-8">
	<div>
		<a href={backHref} class="fl-back"><Icon name="chevron-left" size={16} />{backLabel}</a>
		<span class="fl-overline mt-3 block">New form</span>
		<h1 class="fl-h1 mt-1.5">Create a form</h1>
		<p class="fl-muted mt-1.5">You get an endpoint to point any HTML form at.</p>
	</div>

	<form method="POST" onsubmit={() => (submitting = true)} class="fl-card grid gap-6 sm:!p-8">
		{#if form?.error}
			<div class="fl-alert fl-alert--error" role="alert">
				<Icon name="alert" size={20} class="fl-alert__icon" />
				<div><strong>The form wasn't created.</strong> {form.error}</div>
			</div>
		{/if}

		<div class="fl-field">
			<label for="workspaceId" class="fl-label">Workspace</label>
			<select id="workspaceId" name="workspaceId" bind:value={workspaceId} required class="fl-input">
				<option value="" disabled>Choose a workspace…</option>
				{#each data.workspaces as workspace (workspace.id)}
					<option value={workspace.id}>{workspace.name}</option>
				{/each}
			</select>
			<span class="fl-help">The form will live inside this workspace.</span>
		</div>

		<div class="fl-field">
			<label for="name" class="fl-label">Form name</label>
			<input
				type="text"
				id="name"
				name="name"
				bind:value={name}
				placeholder="Contact form"
				required
				maxlength="100"
				class="fl-input"
			/>
			<span class="fl-help">Only you see this name.</span>
		</div>

		<div class="fl-field">
			<label for="targetEmail" class="fl-label">Send submissions to</label>
			<input
				type="email"
				id="targetEmail"
				name="targetEmail"
				bind:value={targetEmail}
				placeholder="you@example.com"
				required
				class="fl-input"
			/>
			<span class="fl-help">You can add more addresses later in the form settings.</span>
		</div>

		<div class="flex flex-col-reverse justify-end gap-2 border-t border-line pt-6 sm:flex-row">
			<a href={backHref} class="fl-btn fl-btn--ghost">Cancel</a>
			<button type="submit" disabled={submitting} class="fl-btn fl-btn--primary">
				{#if submitting}
					Creating…
				{:else}
					Create form
					<Icon name="arrow-right" />
				{/if}
			</button>
		</div>
	</form>
</div>
