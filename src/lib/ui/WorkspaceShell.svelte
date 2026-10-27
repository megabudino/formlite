<script lang="ts" module>
	export interface ShellForm {
		id: string;
		name: string;
		is_active: number;
		submission_count: number;
	}
</script>

<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Icon from './Icon.svelte';
	import { workspaceMenu } from './workspace-menu.svelte';

	// Workspace pages (overview, each form, its integration guide) share this frame:
	// a full-height sidebar on desktop, a hamburger-opened drawer on phones.
	let {
		workspace,
		forms,
		active,
		children
	}: {
		workspace: { id: string; name: string };
		forms: ShellForm[];
		/** 'overview' or the id of the open form */
		active: string;
		children: Snippet;
	} = $props();

	let drawer = $state<HTMLDialogElement | null>(null);

	// The hamburger lives in the top bar (app layout); it flips workspaceMenu.open.
	onMount(() => {
		workspaceMenu.shells++;
		return () => {
			workspaceMenu.shells--;
			workspaceMenu.open = false;
			workspaceMenu.newForm = false;
		};
	});

	$effect(() => {
		if (!drawer) return;
		if (workspaceMenu.open && !drawer.open) drawer.showModal();
		if (!workspaceMenu.open && drawer.open) drawer.close();
	});

	// Close the drawer once a link in it has taken you somewhere.
	afterNavigate(() => {
		workspaceMenu.open = false;
		workspaceMenu.newForm = false;
	});

	// "New form" dialog. Posts to the /forms/new action, which redirects to the new form.
	let newFormDialog = $state<HTMLDialogElement | null>(null);
	let nameInput = $state<HTMLInputElement | null>(null);
	let formName = $state('');
	let targetEmail = $state('');
	let creating = $state(false);
	let createError = $state('');

	$effect(() => {
		if (!newFormDialog) return;
		if (workspaceMenu.newForm && !newFormDialog.open) {
			workspaceMenu.open = false;
			formName = '';
			createError = '';
			targetEmail = ($page.data.user as { email?: string } | null)?.email ?? '';
			newFormDialog.showModal();
			tick().then(() => nameInput?.focus());
		}
		if (!workspaceMenu.newForm && newFormDialog.open) newFormDialog.close();
	});
</script>

<div class="fl-shell">
	<aside class="fl-side" aria-label="{workspace.name} navigation">
		{@render nav()}
	</aside>

	<div class="fl-shell__main">
		{@render children()}
	</div>
</div>

<dialog
	bind:this={drawer}
	class="fl-drawer"
	aria-label="{workspace.name} navigation"
	onclose={() => (workspaceMenu.open = false)}
	onclick={(e) => {
		if (e.target === drawer) workspaceMenu.open = false;
	}}
>
	<div class="mb-2 flex justify-end">
		<button
			type="button"
			class="fl-btn fl-btn--ghost fl-btn--icon fl-btn--sm !w-9"
			aria-label="Close menu"
			onclick={() => (workspaceMenu.open = false)}
		>
			<Icon name="x" />
		</button>
	</div>
	{@render nav()}
</dialog>

<!-- New form -->
<dialog
	bind:this={newFormDialog}
	class="fl-dialog !w-[min(480px,calc(100vw-32px))]"
	aria-labelledby="new-form-title"
	onclose={() => (workspaceMenu.newForm = false)}
	onclick={(e) => {
		if (e.target === newFormDialog) workspaceMenu.newForm = false;
	}}
