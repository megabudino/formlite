<script lang="ts">
	import { Icon, type IconName } from '$lib/ui';
	import SectionHead from './SectionHead.svelte';

	type PainPoint = {
		icon: IconName;
		title: string;
		body: string;
	};

	type Props = {
		eyebrow?: string;
		title?: string;
		subhead?: string;
		items: PainPoint[];
	};

	let { eyebrow, title, subhead, items }: Props = $props();
</script>

<section class="border-t border-line">
	<div class="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
		<SectionHead {eyebrow} {title} {subhead} />

		<div class="mt-12 grid gap-4 sm:mt-16 md:grid-cols-3">
			{#each items as item, i}
				<article class="fl-card !flex flex-col">
					<div class="fl-card__head">
						<span class="fl-card__tile"><Icon name={item.icon} size={20} /></span>
						<span class="font-mono text-xs font-medium text-fg-subtle">
							{String(i + 1).padStart(2, '0')}
						</span>
					</div>
					<h3 class="fl-card__title">{item.title}</h3>
					<p class="mt-3 text-[15px] leading-relaxed text-fg-muted">{item.body}</p>
				</article>
			{/each}
		</div>
	</div>
</section>
