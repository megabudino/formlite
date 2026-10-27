// Normalizes an allowed-domain entry to one of three canonical forms:
//   - exact origin:  https://example.com        (scheme + host [+ port])
//   - domain:        example.com | host:8080    (any scheme)
//   - wildcard:      *.example.com              (subdomains only, any scheme)
// Paths and trailing slashes are dropped. Returns null if the entry is unusable.
export function normalizeAllowedDomain(rawDomain: string): string | null {
	const value = rawDomain.trim().toLowerCase();
	if (!value || /\s/.test(value)) {
		return null;
	}

	if (value.includes('://')) {
		if (value.includes('*')) {
			return null;
		}
		try {
			const url = new URL(value);
			if (url.protocol !== 'http:' && url.protocol !== 'https:') {
				return null;
			}
			return url.origin;
		} catch {
			return null;
		}
	}

	const isWildcard = value.startsWith('*.');
	const hostPart = isWildcard ? value.slice(2) : value;
	if (!hostPart || hostPart.includes('*') || hostPart.includes('@')) {
		return null;
	}

	try {
		const url = new URL(`http://${hostPart}`);
		if (!url.hostname) {
			return null;
		}
		return isWildcard ? `*.${url.hostname}` : url.host;
	} catch {
		return null;
	}
}

export function isOriginAllowed(origin: string | null, allowedDomains: string[]): boolean {
	if (allowedDomains.length === 0) {
		return true;
	}

	if (!origin) {
		return false;
	}

	let originUrl: URL;
	try {
		originUrl = new URL(origin.trim().toLowerCase());
	} catch {
		return false;
	}

	const originHost = originUrl.hostname;
	const defaultPort = originUrl.protocol === 'https:' ? '443' : '80';
	const originHostWithPort = `${originHost}:${originUrl.port || defaultPort}`;

	for (const rawDomain of allowedDomains) {
		// Normalize on read too, so entries saved before validation existed still work
		const allowed = typeof rawDomain === 'string' ? normalizeAllowedDomain(rawDomain) : null;
		if (!allowed) {
			continue;
		}

		if (allowed.includes('://')) {
			if (originUrl.origin === allowed) {
				return true;
			}
			continue;
		}

		if (allowed.startsWith('*.')) {
			if (originHost.endsWith(allowed.slice(1))) {
				return true;
			}
			continue;
		}

		if (/:\d+$/.test(allowed)) {
			if (originHostWithPort === allowed) {
				return true;
			}
			continue;
		}

		// A bare domain also covers its www. variant
		if (originHost === allowed || originHost === `www.${allowed}`) {
			return true;
		}
	}

	return false;
}
