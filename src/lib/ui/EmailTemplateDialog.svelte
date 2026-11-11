<script lang="ts">
	import { enhance } from '$app/forms';
	import { Icon } from '$lib/ui';
	import EmailPreview from './EmailPreview.svelte';
	import {
		renderEmail,
		htmlToText,
		textToHtml,
		BUILTIN_VARIABLES,
		MAX_SUBJECT_LENGTH,
		MAX_BODY_LENGTH,
		type BodyFormat,
		type EmailDraft
	} from '$lib/email-template';

	let {
		open = $bindable(false),
		title,
		description,
		action,
		errorKey,
		initial,
		withSender = false,
		enableOnSave = false,
		allowReset = false,
		clampValues = false,
		fieldNames,
		previewData,
		previewIsSample,
		formName,
		fromAddress,
		previewTo,
		defaultReplyTo = ''
	}: {
		open: boolean;
		title: string;
		description: string;
		action: string;
		errorKey: 'notifyError' | 'autoreplyError';
		initial: EmailDraft;
		withSender?: boolean;
		enableOnSave?: boolean;
		allowReset?: boolean;
		clampValues?: boolean;
		fieldNames: string[];
		previewData: Record<string, unknown>;
		previewIsSample: boolean;
		formName: string;
		fromAddress: string;
		previewTo: string;
		defaultReplyTo?: string;
	} = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let bodyEl: HTMLTextAreaElement | undefined = $state();
	let draft = $state<EmailDraft>({ subject: '', body: '', format: 'text', fromName: '', replyTo: '' });
	let saving = $state(false);
	let errorMessage = $state('');

	// Start from the saved email each time the dialog opens
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			draft = { ...initial };
			errorMessage = '';
			dialog.showModal();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});

	const variables = $derived([...new Set([...fieldNames, ...BUILTIN_VARIABLES])]);
	const dirty = $derived(JSON.stringify(draft) !== JSON.stringify(initial));

	const preview = $derived(
		renderEmail(
			{ subject: draft.subject, body: draft.body, format: draft.format },
			{ data: previewData, formName, submittedAt: new Date().toISOString() },
			{ clampValues }
		)
	);

	const fromLine = $derived(
		draft.fromName.trim() ? `${draft.fromName.trim()} <${fromAddress}>` : fromAddress
	);

	function requestClose() {
		if (dirty && !confirm('Discard your changes to this email?')) return;
		open = false;
	}

	function setFormat(next: BodyFormat) {
		if (next === draft.format) return;
		if (next === 'html') {
			draft.body = draft.body.trim() ? textToHtml(draft.body) : '';
		} else {
			if (draft.body.trim() && !confirm('Switch to plain text? Formatting and images will be removed.')) return;
			draft.body = htmlToText(draft.body);
		}
		draft.format = next;
	}

	// Insert at the cursor in the message, keeping the caret after the placeholder
	function insertVariable(name: string) {
		const token = `{{${name}}}`;
		const start = bodyEl?.selectionStart ?? draft.body.length;
		const end = bodyEl?.selectionEnd ?? draft.body.length;
		draft.body = draft.body.slice(0, start) + token + draft.body.slice(end);
		const caret = start + token.length;
		requestAnimationFrame(() => {
			bodyEl?.focus();
			bodyEl?.setSelectionRange(caret, caret);
		});
	}
</script>

<dialog
	bind:this={dialog}
	class="fl-dialog fl-dialog--editor"
	aria-labelledby="{action}-title"
	oncancel={(e) => {
		e.preventDefault();
		requestClose();
	}}
	onclose={() => (open = false)}
