<script lang="ts">
	import { onMount } from 'svelte';
	import { chart } from '$lib/charts';
	import { buildSeries, computeDelta, rangeLabel, type Overview } from '$lib/stats';
	import StatCard from './StatCard.svelte';
	import ActivityTable from './ActivityTable.svelte';

	// The overview block shared by the dashboard and a workspace: three stat cards,
	// traffic trend plus submissions by form, then the latest activity.
	let { overview }: { overview: Overview } = $props();

	// Series depend on the viewer's time zone, so they're built in the browser.
	let now = $state<Date | null>(null);
	onMount(() => (now = new Date()));

	const series = $derived(now ? buildSeries(overview.buckets, overview.range, now) : null);
	const t = $derived(overview.totals);
	const topForms = $derived(overview.byForm.slice(0, 12));
	const hasTraffic = $derived(t.submissions + t.blocked > 0);
</script>

<div class="grid grid-cols-[minmax(0,1fr)] gap-4">
	<div class="fl-grid-stats gap-4">
		<StatCard
			accent
			label="Submissions · {overview.range}"
			value={t.submissions.toLocaleString()}
			delta={computeDelta(t.submissions, t.submissionsPrev, overview.range)}
			points={series?.submissions ?? null}
		/>
		<StatCard
			label="Spam blocked · {overview.range}"
			value={t.blocked.toLocaleString()}
			delta={computeDelta(t.blocked, t.blockedPrev, overview.range)}
			goodWhen="down"
			points={series?.blocked ?? null}
			slot={4}
		/>
		<StatCard
			label="Forms live"
			value="{overview.forms.live} of {overview.forms.total}"
			help={overview.forms.total - overview.forms.live === 0
				? 'Every form accepts submissions'
				: `${overview.forms.total - overview.forms.live} paused`}
		/>
	</div>

	<div class="fl-grid-split gap-4">
		<section class="fl-card">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<h2 class="fl-h2">Traffic</h2>
				<div class="fl-legend">
					<span><i style="background:var(--chart-1)"></i>Submissions</span>
					<span><i style="background:var(--chart-4)"></i>Blocked</span>
				</div>
			</div>
			<div class="relative">
				{#if series}
					<div
						class="fl-chart"
						use:chart={{
							type: 'trend',
							options: {
								labels: series.labels,
								full: series.full,
								title: `Submissions and blocked requests, ${rangeLabel(overview.range)}`,
								series: [
									{ name: 'Submissions', slot: 1, data: series.submissions },
									{ name: 'Blocked', slot: 4, data: series.blocked }
								]
							}
						}}
					></div>
				{:else}
					<div class="h-[240px]"></div>
				{/if}
				{#if !hasTraffic}
					<p class="fl-subtle pointer-events-none absolute inset-x-0 top-[38%] m-0 text-center text-sm">
						Nothing in the {rangeLabel(overview.range)}
					</p>
				{/if}
			</div>
		</section>

		<section class="fl-card">
			<h2 class="fl-h2 mb-4">Submissions by form</h2>
			{#if topForms.length > 0 && now}
				<div
					class="fl-chart"
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
				<div class="h-[240px]"></div>
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
