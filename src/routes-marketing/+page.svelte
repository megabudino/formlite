<svelte:head>
	<title>Formlite — Self-hosted form backend</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-white via-mint-50/40 to-white">
	<header class="border-b border-ink-100/80 bg-white/80 backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
			<a href="/" class="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink-900">
				<span
					class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500 text-white shadow-sm"
				>
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
						<path d="M4 6h16" />
						<path d="M4 12h10" />
						<path d="M4 18h7" />
					</svg>
				</span>
				Formlite
			</a>

			<nav class="flex items-center gap-3">
				<a
					href="/auth/login"
					class="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition hover:text-ink-900"
				>
					Log in
				</a>
				<a
					href="/setup"
					class="rounded-lg bg-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600"
				>
					Get started
				</a>
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-6 py-20 sm:py-28">
		<div class="mx-auto max-w-3xl text-center">
			<span
				class="inline-flex items-center gap-2 rounded-full border border-mint-200 bg-mint-50 px-3 py-1 text-xs font-medium text-mint-700"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-mint-500"></span>
				Self-hosted form backend
			</span>
			<h1
				class="mt-6 text-balance text-5xl font-extrabold tracking-tight text-ink-900 sm:text-6xl"
			>
				Forms that just
				<span
					class="bg-gradient-to-br from-mint-500 to-mint-700 bg-clip-text text-transparent"
					>work</span
				>.
			</h1>
			<p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
				A fresh, self-hosted alternative to Formspree. Point your HTML form at an endpoint and
				start receiving submissions by email and webhook — no backend, no JavaScript required.
			</p>

			<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a
					href="/setup"
					class="inline-flex items-center justify-center rounded-lg bg-mint-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-mint-600 hover:shadow"
				>
					Create your first form
				</a>
				<a
					href="/auth/login"
					class="inline-flex items-center justify-center rounded-lg border border-ink-200 bg-white px-6 py-3 text-base font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
				>
					I already have an account
				</a>
			</div>
		</div>

		<div class="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
			{#each [{ icon: '✉️', title: 'Email notifications', body: 'Get every submission delivered straight to your inbox via Mailgun.' }, { icon: '🔗', title: 'Signed webhooks', body: 'Forward data to your own services with HMAC-signed payloads.' }, { icon: '🍯', title: 'Spam protection', body: 'Honeypot fields and allowed-domain rules out of the box.' }] as feature}
				<div
					class="rounded-xl border border-ink-100 bg-white p-6 shadow-card transition hover:shadow-card-hover"
				>
					<div
						class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-mint-100 text-lg"
					>
						{feature.icon}
					</div>
					<h3 class="font-semibold text-ink-900">{feature.title}</h3>
					<p class="mt-1.5 text-sm leading-relaxed text-ink-600">{feature.body}</p>
				</div>
			{/each}
		</div>
	</main>

	<footer class="border-t border-ink-100 bg-white/60">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-ink-500 sm:flex-row"
		>
			<p>Formlite — self-hosted form backend.</p>
			<a
				href="https://github.com"
				class="font-medium text-ink-600 hover:text-mint-600"
				target="_blank"
				rel="noopener"
			>
				Open source on GitHub →
			</a>
		</div>
	</footer>
</div>
