import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getWorkspace, listWorkspaceForms } from '$lib/server/workspaces';
import { getOverview, parseRange } from '$lib/server/stats';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const workspace = getWorkspace(user.id, params.workspaceId);
	if (!workspace) {
		throw error(404, 'Workspace not found');
	}

	const forms = listWorkspaceForms(user.id, workspace.id);

	// Optional ?form= filter; ignored unless it's a form in this workspace
	const requestedForm = url.searchParams.get('form');
	const formFilter = forms.some((f) => f.id === requestedForm) ? requestedForm : null;

	return {
		workspace: {
			id: workspace.id,
			name: workspace.name,
			slug: workspace.slug
		},
		forms,
		formFilter,
		overview: getOverview(
			{ userId: user.id, workspaceId: workspace.id, formId: formFilter ?? undefined },
			parseRange(url.searchParams.get('range')),
			10
		)
	};
};

