<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Icon } from '$lib/ui';
	import OverviewPanel from '$lib/ui/dash/OverviewPanel.svelte';
	import RangeSelect from '$lib/ui/dash/RangeSelect.svelte';

	let { data }: { data: PageData } = $props();

	const newFormHref = $derived(`/app/forms/new?workspace_id=${data.workspace.id}`);
	const liveCount = $derived(data.forms.filter((f) => f.is_active === 1).length);

	function countSubmissions(n: number) {
		return n === 0 ? 'No submissions yet' : n === 1 ? '1 submission' : `${n.toLocaleString()} submissions`;
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
	<title>{data.workspace.name} — Formlite</title>
</svelte:head>

<div class="grid grid-cols-[minmax(0,1fr)] gap-8">
	<div>
		<a href="/app" class="fl-back"><Icon name="chevron-left" size={16} />All workspaces</a>
		<div class="mt-3 flex flex-wrap items-end justify-between gap-4">
			<div class="min-w-0">
				<span class="fl-overline">
					Workspace · {data.forms.length === 1 ? '1 form' : `${data.forms.length} forms`}{data.forms
						.length > 0
						? ` · ${liveCount} live`
						: ''}
				</span>
				<h1 class="fl-h1 mt-1.5 break-words">{data.workspace.name}</h1>
			</div>
			{#if data.forms.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					<RangeSelect value={data.overview.range} />
					<a href={newFormHref} class="fl-btn fl-btn--primary">
						<Icon name="plus" />
						New form
					</a>
				</div>
			{/if}
		</div>
	</div>

	{#if data.forms.length > 0}
		<OverviewPanel overview={data.overview} />
		<h2 class="fl-h2 -mb-4">Forms</h2>
	{/if}

	{#if data.forms.length === 0}
		<div class="fl-empty">
			<div class="fl-card__tile" style="width:56px;height:56px"><Icon name="file" size={24} /></div>
			<h2 class="fl-h2 mt-5">No forms yet</h2>
			<p class="fl-muted mt-2 max-w-sm">
				Create a form to get an endpoint. Point any HTML form at it and submissions land in your
				inbox.
			</p>
			<a href={newFormHref} class="fl-btn fl-btn--primary mt-6">
				<Icon name="plus" />
				Create your first form
			</a>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.forms as form (form.id)}
				{@const live = form.is_active === 1}
				<article class="fl-card fl-card--link flex flex-col !p-0">
					<a href="/app/forms/{form.id}" class="block flex-1 p-6 text-inherit no-underline">
						<div class="fl-card__head">
							<span class="fl-badge {live ? 'fl-badge--live' : 'fl-badge--paused'}">
								{live ? 'Live' : 'Paused'}
							</span>
							<span class="fl-card__arrow"><Icon name="arrow-right" size={16} /></span>
						</div>
						<h3 class="fl-card__title break-words">{form.name}</h3>
						<p class="fl-card__meta">{countSubmissions(form.submission_count)}</p>
						<p class="fl-help mt-1">Created {formatDate(form.created_at)}</p>
					</a>
					<form
						method="POST"
						action="?/toggleActive"
						use:enhance
						class="m-0 border-t border-line px-6 py-4"
					>
						<input type="hidden" name="formId" value={form.id} />
						<input type="hidden" name="isActive" value={live ? '0' : '1'} />
						<label class="fl-switch">
							<input
								type="checkbox"
								checked={live}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							/>
							Accept submissions
						</label>
					</form>
				</article>
			{/each}
		</div>
	{/if}
</div>
