import type { LayoutServerLoad } from './$types';

// Exposes the signed-in user's name and email to the app shell (top bar, greeting).
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ? { name: locals.user.name, email: locals.user.email } : null
	};
};
