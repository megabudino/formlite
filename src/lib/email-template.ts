// Email templates for form notifications and auto-replies.
// Plain text with {{field}} placeholders. Shared by the server (sending) and the
// dashboard (live preview), so it must not import anything server-only.

export interface TemplateContext {
	data: Record<string, unknown>;
	formName: string;
	submittedAt: string;
}

export interface RenderedEmail {
	subject: string;
	text: string;
	html: string;
}

// Built-in variables. They win over submitted fields with the same name.
export const BUILTIN_VARIABLES = ['form_name', 'submitted_at', 'all_fields'] as const;

export const DEFAULT_NOTIFY_SUBJECT = 'New submission from {{form_name}}';
export const DEFAULT_NOTIFY_BODY =
	'You received a new submission from {{form_name}}\n\nSubmitted at: {{submitted_at}}\n\n---\n\n{{all_fields}}';

export const SAMPLE_AUTOREPLY_SUBJECT = 'Here is your download';
export const SAMPLE_AUTOREPLY_BODY =
	'Hi {{name}},\n\nthanks for signing up. Here is the link to download your guide:\n\nhttps://example.com/guide.pdf\n\nSee you soon!';

export const MAX_SUBJECT_LENGTH = 200;
export const MAX_BODY_LENGTH = 20_000;

// Auto-replies go to whatever address the visitor typed, so their own values are
// kept short and on one line: a stranger can't turn the email into a long message.
const MAX_AUTOREPLY_VALUE_LENGTH = 100;

const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g;

function formatValue(value: unknown): string {
	if (value === undefined || value === null) return '';
	if (Array.isArray(value)) return value.map(formatValue).join(', ');
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

function formatAllFields(data: Record<string, unknown>): string {
	return Object.entries(data)
		.map(([key, value]) => `${key}: ${formatValue(value)}`)
		.join('\n');
}

function lookup(data: Record<string, unknown>, path: string): unknown {
	if (Object.hasOwn(data, path)) return data[path];
	// Nested fields like address[city] arrive as { address: { city } }
	let current: unknown = data;
	for (const part of path.split('.')) {
		if (!current || typeof current !== 'object' || !Object.hasOwn(current, part)) return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

function resolve(name: string, ctx: TemplateContext): string {
	switch (name) {
		case 'form_name':
			return ctx.formName;
		case 'submitted_at':
			return ctx.submittedAt;
		case 'all_fields':
			return formatAllFields(ctx.data);
		default:
			return formatValue(lookup(ctx.data, name));
	}
}

type Part = { text: string; fromTemplate: boolean };

function split(template: string, ctx: TemplateContext, clampValues: boolean): Part[] {
	const parts: Part[] = [];
	let last = 0;
	for (const match of template.matchAll(PLACEHOLDER)) {
		if (match.index > last) parts.push({ text: template.slice(last, match.index), fromTemplate: true });
		let value = resolve(match[1], ctx);
		if (clampValues) {
			value = value.replace(/\s+/g, ' ').trim().slice(0, MAX_AUTOREPLY_VALUE_LENGTH);
		}
		parts.push({ text: value, fromTemplate: false });
		last = match.index + match[0].length;
	}
	if (last < template.length) parts.push({ text: template.slice(last), fromTemplate: true });
	return parts;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// Only links the owner wrote in the template become clickable, never links typed by visitors.
function linkify(escaped: string): string {
	return escaped.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, (url) => `<a href="${url}">${url}</a>`);
}

function toHtml(parts: Part[]): string {
	const body = parts
		.map((part) => (part.fromTemplate ? linkify(escapeHtml(part.text)) : escapeHtml(part.text)))
		.join('')
		.replace(/\r?\n/g, '<br>\n');
	return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">${body}</body></html>`;
}

export function renderEmail(
	template: { subject: string; body: string },
	ctx: TemplateContext,
	options: { clampValues?: boolean } = {}
): RenderedEmail {
	const clampValues = options.clampValues ?? false;
	const subject = split(template.subject, ctx, clampValues)
		.map((part) => part.text)
		.join('')
		.replace(/[\r\n]+/g, ' ')
		.trim()
		.slice(0, MAX_SUBJECT_LENGTH);
	const bodyParts = split(template.body, ctx, clampValues);
	return {
		subject,
		text: bodyParts.map((part) => part.text).join(''),
		html: toHtml(bodyParts)
	};
}
