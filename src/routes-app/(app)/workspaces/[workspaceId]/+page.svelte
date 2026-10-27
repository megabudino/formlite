<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Icon } from '$lib/ui';
	import WorkspaceShell from '$lib/ui/WorkspaceShell.svelte';
	import { workspaceMenu } from '$lib/ui/workspace-menu.svelte';
	import OverviewPanel from '$lib/ui/dash/OverviewPanel.svelte';
	import RangeSelect from '$lib/ui/dash/RangeSelect.svelte';

	let { data }: { data: PageData } = $props();

	const filteredForm = $derived(data.forms.find((f) => f.id === data.formFilter) ?? null);

	function filterBy(formId: string) {
		const url = new URL($page.url);
		if (formId) url.searchParams.set('form', formId);
		else url.searchParams.delete('form');
		goto(url, { noScroll: true, keepFocus: true, replaceState: true });
	}
</script>

<svelte:head>
	<title>{data.workspace.name} — Formlite</title>
</svelte:head>

<WorkspaceShell workspace={data.workspace} forms={data.forms} active="overview">
	<div class={data.forms.length === 0 ? 'fl-fillpage' : 'grid grid-cols-[minmax(0,1fr)] gap-6'}>
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div class="min-w-0">
				<h1 class="fl-h1 break-words">{filteredForm ? filteredForm.name : 'Overview'}</h1>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#if data.forms.length > 0}
					<label class="sr-only" for="form-filter">Show stats for</label>
					<select
						id="form-filter"
						class="fl-input fl-input--pill"
						value={data.formFilter ?? ''}
						onchange={(e) => filterBy(e.currentTarget.value)}
					>
						<option value="">All forms</option>
						{#each data.forms as f (f.id)}
							<option value={f.id}>{f.name}</option>
						{/each}
					</select>
					<RangeSelect value={data.overview.range} />
				{/if}
			</div>
		</div>

		{#if data.forms.length > 0}
			{#if filteredForm}
				<div class="-mt-2 flex flex-wrap items-center gap-2 text-sm">
					<span class="fl-muted">Showing one form.</span>
					<a href="/forms/{filteredForm.id}" class="font-semibold text-accent-text no-underline hover:underline"
						>Open its submissions</a
					>
					<span class="fl-subtle" aria-hidden="true">·</span>
					<button type="button" class="font-semibold text-accent-text hover:underline" onclick={() => filterBy('')}>
						Show all forms
					</button>
				</div>
			{/if}
			<OverviewPanel overview={data.overview} filtered={!!filteredForm} />
		{:else}
			<div class="fl-empty">
				<div class="fl-card__tile" style="width:56px;height:56px"><Icon name="file" size={24} /></div>
				<h2 class="fl-h2 mt-5">No forms yet</h2>
				<p class="fl-muted mt-2 max-w-sm">
					Create a form to get an endpoint. Point any HTML form at it and submissions land in your
					inbox.
				</p>
				<button type="button" class="fl-btn fl-btn--primary mt-6" onclick={() => (workspaceMenu.newForm = true)}>
					<Icon name="plus" />
					Create your first form
				</button>
			</div>
		{/if}
	</div>
</WorkspaceShell>
