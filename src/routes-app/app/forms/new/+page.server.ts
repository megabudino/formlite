import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import db from '$lib/db';
import { randomUUID } from 'crypto';
import { listWorkspacesForUser, getWorkspace } from '$lib/server/workspaces';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/auth/login');
	}

	const workspaces = listWorkspacesForUser(user.id);

	if (workspaces.length === 0) {
		throw redirect(302, '/app');
	}

	const queryWorkspaceId = url.searchParams.get('workspace_id') ?? '';
	const preselectedWorkspaceId = workspaces.some((w) => w.id === queryWorkspaceId)
		? queryWorkspaceId
		: workspaces[0]?.id ?? '';

	return {
		userEmail: user.email ?? '',
		workspaces: workspaces.map((w) => ({ id: w.id, name: w.name })),
		preselectedWorkspaceId
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
		const workspaceId = formData.get('workspaceId')?.toString().trim() ?? '';

		if (!name) {
			return fail(400, { error: 'Form name is required', name, targetEmail, workspaceId });
		}

		if (name.length > 100) {
			return fail(400, {
				error: 'Form name must be 100 characters or less',
				name,
				targetEmail,
				workspaceId
			});
		}

		if (!workspaceId) {
			return fail(400, {
				error: 'Workspace is required',
				name,
				targetEmail,
				workspaceId
			});
		}

		const workspace = getWorkspace(user.id, workspaceId);
		if (!workspace) {
			return fail(400, {
				error: 'Workspace not found',
				name,
				targetEmail,
				workspaceId
			});
		}

		const formId = randomUUID();
		const targetEmails = JSON.stringify([targetEmail]);

		try {
			const stmt = db.prepare(`
				INSERT INTO forms (id, user_id, workspace_id, name, target_emails, is_active, created_at)
				VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
			`);
			stmt.run(formId, user.id, workspace.id, name, targetEmails);
		} catch (err) {
			console.error('Failed to create form:', err);
			return fail(500, {
				error: 'Failed to create form. Please try again.',
				name,
				targetEmail,
				workspaceId
			});
		}

		throw redirect(303, `/app/forms/${formId}`);
	}
};
