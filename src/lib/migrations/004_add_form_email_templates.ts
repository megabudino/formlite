import Database from 'better-sqlite3';

// Custom notification email (NULL = built-in default) and the optional auto-reply
// sent to whoever fills in the form.
const columns: [name: string, definition: string][] = [
	['notify_subject', 'TEXT'],
	['notify_body', 'TEXT'],
	['autoreply_enabled', 'INTEGER NOT NULL DEFAULT 0'],
	['autoreply_subject', 'TEXT'],
	['autoreply_body', 'TEXT'],
	['autoreply_from_name', 'TEXT'],
	['autoreply_reply_to', 'TEXT']
];

const migration = {
	id: '004_add_form_email_templates',
	up(db: Database.Database) {
		const existing = new Set(
			(db.prepare('PRAGMA table_info(forms)').all() as { name: string }[]).map((column) => column.name)
		);
		for (const [name, definition] of columns) {
			if (!existing.has(name)) {
				db.exec(`ALTER TABLE forms ADD COLUMN ${name} ${definition};`);
			}
		}
	}
};

export { migration };
