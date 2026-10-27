<script lang="ts">
	import Mark from './Mark.svelte';

	let { href = '/', size = 32 }: { href?: string; size?: number } = $props();
</script>

<a class="fl-brand" {href} aria-label="Formlite home">
	<Mark {size} />
	<span>Formlite</span>
</a>
