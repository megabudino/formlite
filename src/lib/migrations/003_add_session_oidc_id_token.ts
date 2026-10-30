import Database from 'better-sqlite3';

// Sessions opened through single sign-on keep the provider's id_token, so logging
// out can also end the session at the provider (RP-initiated logout).
const migration = {
	id: '003_add_session_oidc_id_token',
	up(db: Database.Database) {
		const columns = db.prepare('PRAGMA table_info(session)').all() as { name: string }[];
		if (!columns.some((column) => column.name === 'oidcIdToken')) {
			db.exec('ALTER TABLE session ADD COLUMN oidcIdToken TEXT;');
		}
	}
};

export { migration };
