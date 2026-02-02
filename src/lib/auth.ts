import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';

const DATABASE_PATH = env.DATABASE_PATH || './data/freeform.db';

export const auth = betterAuth({
	database: new Database(DATABASE_PATH),
	emailAndPassword: {
		enabled: true,
		disableSignUp: true,
		minPasswordLength: 8
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60 // 5 minutes
		}
	}
});
