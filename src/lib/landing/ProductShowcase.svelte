<script lang="ts">
	import SectionHead from './SectionHead.svelte';

	type Image = { src: string; width: number; height: number };

	type Shot = Image & {
		alt: string;
		/** Phone-sized capture shown below 640px, where the desktop one would be unreadable */
		mobile?: Image;
	};

	type Row = Shot & { title: string; body: string };

	type Props = {
		eyebrow?: string;
		title?: string;
		subhead?: string;
		hero: Shot & { label?: string };
		rows?: Row[];
	};

	let { eyebrow, title, subhead, hero, rows = [] }: Props = $props();
</script>

{#snippet picture(shot: Shot)}
	<picture>
		{#if shot.mobile}
			<source
				media="(max-width: 639px)"
				srcset={shot.mobile.src}
				width={shot.mobile.width}
				height={shot.mobile.height}
			/>
		{/if}
		<img
			src={shot.src}
			alt={shot.alt}
			width={shot.width}
			height={shot.height}
			loading="lazy"
			decoding="async"
		/>
	</picture>
{/snippet}

<!-- Real screenshots of the app, framed like a browser window on wide screens -->
<section class="relative overflow-hidden pt-20 pb-24 sm:pt-0 sm:pb-28">
	<div class="mx-auto max-w-[1200px] px-4 sm:px-6">
		<SectionHead {eyebrow} {title} {subhead} />

		<div class="relative mt-6 sm:mt-16">
			<div class="hidden sm:block" aria-hidden="true">
				<div
					class="absolute -top-6 -right-6 h-40 w-[60%] rounded-xl bg-accent-tint sm:-top-10 sm:-right-10 sm:h-64 sm:w-[46%]"
				></div>
				<div
					class="absolute -bottom-6 -left-6 h-28 w-32 rounded-xl bg-amber sm:-bottom-10 sm:-left-10 sm:h-40 sm:w-64"
				></div>
			</div>

			<figure class="shot relative m-0">
				<div class="shot__bar" aria-hidden="true">
					<span class="flex gap-1.5">
						<i class="bg-danger"></i>
						<i class="bg-amber"></i>
						<i class="bg-accent"></i>
					</span>
					{#if hero.label}
						<span class="shot__url">{hero.label}</span>
					{/if}
				</div>
				{@render picture(hero)}
			</figure>
		</div>

		{#each rows as row, i (row.src)}
			<div class="row" class:row--flip={i % 2 === 1}>
				<div class="row__text">
					<h3 class="m-0 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.08] font-bold tracking-[-0.03em]">
						{row.title}
					</h3>
					<p class="m-0 mt-3 max-w-md text-lg leading-relaxed text-fg-muted lg:mt-4">{row.body}</p>
				</div>
				<figure class="m-0 min-w-0">
					<div class="shot shot--row">
						{@render picture(row)}
					</div>
				</figure>
			</div>
		{/each}
	</div>
</section>

<style>
	.shot {
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius-xl);
		background: var(--surface);
		box-shadow: var(--shadow-md);
	}
	.shot :global(img) {
		display: block;
		width: 100%;
		height: auto;
	}
	.shot__bar {
		display: flex;
		align-items: center;
		gap: 16px;
		height: 44px;
		padding: 0 18px;
		border-bottom: 1px solid var(--line);
		background: var(--surface-2);
	}
	.shot__bar i {
		display: block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		opacity: 0.85;
	}
	.shot__url {
		flex: 1;
		max-width: 360px;
		margin: 0 auto;
		padding: 4px 14px;
		border-radius: var(--radius-pill);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-subtle);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* One screenshot per row: text beside it on wide screens, alternating sides */
	/* Phones: the caption sits tight on its own screenshot, with clear air before the next pair */
	.row {
		display: grid;
		gap: 24px;
		margin-top: 112px;
	}
	@media (min-width: 1024px) {
		.row {
			grid-template-columns: minmax(0, 1fr) minmax(0, 2.1fr);
			align-items: center;
			gap: 56px;
			margin-top: 112px;
		}
		.row--flip {
			grid-template-columns: minmax(0, 2.1fr) minmax(0, 1fr);
		}
		.row--flip .row__text {
			order: 2;
		}
	}
	.shot--row {
		border-radius: var(--radius-lg);
	}

	/* Phones: phone-sized captures in a plain card, no browser bar */
	@media (max-width: 639px) {
		.shot__bar {
			display: none;
		}
		.shot,
		.shot--row {
			border-radius: var(--radius-lg);
		}
	}
</style>
