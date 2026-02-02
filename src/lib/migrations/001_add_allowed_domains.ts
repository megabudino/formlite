import Database from 'better-sqlite3';

const migration = {
	id: '001_add_allowed_domains',
	up(db: Database.Database) {
		db.exec(
			`ALTER TABLE forms ADD COLUMN allowed_domains TEXT NOT NULL DEFAULT '[]';
CREATE TABLE IF NOT EXISTS blocked_requests (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	form_id TEXT NOT NULL,
	origin TEXT,
	ip TEXT,
	user_agent TEXT,
	data TEXT NOT NULL DEFAULT '{}',
	reason TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_blocked_requests_form_id ON blocked_requests(form_id);`
		);
	}
};

export { migration };
