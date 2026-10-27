import { auth } from '$lib/auth';
import { hasUsers } from '$lib/server/users';
import { countOrphanForms } from '$lib/server/workspaces';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';

const DEPLOY_TARGET = process.env.DEPLOY_TARGET ?? 'app';

// Everything is behind login except these: auth pages and API, first-run setup,
// the public submission endpoint and its thank-you page, the health check, and
// the legacy /app/* redirects (which forward to pages that are themselves protected).
const PUBLIC_PATHS = ['/auth', '/api/auth', '/setup', '/s', '/thanks', '/health', '/app'];

function isPublicPath(path: string): boolean {
	return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export const handle: Handle = async ({ event, resolve }) => {
	if (DEPLOY_TARGET === 'marketing') {
		return resolve(event);
	}

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	const path = event.url.pathname;
	const isSetupPath = path === '/setup' || path.startsWith('/setup/');
	const isLoginPath = path === '/auth/login' || path.startsWith('/auth/login/');

	if (isSetupPath || isLoginPath) {
		const usersExist = hasUsers();

		if (!usersExist && isLoginPath) {
			throw redirect(302, '/setup');
		}

		if (usersExist && isSetupPath) {
			throw redirect(302, '/auth/login');
		}
	}

	if (!isPublicPath(path)) {
		if (!session) {
			throw redirect(302, '/auth/login');
		}

		const isMigratePath = path === '/migrate' || path.startsWith('/migrate/');
		if (!isMigratePath && countOrphanForms(session.user.id) > 0) {
			throw redirect(302, '/migrate');
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
