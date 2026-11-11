import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/db';
import { randomUUID, randomBytes } from 'crypto';
import { getWorkspace, listWorkspaceForms } from '$lib/server/workspaces';
import { normalizeAllowedDomain as normalizeDomainEntry } from '$lib/server/origin';
import {
	DEFAULT_NOTIFY_SUBJECT,
	DEFAULT_NOTIFY_BODY,
	MAX_SUBJECT_LENGTH,
	MAX_BODY_LENGTH,
	isBodyFormat,
	type BodyFormat
} from '$lib/email-template';
import { env } from '$env/dynamic/private';
import {
	findBackfillTargets,
	backfillCounts,
	startBackfill,
	autoreplyReady,
	BACKFILL_WINDOWS_DAYS,
	BACKFILL_MAX,
	type AutoreplySettings,
	type AutoreplyStatus
} from '$lib/server/autoreply';

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
	notify_subject: string | null;
	notify_body: string | null;
	notify_format: string;
	autoreply_enabled: number;
	autoreply_subject: string | null;
	autoreply_body: string | null;
	autoreply_format: string;
	autoreply_from_name: string | null;
	autoreply_reply_to: string | null;
}

interface Webhook {
	id: string;
	form_id: string;
	url: string;
	secret: string;
	created_at: string;
}

interface Submission {
	id: number;
	form_id: string;
	data: string;
	meta: string;
	autoreply_status: AutoreplyStatus | null;
	autoreply_at: string | null;
	autoreply_error: string | null;
	created_at: string;
}

interface BlockedRequest {
	id: number;
	form_id: string;
	origin: string | null;
	ip: string | null;
	user_agent: string | null;
	data: string;
	reason: string;
	created_at: string;
}

function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

const SUBMISSIONS_PER_PAGE = 20;

