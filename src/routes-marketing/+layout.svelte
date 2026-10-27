<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<!-- The marketing site is always dark. Set in <head> so the page never flashes light first. -->
<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#06120d" />
	{@html '<script>document.documentElement.setAttribute("data-theme","dark")</script>'}
</svelte:head>

{@render children()}
