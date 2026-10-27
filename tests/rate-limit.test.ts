import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeRateLimit, resetRateLimits } from '../src/lib/server/rate-limit.ts';

test('allows up to the limit, then blocks until the window resets', () => {
	resetRateLimits();
	const start = 1_000_000;

	for (let i = 0; i < 3; i++) {
		assert.equal(consumeRateLimit('a', 3, 60_000, start + i).allowed, true);
	}

	const blocked = consumeRateLimit('a', 3, 60_000, start + 30_000);
	assert.equal(blocked.allowed, false);
	assert.equal(blocked.retryAfterSeconds, 30);

	assert.equal(consumeRateLimit('a', 3, 60_000, start + 60_000).allowed, true);
});

test('keys are independent', () => {
	resetRateLimits();
	assert.equal(consumeRateLimit('a', 1, 60_000, 0).allowed, true);
	assert.equal(consumeRateLimit('a', 1, 60_000, 1).allowed, false);
	assert.equal(consumeRateLimit('b', 1, 60_000, 1).allowed, true);
});

test('a limit of 0 disables the check', () => {
	resetRateLimits();
	for (let i = 0; i < 50; i++) {
		assert.equal(consumeRateLimit('a', 0, 60_000, i).allowed, true);
	}
});
