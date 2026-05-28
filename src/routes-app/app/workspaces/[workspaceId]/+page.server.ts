import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import db from '$lib/db';
import { getWorkspace } from '$lib/server/workspaces';

interface FormWithCount {
	id: string;
	name: string;
	is_active: number;
	created_at: string;
	submission_count: number;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const workspace = getWorkspace(user.id, params.workspaceId);
	if (!workspace) {
		throw error(404, 'Workspace not found');
	}

	const forms = db
		.prepare(
			`SELECT
				f.id,
				f.name,
				f.is_active,
				f.created_at,
				(SELECT COUNT(*) FROM submissions WHERE form_id = f.id) as submission_count
			FROM forms f
			WHERE f.user_id = ? AND f.workspace_id = ?
			ORDER BY f.created_at DESC`
		)
		.all(user.id, workspace.id) as FormWithCount[];

	return {
		workspace: {
			id: workspace.id,
			name: workspace.name,
			slug: workspace.slug
		},
		forms
	};
};

export const actions: Actions = {
	toggleActive: async ({ request, locals, params }) => {
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const workspace = getWorkspace(user.id, params.workspaceId);
		if (!workspace) {
			return fail(404, { error: 'Workspace not found' });
		}

		const formData = await request.formData();
		const formId = formData.get('formId') as string;
		const isActive = formData.get('isActive') === '1' ? 1 : 0;

		if (!formId) {
			return fail(400, { error: 'Form ID is required' });
		}

		const form = db
			.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ? AND workspace_id = ?')
			.get(formId, user.id, workspace.id);
		if (!form) {
			return fail(404, { error: 'Form not found' });
		}

		db.prepare('UPDATE forms SET is_active = ? WHERE id = ?').run(isActive, formId);

		return { success: true };
	}
};
