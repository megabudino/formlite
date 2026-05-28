import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	listWorkspacesForUser,
	listOrphanForms,
	createWorkspace,
	assignFormsToWorkspace
} from '$lib/server/workspaces';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const orphanForms = listOrphanForms(user.id);
	if (orphanForms.length === 0) {
		throw redirect(302, '/app');
	}

	const workspaces = listWorkspacesForUser(user.id);

	return {
		orphanForms,
		workspaces: workspaces.map((w) => ({
			id: w.id,
			name: w.name,
			slug: w.slug,
			formCount: w.formCount
		}))
	};
};

export const actions: Actions = {
	createWorkspace: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString() ?? '';

		const result = createWorkspace(user.id, name);
		if (result.error) {
			return fail(400, { workspaceError: result.error, workspaceName: name });
		}

		return { workspaceCreated: true, workspaceId: result.workspace?.id };
	},

	assignAll: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/auth/login');
		}

		const orphans = listOrphanForms(user.id);
		if (orphans.length === 0) {
			throw redirect(302, '/app');
		}

		const formData = await request.formData();
		const assignments = new Map<string, string>();

		for (const orphan of orphans) {
			const workspaceId = formData.get(`assign__${orphan.id}`)?.toString().trim() ?? '';
			if (!workspaceId) {
				return fail(400, {
					assignError: `Please select a workspace for "${orphan.name}"`
				});
			}
			assignments.set(orphan.id, workspaceId);
		}

		const result = assignFormsToWorkspace(user.id, assignments);
		if (result.error) {
			return fail(400, { assignError: result.error });
		}

		throw redirect(303, '/app');
	}
};
