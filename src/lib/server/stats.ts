import db from '$lib/db';
import type { RangeKey, Overview, ActivityItem, HourBucket } from '$lib/stats';
import { RANGE_HOURS } from '$lib/stats';

// Which forms an overview covers: everything a user owns, one workspace, or one form.
export interface StatsScope {
	userId: string;
	workspaceId?: string;
	formId?: string;
}

export function parseRange(value: string | null): RangeKey {
	return value === '24h' || value === '30d' ? value : '7d';
}

function scopeFilter(scope: StatsScope): { sql: string; params: string[] } {
	let sql = 'f.user_id = ?';
	const params = [scope.userId];
	if (scope.workspaceId) {
		sql += ' AND f.workspace_id = ?';
		params.push(scope.workspaceId);
	}
	if (scope.formId) {
		sql += ' AND f.id = ?';
		params.push(scope.formId);
	}
	return { sql, params };
}

// created_at is stored by SQLite as 'YYYY-MM-DD HH:MM:SS' in UTC, so datetime('now', …)
// gives a directly comparable string.
function countBetween(
	table: 'submissions' | 'blocked_requests',
	scope: StatsScope,
	fromHoursAgo: number,
	toHoursAgo: number
): number {
	const { sql, params } = scopeFilter(scope);
	const row = db
		.prepare(
			`SELECT COUNT(*) AS n FROM ${table} t JOIN forms f ON f.id = t.form_id
			WHERE ${sql}
				AND t.created_at >= datetime('now', ?)
				AND t.created_at < datetime('now', ?)`
		)
		.get(...params, `-${fromHoursAgo} hours`, `-${toHoursAgo} hours`) as { n: number };
	return row.n;
}

function hourly(table: 'submissions' | 'blocked_requests', scope: StatsScope): Map<string, number> {
	const { sql, params } = scopeFilter(scope);
	const rows = db
		.prepare(
			`SELECT strftime('%Y-%m-%d %H', t.created_at) AS h, COUNT(*) AS n
			FROM ${table} t JOIN forms f ON f.id = t.form_id
			WHERE ${sql} AND t.created_at >= datetime('now', '-${RANGE_HOURS['30d']} hours')
			GROUP BY h`
		)
		.all(...params) as { h: string; n: number }[];
	return new Map(rows.map((r) => [r.h, r.n]));
}

function parseData(raw: string): Record<string, unknown> {
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

function senderOf(data: Record<string, unknown>): string | null {
	for (const key of ['email', 'reply_to', '_replyto', 'name']) {
		const v = data[key];
		if (typeof v === 'string' && v.trim()) return v.trim();
	}
	return null;
}

export function getOverview(scope: StatsScope, range: RangeKey, latestLimit = 8): Overview {
	const hours = RANGE_HOURS[range];
	const { sql, params } = scopeFilter(scope);

	const submissions = countBetween('submissions', scope, hours, 0);
	const submissionsPrev = countBetween('submissions', scope, hours * 2, hours);
	const blocked = countBetween('blocked_requests', scope, hours, 0);
	const blockedPrev = countBetween('blocked_requests', scope, hours * 2, hours);

	// Hourly buckets for the last 30 days; the browser groups them into its own local days.
	const subHours = hourly('submissions', scope);
	const blkHours = hourly('blocked_requests', scope);
	const keys = new Set([...subHours.keys(), ...blkHours.keys()]);
	const buckets: HourBucket[] = [...keys].sort().map((t) => ({
		t,
		s: subHours.get(t) ?? 0,
		b: blkHours.get(t) ?? 0
	}));

	const byForm = db
		.prepare(
			`SELECT f.id, f.name,
				(SELECT COUNT(*) FROM submissions s
					WHERE s.form_id = f.id AND s.created_at >= datetime('now', ?)) AS n
			FROM forms f WHERE ${sql}
			ORDER BY n DESC, f.name ASC`
		)
		.all(`-${hours} hours`, ...params) as { id: string; name: string; n: number }[];

	const latestRows = db
		.prepare(
			`SELECT * FROM (
				SELECT 'submission' AS kind, s.id, s.form_id, f.name AS form_name, s.data, NULL AS reason, s.created_at
				FROM submissions s JOIN forms f ON f.id = s.form_id WHERE ${sql}
				UNION ALL
				SELECT 'blocked' AS kind, b.id, b.form_id, f.name AS form_name, b.data, b.reason, b.created_at
				FROM blocked_requests b JOIN forms f ON f.id = b.form_id WHERE ${sql}
			) ORDER BY created_at DESC LIMIT ?`
		)
		.all(...params, ...params, latestLimit) as {
		kind: 'submission' | 'blocked';
		id: number;
		form_id: string;
		form_name: string;
		data: string;
		reason: string | null;
		created_at: string;
	}[];

	const latest: ActivityItem[] = latestRows.map((r) => {
		const data = parseData(r.data);
		return {
			kind: r.kind,
			id: r.id,
			formId: r.form_id,
			formName: r.form_name,
			from: senderOf(data),
			fieldCount: Object.keys(data).length,
			reason: r.reason,
			createdAt: r.created_at
		};
	});

	const forms = db
		.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(f.is_active), 0) AS live FROM forms f WHERE ${sql}`)
		.get(...params) as { total: number; live: number };

	const last = db
		.prepare(
			`SELECT MAX(s.created_at) AS at FROM submissions s JOIN forms f ON f.id = s.form_id WHERE ${sql}`
		)
		.get(...params) as { at: string | null };

	return {
		range,
		totals: { submissions, submissionsPrev, blocked, blockedPrev },
		buckets,
		byForm,
		latest,
		forms,
		lastSubmissionAt: last.at
	};
}

export interface WorkspaceActivity {
	/** All-time submissions across the workspace's forms */
	total: number;
	/** Submissions in the last 30 days */
	recent: number;
	/** One count per UTC day for the last 30 days, oldest first */
	daily: number[];
}

// Small per-workspace summary for the dashboard cards. Days are UTC: close enough for a sparkline.
export function getWorkspaceActivity(userId: string): Record<string, WorkspaceActivity> {
	const DAYS = 30;
	const result: Record<string, WorkspaceActivity> = {};

	const totals = db
		.prepare(
			`SELECT f.workspace_id AS ws, COUNT(s.id) AS n
			FROM forms f JOIN submissions s ON s.form_id = f.id
			WHERE f.user_id = ? AND f.workspace_id IS NOT NULL
			GROUP BY f.workspace_id`
		)
		.all(userId) as { ws: string; n: number }[];
	for (const t of totals) result[t.ws] = { total: t.n, recent: 0, daily: new Array(DAYS).fill(0) };

	const days = db
		.prepare(
			`SELECT f.workspace_id AS ws,
				CAST(julianday(date('now')) - julianday(date(s.created_at)) AS INTEGER) AS ago,
				COUNT(*) AS n
			FROM forms f JOIN submissions s ON s.form_id = f.id
			WHERE f.user_id = ? AND f.workspace_id IS NOT NULL
				AND s.created_at >= date('now', '-${DAYS - 1} days')
			GROUP BY ws, ago`
		)
		.all(userId) as { ws: string; ago: number; n: number }[];
	for (const d of days) {
		const entry = result[d.ws];
		if (!entry || d.ago < 0 || d.ago >= DAYS) continue;
		entry.daily[DAYS - 1 - d.ago] += d.n;
		entry.recent += d.n;
	}

	return result;
}
