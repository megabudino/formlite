interface RateLimitWindow {
	count: number;
	resetAt: number;
}

export interface RateLimitResult {
	allowed: boolean;
	retryAfterSeconds: number;
}

const windows = new Map<string, RateLimitWindow>();
let lastSweep = 0;

function sweepExpired(now: number, windowMs: number): void {
	if (now - lastSweep < windowMs) {
		return;
	}
	lastSweep = now;
	for (const [key, window] of windows) {
		if (window.resetAt <= now) {
			windows.delete(key);
		}
	}
}

// Fixed-window counter kept in process memory: limits are per server instance
// and reset on restart. A limit of 0 (or less) disables the check.
export function consumeRateLimit(
	key: string,
	limit: number,
	windowMs: number,
	now: number = Date.now()
): RateLimitResult {
	if (limit <= 0) {
		return { allowed: true, retryAfterSeconds: 0 };
	}

	sweepExpired(now, windowMs);

	const window = windows.get(key);
	if (!window || window.resetAt <= now) {
		windows.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, retryAfterSeconds: 0 };
	}

	if (window.count >= limit) {
		return { allowed: false, retryAfterSeconds: Math.ceil((window.resetAt - now) / 1000) };
	}

	window.count += 1;
	return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimits(): void {
	windows.clear();
	lastSweep = 0;
}
