<script lang="ts">
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

<section class="bg-white">
	<div class="mx-auto max-w-6xl px-6 py-24 sm:py-32">
		{#if eyebrow || title || subhead}
			<div class="mx-auto max-w-3xl text-center">
				{#if eyebrow}
					<div class="flex items-center justify-center gap-4">
						<span class="h-px w-10 bg-mint-500"></span>
						<span
							class="font-mono text-xs uppercase tracking-[0.25em] text-mint-700"
						>
							{eyebrow}
						</span>
						<span class="h-px w-10 bg-mint-500"></span>
					</div>
				{/if}
				{#if title}
					<h2
						class="mt-8 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl"
					>
						{title}
					</h2>
				{/if}
				{#if subhead}
					<p class="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-600 sm:text-xl">
						{subhead}
					</p>
				{/if}
			</div>
		{/if}

		{#if isSolo}
			{@const member = members[0]}
			<div
				class="mx-auto mt-16 grid max-w-4xl items-center gap-10 sm:grid-cols-[auto_1fr] sm:gap-14"
			>
				<div class="flex justify-center sm:justify-start">
					{#if member.avatarUrl}
						<img
							src={member.avatarUrl}
							alt={member.name}
							class="h-40 w-40 rounded-full object-cover sm:h-48 sm:w-48 object-[50%_25%]"
						/>
					{:else}
						<div
							class="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-mint-300 via-mint-500 to-mint-700 sm:h-48 sm:w-48"
						>
							<span class="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
								{member.initials ?? deriveInitials(member.name)}
							</span>
						</div>
					{/if}
				</div>

				<div class="text-center sm:text-left">
					<p
						class="font-mono text-xs uppercase tracking-[0.25em] text-mint-700"
					>
						{member.role}
					</p>
					<h3
						class="mt-3 text-balance text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl"
					>
						{member.name}
					</h3>
					{#if member.bio}
						<p class="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
							{member.bio}
						</p>
					{/if}
					{#if member.link}
						<a
							href={member.link.href}
							target="_blank"
							rel="noopener"
							class="mt-6 inline-flex items-center gap-2 text-base font-semibold text-ink-900 transition hover:text-mint-700"
						>
							<span class="relative">
								{member.link.label}
								<span class="absolute inset-x-0 -bottom-0.5 h-0.5 bg-mint-500"></span>
							</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="h-4 w-4"
							>
								<path d="M7 17 17 7" />
								<path d="M7 7h10v10" />
							</svg>
						</a>
					{/if}
				</div>
			</div>
		{:else}
			<div
				class="mt-16 grid gap-12 sm:grid-cols-2 sm:gap-10"
				class:lg:grid-cols-3={members.length >= 3}
			>
				{#each members as member}
					<article class="flex flex-col items-start">
						{#if member.avatarUrl}
							<img
								src={member.avatarUrl}
								alt={member.name}
								class="h-24 w-24 rounded-full object-cover"
							/>
						{:else}
							<div
								class="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-mint-300 via-mint-500 to-mint-700 text-3xl font-extrabold text-white"
							>
								{member.initials ?? deriveInitials(member.name)}
							</div>
						{/if}
						<p
							class="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-mint-700"
						>
							{member.role}
						</p>
						<h3
							class="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl"
						>
							{member.name}
						</h3>
						{#if member.bio}
							<p class="mt-3 text-base leading-relaxed text-ink-600">{member.bio}</p>
						{/if}
						{#if member.link}
							<a
								href={member.link.href}
								target="_blank"
								rel="noopener"
								class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-900 transition hover:text-mint-700"
							>
								<span class="relative">
									{member.link.label}
									<span class="absolute inset-x-0 -bottom-0.5 h-0.5 bg-mint-500"></span>
								</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="h-3.5 w-3.5"
								>
									<path d="M7 17 17 7" />
									<path d="M7 7h10v10" />
								</svg>
							</a>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</div>
</section>
