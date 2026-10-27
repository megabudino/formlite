<script lang="ts">
	import { chart } from '$lib/charts';
	import { computeDelta, rangeLabel, type Overview, type Series } from '$lib/stats';
	import Icon from '../Icon.svelte';

	// Submissions and blocked requests over time. The two totals sit in the header and
	// double as the chart's legend, so there's no separate row of stat cards.
	let {
		totals,
		range,
		series
	}: {
		totals: Overview['totals'];
		range: Overview['range'];
		series: Series | null;
	} = $props();

	const metrics = $derived([
		{
			label: 'Submissions',
			slot: 1,
			value: totals.submissions,
			delta: computeDelta(totals.submissions, totals.submissionsPrev, range),
			goodWhen: 'up'
		},
		{
			label: 'Spam blocked',
			slot: 4,
			value: totals.blocked,
			delta: computeDelta(totals.blocked, totals.blockedPrev, range),
			goodWhen: 'down'
		}
	] as const);

	const empty = $derived(totals.submissions + totals.blocked === 0);
</script>

<section class="fl-card flex flex-col gap-5">
	<div class="flex flex-wrap items-start gap-x-10 gap-y-4">
		<h2 class="sr-only">Traffic, {rangeLabel(range)}</h2>
		<div class="grid w-full grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:w-auto sm:gap-x-10">
			{#each metrics as m (m.label)}
				{@const tone =
					m.delta.direction === 'flat' ? '' : m.delta.direction === m.goodWhen ? 'fl-delta--good' : 'fl-delta--bad'}
				<div class="grid min-w-0 gap-1">
					<span class="fl-overline flex items-center gap-2">
						<i class="inline-block h-2.5 w-2.5 rounded-[3px]" style="background: var(--chart-{m.slot})"></i>
						{m.label}
					</span>
					<span class="fl-stat__value">{m.value.toLocaleString()}</span>
					<span class="fl-delta {tone}">
						<Icon
							name={m.delta.direction === 'up' ? 'arrow-up-right' : m.delta.direction === 'down' ? 'arrow-down-right' : 'minus'}
							size={12}
						/>
						{m.delta.text}
					</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="relative flex flex-1 flex-col">
		{#if series}
			<div
				class="fl-chart fl-chart--fill"
				use:chart={{
					type: 'trend',
					options: {
						labels: series.labels,
						full: series.full,
						title: `Submissions and blocked requests, ${rangeLabel(range)}`,
						series: [
							{ name: 'Submissions', slot: 1, data: series.submissions },
							{ name: 'Blocked', slot: 4, data: series.blocked }
						]
					}
				}}
			></div>
		{:else}
			<div class="min-h-[220px] flex-1"></div>
		{/if}
		{#if empty}
			<p class="fl-subtle pointer-events-none absolute inset-x-0 top-[38%] m-0 text-center text-sm">
				Nothing in the {rangeLabel(range)}
			</p>
		{/if}
	</div>
</section>
