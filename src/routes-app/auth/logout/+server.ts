import { json, type RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import db from '$lib/db';
import { getEndSessionEndpoint, getSsoConfig } from '$lib/server/sso';

// Logs out of Formlite. If the session came from single sign-on, the response also
// carries the provider's logout URL, so the browser ends the session there too.
export const POST: RequestHandler = async ({ request, locals, url }) => {
	let idToken: string | null = null;
	if (locals.session) {
		const row = db
			.prepare('SELECT oidcIdToken FROM session WHERE id = ?')
			.get(locals.session.id) as { oidcIdToken: string | null } | undefined;
		idToken = row?.oidcIdToken ?? null;
	}

	const signOut = await auth.api.signOut({ headers: request.headers, asResponse: true });

	let redirectTo = '/auth/login';
	const sso = getSsoConfig();
	if (idToken && sso) {
		const endpoint = await getEndSessionEndpoint(sso);
		if (endpoint) {
			const logoutUrl = new URL(endpoint);
			logoutUrl.searchParams.set('id_token_hint', idToken);
			logoutUrl.searchParams.set('client_id', sso.clientId);
			logoutUrl.searchParams.set('post_logout_redirect_uri', `${url.origin}/auth/login`);
			redirectTo = logoutUrl.toString();
		}
	}

	const response = json({ redirectTo });
	for (const cookie of signOut.headers.getSetCookie()) {
		response.headers.append('set-cookie', cookie);
	}
	return response;
};
