import { auth } from '$lib/auth';
import { hasUsers } from '$lib/server/users';
import { countOrphanForms } from '$lib/server/workspaces';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';

const DEPLOY_TARGET = process.env.DEPLOY_TARGET ?? 'app';

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

	if (path.startsWith('/app')) {
		if (!session) {
			throw redirect(302, '/auth/login');
		}

		const isMigratePath = path === '/app/migrate' || path.startsWith('/app/migrate/');
		if (!isMigratePath && countOrphanForms(session.user.id) > 0) {
			throw redirect(302, '/app/migrate');
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
