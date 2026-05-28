<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let name = $state(form?.name ?? '');
	let targetEmail = $state(form?.targetEmail ?? data.userEmail);
	let workspaceId = $state(form?.workspaceId ?? data.preselectedWorkspaceId);
	let submitting = $state(false);

	const backHref = $derived(workspaceId ? `/app/workspaces/${workspaceId}` : '/app');
</script>

<svelte:head>
	<title>Create new form — Freeform</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<div>
		<a
			href={backHref}
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
			Back
		</a>
		<h1 class="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Create new form</h1>
		<p class="mt-1 text-sm text-ink-500">A form is an endpoint to receive submissions on.</p>
	</div>

	<div class="rounded-xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
		<form method="POST" onsubmit={() => (submitting = true)} class="space-y-5">
			{#if form?.error}
				<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			<div>
				<label for="workspaceId" class="mb-1.5 block text-sm font-medium text-ink-700">
					Workspace
				</label>
				<select
					id="workspaceId"
					name="workspaceId"
					bind:value={workspaceId}
					required
					class="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30"
				>
					<option value="" disabled>Choose workspace…</option>
					{#each data.workspaces as workspace}
						<option value={workspace.id}>{workspace.name}</option>
					{/each}
				</select>
				<p class="mt-1.5 text-xs text-ink-500">The form will live inside this workspace.</p>
			</div>

			<div>
				<label for="name" class="mb-1.5 block text-sm font-medium text-ink-700">Form name</label>
				<input
					type="text"
					id="name"
					name="name"
					bind:value={name}
					placeholder="e.g. Contact Form, Newsletter Signup"
					required
					maxlength="100"
					class="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30"
				/>
			</div>

			<div>
				<label for="targetEmail" class="mb-1.5 block text-sm font-medium text-ink-700">
					Target email
				</label>
				<input
					type="email"
					id="targetEmail"
					name="targetEmail"
					bind:value={targetEmail}
					placeholder="Where to send submissions"
					required
					class="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30"
				/>
				<p class="mt-1.5 text-xs text-ink-500">
					Submissions will be sent to this email address.
				</p>
			</div>

			<div class="flex flex-col-reverse justify-end gap-2 border-t border-ink-100 pt-5 sm:flex-row">
				<a
					href={backHref}
					class="inline-flex items-center justify-center rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
				>
					Cancel
				</a>
				<button
					type="submit"
					disabled={submitting}
					class="inline-flex items-center justify-center rounded-lg bg-mint-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-mint-300"
				>
					{submitting ? 'Creating…' : 'Create form'}
				</button>
			</div>
		</form>
	</div>
</div>
