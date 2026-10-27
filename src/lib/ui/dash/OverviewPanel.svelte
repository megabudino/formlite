<script lang="ts">
	import { onMount } from 'svelte';
	import { chart } from '$lib/charts';
	import { buildHeatmap, buildSeries, rangeLabel, type Overview } from '$lib/stats';
	import TrafficCard from './TrafficCard.svelte';
	import ActivityTable from './ActivityTable.svelte';

	// Every chart for a workspace, optionally narrowed to one form:
	// traffic, submissions by form (all forms only), when people write, latest activity.
	let { overview, filtered = false }: { overview: Overview; filtered?: boolean } = $props();

	// Series depend on the viewer's time zone, so they're built in the browser.
	let now = $state<Date | null>(null);
	onMount(() => (now = new Date()));

	const series = $derived(now ? buildSeries(overview.buckets, overview.range, now) : null);
	const heat = $derived(now ? buildHeatmap(overview.buckets) : null);
	const topForms = $derived(overview.byForm.slice(0, 12));
	const weekdays = $derived(
		Array.from({ length: 7 }, (_, i) =>
			new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'short' })
		)
	);
</script>

<div class="fl-overview" data-filtered={filtered}>
	<div class="fl-overview__traffic">
		<TrafficCard
			totals={overview.totals}
			range={overview.range}
			{series}
		/>
	</div>

	{#if !filtered}
		<section class="fl-card fl-overview__bars flex flex-col">
			<div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<h2 class="fl-h2">Submissions by form</h2>
				<span class="fl-overline">{rangeLabel(overview.range)}</span>
			</div>
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
	{/if}

	<section class="fl-card fl-overview__heat">
		<div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
			<h2 class="fl-h2">When people write</h2>
			<span class="fl-overline" title="In your time zone">Last 30 days</span>
		</div>
		{#if heat}
			<div class="fl-heat" use:chart={{ type: 'heat', options: { rows: heat, days: weekdays } }}></div>
			<div class="mt-3 flex justify-between font-mono text-[11px] text-fg-subtle" style="padding-left:32px">
				<span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
			</div>
			<div class="fl-ramp mt-3 justify-end">
				Less <i class="bg-surface-2"></i><i style="background:var(--seq-1)"></i><i
					style="background:var(--seq-2)"
				></i><i style="background:var(--seq-3)"></i><i style="background:var(--seq-4)"></i><i
					style="background:var(--seq-5)"
				></i> More
			</div>
		{:else}
			<div class="min-h-[200px]"></div>
		{/if}
	</section>

	<section class="fl-card fl-overview__activity !p-4">
		<div class="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
			<h2 class="fl-h2">Latest activity</h2>
		</div>
		{#if overview.latest.length > 0}
			<ActivityTable items={overview.latest} showForm={!filtered} />
		{:else}
			<p class="fl-subtle m-0 px-2 pb-4 text-sm">No submissions yet. They'll show up here as they arrive.</p>
		{/if}
	</section>
</div>
