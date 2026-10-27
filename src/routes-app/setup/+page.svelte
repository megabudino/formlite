<script lang="ts">
	import { enhance } from '$app/forms';
	import { AuthShell, Icon } from '$lib/ui';

	type FieldErrors = {
		name?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
	};

	type ActionData = {
		error?: string;
		name?: string;
		email?: string;
		fieldErrors?: FieldErrors;
	};

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
	let fieldErrors = $derived(form?.fieldErrors ?? {});
</script>

<svelte:head>
	<title>Set up Formlite</title>
</svelte:head>

<AuthShell title="Set up Formlite">
	<p class="fl-muted mt-1.5">Create the admin account for this server.</p>

	<div class="mt-8 grid gap-5">
		{#if form?.error}
			<div class="fl-alert fl-alert--error" role="alert">
				<Icon name="alert" size={20} class="fl-alert__icon" />
				<div><strong>The account wasn't created.</strong> {form.error}</div>
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
			class="grid gap-5"
		>
			{@render field('name', 'Name', 'text', 'Your name', 'name', form?.name ?? '', fieldErrors.name)}
			{@render field('email', 'Email', 'email', 'you@example.com', 'email', form?.email ?? '', fieldErrors.email)}
			{@render field('password', 'Password', 'password', 'At least 8 characters', 'new-password', '', fieldErrors.password)}
			{@render field('confirmPassword', 'Confirm password', 'password', 'Type it again', 'new-password', '', fieldErrors.confirmPassword)}

			<button type="submit" disabled={loading} class="fl-btn fl-btn--primary fl-btn--block mt-1">
				{#if loading}
					Creating account…
				{:else}
					Create account
					<Icon name="arrow-right" />
				{/if}
			</button>
		</form>
	</div>
</AuthShell>

{#snippet field(
	id: string,
	label: string,
	type: string,
	placeholder: string,
	autocomplete: 'name' | 'email' | 'new-password',
	value: string,
	err: string | undefined
)}
	<div class="fl-field">
		<label for={id} class="fl-label">{label}</label>
		<input
			{type}
			{id}
			name={id}
			{value}
			{placeholder}
			{autocomplete}
			required
			disabled={loading}
			aria-invalid={err ? 'true' : undefined}
			aria-describedby={err ? `${id}-error` : undefined}
			class="fl-input"
			class:fl-input--error={err}
		/>
		{#if err}
			<span class="fl-error" id="{id}-error"><Icon name="alert" size={14} />{err}</span>
		{/if}
	</div>
{/snippet}
