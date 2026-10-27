<script lang="ts">
	import { onMount } from 'svelte';
	import { chart } from '$lib/charts';
	import { buildSeries, rangeLabel, type Overview } from '$lib/stats';
	import TrafficCard from './TrafficCard.svelte';
	import ActivityTable from './ActivityTable.svelte';

	// A workspace's overview: traffic (with its totals in the header) next to
	// submissions by form, then the latest activity.
	let { overview }: { overview: Overview } = $props();

	// Series depend on the viewer's time zone, so they're built in the browser.
	let now = $state<Date | null>(null);
	onMount(() => (now = new Date()));

	const series = $derived(now ? buildSeries(overview.buckets, overview.range, now) : null);
	const topForms = $derived(overview.byForm.slice(0, 12));
</script>

<div class="grid grid-cols-[minmax(0,1fr)] gap-4">
	<div class="fl-grid-split gap-4">
		<TrafficCard totals={overview.totals} range={overview.range} {series} />

		<section class="fl-card flex flex-col">
			<h2 class="fl-h2">Submissions by form</h2>
			<p class="fl-subtle m-0 mb-4 mt-1 text-sm">{rangeLabel(overview.range)}</p>
			{#if topForms.length > 0 && now}
				<div
					class="fl-chart fl-chart--fill"
					use:chart={{
						type: 'bars',
						options: {
							labels: topForms.map((f) => f.name),
							full: topForms.map((f) => f.name),
							data: topForms.map((f) => f.n),
							name: 'Submissions',
							title: `Submissions by form, ${rangeLabel(overview.range)}`
						}
					}}
				></div>
			{:else}
				<div class="min-h-[220px] flex-1"></div>
			{/if}
		</section>
	</div>

	<section class="fl-card !p-4">
		<div class="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
			<h2 class="fl-h2">Latest activity</h2>
		</div>
		{#if overview.latest.length > 0}
			<ActivityTable items={overview.latest} />
		{:else}
			<p class="fl-subtle m-0 px-2 pb-4 text-sm">No submissions yet. They'll show up here as they arrive.</p>
		{/if}
	</section>
</div>
