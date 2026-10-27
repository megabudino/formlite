import { json, error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/db';
import { sendSubmissionEmail } from '$lib/email';
import { dispatchWebhooks, type Webhook } from '$lib/webhooks';
import { isOriginAllowed } from '$lib/server/origin';
import { consumeRateLimit } from '$lib/server/rate-limit';

const RATE_LIMIT_WINDOW_MS = 60_000;

function readLimit(name: string, fallback: number): number {
	const parsed = Number.parseInt(process.env[name] ?? '', 10);
	return Number.isNaN(parsed) ? fallback : parsed;
}

// Max submissions per minute, per form. 0 disables the limit.
const RATE_LIMIT_PER_IP = readLimit('SUBMISSION_RATE_LIMIT_PER_IP', 10);
const RATE_LIMIT_PER_FORM = readLimit('SUBMISSION_RATE_LIMIT_PER_FORM', 120);

const baseCorsHeaders = {
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

function getRequestOrigin(request: Request): string | null {
	const origin = request.headers.get('origin');
	if (origin) {
		return origin;
	}

	const referer = request.headers.get('referer');
	if (!referer) {
		return null;
	}

	try {
		return new URL(referer).origin;
	} catch {
		return null;
	}
}

function getRequestIp(request: Request): string | null {
	return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
}

function parseAllowedDomains(rawDomains: string): string[] {
	try {
		const parsed = JSON.parse(rawDomains);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function buildCorsHeaders(
	allowedDomains: string[],
	origin: string | null,
	originAllowed: boolean
): Record<string, string> {
	if (allowedDomains.length === 0) {
		return { ...baseCorsHeaders, 'Access-Control-Allow-Origin': '*' };
	}

	if (originAllowed && origin) {
		return { ...baseCorsHeaders, 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
	}

	return { ...baseCorsHeaders, Vary: 'Origin' };
}

function logBlockedRequest(
	formId: string,
	request: Request,
	origin: string | null,
	data: Record<string, unknown>,
	reason: 'origin_not_allowed' | 'honeypot'
): void {
	const ip = getRequestIp(request);
	const userAgent = request.headers.get('user-agent') || null;

	const insertStmt = db.prepare(
		'INSERT INTO blocked_requests (form_id, origin, ip, user_agent, data, reason) VALUES (?, ?, ?, ?, ?, ?)'
	);
	insertStmt.run(formId, origin, ip, userAgent, JSON.stringify(data), reason);
}

export const OPTIONS: RequestHandler = async ({ params, request }) => {
	const { form_id } = params;
	const form = db
		.prepare('SELECT allowed_domains FROM forms WHERE id = ?')
		.get(form_id) as Pick<Form, 'allowed_domains'> | undefined;

	if (!form) {
		return new Response(null, {
			status: 404,
			headers: { ...baseCorsHeaders, 'Access-Control-Allow-Origin': '*' }
		});
	}

	const allowedDomains = parseAllowedDomains(form.allowed_domains);
	const requestOrigin = getRequestOrigin(request);
	const originAllowed = isOriginAllowed(requestOrigin, allowedDomains);
	const corsHeaders = buildCorsHeaders(allowedDomains, requestOrigin, originAllowed);

	// Preflights carry no payload: the blocked POST never follows, so don't log them
	if (!originAllowed) {
		return new Response(null, {
			status: 403,
			headers: corsHeaders
		});
	}

	return new Response(null, {
		status: 204,
		headers: corsHeaders
	});
};

interface Form {
	id: string;
	user_id: string;
	workspace_id: string | null;
	name: string;
	redirect_url: string | null;
	target_emails: string;
	allowed_domains: string;
	is_active: number;
	created_at: string;
}

function setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
	const match = key.match(/^([^[]+)\[([^\]]+)\]$/);
	if (match) {
		const [, parent, child] = match;
		if (!obj[parent] || typeof obj[parent] !== 'object') {
			obj[parent] = {};
		}
		(obj[parent] as Record<string, unknown>)[child] = value;
	} else {
		obj[key] = value;
	}
}

function parseFormData(formData: FormData): Record<string, unknown> {
	const data: Record<string, unknown> = {};
	for (const [key, value] of formData.entries()) {
		if (value instanceof File) {
			continue;
		}
		setNestedValue(data, key, value);
	}
	return data;
}

function isAjaxRequest(request: Request): boolean {
	const acceptHeader = request.headers.get('accept') || '';
	return acceptHeader.includes('application/json');
}

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	const { form_id } = params;
	const isAjax = isAjaxRequest(request);

	const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(form_id) as Form | undefined;

	if (!form) {
		if (isAjax) {
			return json(
				{ ok: false, error: 'Form not found' },
				{ status: 404, headers: { ...baseCorsHeaders, 'Access-Control-Allow-Origin': '*' } }
			);
		}
		throw error(404, 'Form not found');
	}

	const allowedDomains = parseAllowedDomains(form.allowed_domains);
	const requestOrigin = getRequestOrigin(request);
	const originAllowed = isOriginAllowed(requestOrigin, allowedDomains);
	const corsHeaders = buildCorsHeaders(allowedDomains, requestOrigin, originAllowed);

	if (!form.is_active) {
		if (isAjax) {
			return json(
				{ ok: false, error: 'Form is no longer accepting submissions' },
				{ status: 410, headers: corsHeaders }
			);
		}
		throw error(410, 'Form is no longer accepting submissions');
	}

	// Prefer the address resolved by the adapter (honours ADDRESS_HEADER / XFF_DEPTH)
	// over raw headers, which any client can forge
	let clientAddress: string | null = null;
	try {
		clientAddress = getClientAddress();
	} catch {
		clientAddress = null;
	}

	let rateLimit = clientAddress
		? consumeRateLimit(`ip:${form_id}:${clientAddress}`, RATE_LIMIT_PER_IP, RATE_LIMIT_WINDOW_MS)
		: { allowed: true, retryAfterSeconds: 0 };
	if (rateLimit.allowed) {
		rateLimit = consumeRateLimit(`form:${form_id}`, RATE_LIMIT_PER_FORM, RATE_LIMIT_WINDOW_MS);
	}

	if (!rateLimit.allowed) {
		const headers = { ...corsHeaders, 'Retry-After': String(rateLimit.retryAfterSeconds) };
		if (isAjax) {
			return json({ ok: false, error: 'Too many submissions' }, { status: 429, headers });
		}
		return new Response('Too many submissions. Please try again later.', { status: 429, headers });
	}

	const contentType = request.headers.get('content-type') || '';
	const isJsonBody = contentType.includes('application/json');

	let data: Record<string, unknown> | null = null;

	try {
		if (isJsonBody) {
			const parsed: unknown = await request.json();
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				data = parsed as Record<string, unknown>;
			}
		} else {
			data = parseFormData(await request.formData());
		}
	} catch {
		data = null;
	}

	if (!data) {
		const message = isJsonBody ? 'Invalid JSON body' : 'Invalid form body';
		if (isAjax) {
			return json({ ok: false, error: message }, { status: 400, headers: corsHeaders });
		}
		throw error(400, message);
	}

	const { _gotcha, ...cleanData } = data;

	if (!originAllowed) {
		logBlockedRequest(form_id, request, requestOrigin, cleanData, 'origin_not_allowed');
		return json(
			{ ok: false, error: 'Origin not allowed' },
			{ status: 403, headers: corsHeaders }
		);
	}

	// Same response for accepted submissions and honeypot hits, so bots can't tell them apart
	const respondSuccess = () => {
		if (isAjax) {
			return json({ ok: true }, { headers: corsHeaders });
		}

		// For non-AJAX (HTML form posts), redirect to custom URL or default thank-you page
		const redirectUrl = form.redirect_url || '/thanks';
		throw redirect(303, redirectUrl);
	};

	// Honeypot spam filter: if _gotcha has any value, it's likely a bot.
	// Log it to the Spam tab (browser autofill can trip it too) but don't deliver it
	if (_gotcha !== undefined && _gotcha !== null && _gotcha !== '') {
		logBlockedRequest(form_id, request, requestOrigin, cleanData, 'honeypot');
		return respondSuccess();
	}

	// Build meta object with request headers
	const meta = {
		ip: getRequestIp(request),
		userAgent: request.headers.get('user-agent') || null,
		referer: request.headers.get('referer') || null
	};

	// Store submission in database
	const result = db.prepare('INSERT INTO submissions (form_id, data, meta) VALUES (?, ?, ?)').run(
		form_id,
		JSON.stringify(cleanData),
		JSON.stringify(meta)
	);
	const submissionId = Number(result.lastInsertRowid);

	// Send email notification
	const targetEmails: string[] = JSON.parse(form.target_emails);
	
	// Determine Reply-To: reply_to takes precedence over email
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	let replyToEmail: string | undefined;
	
	if (typeof cleanData.reply_to === 'string' && emailRegex.test(cleanData.reply_to)) {
		replyToEmail = cleanData.reply_to;
	} else if (typeof cleanData.email === 'string' && emailRegex.test(cleanData.email)) {
		replyToEmail = cleanData.email;
	}
	
	sendSubmissionEmail(targetEmails, form.name, cleanData, replyToEmail)
		.then((results) => {
			const successCount = results.filter((r) => r.success).length;
			const failCount = results.length - successCount;
			console.log(
				`[Email] Form "${form.name}": ${successCount}/${results.length} emails sent successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
			);
		})
		.catch((err) => {
			console.error(`[Email] Unexpected error sending emails for form "${form.name}":`, err);
		});

	// Dispatch webhooks asynchronously
	const webhooks = db.prepare('SELECT * FROM webhooks WHERE form_id = ?').all(form_id) as Webhook[];
	if (webhooks.length > 0) {
		const created_at = new Date().toISOString();
		dispatchWebhooks(webhooks, {
			form_id,
			submission_id: submissionId,
			data: cleanData,
			meta,
			created_at
		}).catch((err) => {
			console.error(`[Webhook] Unexpected error dispatching webhooks for form "${form.name}":`, err);
		});
	}

	return respondSuccess();
};
