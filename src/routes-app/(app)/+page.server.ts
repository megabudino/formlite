import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { listWorkspacesForUser, createWorkspace } from '$lib/server/workspaces';
import { getWorkspaceActivity } from '$lib/server/stats';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id;

	if (!userId) {
		return { workspaces: [], activity: {} };
	}

	const workspaces = listWorkspacesForUser(userId);

	return {
		workspaces: workspaces.map((w) => ({
			id: w.id,
			name: w.name,
			slug: w.slug,
			formCount: w.formCount,
			createdAt: w.createdAt
		})),
		activity: getWorkspaceActivity(userId)
	};
};

export const actions: Actions = {
	createWorkspace: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString() ?? '';

		const result = createWorkspace(user.id, name);
		if (result.error) {
			return fail(400, { workspaceError: result.error, workspaceName: name });
		}

		throw redirect(303, `/workspaces/${result.workspace?.id}`);
	}
};
