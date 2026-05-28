import Database from 'better-sqlite3';
import test from 'node:test';
import assert from 'node:assert/strict';
import { schema } from '../src/lib/schema.ts';
import { runMigrations } from '../src/lib/migrations/index.ts';

const legacySchema = `
CREATE TABLE IF NOT EXISTS user (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	emailVerified INTEGER NOT NULL DEFAULT 0,
	image TEXT,
	createdAt TEXT NOT NULL DEFAULT (datetime('now')),
	updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session (
	id TEXT PRIMARY KEY,
	userId TEXT NOT NULL,
	token TEXT NOT NULL UNIQUE,
	expiresAt TEXT NOT NULL,
	ipAddress TEXT,
	userAgent TEXT,
	createdAt TEXT NOT NULL DEFAULT (datetime('now')),
	updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
	id TEXT PRIMARY KEY,
	userId TEXT NOT NULL,
	accountId TEXT NOT NULL,
	providerId TEXT NOT NULL,
	accessToken TEXT,
	refreshToken TEXT,
	accessTokenExpiresAt TEXT,
	refreshTokenExpiresAt TEXT,
	scope TEXT,
	idToken TEXT,
	password TEXT,
	createdAt TEXT NOT NULL DEFAULT (datetime('now')),
	updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification (
	id TEXT PRIMARY KEY,
	identifier TEXT NOT NULL,
	value TEXT NOT NULL,
	expiresAt TEXT NOT NULL,
	createdAt TEXT NOT NULL DEFAULT (datetime('now')),
	updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS forms (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	name TEXT NOT NULL,
	redirect_url TEXT,
	target_emails TEXT NOT NULL DEFAULT '[]',
	is_active INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	form_id TEXT NOT NULL,
	data TEXT NOT NULL DEFAULT '{}',
	meta TEXT NOT NULL DEFAULT '{}',
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhooks (
	id TEXT PRIMARY KEY,
	form_id TEXT NOT NULL,
	url TEXT NOT NULL,
	secret TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(userId);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(userId);
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_form_id ON webhooks(form_id);
`;

function getColumnNames(db: Database.Database, table: string): string[] {
	const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
	return rows.map((row) => row.name);
}

function getTableNames(db: Database.Database): string[] {
	const rows = db
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
		.all() as { name: string }[];
	return rows.map((row) => row.name);
}

test('fresh installs stay aligned with recorded migrations', () => {
	const db = new Database(':memory:');

	db.exec(schema);
	runMigrations(db);

	assert.deepEqual(
		db.prepare('SELECT id FROM migrations ORDER BY id').all(),
		[{ id: '001_add_allowed_domains' }, { id: '002_add_workspaces' }]
	);
	assert.ok(getColumnNames(db, 'forms').includes('allowed_domains'));
	assert.ok(getColumnNames(db, 'forms').includes('workspace_id'));
	assert.ok(getTableNames(db).includes('blocked_requests'));
	assert.ok(getTableNames(db).includes('workspaces'));

	// Running migrations again should remain a no-op for already aligned databases.
	runMigrations(db);
	const migrationCount = db.prepare('SELECT COUNT(*) as count FROM migrations').get() as { count: number };
	assert.equal(migrationCount.count, 2);

	db.close();
});

test('legacy installs are upgraded by all migrations', () => {
	const db = new Database(':memory:');

	db.exec(legacySchema);
	runMigrations(db);

	const formColumns = getColumnNames(db, 'forms');
	assert.ok(formColumns.includes('allowed_domains'));
	assert.ok(formColumns.includes('workspace_id'));
	assert.ok(getTableNames(db).includes('blocked_requests'));
	assert.ok(getTableNames(db).includes('workspaces'));
	assert.deepEqual(
		db.prepare('SELECT id FROM migrations ORDER BY id').all(),
		[{ id: '001_add_allowed_domains' }, { id: '002_add_workspaces' }]
	);

	db.close();
});

test('schema applied on pre-002 DB succeeds, then migrations bring it up to date', () => {
	// Mirrors src/lib/db.ts: db.exec(schema) followed by runMigrations(db).
	// Regression: the schema must not assume columns added by later migrations exist.
	const db = new Database(':memory:');

	db.exec(legacySchema);
	db.exec(`ALTER TABLE forms ADD COLUMN allowed_domains TEXT NOT NULL DEFAULT '[]';`);
	db.exec(
		`CREATE TABLE blocked_requests (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			form_id TEXT NOT NULL,
			origin TEXT,
			ip TEXT,
			user_agent TEXT,
			data TEXT NOT NULL DEFAULT '{}',
			reason TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
		);`
	);
	db.exec(
		`CREATE TABLE migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
		INSERT INTO migrations (id, applied_at) VALUES ('001_add_allowed_domains', datetime('now'));`
	);

	assert.doesNotThrow(() => db.exec(schema));
	assert.doesNotThrow(() => runMigrations(db));

	assert.ok(getColumnNames(db, 'forms').includes('workspace_id'));
	assert.ok(getTableNames(db).includes('workspaces'));
	assert.deepEqual(
		db.prepare('SELECT id FROM migrations ORDER BY id').all(),
		[{ id: '001_add_allowed_domains' }, { id: '002_add_workspaces' }]
	);

	db.close();
});

test('migration 002 preserves existing form rows and leaves workspace_id null', () => {
	const db = new Database(':memory:');

	db.exec(legacySchema);
	db.prepare("INSERT INTO user (id, name, email) VALUES ('u1', 'User', 'user@example.com')").run();
	db.prepare(
		"INSERT INTO forms (id, user_id, name, target_emails) VALUES ('f1', 'u1', 'Existing form', '[]')"
	).run();

	runMigrations(db);

	const row = db.prepare('SELECT id, user_id, workspace_id, name FROM forms WHERE id = ?').get('f1') as {
		id: string;
		user_id: string;
		workspace_id: string | null;
		name: string;
	};

	assert.equal(row.id, 'f1');
	assert.equal(row.user_id, 'u1');
	assert.equal(row.workspace_id, null);
	assert.equal(row.name, 'Existing form');

	db.close();
});
