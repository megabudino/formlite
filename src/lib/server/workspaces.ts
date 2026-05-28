import { randomUUID } from 'crypto';
import db from '$lib/db';

interface Workspace {
	id: string;
	ownerId: string;
	name: string;
	slug: string;
	createdAt: string;
}

interface WorkspaceWithCount extends Workspace {
	formCount: number;
}

interface WorkspaceRow {
	id: string;
	owner_id: string;
	name: string;
	slug: string;
	created_at: string;
}

interface WorkspaceWithCountRow extends WorkspaceRow {
	form_count: number;
}

function rowToWorkspace(row: WorkspaceRow): Workspace {
	return {
		id: row.id,
		ownerId: row.owner_id,
		name: row.name,
		slug: row.slug,
		createdAt: row.created_at
	};
}

function slugify(name: string): string {
	const base = name
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 50);
	return base || `workspace-${randomUUID().slice(0, 8)}`;
}

function ensureUniqueSlug(ownerId: string, baseSlug: string): string {
	const stmt = db.prepare(
		'SELECT 1 FROM workspaces WHERE owner_id = ? AND slug = ? LIMIT 1'
	);
	let slug = baseSlug;
	let attempt = 1;
	while (stmt.get(ownerId, slug)) {
		attempt += 1;
		slug = `${baseSlug}-${attempt}`;
	}
	return slug;
}

function listWorkspacesForUser(userId: string): WorkspaceWithCount[] {
	const rows = db
		.prepare(
			`SELECT w.id, w.owner_id, w.name, w.slug, w.created_at,
				(SELECT COUNT(*) FROM forms WHERE forms.workspace_id = w.id) AS form_count
			FROM workspaces w
			WHERE w.owner_id = ?
			ORDER BY w.created_at ASC`
		)
		.all(userId) as WorkspaceWithCountRow[];

	return rows.map((row) => ({
		...rowToWorkspace(row),
		formCount: row.form_count
	}));
}

function getWorkspace(userId: string, workspaceId: string): Workspace | null {
	const row = db
		.prepare('SELECT id, owner_id, name, slug, created_at FROM workspaces WHERE id = ? AND owner_id = ?')
		.get(workspaceId, userId) as WorkspaceRow | undefined;

	if (!row) {
		return null;
	}
	return rowToWorkspace(row);
}

interface CreateWorkspaceResult {
	workspace?: Workspace;
	error?: string;
}

function createWorkspace(userId: string, rawName: string): CreateWorkspaceResult {
	const name = rawName.trim();
	if (!name) {
		return { error: 'Workspace name is required' };
	}
	if (name.length > 100) {
		return { error: 'Workspace name must be 100 characters or less' };
	}

	const baseSlug = slugify(name);
	const slug = ensureUniqueSlug(userId, baseSlug);
	const id = randomUUID();

	db.prepare(
		'INSERT INTO workspaces (id, owner_id, name, slug) VALUES (?, ?, ?, ?)'
	).run(id, userId, name, slug);

	const created = getWorkspace(userId, id);
	if (!created) {
		return { error: 'Failed to create workspace' };
	}
	return { workspace: created };
}

function countOrphanForms(userId: string): number {
	const row = db
		.prepare('SELECT COUNT(*) AS count FROM forms WHERE user_id = ? AND workspace_id IS NULL')
		.get(userId) as { count: number } | undefined;
	return row?.count ?? 0;
}

interface OrphanForm {
	id: string;
	name: string;
	createdAt: string;
	submissionCount: number;
}

function listOrphanForms(userId: string): OrphanForm[] {
	const rows = db
		.prepare(
			`SELECT f.id, f.name, f.created_at,
				(SELECT COUNT(*) FROM submissions WHERE form_id = f.id) AS submission_count
			FROM forms f
			WHERE f.user_id = ? AND f.workspace_id IS NULL
			ORDER BY f.created_at DESC`
		)
		.all(userId) as { id: string; name: string; created_at: string; submission_count: number }[];

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		createdAt: row.created_at,
		submissionCount: row.submission_count
	}));
}

interface AssignFormsResult {
	assigned: number;
	error?: string;
}

function assignFormsToWorkspace(
	userId: string,
	assignments: Map<string, string>
): AssignFormsResult {
	if (assignments.size === 0) {
		return { assigned: 0, error: 'No assignments provided' };
	}

	const formStmt = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?');
	const wsStmt = db.prepare('SELECT id FROM workspaces WHERE id = ? AND owner_id = ?');

	for (const [formId, workspaceId] of assignments) {
		if (!formStmt.get(formId, userId)) {
			return { assigned: 0, error: `Form ${formId} not found` };
		}
		if (!wsStmt.get(workspaceId, userId)) {
			return { assigned: 0, error: `Workspace ${workspaceId} not found` };
		}
	}

	const updateStmt = db.prepare('UPDATE forms SET workspace_id = ? WHERE id = ? AND user_id = ?');
	const tx = db.transaction((items: [string, string][]) => {
		for (const [formId, workspaceId] of items) {
			updateStmt.run(workspaceId, formId, userId);
		}
	});

	const items = Array.from(assignments.entries());
	tx(items);
	return { assigned: items.length };
}

export {
	listWorkspacesForUser,
	getWorkspace,
	createWorkspace,
	countOrphanForms,
	listOrphanForms,
	assignFormsToWorkspace,
	slugify,
	type Workspace,
	type WorkspaceWithCount,
	type OrphanForm
};
