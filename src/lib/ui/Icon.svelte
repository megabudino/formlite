<script lang="ts" module>
	// Feather-style line icons from the design system (24px grid, round caps and joins).
	// Stroke widths follow the system: 2.5 for plus and arrows, 3 for check, 2 for the rest.
	const ICONS = {
		plus: { w: 2.5, d: '<path d="M12 5v14"/><path d="M5 12h14"/>' },
		'arrow-right': { w: 2.5, d: '<path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>' },
		'arrow-up-right': { w: 2.5, d: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>' },
		'arrow-down-right': { w: 2.5, d: '<path d="M7 7l10 10"/><path d="M17 7v10H7"/>' },
		minus: { w: 2.5, d: '<path d="M5 12h14"/>' },
		dollar: {
			w: 2,
			d: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'
		},
		menu: { w: 2, d: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>' },
		sparkles: {
			w: 2,
			d: '<path d="M9.94 14.06 4 20"/><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>'
		},
		book: {
			w: 2,
			d: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>'
		},
		activity: { w: 2, d: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
		check: { w: 3, d: '<polyline points="20 6 9 17 4 12"/>' },
		'chevron-left': { w: 2, d: '<polyline points="15 18 9 12 15 6"/>' },
		'chevron-right': { w: 2, d: '<polyline points="9 18 15 12 9 6"/>' },
		copy: {
			w: 2,
			d: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'
		},
		file: {
			w: 2,
			d: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
		},
		folder: {
			w: 2,
			d: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'
		},
		x: { w: 2.5, d: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>' },
		// Lucide additions at the same stroke width
		'log-out': {
			w: 2,
			d: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
		},
		sun: {
			w: 2,
			d: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'
		},
		moon: { w: 2, d: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
		alert: {
			w: 2,
			d: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
		},
		'check-circle': {
			w: 2,
			d: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
		},
		inbox: {
			w: 2,
			d: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'
		},
		shield: { w: 2, d: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
		code: { w: 2, d: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' },
		settings: {
			w: 2,
			d: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'
		},
		eye: {
			w: 2,
			d: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
		},
		'eye-off': {
			w: 2,
			d: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>'
		},
		trash: {
			w: 2,
			d: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'
		},
		webhook: {
			w: 2,
			d: '<path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>'
		},
		mail: {
			w: 2,
			d: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'
		},
		globe: {
			w: 2,
			d: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
		},
		key: {
			w: 2,
			d: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>'
		},
		github: {
			w: 2,
			d: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>'
		}
	} as const;

	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	let {
		name,
		size = 18,
		class: className = ''
	}: { name: IconName; size?: number; class?: string } = $props();

	const icon = $derived(ICONS[name]);
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width={icon.w}
	stroke-linecap="round"
	stroke-linejoin="round"
	class="flex-none {className}"
	aria-hidden="true"
	focusable="false"
>
	{@html icon.d}
</svg>
