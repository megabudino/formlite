<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { Icon } from '$lib/ui';
	import IntegrationGuide from '$lib/ui/IntegrationGuide.svelte';

	let { data }: { data: PageData } = $props();

	const actionUrl = $derived(`${$page.url.origin}/s/${data.form.id}`);
</script>

<svelte:head>
	<title>Integration guide · {data.form.name} — Formlite</title>
</svelte:head>

<div class="mx-auto grid max-w-[880px] grid-cols-[minmax(0,1fr)] gap-8">
	<div>
		<a href="/forms/{data.form.id}" class="fl-back">
			<Icon name="chevron-left" size={16} />{data.form.name}
		</a>
		<span class="fl-overline mt-3 block">
			{data.workspace ? `${data.workspace.name} · ` : ''}{data.form.name}
		</span>
		<h1 class="fl-h1 mt-1.5">Integration guide</h1>
		<p class="fl-muted m-0 mt-1.5 max-w-[600px]">
			Everything you need to connect a website to this form: the endpoint, a prompt for your AI
			assistant and copy-ready code.
		</p>
	</div>

	{#if !data.form.isActive}
		<div class="fl-alert fl-alert--warning" role="status">
			<Icon name="alert" size={20} class="fl-alert__icon" />
			<div>
				<strong>This form is paused.</strong> It answers every request with 410 until you turn
				"Accept submissions" back on.
			</div>
		</div>
	{/if}

	<section class="fl-card sm:!p-10">
		<IntegrationGuide {actionUrl} />
	</section>
</div>
