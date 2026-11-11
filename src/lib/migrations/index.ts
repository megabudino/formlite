import Database from 'better-sqlite3';
import { migration as addAllowedDomains } from './001_add_allowed_domains';
import { migration as addWorkspaces } from './002_add_workspaces';
import { migration as addSessionOidcIdToken } from './003_add_session_oidc_id_token';
import { migration as addFormEmailTemplates } from './004_add_form_email_templates';
import { migration as addEmailFormats } from './005_add_email_formats';

type Migration = {
	id: string;
	up: (db: Database.Database) => void;
};

const migrations: Migration[] = [
	addAllowedDomains,
	addWorkspaces,
	addSessionOidcIdToken,
	addFormEmailTemplates,
	addEmailFormats
];

function runMigrations(db: Database.Database): void {
	db.exec(
		`CREATE TABLE IF NOT EXISTS migrations (
			id TEXT PRIMARY KEY,
			applied_at TEXT NOT NULL
		);`
	);

	const appliedRows = db.prepare('SELECT id FROM migrations').all() as { id: string }[];
	const applied = new Set(appliedRows.map((row) => row.id));

	for (const migration of migrations) {
		if (applied.has(migration.id)) {
			continue;
		}

		const applyMigration = db.transaction(() => {
			migration.up(db);
			db.prepare('INSERT INTO migrations (id, applied_at) VALUES (?, datetime(\'now\'))').run(
				migration.id
			);
		});

		applyMigration();
	}
}

export { runMigrations, type Migration, migrations };
