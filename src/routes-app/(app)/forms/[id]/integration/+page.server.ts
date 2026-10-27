import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The guide now lives in the form page's Integration tab.
export const load: PageServerLoad = ({ params }) => {
	throw redirect(301, `/forms/${params.id}?tab=integration`);
};
