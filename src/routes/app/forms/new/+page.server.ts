import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import db from '$lib/db';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		userEmail: locals.user?.email ?? ''
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const targetEmail = formData.get('targetEmail')?.toString().trim() ?? user.email;

		if (!name) {
			return fail(400, { error: 'Form name is required', name, targetEmail });
		}

		if (name.length > 100) {
			return fail(400, { error: 'Form name must be 100 characters or less', name, targetEmail });
		}

		const formId = randomUUID();
		const targetEmails = JSON.stringify([targetEmail]);

		try {
			const stmt = db.prepare(`
				INSERT INTO forms (id, user_id, name, target_emails, is_active, created_at)
				VALUES (?, ?, ?, ?, 1, datetime('now'))
			`);
			stmt.run(formId, user.id, name, targetEmails);
		} catch (err) {
			console.error('Failed to create form:', err);
			return fail(500, { error: 'Failed to create form. Please try again.', name, targetEmail });
		}

		throw redirect(303, `/app/forms/${formId}`);
	}
};
