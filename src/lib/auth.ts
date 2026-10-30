import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { genericOAuth } from 'better-auth/plugins';
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/db';
import { getProviderPicture, getSsoConfig, isPasswordLoginEnabled } from '$lib/server/sso';

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

function getSsoPlugins(): NonNullable<BetterAuthOptions['plugins']> {
	const sso = getSsoConfig();
	if (!sso) return [];

	return [
		genericOAuth({
			config: [
				{
					providerId: sso.providerId,
					discoveryUrl: sso.discoveryUrl,
					clientId: sso.clientId,
					clientSecret: sso.clientSecret,
					authentication: sso.tokenAuthMethod,
					scopes: ['openid', 'email', 'profile'],
					pkce: true,
					// Invite only: SSO logs in existing users, it never creates new ones.
					disableSignUp: true,
					mapProfileToUser: (profile) => ({
						name: profile.name || profile.preferred_username || profile.email,
						// Linking to an existing account by email requires a verified email.
						emailVerified: profile.email_verified === true
					})
				}
			]
		})
	];
}

function getAuthConfig(): BetterAuthOptions {
	return {
		database: getDb(),
		trustedOrigins: parseTrustedOrigins(),
		emailAndPassword: {
			enabled: isPasswordLoginEnabled(),
			disableSignUp: true,
			minPasswordLength: 8
		},
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60 // 5 minutes
			}
		},
		databaseHooks: {
			session: {
				create: {
					// On SSO logins: remember the id_token on the session (for logout) and
					// take the profile picture from the provider.
					after: async (session, ctx) => {
						const sso = getSsoConfig();
						if (!sso || !ctx?.path?.startsWith('/oauth2/callback')) return;
						const db = getDb();
						const row = db
							.prepare(
								'SELECT idToken, accessToken FROM account WHERE userId = ? AND providerId = ?'
							)
							.get(session.userId, sso.providerId) as
							| { idToken: string | null; accessToken: string | null }
							| undefined;
						const idToken = row?.idToken ?? null;
						db.prepare('UPDATE session SET oidcIdToken = ? WHERE id = ?').run(idToken, session.id);

						const picture = await getProviderPicture(sso, idToken, row?.accessToken ?? null);
						if (picture !== undefined) {
							db.prepare(`UPDATE user SET image = ?, updatedAt = datetime('now') WHERE id = ?`).run(
								picture,
								session.userId
							);
						}
					}
				}
			}
		},
		// Send OAuth errors (e.g. SSO user not found) back to the login page.
		onAPIError: { errorURL: '/auth/login' },
		plugins: getSsoPlugins()
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
