import { env } from '$env/dynamic/private';

// Single sign-on through any OpenID Connect provider (Authentik, Keycloak,
// Pocket ID, Zitadel, ...). Enabled only when issuer and client ID are set.
// SSO never creates accounts: it only logs in users who already exist here,
// matched by a verified email.

export const SSO_PROVIDER_ID = 'oidc';

export type SsoConfig = {
	providerId: string;
	label: string;
	discoveryUrl: string;
	clientId: string;
	clientSecret?: string;
	/** How the client secret is sent to the token endpoint. */
	tokenAuthMethod: 'basic' | 'post';
	/** Page where users manage their account at the provider (profile, passkeys, sessions). */
	accountUrl?: string;
};

function parseHttpUrl(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	if (!trimmed) return undefined;
	try {
		const url = new URL(trimmed);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
	} catch {
		return undefined;
	}
}

export function getSsoConfig(): SsoConfig | null {
	const issuer = env.OIDC_ISSUER?.trim().replace(/\/+$/, '');
	const clientId = env.OIDC_CLIENT_ID?.trim();
	if (!issuer || !clientId) return null;

	return {
		providerId: SSO_PROVIDER_ID,
		label: env.OIDC_PROVIDER_NAME?.trim() || 'SSO',
		discoveryUrl: `${issuer}/.well-known/openid-configuration`,
		clientId,
		clientSecret: env.OIDC_CLIENT_SECRET?.trim() || undefined,
		// client_secret_basic is the OIDC default; a few providers want client_secret_post.
		tokenAuthMethod: env.OIDC_TOKEN_AUTH_METHOD?.trim() === 'client_secret_post' ? 'post' : 'basic',
		accountUrl: parseHttpUrl(env.OIDC_ACCOUNT_URL)
	};
}

// PASSWORD_LOGIN=false turns off email/password login, but only when SSO is
// configured: without it nobody could log in. To get back in when the provider
// is down, remove the variable and restart.
export function isPasswordLoginEnabled(): boolean {
	const disabled = env.PASSWORD_LOGIN?.trim().toLowerCase() === 'false';
	return !(disabled && getSsoConfig());
}

type Discovery = { end_session_endpoint?: string; userinfo_endpoint?: string };

let discoveryCache: { url: string; doc: Discovery } | null = null;

// The provider's discovery document (cached after the first successful read).
async function getDiscovery(sso: SsoConfig): Promise<Discovery | null> {
	if (discoveryCache?.url === sso.discoveryUrl) return discoveryCache.doc;

	try {
		const res = await fetch(sso.discoveryUrl, { signal: AbortSignal.timeout(5000) });
		if (!res.ok) return null;
		const raw = (await res.json()) as Record<string, unknown>;
		const doc: Discovery = {
			end_session_endpoint:
				typeof raw.end_session_endpoint === 'string' ? raw.end_session_endpoint : undefined,
			userinfo_endpoint:
				typeof raw.userinfo_endpoint === 'string' ? raw.userinfo_endpoint : undefined
		};
		discoveryCache = { url: sso.discoveryUrl, doc };
		return doc;
	} catch (err) {
		console.error('Could not read the OIDC discovery document:', err);
		return null;
	}
}

// The provider's logout endpoint, if it has one.
export async function getEndSessionEndpoint(sso: SsoConfig): Promise<string | null> {
	return (await getDiscovery(sso))?.end_session_endpoint ?? null;
}

function decodeJwtClaims(token: string | null): Record<string, unknown> | null {
	const payload = token?.split('.')[1];
	if (!payload) return null;
	try {
		return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
	} catch {
		return null;
	}
}

function toHttpUrl(value: unknown): string | null {
	return typeof value === 'string' ? (parseHttpUrl(value) ?? null) : null;
}

// The user's profile picture URL from the provider: the `picture` claim of the
// id_token, or of the userinfo endpoint for providers that keep profile claims
// there. Returns null when the provider has no picture for this user, and
// undefined when it could not be checked (keep the current picture then).
export async function getProviderPicture(
	sso: SsoConfig,
	idToken: string | null,
	accessToken: string | null
): Promise<string | null | undefined> {
	const claims = decodeJwtClaims(idToken);
	const fromIdToken = toHttpUrl(claims?.picture);
	if (fromIdToken || !accessToken) return fromIdToken;

	const discovery = await getDiscovery(sso);
	if (!discovery) return undefined;
	const endpoint = discovery.userinfo_endpoint;
	if (!endpoint) return null;

	try {
		const res = await fetch(endpoint, {
			headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
			signal: AbortSignal.timeout(5000)
		});
		if (!res.ok) return undefined;
		const info = (await res.json()) as Record<string, unknown>;
		// Userinfo must describe the same user as the id_token.
		if (claims?.sub && info.sub !== claims.sub) return undefined;
		return toHttpUrl(info.picture);
	} catch (err) {
		console.error('Could not read the OIDC userinfo endpoint:', err);
		return undefined;
	}
}
