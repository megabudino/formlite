<script lang="ts">
	import { goto } from '$app/navigation';
	import { parseUtc, reasonLabel, type ActivityItem } from '$lib/stats';

	// Latest submissions and blocked requests, newest first.
	let { items, showForm = true }: { items: ActivityItem[]; showForm?: boolean } = $props();

	function when(value: string) {
		const d = parseUtc(value);
		const today = new Date();
		const sameDay = d.toDateString() === today.toDateString();
		return sameDay
			? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
			: d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function hrefFor(item: ActivityItem) {
		return `/forms/${item.formId}?tab=${item.kind === 'blocked' ? 'spam' : 'submissions'}`;
	}
</script>

<div class="fl-table-wrap">
	<table class="fl-table">
		<thead>
			<tr>
				<th>Time</th>
				{#if showForm}<th>Form</th>{/if}
				<th>From</th>
				<th>Status</th>
				<th style="text-align:right">Fields</th>
			</tr>
		</thead>
		<tbody>
			{#each items as item (`${item.kind}-${item.id}`)}
				<tr class="cursor-pointer" onclick={() => goto(hrefFor(item))}>
					<td class="data">{when(item.createdAt)}</td>
					{#if showForm}
						<td>
							<a href={hrefFor(item)} class="font-semibold text-fg no-underline hover:underline"
								>{item.formName}</a
							>
						</td>
					{/if}
					<td class="max-w-[260px] truncate">
						{#if item.from}{item.from}{:else}<span class="fl-subtle">—</span>{/if}
					</td>
					<td>
						{#if item.kind === 'submission'}
							<span class="fl-badge fl-badge--live">Received</span>
						{:else}
							<span class="fl-badge fl-badge--spam">{reasonLabel(item.reason)}</span>
						{/if}
					</td>
					<td class="num">{item.fieldCount}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
