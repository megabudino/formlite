<script lang="ts">
	// The Formlite mark: mint tile, three forest bars (fields) and a dot (submit).
	// Fixed brand colours, identical on light and dark grounds.
	let { size = 32, class: className = '' }: { size?: number; class?: string } = $props();
</script>

<svg
	viewBox="0 0 128 128"
	width={size}
	height={size}
	class={className}
	aria-hidden="true"
	focusable="false"
>
	<rect width="128" height="128" rx="32" fill="var(--brand-mint)" />
	<g fill="var(--brand-forest)">
		<rect x="32" y="32" width="64" height="16" rx="8" />
		<rect x="32" y="56" width="46" height="16" rx="8" />
		<rect x="32" y="80" width="24" height="16" rx="8" />
		<circle cx="74" cy="88" r="8" />
	</g>
</svg>