>
	<form
		method="POST"
		action="/forms/new"
		use:enhance={() => {
			creating = true;
			createError = '';
			return async ({ result, update }) => {
				creating = false;
				if (result.type === 'failure') {
					createError = String(result.data?.error ?? 'The form wasn\'t created. Please try again.');
					return;
				}
				// Success redirects to the new form: close first so the next page doesn't reopen it
				workspaceMenu.newForm = false;
				await update();
			};
		}}
	>
		<input type="hidden" name="workspaceId" value={workspace.id} />
		<div class="fl-dialog__head">
			<div class="flex items-start gap-4">
				<span class="fl-card__tile flex-none"><Icon name="file" /></span>
				<div>
					<h2 class="fl-h2" id="new-form-title">New form</h2>
					<p class="fl-muted m-0 mt-1 text-sm">In {workspace.name}. You get an endpoint right away.</p>
				</div>
			</div>
			<button
				type="button"
				class="fl-btn fl-btn--ghost fl-btn--icon fl-btn--sm !w-9"
				aria-label="Close"
				onclick={() => (workspaceMenu.newForm = false)}
			>
				<Icon name="x" />
			</button>
		</div>
		<div class="fl-dialog__body grid gap-5">
			{#if createError}
				<div class="fl-alert fl-alert--error" role="alert">
					<Icon name="alert" size={20} class="fl-alert__icon" />
					<div><strong>The form wasn't created.</strong> {createError}</div>
				</div>
			{/if}
			<div class="fl-field">
				<label class="fl-label" for="new-form-name">Form name</label>
				<input
					bind:this={nameInput}
					id="new-form-name"
					name="name"
					type="text"
					bind:value={formName}
					placeholder="Contact form"
					maxlength="100"
					required
					class="fl-input"
				/>
				<span class="fl-help">Only you see this name.</span>
			</div>
			<div class="fl-field">
				<label class="fl-label" for="new-form-email">Send submissions to</label>
				<input
					id="new-form-email"
					name="targetEmail"
					type="email"
					bind:value={targetEmail}
					placeholder="you@example.com"
					required
					class="fl-input"
				/>
				<span class="fl-help">You can add more addresses later in Settings.</span>
			</div>
			<div class="flex flex-col-reverse justify-end gap-2 sm:flex-row">
				<button type="button" class="fl-btn fl-btn--ghost" onclick={() => (workspaceMenu.newForm = false)}>
					Cancel
				</button>
				<button type="submit" class="fl-btn fl-btn--primary" disabled={creating || !formName.trim()}>
					{#if creating}
						Creating…
					{:else}
						Create form
						<Icon name="arrow-right" />
					{/if}
				</button>
			</div>
		</div>
	</form>
</dialog>

{#snippet nav()}
	<div class="fl-side__head">
		<a href="/" class="fl-back"><Icon name="chevron-left" size={16} />All workspaces</a>
		<p class="fl-side__title" title={workspace.name}>{workspace.name}</p>
	</div>

	<nav class="fl-side__nav">
		<a href="/workspaces/{workspace.id}" class="fl-side__item" aria-current={active === 'overview' ? 'page' : undefined}>
			<Icon name="activity" size={16} class="text-fg-subtle" />
			<span class="flex-1 truncate">Overview</span>
		</a>

		<div class="fl-side__section">
			<span class="fl-overline">Forms</span>
			<button
				type="button"
				class="fl-btn fl-btn--ghost fl-btn--icon fl-btn--sm !h-7 !w-7"
				aria-label="New form"
				title="New form"
				aria-haspopup="dialog"
				onclick={() => (workspaceMenu.newForm = true)}
			>
				<Icon name="plus" size={14} />
			</button>
		</div>

		{#each forms as form (form.id)}
			<a href="/forms/{form.id}" class="fl-side__item" aria-current={active === form.id ? 'page' : undefined}>
				<span
					class="fl-side__dot"
					data-live={form.is_active === 1}
					title={form.is_active === 1 ? 'Live' : 'Paused'}
				></span>
				<span class="flex-1 truncate">{form.name}</span>
				<span class="fl-side__count">{form.submission_count.toLocaleString()}</span>
			</a>
		{:else}
			<p class="fl-side__empty">No forms yet</p>
		{/each}
	</nav>
{/snippet}
