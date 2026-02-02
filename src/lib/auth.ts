import { betterAuth } from 'better-auth';
import db from '$lib/db';

export const auth = betterAuth({
	database: db,
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
