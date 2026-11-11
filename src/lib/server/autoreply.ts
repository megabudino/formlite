import db from '$lib/db';
import { sendEmail } from '$lib/email';
import { renderEmail, type TemplateContext } from '$lib/email-template';
import { consumeRateLimit } from './rate-limit';

// What happened to the auto-reply of a submission. NULL: auto-reply was off.
export type AutoreplyStatus = 'pending' | 'sent' | 'failed' | 'limited' | 'no_address';

export interface AutoreplySettings {
	id: string;
	name: string;
	autoreply_enabled: number;
	autoreply_subject: string | null;
	autoreply_body: string | null;
	autoreply_format: string;
	autoreply_from_name: string | null;
	autoreply_reply_to: string | null;
}

function readLimit(name: string, fallback: number): number {
	const parsed = Number.parseInt(process.env[name] ?? '', 10);
	return Number.isNaN(parsed) ? fallback : parsed;
}

// Auto-replies per recipient address, per form, per day. 0 disables the limit.
const LIMIT_PER_RECIPIENT = readLimit('AUTOREPLY_LIMIT_PER_RECIPIENT', 3);
const LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The visitor's address: reply_to takes precedence over email
export function visitorAddress(data: Record<string, unknown>): string | undefined {
	for (const key of ['reply_to', 'email']) {
		const value = data[key];
		if (typeof value === 'string' && EMAIL_PATTERN.test(value.trim())) return value.trim();
	}
	return undefined;
}

export function autoreplyReady(form: AutoreplySettings): boolean {
	return form.autoreply_enabled === 1 && !!form.autoreply_subject && !!form.autoreply_body;
}

function setStatus(submissionId: number, status: AutoreplyStatus, error: string | null = null): void {
	db.prepare(
		`UPDATE submissions SET autoreply_status = ?, autoreply_error = ?,
			autoreply_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE autoreply_at END
		WHERE id = ?`
	).run(status, error, status, submissionId);
}

// Sends the auto-reply for one submission and records the outcome on it.
// Resolves once the email is sent (or skipped); never throws.
export async function sendAutoreply(
	form: AutoreplySettings,
	submissionId: number,
	data: Record<string, unknown>,
	submittedAt: string
): Promise<AutoreplyStatus> {
	const recipient = visitorAddress(data);
	if (!recipient) {
		setStatus(submissionId, 'no_address');
		return 'no_address';
	}

	// Keeps the form from being used to flood someone else's inbox
	const limit = consumeRateLimit(
		`autoreply:${form.id}:${recipient.toLowerCase()}`,
		LIMIT_PER_RECIPIENT,
		LIMIT_WINDOW_MS
	);
	if (!limit.allowed) {
		console.log(`[Email] Auto-reply for form "${form.name}" to ${recipient} skipped: daily limit reached`);
		setStatus(submissionId, 'limited');
		return 'limited';
	}

	setStatus(submissionId, 'pending');
	const context: TemplateContext = { data, formName: form.name, submittedAt };
	const email = renderEmail(
		{
			subject: form.autoreply_subject ?? '',
			body: form.autoreply_body ?? '',
			format: form.autoreply_format === 'html' ? 'html' : 'text'
		},
		context,
		{ clampValues: true }
	);

	try {
		const result = await sendEmail(recipient, {
			...email,
			fromName: form.autoreply_from_name || undefined,
			replyTo: form.autoreply_reply_to || undefined
		});
		if (result.success) {
			console.log(`[Email] Auto-reply for form "${form.name}" sent to ${recipient}`);
			setStatus(submissionId, 'sent');
			return 'sent';
		}
		console.error(`[Email] Auto-reply for form "${form.name}" to ${recipient} failed: ${result.error}`);
		setStatus(submissionId, 'failed', result.error ?? 'Unknown error');
		return 'failed';
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		console.error(`[Email] Unexpected error sending auto-reply for form "${form.name}":`, err);
		setStatus(submissionId, 'failed', message);
		return 'failed';
	}
}

export const BACKFILL_WINDOWS_DAYS = [1, 7, 30] as const;
// Upper bound for one "send to past submissions" run, to keep it a catch-up, not a mailing
export const BACKFILL_MAX = 500;

export interface BackfillTarget {
	submissionId: number;
	data: Record<string, unknown>;
	createdAt: string;
}

// Past submissions that should get the auto-reply: one per address (the most recent),
// skipping addresses that already received it from this form.
export function findBackfillTargets(formId: string, days: number): BackfillTarget[] {
	const rows = db
		.prepare(
			`SELECT id, data, created_at, autoreply_status FROM submissions
			WHERE form_id = ? AND created_at >= datetime('now', ?)
			ORDER BY created_at DESC, id DESC`
		)
		.all(formId, `-${days} days`) as {
		id: number;
		data: string;
		created_at: string;
		autoreply_status: AutoreplyStatus | null;
	}[];

	const alreadySent = new Set(
		(
			db
				.prepare(
					`SELECT data FROM submissions WHERE form_id = ? AND autoreply_status IN ('sent', 'pending')`
				)
				.all(formId) as { data: string }[]
		)
			.map((row) => addressOfRow(row.data))
			.filter((address): address is string => !!address)
	);

	const targets: BackfillTarget[] = [];
	const seen = new Set<string>();
	for (const row of rows) {
		// Limited submissions came from someone who already got several in a day
		if (row.autoreply_status === 'limited') continue;
		let data: Record<string, unknown>;
		try {
			data = JSON.parse(row.data) as Record<string, unknown>;
		} catch {
			continue;
		}
		const address = visitorAddress(data)?.toLowerCase();
		if (!address || seen.has(address) || alreadySent.has(address)) continue;
		seen.add(address);
		targets.push({ submissionId: row.id, data, createdAt: row.created_at });
	}
	return targets;
}

// How many people each "send to past submissions" option would reach. One query for the
// widest window: an address's newest submission decides which windows it falls in.
export function backfillCounts(formId: string): { days: number; count: number }[] {
	const widest = Math.max(...BACKFILL_WINDOWS_DAYS);
	const targets = findBackfillTargets(formId, widest);
	const now = Date.now();
	return BACKFILL_WINDOWS_DAYS.map((days) => {
		const cutoff = now - days * 24 * 60 * 60 * 1000;
		const count = targets.filter((target) => Date.parse(sqliteToIso(target.createdAt)) >= cutoff).length;
		return { days, count: Math.min(count, BACKFILL_MAX) };
	});
}

function addressOfRow(rawData: string): string | undefined {
	try {
		return visitorAddress(JSON.parse(rawData) as Record<string, unknown>)?.toLowerCase();
	} catch {
		return undefined;
	}
}

// Sends one after the other in the background, so a big batch doesn't hit Mailgun at once
export function startBackfill(form: AutoreplySettings, targets: BackfillTarget[]): void {
	for (const target of targets) {
		db.prepare(`UPDATE submissions SET autoreply_status = 'pending', autoreply_error = NULL WHERE id = ?`).run(
			target.submissionId
		);
	}
	void (async () => {
		let sent = 0;
		for (const target of targets) {
			const status = await sendAutoreply(form, target.submissionId, target.data, sqliteToIso(target.createdAt));
			if (status === 'sent') sent += 1;
		}
		console.log(`[Email] Past submissions of form "${form.name}": ${sent}/${targets.length} auto-replies sent`);
	})();
}

function sqliteToIso(value: string): string {
	return value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
}
