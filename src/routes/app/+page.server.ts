import type { PageServerLoad, Actions } from './$types';
import db from '$lib/db';
import { fail } from '@sveltejs/kit';

interface FormWithCount {
	id: string;
	name: string;
	is_active: number;
	created_at: string;
	submission_count: number;
}

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id;
	
	if (!userId) {
		return { forms: [] };
	}

	const forms = db.prepare(`
		SELECT 
			f.id,
			f.name,
			f.is_active,
			f.created_at,
			(SELECT COUNT(*) FROM submissions WHERE form_id = f.id) as submission_count
		FROM forms f
		WHERE f.user_id = ?
		ORDER BY f.created_at DESC
	`).all(userId) as FormWithCount[];

	return { forms };
};

export const actions: Actions = {
	toggleActive: async ({ request, locals }) => {
		const userId = locals.user?.id;
		if (!userId) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const formId = formData.get('formId') as string;
		const isActive = formData.get('isActive') === '1' ? 1 : 0;

		if (!formId) {
			return fail(400, { error: 'Form ID is required' });
		}

		// Verify the form belongs to the user
		const form = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(formId, userId);
		if (!form) {
			return fail(404, { error: 'Form not found' });
		}

		// Toggle the is_active status
		db.prepare('UPDATE forms SET is_active = ? WHERE id = ?').run(isActive, formId);

		return { success: true };
	}
};
