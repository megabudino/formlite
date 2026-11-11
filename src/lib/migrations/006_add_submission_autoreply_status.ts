import Database from 'better-sqlite3';

// What happened to each submission's auto-reply (sent, failed, skipped…), shown in the inbox
// and used to skip people who already got it when sending to past submissions.
const columns: [name: string, definition: string][] = [
	['autoreply_status', 'TEXT'],
	['autoreply_at', 'TEXT'],
	['autoreply_error', 'TEXT']
];

const migration = {
	id: '006_add_submission_autoreply_status',
	up(db: Database.Database) {
		const existing = new Set(
			(db.prepare('PRAGMA table_info(submissions)').all() as { name: string }[]).map((column) => column.name)
		);
		for (const [name, definition] of columns) {
			if (!existing.has(name)) {
				db.exec(`ALTER TABLE submissions ADD COLUMN ${name} ${definition};`);
			}
		}
	}
};

export { migration };
