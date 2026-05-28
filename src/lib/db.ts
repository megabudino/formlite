import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { runMigrations } from '$lib/migrations';
import { schema } from '$lib/schema';

let _db: Database.Database | null = null;

function getDb(): Database.Database {
	if (!_db) {
		const DATABASE_PATH = env.DATABASE_PATH || './data/freeform.db';

		const dbDir = dirname(DATABASE_PATH);
		if (!existsSync(dbDir)) {
			mkdirSync(dbDir, { recursive: true });
		}

		_db = new Database(DATABASE_PATH);
		_db.pragma('journal_mode = WAL');
		_db.pragma('foreign_keys = ON');
		_db.exec(schema);
		runMigrations(_db);
	}
	return _db;
}

const db = new Proxy({} as Database.Database, {
	get(_, prop) {
		return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
	}
});

export { getDb };
export default db;
