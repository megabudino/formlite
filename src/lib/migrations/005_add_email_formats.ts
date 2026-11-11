import Database from 'better-sqlite3';

// Whether each form email is written as plain text or HTML.
const columns = ['notify_format', 'autoreply_format'];

const migration = {
	id: '005_add_email_formats',
	up(db: Database.Database) {
		const existing = new Set(
			(db.prepare('PRAGMA table_info(forms)').all() as { name: string }[]).map((column) => column.name)
		);
		for (const name of columns) {
			if (!existing.has(name)) {
				db.exec(`ALTER TABLE forms ADD COLUMN ${name} TEXT NOT NULL DEFAULT 'text';`);
			}
		}
	}
};

export { migration };
