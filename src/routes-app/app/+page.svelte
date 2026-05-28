<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateForm = $state(false);
	let workspaceName = $state('');
	let creating = $state(false);

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Workspaces — Freeform</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Your workspaces</h1>
			<p class="mt-1 text-sm text-ink-500">Organize your forms into separate workspaces.</p>
		</div>
		<button
			type="button"
			onclick={() => (showCreateForm = !showCreateForm)}
			class="inline-flex items-center gap-1.5 rounded-lg bg-mint-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-4 w-4"
			>
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			New workspace
		</button>
	</div>

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
			class="flex flex-wrap gap-2 rounded-xl border border-ink-100 bg-white p-4 shadow-card"
		>
			<input
				type="text"
				name="name"
				bind:value={workspaceName}
				placeholder="Workspace name (e.g. 'Personal', 'Acme Inc.')"
				maxlength="100"
				required
				autofocus
				class="min-w-56 flex-1 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30"
			/>
			<button
				type="submit"
				disabled={creating || !workspaceName.trim()}
				class="inline-flex items-center justify-center rounded-lg bg-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
			>
				{creating ? 'Creating…' : 'Create'}
			</button>
			<button
				type="button"
				onclick={() => {
					showCreateForm = false;
					workspaceName = '';
				}}
				class="inline-flex items-center justify-center rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
			>
				Cancel
			</button>
		</form>

		{#if form?.workspaceError}
			<p
				class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
			>
				{form.workspaceError}
			</p>
		{/if}
	{/if}

	{#if data.workspaces.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-white px-6 py-16 text-center"
		>
			<div
				class="flex h-14 w-14 items-center justify-center rounded-full bg-mint-100 text-mint-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-7 w-7"
				>
					<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
				</svg>
			</div>
			<h2 class="mt-4 text-lg font-semibold text-ink-900">No workspaces yet</h2>
			<p class="mt-1 max-w-sm text-sm text-ink-500">
				Create your first workspace to start organizing your forms.
			</p>
			<button
				type="button"
				onclick={() => (showCreateForm = true)}
				class="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-mint-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-4 w-4"
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				Create your first workspace
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.workspaces as workspace}
				<a
					href="/app/workspaces/{workspace.id}"
					class="group block rounded-xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-mint-200 hover:shadow-card-hover"
				>
					<div class="flex items-start justify-between gap-3">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-50 text-mint-600 transition group-hover:bg-mint-100"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="h-4 w-4"
							>
								<path
									d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
								/>
							</svg>
						</div>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-mint-500"
						>
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</div>
					<h3 class="mt-4 text-base font-semibold tracking-tight text-ink-900">
						{workspace.name}
					</h3>
					<p class="mt-1 text-sm text-ink-600">
						{workspace.formCount === 0
							? 'No forms yet'
							: workspace.formCount === 1
								? '1 form'
								: `${workspace.formCount} forms`}
					</p>
					<p class="mt-2 text-xs text-ink-400">Created {formatDate(workspace.createdAt)}</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