>
	<form
		method="POST"
		{action}
		class="flex min-h-0 flex-1 flex-col"
		use:enhance={() => {
			saving = true;
			errorMessage = '';
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					await update({ reset: false });
					open = false;
				} else if (result.type === 'failure') {
					errorMessage = String(result.data?.[errorKey] ?? 'Could not save this email');
				} else {
					await update({ reset: false });
				}
			};
		}}
	>
		<input type="hidden" name="format" value={draft.format} />
		{#if enableOnSave}
			<input type="hidden" name="enable" value="1" />
		{/if}

		<div class="fl-dialog__head">
			<div>
				<h2 id="{action}-title" class="fl-h3">{title}</h2>
				<p class="fl-muted m-0 mt-1 text-sm">{description}</p>
			</div>
			<button type="button" class="fl-btn fl-btn--ghost fl-btn--sm fl-btn--icon !w-9" aria-label="Close" onclick={requestClose}>
				<Icon name="x" size={18} />
			</button>
		</div>

		<div class="fl-editor">
			<div class="fl-editor__form">
				{#if withSender}
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="fl-field">
							<label for="{action}-from" class="fl-label">Sender name</label>
							<input
								id="{action}-from"
								name="from_name"
								type="text"
								bind:value={draft.fromName}
								placeholder="Jane from Acme"
								maxlength="80"
								class="fl-input"
							/>
						</div>
						<div class="fl-field">
							<label for="{action}-replyto" class="fl-label">Replies go to</label>
							<input
								id="{action}-replyto"
								name="reply_to"
								type="email"
								bind:value={draft.replyTo}
								placeholder={defaultReplyTo || 'you@example.com'}
								class="fl-input"
							/>
						</div>
					</div>
				{/if}

				<div class="fl-field">
					<label for="{action}-subject" class="fl-label">Subject</label>
					<input
						id="{action}-subject"
						name="subject"
						type="text"
						bind:value={draft.subject}
						maxlength={MAX_SUBJECT_LENGTH}
						class="fl-input"
					/>
				</div>

				<div class="fl-field fl-editor__message">
					<div class="flex items-center justify-between gap-3">
						<label for="{action}-body" class="fl-label">Message</label>
						<div class="fl-seg" role="group" aria-label="Message format">
							<button type="button" aria-pressed={draft.format === 'text'} onclick={() => setFormat('text')}>Text</button>
							<button type="button" aria-pressed={draft.format === 'html'} onclick={() => setFormat('html')}>HTML</button>
						</div>
					</div>
					<textarea
						id="{action}-body"
						name="body"
						bind:this={bodyEl}
						bind:value={draft.body}
						maxlength={MAX_BODY_LENGTH}
						spellcheck={draft.format === 'text'}
						class="fl-input fl-editor__textarea"
						class:fl-input--mono={draft.format === 'html'}
					></textarea>
					<div class="flex flex-wrap items-center gap-1.5">
						<span class="fl-help mr-1">Insert:</span>
						{#each variables as name (name)}
							<button
								type="button"
								class="fl-chip fl-chip--mono !h-7 !px-2.5 !text-xs hover:!bg-accent-tint hover:!text-on-accent-tint"
								onclick={() => insertVariable(name)}
							>
								{`{{${name}}}`}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="fl-editor__preview">
				<div class="mb-3 flex items-center justify-between gap-3">
					<span class="fl-overline">Preview</span>
					<span class="fl-help">
						{previewIsSample ? 'Filled with sample data' : 'Filled with your latest submission'}
					</span>
				</div>
				<EmailPreview
					subject={preview.subject}
					html={preview.html}
					from={fromLine}
					to={previewTo}
					replyTo={withSender ? draft.replyTo.trim() : ''}
				/>
			</div>
		</div>

		<div class="fl-dialog__foot">
			{#if allowReset}
				<button type="submit" name="reset" value="1" disabled={saving} class="fl-btn fl-btn--ghost">
					Restore default
				</button>
			{/if}
			<span class="mr-auto">
				{#if errorMessage}
					<span class="fl-error"><Icon name="alert" size={14} />{errorMessage}</span>
				{/if}
			</span>
			<button type="button" class="fl-btn fl-btn--secondary" onclick={requestClose}>Cancel</button>
			<button type="submit" disabled={saving} class="fl-btn fl-btn--primary">
				{saving ? 'Saving…' : enableOnSave ? 'Save and turn on' : 'Save email'}
			</button>
		</div>
	</form>
</dialog>