// Positive integer ids from repeated `id` fields, capped to one page's worth plus margin.
function parseIds(formData: FormData): number[] {
	const ids = formData
		.getAll('id')
		.map((v) => Number.parseInt(String(v), 10))
		.filter((n) => Number.isInteger(n) && n > 0);
	return [...new Set(ids)].slice(0, 500);
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const stmt = db.prepare('SELECT * FROM forms WHERE id = ? AND user_id = ?');
	const form = stmt.get(params.id, user.id) as Form | undefined;

	if (!form) {
		throw error(404, 'Form not found');
	}

	const webhooksStmt = db.prepare('SELECT * FROM webhooks WHERE form_id = ? ORDER BY created_at DESC');
	const webhooks = webhooksStmt.all(params.id) as Webhook[];

	// Fetch submissions with pagination
	const countStmt = db.prepare('SELECT COUNT(*) as count FROM submissions WHERE form_id = ?');
	const { count: totalSubmissions } = countStmt.get(params.id) as { count: number };
	const totalPages = Math.ceil(totalSubmissions / SUBMISSIONS_PER_PAGE);

	// Clamp to the last page, so deleting the final rows of a page doesn't strand you on an empty one
	const requestedPage = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
	const page = Math.min(requestedPage, Math.max(1, totalPages));
	const offset = (page - 1) * SUBMISSIONS_PER_PAGE;

	const submissionsStmt = db.prepare(
		'SELECT * FROM submissions WHERE form_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
	);
	const submissions = submissionsStmt.all(params.id, SUBMISSIONS_PER_PAGE, offset) as Submission[];

	const blockedCountStmt = db.prepare('SELECT COUNT(*) as count FROM blocked_requests WHERE form_id = ?');
	const { count: totalBlockedRequests } = blockedCountStmt.get(params.id) as { count: number };
	const blockedTotalPages = Math.ceil(totalBlockedRequests / SUBMISSIONS_PER_PAGE);

	const requestedSpamPage = Math.max(1, parseInt(url.searchParams.get('spam_page') || '1', 10) || 1);
	const spamPage = Math.min(requestedSpamPage, Math.max(1, blockedTotalPages));
	const spamOffset = (spamPage - 1) * SUBMISSIONS_PER_PAGE;

	const blockedStmt = db.prepare(
		'SELECT * FROM blocked_requests WHERE form_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
	);
	const blockedRequests = blockedStmt.all(
		params.id,
		SUBMISSIONS_PER_PAGE,
		spamOffset
	) as BlockedRequest[];

	const workspace = form.workspace_id ? getWorkspace(user.id, form.workspace_id) : null;

	// Field names from recent submissions, offered as {{placeholders}} in the email editors
	const recentData = db
		.prepare('SELECT data FROM submissions WHERE form_id = ? ORDER BY created_at DESC LIMIT 50')
		.all(params.id) as { data: string }[];
	const fieldNames = new Set<string>();
	for (const row of recentData) {
		try {
			for (const [key, value] of Object.entries(JSON.parse(row.data) as Record<string, unknown>)) {
				if (value && typeof value === 'object' && !Array.isArray(value)) {
					for (const child of Object.keys(value)) fieldNames.add(`${key}.${child}`);
				} else {
					fieldNames.add(key);
				}
			}
		} catch {
			// Skip malformed rows
		}
	}

	return {
		navForms: workspace ? listWorkspaceForms(user.id, workspace.id) : [],
		form: {
			id: form.id,
			name: form.name,
			redirectUrl: form.redirect_url,
			targetEmails: JSON.parse(form.target_emails) as string[],
			allowedDomains: JSON.parse(form.allowed_domains) as string[],
			isActive: form.is_active === 1,
			createdAt: form.created_at,
			workspaceId: form.workspace_id
		},
		emails: {
			notifySubject: form.notify_subject ?? '',
			notifyBody: form.notify_body ?? '',
			notifyFormat: (form.notify_body && form.notify_format === 'html' ? 'html' : 'text') as BodyFormat,
			autoreplyEnabled: form.autoreply_enabled === 1,
			autoreplySubject: form.autoreply_subject ?? '',
			autoreplyBody: form.autoreply_body ?? '',
			autoreplyFormat: (form.autoreply_format === 'html' ? 'html' : 'text') as BodyFormat,
			autoreplyFromName: form.autoreply_from_name ?? '',
			autoreplyReplyTo: form.autoreply_reply_to ?? '',
			fieldNames: [...fieldNames].slice(0, 30),
			// People who filled in the form before and haven't had the auto-reply, per time window
			backfill: autoreplyReady(form) ? backfillCounts(form.id) : [],
			// Address only, for the From line of the previews
			fromAddress: (env.MAILGUN_FROM_EMAIL ?? '').match(/<([^>]+)>/)?.[1] ?? env.MAILGUN_FROM_EMAIL ?? ''
		},
		workspace: workspace
			? { id: workspace.id, name: workspace.name }
			: null,
		webhooks: webhooks.map((w) => ({
			id: w.id,
			url: w.url,
			secret: w.secret,
			createdAt: w.created_at
		})),
		submissions: submissions.map((s) => ({
			id: s.id,
			data: JSON.parse(s.data) as Record<string, unknown>,
			meta: JSON.parse(s.meta) as Record<string, unknown>,
			createdAt: s.created_at,
			autoreply: s.autoreply_status
				? { status: s.autoreply_status, at: s.autoreply_at, error: s.autoreply_error }
				: null
		})),
		blockedRequests: blockedRequests.map((blocked) => ({
			id: blocked.id,
			origin: blocked.origin,
			reason: blocked.reason,
			data: JSON.parse(blocked.data) as Record<string, unknown>,
			createdAt: blocked.created_at
		})),
		pagination: {
			page,
			totalPages,
			totalSubmissions,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1
		},
		blockedPagination: {
			page: spamPage,
			totalPages: blockedTotalPages,
			totalBlockedRequests,
			hasNextPage: spamPage < blockedTotalPages,
			hasPrevPage: spamPage > 1
		}
	};
};

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

function normalizeAllowedDomain(domain: string): { normalized: string; error?: string } {
	const trimmed = domain.trim().toLowerCase();
	if (!trimmed) {
		return { normalized: '', error: 'Domain is required' };
	}
	if (/\s/.test(trimmed)) {
		return { normalized: '', error: 'Domain cannot contain spaces' };
	}
	if (trimmed.includes('://') && trimmed.includes('*')) {
		return {
			normalized: '',
			error: 'Wildcards cannot include a scheme. Use *.example.com instead'
		};
	}
	const normalized = normalizeDomainEntry(trimmed);
	if (!normalized) {
		return {
			normalized: '',
			error: 'Enter a domain (example.com), a wildcard (*.example.com) or an origin (https://example.com)'
		};
	}
	return { normalized };
}

