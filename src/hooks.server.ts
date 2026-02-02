import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	if (event.url.pathname.startsWith('/app')) {
		if (!session) {
			throw redirect(302, '/auth/login');
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
}
