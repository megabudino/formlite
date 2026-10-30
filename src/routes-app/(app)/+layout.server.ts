import type { LayoutServerLoad } from './$types';
import db from '$lib/db';
import { getSsoConfig } from '$lib/server/sso';

// Exposes the signed-in user's name and email to the app shell (top bar, greeting),
// plus a link to their account at the SSO provider when they have one linked.
export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) return { user: null, ssoAccount: null };

	let ssoAccount: { label: string; url: string } | null = null;
	const sso = getSsoConfig();
	if (sso?.accountUrl) {
		const linked = db
			.prepare('SELECT 1 FROM account WHERE userId = ? AND providerId = ? LIMIT 1')
			.get(locals.user.id, sso.providerId);
		if (linked) ssoAccount = { label: sso.label, url: sso.accountUrl };
	}

	const profile = db.prepare('SELECT image FROM user WHERE id = ?').get(locals.user.id) as
		| { image: string | null }
		| undefined;

	return {
		user: { name: locals.user.name, email: locals.user.email, image: profile?.image ?? null },
		ssoAccount
	};
};
