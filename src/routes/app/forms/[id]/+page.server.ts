import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/db';
import { randomUUID, randomBytes } from 'crypto';

interface Form {
	id: string;
	user_id: string;
	name: string;
	redirect_url: string | null;
	target_emails: string;
	is_active: number;
	created_at: string;
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
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
	const offset = (page - 1) * SUBMISSIONS_PER_PAGE;

	const countStmt = db.prepare('SELECT COUNT(*) as count FROM submissions WHERE form_id = ?');
	const { count: totalSubmissions } = countStmt.get(params.id) as { count: number };
	const totalPages = Math.ceil(totalSubmissions / SUBMISSIONS_PER_PAGE);

	const submissionsStmt = db.prepare(
		'SELECT * FROM submissions WHERE form_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
	);
	const submissions = submissionsStmt.all(params.id, SUBMISSIONS_PER_PAGE, offset) as Submission[];

	return {
		form: {
			id: form.id,
			name: form.name,
			redirectUrl: form.redirect_url,
			targetEmails: JSON.parse(form.target_emails) as string[],
			isActive: form.is_active === 1,
			createdAt: form.created_at
		},
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
			createdAt: s.created_at
		})),
		pagination: {
			page,
			totalPages,
			totalSubmissions,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1
		}
	};
};

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export const actions: Actions = {
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

	deleteForm: async ({ params, locals }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const stmt = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?');
		const form = stmt.get(params.id, user.id);
		if (!form) {
			throw error(404, 'Form not found');
		}

		// Delete the form (CASCADE will handle submissions and webhooks)
		const deleteStmt = db.prepare('DELETE FROM forms WHERE id = ?');
		deleteStmt.run(params.id);

		throw redirect(302, '/app');
	}
};
