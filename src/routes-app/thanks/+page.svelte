<script lang="ts">
	import { Icon } from '$lib/ui';
</script>

<svelte:head>
	<title>Thank you — Formlite</title>
</svelte:head>

<!-- Shown to people who submit a form without a redirect URL, so it stays neutral and brief. -->
<div class="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
	<div class="fl-card w-full max-w-[440px] !rounded-xl !p-10 text-center sm:!p-12">
		<div
			class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent text-on-accent shadow-glow"
		>
			<Icon name="check" size={28} />
		</div>
		<h1 class="fl-h1 mt-6">Thank you!</h1>
		<p class="fl-muted mt-2">Your message is on its way. You can close this page.</p>
		<button type="button" class="fl-btn fl-btn--secondary mt-8" onclick={() => history.back()}>
			<Icon name="chevron-left" size={16} />
			Go back
		</button>
	</div>
</div>
