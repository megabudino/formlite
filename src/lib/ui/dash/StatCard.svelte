<script lang="ts">
	import { spark } from '$lib/charts';
	import type { Delta } from '$lib/stats';
	import Icon from '../Icon.svelte';

	// A KPI tile: label, number, change against the previous period, sparkline.
	// `goodWhen` says which direction is good news (spam going down is good).
	let {
		label,
		value,
		delta = null,
		goodWhen = 'up',
		help = '',
		points = null,
		slot = 1,
		accent = false,
		href = ''
	}: {
		label: string;
		value: string;
		delta?: Delta | null;
		goodWhen?: 'up' | 'down';
		help?: string;
		points?: number[] | null;
		slot?: 1 | 2 | 3 | 4;
		accent?: boolean;
		href?: string;
	} = $props();

	const tone = $derived(
		!delta || delta.direction === 'flat'
			? ''
			: delta.direction === goodWhen
				? 'fl-delta--good'
				: 'fl-delta--bad'
	);
</script>

<svelte:element
	this={href ? 'a' : 'div'}
	{href}
	class="fl-card fl-stat content-start {accent ? 'fl-card--accent' : ''} {href ? 'fl-card--link' : ''}"
>
	<span class="fl-overline">{label}</span>
	<span class="fl-stat__value {accent ? 'fl-stat__value--xl' : ''}">{value}</span>
	{#if delta}
		<span class="fl-delta {accent ? '' : tone}">
			<Icon
				name={delta.direction === 'up' ? 'arrow-up-right' : delta.direction === 'down' ? 'arrow-down-right' : 'minus'}
				size={12}
			/>
			{delta.text}
		</span>
	{:else if help}
		<span class="fl-help" style={accent ? 'color: var(--on-accent)' : ''}>{help}</span>
	{/if}
	{#if points}
		<svg
			class="fl-spark"
			style="color: {accent ? 'var(--on-accent)' : `var(--chart-${slot})`}"
			use:spark={points}
			aria-hidden="true"
		></svg>
	{:else if delta && help}
		<span class="fl-help">{help}</span>
	{/if}
</svelte:element>
