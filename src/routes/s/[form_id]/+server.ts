import { json, error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/db';
import { sendSubmissionEmail } from '$lib/email';
import { dispatchWebhooks, type Webhook } from '$lib/webhooks';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: corsHeaders
	});
};

interface Form {
	id: string;
	user_id: string;
	name: string;
	redirect_url: string | null;
	target_emails: string;
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

export const POST: RequestHandler = async ({ params, request }) => {
	const { form_id } = params;
	const isAjax = isAjaxRequest(request);

	const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(form_id) as Form | undefined;

	if (!form) {
		if (isAjax) {
			return json({ ok: false, error: 'Form not found' }, { status: 404, headers: corsHeaders });
		}
		throw error(404, 'Form not found');
	}

	if (!form.is_active) {
		if (isAjax) {
			return json(
				{ ok: false, error: 'Form is no longer accepting submissions' },
				{ status: 410, headers: corsHeaders }
			);
		}
		throw error(410, 'Form is no longer accepting submissions');
	}

	const contentType = request.headers.get('content-type') || '';

	let data: Record<string, unknown>;

	if (contentType.includes('application/json')) {
		try {
			data = await request.json();
		} catch {
			if (isAjax) {
				return json({ ok: false, error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders });
			}
			throw error(400, 'Invalid JSON body');
		}
	} else if (
		contentType.includes('application/x-www-form-urlencoded') ||
		contentType.includes('multipart/form-data')
	) {
		const formData = await request.formData();
		data = parseFormData(formData);
	} else {
		const formData = await request.formData();
		data = parseFormData(formData);
	}

	const { _gotcha, ...cleanData } = data;

	// Honeypot spam filter: if _gotcha has any value, it's likely a bot
	// Return 200 OK to fool the bot, but don't store the submission
	if (_gotcha !== undefined && _gotcha !== '') {
		return json({ ok: true }, { headers: corsHeaders });
	}

	// Build meta object with request headers
	const meta = {
		ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
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

	// Return JSON response for AJAX requests
	if (isAjax) {
		return json({ ok: true }, { headers: corsHeaders });
	}

	// For non-AJAX (HTML form posts), redirect to custom URL or default thank-you page
	const redirectUrl = form.redirect_url || '/thanks';
	throw redirect(303, redirectUrl);
};
