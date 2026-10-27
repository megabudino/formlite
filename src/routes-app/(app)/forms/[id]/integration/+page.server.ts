import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import db from '$lib/db';
import { getWorkspace } from '$lib/server/workspaces';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const form = db
		.prepare('SELECT id, name, is_active, workspace_id FROM forms WHERE id = ? AND user_id = ?')
		.get(params.id, user.id) as
		| { id: string; name: string; is_active: number; workspace_id: string | null }
		| undefined;

	if (!form) {
		throw error(404, 'Form not found');
	}

	const workspace = form.workspace_id ? getWorkspace(user.id, form.workspace_id) : null;

	return {
		form: { id: form.id, name: form.name, isActive: form.is_active === 1 },
		workspace: workspace ? { id: workspace.id, name: workspace.name } : null
	};
};
