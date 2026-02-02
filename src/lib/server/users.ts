import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

const DATABASE_PATH = env.DATABASE_PATH || './data/freeform.db';
const db = new Database(DATABASE_PATH);

export function hasUsers(): boolean {
	const row = db.prepare('SELECT COUNT(*) as count FROM user').get() as
		| { count: number }
		| undefined;

	return (row?.count ?? 0) > 0;
}
