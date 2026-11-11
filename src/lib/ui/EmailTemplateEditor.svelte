<script lang="ts">
	import { renderEmail, BUILTIN_VARIABLES, MAX_SUBJECT_LENGTH, MAX_BODY_LENGTH } from '$lib/email-template';

	let {
		idPrefix,
		subjectName,
		bodyName,
		subject = $bindable(),
		body = $bindable(),
		fieldNames,
		previewData,
		previewIsSample,
		formName,
		clampValues = false,
		subjectPlaceholder = '',
		bodyPlaceholder = ''
	}: {
		idPrefix: string;
		subjectName: string;
		bodyName: string;
		subject: string;
		body: string;
		fieldNames: string[];
		previewData: Record<string, unknown>;
		previewIsSample: boolean;
		formName: string;
		clampValues?: boolean;
		subjectPlaceholder?: string;
		bodyPlaceholder?: string;
	} = $props();

	let bodyEl: HTMLTextAreaElement | undefined = $state();

	const variables = $derived([...new Set([...fieldNames, ...BUILTIN_VARIABLES])]);

	const preview = $derived(
		renderEmail(
			{ subject: subject || subjectPlaceholder, body: body || bodyPlaceholder },
			{ data: previewData, formName, submittedAt: new Date().toISOString() },
			{ clampValues }
		)
	);

	// Insert at the cursor in the message, keeping the caret after the placeholder
	function insertVariable(name: string) {
		const token = `{{${name}}}`;
		if (!bodyEl) {
			body = `${body}${token}`;
			return;
		}
		const start = bodyEl.selectionStart ?? body.length;
		const end = bodyEl.selectionEnd ?? body.length;
		body = body.slice(0, start) + token + body.slice(end);
		const caret = start + token.length;
		requestAnimationFrame(() => {
			bodyEl?.focus();
			bodyEl?.setSelectionRange(caret, caret);
		});
	}
</script>

<div class="grid gap-4">
	<div class="fl-field">
		<label for="{idPrefix}_subject" class="fl-label">Subject</label>
		<input
			type="text"
			id="{idPrefix}_subject"
			name={subjectName}
			bind:value={subject}
			placeholder={subjectPlaceholder}
			maxlength={MAX_SUBJECT_LENGTH}
			class="fl-input"
		/>
	</div>

	<div class="fl-field">
		<label for="{idPrefix}_body" class="fl-label">Message</label>
		<textarea
			id="{idPrefix}_body"
			name={bodyName}
			bind:this={bodyEl}
			bind:value={body}
			placeholder={bodyPlaceholder}
			maxlength={MAX_BODY_LENGTH}
			rows="9"
			class="fl-input !h-auto resize-y py-3 leading-6"
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

	<details class="rounded-md bg-surface-2 p-4">
		<summary class="cursor-pointer text-sm font-semibold">Preview</summary>
		<div class="mt-3 grid gap-2 rounded-sm bg-surface p-4">
			<p class="m-0 text-sm"><span class="text-fg-muted">Subject:</span> <strong>{preview.subject}</strong></p>
			<div class="m-0 border-t border-line pt-3 text-sm whitespace-pre-wrap break-words">{preview.text}</div>
		</div>
		<p class="fl-help mt-2 mb-0">
			{previewIsSample ? 'Filled with sample data.' : 'Filled with your latest submission.'}
		</p>
	</details>
</div>