function readFormat(value: FormDataEntryValue | null): BodyFormat {
	return isBodyFormat(value) ? value : 'text';
}

function readSubject(value: FormDataEntryValue | null): string {
	return value?.toString().trim() ?? '';
}

function readBody(value: FormDataEntryValue | null): string {
	return value?.toString().replace(/\r\n/g, '\n').trim() ?? '';
}

function validateTemplate(subject: string, body: string, required: boolean): string | null {
	if (required && (!subject || !body)) {
		return 'Add a subject and a message before turning this on';
	}
	if (subject.length > MAX_SUBJECT_LENGTH) {
		return `Keep the subject under ${MAX_SUBJECT_LENGTH} characters`;
	}
	if (body.length > MAX_BODY_LENGTH) {
		return `Keep the message under ${MAX_BODY_LENGTH.toLocaleString('en-US')} characters`;
	}
	return null;
}

export const actions: Actions = {
	toggleActive: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const form = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(params.id, user.id);
		if (!form) {
			throw error(404, 'Form not found');
		}

		const isActive = (await request.formData()).get('isActive') === '1' ? 1 : 0;
		db.prepare('UPDATE forms SET is_active = ? WHERE id = ?').run(isActive, params.id);

		return { toggled: true };
	},

	updateRedirectUrl: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const redirectUrl = formData.get('redirect_url')?.toString().trim() ?? '';

		if (redirectUrl && !isValidUrl(redirectUrl)) {
			return fail(400, { 
				redirectUrlError: 'Please enter a valid URL (e.g., https://example.com/thank-you)',
				redirectUrl
			});
		}

		const stmt = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id);
		if (!form) {
			throw error(404, 'Form not found');
		}

		const updateStmt = db.prepare('UPDATE forms SET redirect_url = ? WHERE id = ?');
		updateStmt.run(redirectUrl || null, params.id);

		return { redirectUrlSuccess: true };
	},

	addEmail: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const newEmail = formData.get('new_email')?.toString().trim().toLowerCase() ?? '';

		if (!newEmail) {
			return fail(400, { emailError: 'Email is required' });
		}

		if (!isValidEmail(newEmail)) {
			return fail(400, { emailError: 'Please enter a valid email address' });
		}

		const stmt = db.prepare('SELECT * FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id) as Form | undefined;
		if (!form) {
			throw error(404, 'Form not found');
		}

		const currentEmails = JSON.parse(form.target_emails) as string[];
		if (currentEmails.includes(newEmail)) {
			return fail(400, { emailError: 'This email is already in the list' });
		}

		currentEmails.push(newEmail);
		const updateStmt = db.prepare('UPDATE forms SET target_emails = ? WHERE id = ?');
		updateStmt.run(JSON.stringify(currentEmails), params.id);

		return { emailSuccess: true };
	},

	removeEmail: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const emailToRemove = formData.get('email')?.toString().trim().toLowerCase() ?? '';

		const stmt = db.prepare('SELECT * FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id) as Form | undefined;
		if (!form) {
			throw error(404, 'Form not found');
		}

		const currentEmails = JSON.parse(form.target_emails) as string[];
		
		if (currentEmails.length <= 1) {
			return fail(400, { emailError: 'At least one email is required' });
		}

		const updatedEmails = currentEmails.filter(e => e !== emailToRemove);
		const updateStmt = db.prepare('UPDATE forms SET target_emails = ? WHERE id = ?');
		updateStmt.run(JSON.stringify(updatedEmails), params.id);

		return { emailSuccess: true };
	},

	addAllowedDomain: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const newDomain = formData.get('new_domain')?.toString() ?? '';
		const { normalized, error: domainError } = normalizeAllowedDomain(newDomain);

		if (domainError) {
			return fail(400, { allowedDomainError: domainError });
		}

		const stmt = db.prepare('SELECT * FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id) as Form | undefined;
		if (!form) {
			throw error(404, 'Form not found');
		}

		const currentDomains = JSON.parse(form.allowed_domains) as string[];
		const normalizedDomains = currentDomains.map(
			(domain) => normalizeDomainEntry(domain) ?? domain.trim().toLowerCase()
		);

		if (normalizedDomains.includes(normalized)) {
			return fail(400, { allowedDomainError: 'This domain is already in the list' });
		}

		const updatedDomains = [...currentDomains, normalized];
		const updateStmt = db.prepare('UPDATE forms SET allowed_domains = ? WHERE id = ?');
		updateStmt.run(JSON.stringify(updatedDomains), params.id);

		return { allowedDomainSuccess: true };
	},

	removeAllowedDomain: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		// Match the stored entry as-is: entries saved before validation existed must stay removable
		const normalized = (formData.get('domain')?.toString() ?? '').trim().toLowerCase();

		const stmt = db.prepare('SELECT * FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id) as Form | undefined;
		if (!form) {
			throw error(404, 'Form not found');
		}

		const currentDomains = JSON.parse(form.allowed_domains) as string[];
		const updatedDomains = currentDomains.filter(
			(domain) => domain.trim().toLowerCase() !== normalized
		);

		const updateStmt = db.prepare('UPDATE forms SET allowed_domains = ? WHERE id = ?');
		updateStmt.run(JSON.stringify(updatedDomains), params.id);

		return { allowedDomainSuccess: true };
	},

	deleteSubmissions: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const form = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(params.id, user.id);
		if (!form) {
			throw error(404, 'Form not found');
		}

		const ids = parseIds(await request.formData());
		if (ids.length === 0) {
			return fail(400, { deleteError: 'Select at least one submission to delete' });
		}

		// form_id in the WHERE keeps deletions scoped to this form, whatever ids are sent
		const result = db
			.prepare(
				`DELETE FROM submissions WHERE form_id = ? AND id IN (${ids.map(() => '?').join(',')})`
			)
			.run(params.id, ...ids);

		return { deletedSubmissions: result.changes };
	},

	deleteBlockedRequests: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const form = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(params.id, user.id);
		if (!form) {
			throw error(404, 'Form not found');
		}

		const ids = parseIds(await request.formData());
		if (ids.length === 0) {
			return fail(400, { deleteError: 'Select at least one request to delete' });
		}

		const result = db
			.prepare(
				`DELETE FROM blocked_requests WHERE form_id = ? AND id IN (${ids.map(() => '?').join(',')})`
			)
			.run(params.id, ...ids);

		return { deletedBlocked: result.changes };
	},

	clearBlockedRequests: async ({ params, locals }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const stmt = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id);
		if (!form) {
			throw error(404, 'Form not found');
		}

		const deleteStmt = db.prepare('DELETE FROM blocked_requests WHERE form_id = ?');
		deleteStmt.run(params.id);

		return { clearBlockedRequestsSuccess: true };
	},

	addWebhook: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const webhookUrl = formData.get('webhook_url')?.toString().trim() ?? '';

		if (!webhookUrl) {
			return fail(400, { webhookError: 'URL is required' });
		}

		if (!isValidUrl(webhookUrl)) {
			return fail(400, { webhookError: 'Please enter a valid URL (e.g., https://example.com/webhook)' });
		}

		const stmt = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id);
		if (!form) {
			throw error(404, 'Form not found');
		}

		const webhookId = randomUUID();
		const secret = randomBytes(32).toString('hex');

		const insertStmt = db.prepare('INSERT INTO webhooks (id, form_id, url, secret) VALUES (?, ?, ?, ?)');
		insertStmt.run(webhookId, params.id, webhookUrl, secret);

		return { webhookSuccess: true };
	},

	deleteWebhook: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const webhookId = formData.get('webhook_id')?.toString() ?? '';

		const stmt = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id);
		if (!form) {
			throw error(404, 'Form not found');
		}

		const deleteStmt = db.prepare('DELETE FROM webhooks WHERE id = ? AND form_id = ?');
		deleteStmt.run(webhookId, params.id);

		return { webhookSuccess: true };
	},

	updateNotificationEmail: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const form = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(params.id, user.id);
		if (!form) {
			throw error(404, 'Form not found');
		}

		const formData = await request.formData();
		const reset = formData.get('reset') === '1';
		const format = readFormat(formData.get('format'));
		let subject = reset ? '' : readSubject(formData.get('subject'));
		let body = reset ? '' : readBody(formData.get('body'));

		const templateError = validateTemplate(subject, body, false);
		if (templateError) {
			return fail(400, { notifyError: templateError });
		}

		// Saving the defaults unchanged keeps the form on the built-in template
		if (subject === DEFAULT_NOTIFY_SUBJECT) subject = '';
		if (format === 'text' && body === DEFAULT_NOTIFY_BODY) body = '';

		db.prepare('UPDATE forms SET notify_subject = ?, notify_body = ?, notify_format = ? WHERE id = ?').run(
			subject || null,
			body || null,
			body ? format : 'text',
			params.id
		);

		return { notifySuccess: true };
	},

	// Saves the auto-reply content. Sending "enable" turns it on in the same step,
	// for when the switch is flipped before anything was written.
	updateAutoreply: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const form = db
			.prepare('SELECT autoreply_enabled FROM forms WHERE id = ? AND user_id = ?')
			.get(params.id, user.id) as { autoreply_enabled: number } | undefined;
		if (!form) {
			throw error(404, 'Form not found');
		}

		const formData = await request.formData();
		const enabled = form.autoreply_enabled === 1 || formData.get('enable') === '1';
		const format = readFormat(formData.get('format'));
		const subject = readSubject(formData.get('subject'));
		const body = readBody(formData.get('body'));
		const fromName = formData.get('from_name')?.toString().trim() ?? '';
		const replyTo = formData.get('reply_to')?.toString().trim().toLowerCase() ?? '';

		const templateError = validateTemplate(subject, body, enabled);
		if (templateError) {
			return fail(400, { autoreplyError: templateError });
		}
		if (fromName.length > 80 || /["<>\\\r\n]/.test(fromName)) {
			return fail(400, { autoreplyError: 'Sender name must be under 80 characters, without quotes or < >' });
		}
		if (replyTo && !isValidEmail(replyTo)) {
			return fail(400, { autoreplyError: 'Please enter a valid reply-to address' });
		}

		db.prepare(
			`UPDATE forms SET autoreply_enabled = ?, autoreply_subject = ?, autoreply_body = ?, autoreply_format = ?,
				autoreply_from_name = ?, autoreply_reply_to = ? WHERE id = ?`
		).run(enabled ? 1 : 0, subject || null, body || null, format, fromName || null, replyTo || null, params.id);

		return { autoreplySuccess: true };
	},

	sendAutoreplyToPast: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const form = db
			.prepare(
				`SELECT id, name, autoreply_enabled, autoreply_subject, autoreply_body, autoreply_format,
					autoreply_from_name, autoreply_reply_to FROM forms WHERE id = ? AND user_id = ?`
			)
			.get(params.id, user.id) as AutoreplySettings | undefined;
		if (!form) {
			throw error(404, 'Form not found');
		}
		if (!autoreplyReady(form)) {
			return fail(400, { backfillError: 'Turn on the auto-reply first' });
		}

		const days = Number.parseInt((await request.formData()).get('days')?.toString() ?? '', 10);
		if (!(BACKFILL_WINDOWS_DAYS as readonly number[]).includes(days)) {
			return fail(400, { backfillError: 'Choose how far back to go' });
		}

		const targets = findBackfillTargets(form.id, days).slice(0, BACKFILL_MAX);
		if (targets.length === 0) {
			return fail(400, { backfillError: 'Everyone in this period already has the auto-reply' });
		}

		startBackfill(form, targets);

		return { backfillQueued: targets.length };
	},

	toggleAutoreply: async ({ params, locals, request }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const form = db
			.prepare('SELECT autoreply_subject, autoreply_body FROM forms WHERE id = ? AND user_id = ?')
			.get(params.id, user.id) as { autoreply_subject: string | null; autoreply_body: string | null } | undefined;
		if (!form) {
			throw error(404, 'Form not found');
		}

		const enabled = (await request.formData()).get('enabled') === '1';
		if (enabled && (!form.autoreply_subject || !form.autoreply_body)) {
			return fail(400, { autoreplyError: 'Write the auto-reply before turning it on' });
		}

		db.prepare('UPDATE forms SET autoreply_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, params.id);

		return { autoreplyToggled: true };
	},

	deleteForm: async ({ params, locals }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const stmt = db.prepare('SELECT id, workspace_id FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id) as
			| { id: string; workspace_id: string | null }
			| undefined;
		if (!form) {
			throw error(404, 'Form not found');
		}

		// Delete the form (CASCADE will handle submissions and webhooks)
		const deleteStmt = db.prepare('DELETE FROM forms WHERE id = ?');
		deleteStmt.run(params.id);

		const redirectTo = form.workspace_id ? `/workspaces/${form.workspace_id}` : '/';
		throw redirect(302, redirectTo);
	}
};
