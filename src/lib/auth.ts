import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { getDb } from '$lib/db';

let _auth: ReturnType<typeof betterAuth> | null = null;

function getAuthConfig(): BetterAuthOptions {
	return {
		database: getDb(),
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
	};
}

export function getAuth() {
	if (!_auth) {
		_auth = betterAuth(getAuthConfig());
	}
	return _auth;
}

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
	get(_, prop) {
		return (getAuth() as unknown as Record<string | symbol, unknown>)[prop];
	}
});
