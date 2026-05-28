import type { Actions } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { hasUsers } from '$lib/server/users';
import db from '$lib/db';
import { randomBytes, randomUUID, scryptSync } from 'crypto';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString('hex');
	const normalized = password.normalize('NFKC');
	const key = scryptSync(normalized, salt, 64, {
		N: 16384,
		r: 16,
		p: 1,
		maxmem: 128 * 16384 * 16 * 2
	});

	return `${salt}:${key.toString('hex')}`;
}

export const load = async () => {
	if (hasUsers()) {
		throw redirect(302, '/auth/login');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		if (hasUsers()) {
			return fail(400, {
				error: 'Setup has already been completed. Please log in.'
			});
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim() ?? '';
		const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

		const fieldErrors: Record<string, string> = {};

		if (!name) {
			fieldErrors.name = 'Name is required';
		}

		if (!email) {
			fieldErrors.email = 'Email is required';
		} else if (!emailPattern.test(email)) {
			fieldErrors.email = 'Enter a valid email address';
		}

		if (!password) {
			fieldErrors.password = 'Password is required';
		} else if (password.length < 8) {
			fieldErrors.password = 'Password must be at least 8 characters';
		}

		if (!confirmPassword) {
			fieldErrors.confirmPassword = 'Confirm your password';
		} else if (password !== confirmPassword) {
			fieldErrors.confirmPassword = 'Passwords do not match';
		}

		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, {
				fieldErrors,
				name,
				email
			});
		}

		const existingUser = db
			.prepare('SELECT id FROM user WHERE lower(email) = ?')
			.get(email) as { id: string } | undefined;

		if (existingUser) {
			return fail(400, {
				fieldErrors: {
					email: 'An account with this email already exists'
				},
				name,
				email
			});
		}

		const userId = randomUUID();
		const accountId = randomUUID();
		const passwordHash = await hashPassword(password);

		const createUser = db.transaction(() => {
			const row = db.prepare('SELECT COUNT(*) as count FROM user').get() as
				| { count: number }
				| undefined;

			if ((row?.count ?? 0) > 0) {
				throw new Error('Setup already completed');
			}

			const insertUser = db.prepare(
				`INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
				 VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`
			);
			insertUser.run(userId, name, email);

			const insertAccount = db.prepare(
				`INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
				 VALUES (?, ?, ?, 'credential', ?, datetime('now'), datetime('now'))`
			);
			insertAccount.run(accountId, userId, userId, passwordHash);
		});

		try {
			createUser();
		} catch (err) {
			if (err instanceof Error && err.message === 'Setup already completed') {
				return fail(400, {
					error: 'Setup has already been completed. Please log in.'
				});
			}

			console.error('Failed to create initial user:', err);
			return fail(500, {
				error: 'Failed to create account. Please try again.'
			});
		}

		throw redirect(303, '/auth/login?setup=success');
	}
};
