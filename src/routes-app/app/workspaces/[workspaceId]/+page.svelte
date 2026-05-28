<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	function handleCreateForm() {
		goto(`/app/forms/new?workspace_id=${data.workspace.id}`);
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>{data.workspace.name} — Formlite</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<a
			href="/app"
			class="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-ink-700"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-3.5 w-3.5"
			>
				<polyline points="15 18 9 12 15 6" />
			</svg>
			All workspaces
		</a>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
					{data.workspace.name}
				</h1>
				<p class="mt-1 text-sm text-ink-500">Forms living in this workspace.</p>
			</div>
			<button
				type="button"
				onclick={handleCreateForm}
				class="inline-flex items-center gap-1.5 rounded-lg bg-mint-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600"
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
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				New form
			</button>
		</div>
	</div>

	{#if data.forms.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-white px-6 py-16 text-center"
		>
			<div
				class="flex h-14 w-14 items-center justify-center rounded-full bg-mint-100 text-mint-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-7 w-7"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14 2 14 8 20 8" />
				</svg>
			</div>
			<h2 class="mt-4 text-lg font-semibold text-ink-900">No forms yet</h2>
			<p class="mt-1 max-w-sm text-sm text-ink-500">
				Create your first form in this workspace.
			</p>
			<button
				type="button"
				onclick={handleCreateForm}
				class="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-mint-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600"
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
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				Create your first form
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.forms as form}
				<div
					class="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card transition hover:border-mint-200 hover:shadow-card-hover"
				>
					<a href="/app/forms/{form.id}" class="block p-5">
						<div class="flex items-start justify-between gap-3">
							<h3 class="text-base font-semibold tracking-tight text-ink-900">
								{form.name}
							</h3>
							<span
								class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider {form.is_active ===
								1
									? 'bg-mint-100 text-mint-700'
									: 'bg-ink-100 text-ink-500'}"
							>
								{form.is_active === 1 ? 'Active' : 'Inactive'}
							</span>
						</div>
						<p class="mt-3 text-sm text-ink-600">
							{form.submission_count === 0
								? 'No submissions yet'
								: form.submission_count === 1
									? '1 submission'
									: `${form.submission_count} submissions`}
						</p>
						<p class="mt-1 text-xs text-ink-400">Created {formatDate(form.created_at)}</p>
					</a>
					<div class="border-t border-ink-100 bg-ink-50/60 px-5 py-3">
						<form method="POST" action="?/toggleActive" use:enhance class="m-0">
							<input type="hidden" name="formId" value={form.id} />
							<input
								type="hidden"
								name="isActive"
								value={form.is_active === 1 ? '0' : '1'}
							/>
							<label
								class="inline-flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-ink-700"
							>
								<input
									type="checkbox"
									checked={form.is_active === 1}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
									class="peer sr-only"
								/>
								<span
									class="relative h-6 w-11 rounded-full bg-ink-300 transition peer-checked:bg-mint-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:after:translate-x-5"
								></span>
								<span>{form.is_active === 1 ? 'Active' : 'Inactive'}</span>
							</label>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
