import { getSsoConfig, isPasswordLoginEnabled } from '$lib/server/sso';

export const load = () => {
	const sso = getSsoConfig();
	return {
		sso: sso ? { providerId: sso.providerId, label: sso.label } : null,
		passwordLogin: isPasswordLoginEnabled()
	};
};
