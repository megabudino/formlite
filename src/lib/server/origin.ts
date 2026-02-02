export function isOriginAllowed(origin: string | null, allowedDomains: string[]): boolean {
	if (allowedDomains.length === 0) {
		return true;
	}

	if (!origin) {
		return false;
	}

	const trimmedOrigin = origin.trim();
	if (!trimmedOrigin) {
		return false;
	}

	const originLower = trimmedOrigin.toLowerCase();
	const originCompare = originLower.endsWith('/') ? originLower.slice(0, -1) : originLower;

	let originHost: string | null = null;
	try {
		const originUrl = new URL(originLower);
		originHost = originUrl.hostname.toLowerCase();
	} catch {
		return false;
	}

	for (const rawDomain of allowedDomains) {
		const allowed = rawDomain.trim().toLowerCase();
		if (!allowed) {
			continue;
		}

		if (allowed.includes('://')) {
			const allowedCompare = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
			if (originCompare === allowedCompare) {
				return true;
			}
			continue;
		}

		if (allowed.startsWith('*.')) {
			const baseDomain = allowed.slice(2);
			if (!baseDomain) {
				continue;
			}
			if (originHost !== baseDomain && originHost.endsWith(`.${baseDomain}`)) {
				return true;
			}
			continue;
		}

		if (originHost === allowed) {
			return true;
		}
	}

	return false;
}
