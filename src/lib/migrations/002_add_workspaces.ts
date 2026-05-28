import Database from 'better-sqlite3';

const migration = {
	id: '002_add_workspaces',
	up(db: Database.Database) {
		db.exec(
			`CREATE TABLE IF NOT EXISTS workspaces (
	id TEXT PRIMARY KEY,
	owner_id TEXT NOT NULL,
	name TEXT NOT NULL,
	slug TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_owner_slug ON workspaces(owner_id, slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);`
		);

		const formColumns = db.prepare('PRAGMA table_info(forms)').all() as { name: string }[];
		const hasWorkspaceId = formColumns.some((column) => column.name === 'workspace_id');

		if (!hasWorkspaceId) {
			db.exec(`ALTER TABLE forms ADD COLUMN workspace_id TEXT;`);
		}

		db.exec(`CREATE INDEX IF NOT EXISTS idx_forms_workspace_id ON forms(workspace_id);`);
	}
};

export { migration };
