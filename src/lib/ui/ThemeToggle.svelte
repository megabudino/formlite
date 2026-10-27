<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';

	let theme = $state<'light' | 'dark'>('light');

	onMount(() => {
		theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
	});

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
		try {
			localStorage.setItem('fl-theme', theme);
		} catch {
			// Storage can be unavailable (private mode); the switch still works for this page.
		}
	}
</script>

<button
	type="button"
	class="fl-btn fl-btn--ghost fl-btn--sm fl-btn--icon"
	style="width: 36px"
	onclick={toggle}
	aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
	title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
>
	<Icon name={theme === 'dark' ? 'sun' : 'moon'} />
</button>
