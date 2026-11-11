// Email templates for form notifications and auto-replies.
// Plain text or HTML with {{field}} placeholders. Shared by the server (sending) and
// the dashboard (live preview), so it must not import anything server-only.

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

export type BodyFormat = 'text' | 'html';

// What the dashboard editor works on
export interface EmailDraft {
	subject: string;
	body: string;
	format: BodyFormat;
	fromName: string;
	replyTo: string;
}

export interface EmailTemplate {
	subject: string;
	body: string;
	format?: BodyFormat;
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
export const MAX_BODY_LENGTH = 100_000;

// Auto-replies go to whatever address the visitor typed, so their own values are
// kept short and on one line: a stranger can't turn the email into a long message.
const MAX_AUTOREPLY_VALUE_LENGTH = 100;

const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g;

const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function isBodyFormat(value: unknown): value is BodyFormat {
	return value === 'text' || value === 'html';
}

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

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

const URL_PATTERN = /https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g;

function linkify(escaped: string): string {
	return escaped.replace(URL_PATTERN, (url) => `<a href="${url}">${url}</a>`);
}

// Visitor values are always escaped, so a field can never inject markup
function escapeValue(value: string): string {
	return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

// A full document is sent as written; a fragment gets a minimal readable layout
function wrapHtml(body: string): string {
	if (/<html[\s>]/i.test(body)) return body;
	return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:#1a1a1a;background:#ffffff">${body}</body></html>`;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text: string): string {
	return text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
		if (code[0] === '#') {
			const point = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
			return Number.isFinite(point) ? String.fromCodePoint(point) : entity;
		}
		return ENTITIES[code.toLowerCase()] ?? entity;
	});
}

// Plain-text version of an HTML email, for clients that don't show HTML
export function htmlToText(html: string): string {
	return decodeEntities(
		html
			.replace(/<(head|style|script|title)[\s\S]*?<\/\1>/gi, '')
			// Line breaks in HTML source are just spaces; tags decide where lines end
			.replace(/\s*\n\s*/g, ' ')
			.replace(/<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => {
				const text = label.replace(/<[^>]+>/g, '').trim();
				return !text || text === href ? href : `${text} (${href})`;
			})
			.replace(/<br\s*\/?>/gi, '\n')
			.replace(/<li[^>]*>/gi, '\n- ')
			.replace(/<\/(p|div|h[1-6]|ul|ol|table|tr|blockquote)>/gi, '\n\n')
			.replace(/<hr[^>]*>/gi, '\n---\n')
			.replace(/<[^>]+>/g, '')
	)
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

// Starting point when switching a plain-text template to HTML: paragraphs and links
export function textToHtml(text: string): string {
	return text
		.trim()
		.split(/\n{2,}/)
		.map((paragraph) => `<p>${linkify(escapeHtml(paragraph)).replace(/\n/g, '<br>\n')}</p>`)
		.join('\n');
}

export function renderSubject(template: string, ctx: TemplateContext, clampValues = false): string {
	return split(template, ctx, clampValues)
		.map((part) => part.text)
		.join('')
		.replace(/[\r\n]+/g, ' ')
		.trim()
		.slice(0, MAX_SUBJECT_LENGTH);
}

export function renderEmail(
	template: EmailTemplate,
	ctx: TemplateContext,
	options: { clampValues?: boolean } = {}
): RenderedEmail {
	const clampValues = options.clampValues ?? false;
	const subject = renderSubject(template.subject, ctx, clampValues);
	const parts = split(template.body, ctx, clampValues);

	if (template.format === 'html') {
		const html = wrapHtml(parts.map((part) => (part.fromTemplate ? part.text : escapeValue(part.text))).join(''));
		return { subject, html, text: htmlToText(html) };
	}

	// Plain text: only links the owner wrote become clickable, never links typed by visitors
	const body = parts
		.map((part) => (part.fromTemplate ? linkify(escapeHtml(part.text)) : escapeHtml(part.text)))
		.join('')
		.replace(/\r?\n/g, '<br>\n');
	return { subject, text: parts.map((part) => part.text).join(''), html: wrapHtml(body) };
}
