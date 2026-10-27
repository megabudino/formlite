<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { RANGES, type RangeKey } from '$lib/stats';

	// The one time-range filter per page. Writes ?range= so the server returns matching totals.
	let { value }: { value: RangeKey } = $props();

	function select(range: RangeKey) {
		const url = new URL($page.url);
		if (range === '7d') url.searchParams.delete('range');
		else url.searchParams.set('range', range);
		goto(url, { noScroll: true, keepFocus: true, replaceState: true });
	}
</script>

<div class="fl-seg" role="group" aria-label="Time range">
	{#each RANGES as range (range)}
		<button type="button" aria-pressed={value === range} onclick={() => select(range)}>{range}</button>
	{/each}
</div>
