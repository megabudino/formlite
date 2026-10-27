<script lang="ts">
	import { Icon } from '$lib/ui';
	import SectionHead from './SectionHead.svelte';

	type Member = {
		name: string;
		role: string;
		bio?: string;
		initials?: string;
		avatarUrl?: string;
		link?: { label: string; href: string };
	};

	type Props = {
		eyebrow?: string;
		title?: string;
		subhead?: string;
		members: Member[];
	};

	let { eyebrow, title, subhead, members }: Props = $props();

	function deriveInitials(name: string): string {
		return name
			.split(/\s+/)
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	let isSolo = $derived(members.length === 1);
</script>

{#snippet avatar(member: Member, cls: string)}
	{#if member.avatarUrl}
		<img
			src={member.avatarUrl}
			alt={member.name}
			loading="lazy"
			class="{cls} rounded-xl bg-accent-tint object-cover object-[50%_25%]"
		/>
	{:else}
		<div
			class="{cls} grid place-items-center rounded-xl bg-accent font-display font-extrabold tracking-[-0.03em] text-on-accent"
		>
			{member.initials ?? deriveInitials(member.name)}
		</div>
	{/if}
{/snippet}

{#snippet memberLink(member: Member)}
	{#if member.link}
		<a href={member.link.href} target="_blank" rel="noopener" class="fl-btn fl-btn--secondary fl-btn--sm mt-6">
			<Icon name="globe" size={16} />
			{member.link.label}
			<Icon name="arrow-up-right" size={16} />
		</a>
	{/if}
{/snippet}

<section>
	<div class="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
		<SectionHead {eyebrow} {title} {subhead} />

		{#if isSolo}
			{@const member = members[0]}
			<article
				class="fl-card relative mt-12 !grid items-center gap-8 overflow-hidden !p-6 sm:mt-16 sm:grid-cols-[auto_1fr] sm:gap-10 sm:!p-10"
			>
				<div class="pointer-events-none absolute -right-6 bottom-8 hidden w-56 md:block" aria-hidden="true">
					<div class="fl-bars">
						<i class="w-full bg-accent-tint"></i>
						<i class="w-[70%] bg-accent-tint"></i>
						<i class="w-[36%] bg-amber"></i>
					</div>
				</div>

				{@render avatar(member, 'h-36 w-36 text-5xl sm:h-44 sm:w-44')}

				<div class="relative min-w-0 md:pr-48">
					<p class="fl-overline">{member.role}</p>
					<h3
						class="mt-2 font-display text-[clamp(2rem,4.5vw,2.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em]"
					>
						{member.name}
					</h3>
					{#if member.bio}
						<p class="mt-4 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg sm:leading-relaxed">
							{member.bio}
						</p>
					{/if}
					{@render memberLink(member)}
				</div>
			</article>
		{:else}
			<div class="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2" class:lg:grid-cols-3={members.length >= 3}>
				{#each members as member}
					<article class="fl-card !flex flex-col items-start">
						{@render avatar(member, 'h-24 w-24 text-3xl')}
						<p class="fl-overline mt-6">{member.role}</p>
						<h3 class="fl-card__title !mt-1">{member.name}</h3>
						{#if member.bio}
							<p class="mt-3 text-[15px] leading-relaxed text-fg-muted">{member.bio}</p>
						{/if}
						{@render memberLink(member)}
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>
