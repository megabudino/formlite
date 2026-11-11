<script lang="ts">
	let {
		subject,
		html,
		from,
		to,
		replyTo = '',
		compact = false
	}: {
		subject: string;
		html: string;
		from: string;
		to: string;
		replyTo?: string;
		compact?: boolean;
	} = $props();

	let frame: HTMLIFrameElement | undefined = $state();
	let height = $state(240);

	// Links in the preview open in a new tab instead of inside the frame
	const srcdoc = $derived(
		/<head[^>]*>/i.test(html)
			? html.replace(/<head[^>]*>/i, (head) => `${head}<base target="_blank">`)
			: `<base target="_blank">${html}`
	);

	// Scripts never run in the frame (no allow-scripts); same-origin only lets us measure its height
	function fit() {
		const doc = frame?.contentDocument;
		if (doc?.documentElement) height = Math.max(120, doc.documentElement.scrollHeight);
	}
</script>

<div class="fl-mail" class:fl-mail--compact={compact}>
	<dl class="fl-mail__head">
		<div><dt>From</dt><dd>{from}</dd></div>
		<div><dt>To</dt><dd>{to}</dd></div>
		{#if replyTo}
			<div><dt>Reply-To</dt><dd>{replyTo}</dd></div>
		{/if}
		<div class="fl-mail__subject"><dt>Subject</dt><dd>{subject || '(no subject)'}</dd></div>
	</dl>
	<div class="fl-mail__body">
		<iframe
			bind:this={frame}
			title="Email preview"
			{srcdoc}
			sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
			style="height:{height}px"
			tabindex={compact ? -1 : undefined}
			onload={fit}
		></iframe>
	</div>
</div>
