import test from 'node:test';
import assert from 'node:assert/strict';
import { isOriginAllowed, normalizeAllowedDomain } from '../src/lib/server/origin.ts';

test('normalizeAllowedDomain canonicalizes valid entries', () => {
	assert.equal(normalizeAllowedDomain(' Example.com '), 'example.com');
	assert.equal(normalizeAllowedDomain('example.com/'), 'example.com');
	assert.equal(normalizeAllowedDomain('example.com/contact'), 'example.com');
	assert.equal(normalizeAllowedDomain('localhost:5173'), 'localhost:5173');
	assert.equal(normalizeAllowedDomain('*.Example.com'), '*.example.com');
	assert.equal(normalizeAllowedDomain('https://example.com/contact'), 'https://example.com');
	assert.equal(normalizeAllowedDomain('https://example.com:443'), 'https://example.com');
	assert.equal(normalizeAllowedDomain('http://localhost:5173/'), 'http://localhost:5173');
});

test('normalizeAllowedDomain rejects unusable entries', () => {
	for (const entry of ['', '   ', 'exa mple.com', 'https://*.example.com', '*.', 'a.*.com', 'ftp://example.com', 'user@example.com', '*']) {
		assert.equal(normalizeAllowedDomain(entry), null, entry);
	}
});

test('isOriginAllowed allows everything when the list is empty', () => {
	assert.equal(isOriginAllowed(null, []), true);
	assert.equal(isOriginAllowed('https://anything.test', []), true);
});

test('isOriginAllowed rejects missing or opaque origins when the list is set', () => {
	assert.equal(isOriginAllowed(null, ['example.com']), false);
	assert.equal(isOriginAllowed('null', ['example.com']), false);
	assert.equal(isOriginAllowed('', ['example.com']), false);
});

test('bare domain matches any scheme and its www. variant', () => {
	assert.equal(isOriginAllowed('https://example.com', ['example.com']), true);
	assert.equal(isOriginAllowed('http://example.com', ['example.com']), true);
	assert.equal(isOriginAllowed('https://www.example.com', ['example.com']), true);
	assert.equal(isOriginAllowed('https://example.com:8443', ['example.com']), true);
	assert.equal(isOriginAllowed('https://app.example.com', ['example.com']), false);
	assert.equal(isOriginAllowed('https://example.com', ['www.example.com']), false);
	assert.equal(isOriginAllowed('https://example.com.evil.com', ['example.com']), false);
	assert.equal(isOriginAllowed('https://evilexample.com', ['example.com']), false);
});

test('domain with port matches only that port', () => {
	assert.equal(isOriginAllowed('http://localhost:5173', ['localhost:5173']), true);
	assert.equal(isOriginAllowed('http://localhost:3000', ['localhost:5173']), false);
	assert.equal(isOriginAllowed('https://example.com', ['example.com:443']), true);
	assert.equal(isOriginAllowed('http://example.com', ['example.com:443']), false);
});

test('wildcard matches subdomains only', () => {
	assert.equal(isOriginAllowed('https://app.example.com', ['*.example.com']), true);
	assert.equal(isOriginAllowed('https://a.b.example.com', ['*.example.com']), true);
	assert.equal(isOriginAllowed('https://example.com', ['*.example.com']), false);
	assert.equal(isOriginAllowed('https://evil-example.com', ['*.example.com']), false);
});

test('exact origin matches scheme, host and port', () => {
	assert.equal(isOriginAllowed('https://example.com', ['https://example.com']), true);
	assert.equal(isOriginAllowed('https://example.com/', ['https://example.com']), true);
	assert.equal(isOriginAllowed('http://example.com', ['https://example.com']), false);
	assert.equal(isOriginAllowed('https://www.example.com', ['https://example.com']), false);
	assert.equal(isOriginAllowed('https://example.com:8443', ['https://example.com']), false);
});

test('entries saved before validation are normalized on read', () => {
	assert.equal(isOriginAllowed('https://example.com', ['https://example.com/contact']), true);
	assert.equal(isOriginAllowed('https://example.com', ['example.com/']), true);
	assert.equal(isOriginAllowed('https://example.com', ['https://example.com:443']), true);
	assert.equal(isOriginAllowed('https://example.com', ['Example.COM ']), true);
	assert.equal(isOriginAllowed('https://app.example.com', ['https://*.example.com']), false);
	assert.equal(isOriginAllowed('https://example.com', ['not a domain', 'example.com']), true);
});
