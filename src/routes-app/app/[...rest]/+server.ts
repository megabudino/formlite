import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// The app used to live under /app. Keep old bookmarks and shared links working.
export const GET: RequestHandler = ({ params, url }) => {
	throw redirect(301, `/${params.rest}${url.search}`);
};
