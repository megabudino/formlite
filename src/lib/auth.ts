import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/db';

let _auth: ReturnType<typeof betterAuth> | null = null;

// Parses a comma-separated list of origins. Accepts full origins
// (https://example.com) or wildcard patterns (https://*.example.com).
// ORIGIN is included as a fallback so the canonical domain is always trusted.
function parseTrustedOrigins(): string[] {
	const sources = [env.TRUSTED_ORIGINS, env.ORIGIN];
	const seen = new Set<string>();
	for (const raw of sources) {
		if (!raw) continue;
		for (const value of raw.split(',')) {
			const trimmed = value.trim();
			if (trimmed) seen.add(trimmed);
		}
	}
	return [...seen];
}

function getAuthConfig(): BetterAuthOptions {
	return {
		database: getDb(),
		trustedOrigins: parseTrustedOrigins(),
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
