import db from '$lib/db';

export function hasUsers(): boolean {
	const row = db.prepare('SELECT COUNT(*) as count FROM user').get() as
		| { count: number }
		| undefined;

	return (row?.count ?? 0) > 0;
}
