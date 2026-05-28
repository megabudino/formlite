import nodeAdapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const target = process.env.DEPLOY_TARGET ?? 'app';

if (target !== 'app' && target !== 'marketing') {
	throw new Error(
		`Invalid DEPLOY_TARGET="${target}". Must be "app" or "marketing".`
	);
}

const isMarketing = target === 'marketing';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		files: {
			routes: `src/routes-${target}`
		},
		adapter: isMarketing
			? staticAdapter({
					pages: 'build',
					assets: 'build',
					fallback: undefined,
					strict: true
				})
			: nodeAdapter({
					out: 'build'
				}),
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
