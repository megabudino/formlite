import test from 'node:test';
import assert from 'node:assert/strict';
import {
	renderEmail,
	DEFAULT_NOTIFY_SUBJECT,
	DEFAULT_NOTIFY_BODY
} from '../src/lib/email-template.ts';

const ctx = {
	data: { name: 'Jane', email: 'jane@example.com', address: { city: 'Rome' }, tags: ['a', 'b'] },
	formName: 'Newsletter',
	submittedAt: '2026-11-11T10:00:00.000Z'
};

test('default notification matches the previous built-in email', () => {
	const email = renderEmail({ subject: DEFAULT_NOTIFY_SUBJECT, body: DEFAULT_NOTIFY_BODY }, ctx);
	assert.equal(email.subject, 'New submission from Newsletter');
	assert.equal(
		email.text,
		'You received a new submission from Newsletter\n\nSubmitted at: 2026-11-11T10:00:00.000Z\n\n---\n\n' +
			'name: Jane\nemail: jane@example.com\naddress: {"city":"Rome"}\ntags: a, b'
	);
});

test('fills fields, nested fields and blanks for missing ones', () => {
	const email = renderEmail(
		{ subject: 'Hi {{ name }}', body: '{{address.city}}|{{tags}}|{{missing}}|{{form_name}}' },
		ctx
	);
	assert.equal(email.subject, 'Hi Jane');
	assert.equal(email.text, 'Rome|a, b||Newsletter');
});

test('subject never spans more than one line', () => {
	const email = renderEmail({ subject: 'Hi {{name}}', body: '' }, {
		...ctx,
		data: { name: 'Jane\r\nBcc: someone@example.com' }
	});
	assert.equal(email.subject, 'Hi Jane Bcc: someone@example.com');
});

test('html escapes visitor values and links only template URLs', () => {
	const email = renderEmail(
		{ subject: 's', body: 'Get it: https://example.com/guide.pdf.\nHi {{name}}' },
		{ ...ctx, data: { name: '<b>x</b> https://evil.example' } }
	);
	assert.match(email.html, /<a href="https:\/\/example.com\/guide.pdf">https:\/\/example.com\/guide.pdf<\/a>\./);
	assert.match(email.html, /&lt;b&gt;x&lt;\/b&gt; https:\/\/evil.example/);
	assert.doesNotMatch(email.html, /href="https:\/\/evil/);
	assert.match(email.html, /<br>/);
});

test('auto-replies clamp visitor values to one short line', () => {
	const email = renderEmail(
		{ subject: 'Hi {{name}}', body: 'Hi {{name}}' },
		{ ...ctx, data: { name: `Jane\n\nline two ${'x'.repeat(300)}` } },
		{ clampValues: true }
	);
	assert.ok(!email.text.includes('\n'));
	assert.equal(email.text.length, 'Hi '.length + 100);
});

test('submitted fields cannot override built-in variables', () => {
	const email = renderEmail(
		{ subject: '{{form_name}}', body: '{{form_name}}' },
		{ ...ctx, data: { form_name: 'spoofed' } }
	);
	assert.equal(email.text, 'Newsletter');
});
