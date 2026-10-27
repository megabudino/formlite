// Shared between server and browser: types for dashboard stats and helpers that turn
// UTC hourly buckets into series in the viewer's own time zone.

export type RangeKey = '24h' | '7d' | '30d';

export const RANGE_HOURS: Record<RangeKey, number> = { '24h': 24, '7d': 168, '30d': 720 };
export const RANGES: RangeKey[] = ['24h', '7d', '30d'];

/** One UTC hour: t = 'YYYY-MM-DD HH', s = submissions, b = blocked requests. */
export interface HourBucket {
	t: string;
	s: number;
	b: number;
}

export interface ActivityItem {
	kind: 'submission' | 'blocked';
	id: number;
	formId: string;
	formName: string;
	from: string | null;
	fieldCount: number;
	reason: string | null;
	createdAt: string;
}

export interface Overview {
	range: RangeKey;
	totals: { submissions: number; submissionsPrev: number; blocked: number; blockedPrev: number };
	buckets: HourBucket[];
	byForm: { id: string; name: string; n: number }[];
	latest: ActivityItem[];
	forms: { total: number; live: number };
	lastSubmissionAt: string | null;
}

/** SQLite timestamps are UTC without a zone marker. */
export function parseUtc(value: string): Date {
	const iso = value.includes('T') ? value : value.replace(' ', 'T');
	return new Date(/Z|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
}

function bucketDate(t: string): Date {
	return new Date(`${t.replace(' ', 'T')}:00:00Z`);
}

function localDayKey(d: Date): string {
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export interface Series {
	labels: string[];
	full: string[];
	submissions: number[];
	blocked: number[];
}

/** Points for the selected range: hourly for 24h, one per local day for 7d and 30d. */
export function buildSeries(buckets: HourBucket[], range: RangeKey, now = new Date()): Series {
	const labels: string[] = [];
	const full: string[] = [];
	const submissions: number[] = [];
	const blocked: number[] = [];

	if (range === '24h') {
		const index = new Map<number, number>();
		const end = new Date(now);
		end.setMinutes(0, 0, 0);
		for (let i = 23; i >= 0; i--) {
			const d = new Date(end.getTime() - i * 3_600_000);
			index.set(d.getTime(), labels.length);
			labels.push(d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
			full.push(d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }));
			submissions.push(0);
			blocked.push(0);
		}
		for (const b of buckets) {
			const i = index.get(bucketDate(b.t).getTime());
			if (i !== undefined) {
				submissions[i] += b.s;
				blocked[i] += b.b;
			}
		}
	} else {
		const days = range === '7d' ? 7 : 30;
		const index = new Map<string, number>();
		for (let i = days - 1; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
			index.set(localDayKey(d), labels.length);
			labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
			full.push(d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
			submissions.push(0);
			blocked.push(0);
		}
		for (const b of buckets) {
			const i = index.get(localDayKey(bucketDate(b.t)));
			if (i !== undefined) {
				submissions[i] += b.s;
				blocked[i] += b.b;
			}
		}
	}

	return { labels, full, submissions, blocked };
}

/** 7 × 24 submission counts by local weekday (Mon first) and hour, from the last 30 days. */
export function buildHeatmap(buckets: HourBucket[]): number[][] {
	const rows = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
	for (const b of buckets) {
		const d = bucketDate(b.t);
		rows[(d.getDay() + 6) % 7][d.getHours()] += b.s;
	}
	return rows;
}

export interface Delta {
	text: string;
	direction: 'up' | 'down' | 'flat';
}

export function computeDelta(current: number, previous: number, range: RangeKey): Delta {
	const period = range === '24h' ? 'yesterday' : range === '7d' ? 'last week' : 'last month';
	if (current === previous) return { text: `Same as ${period}`, direction: 'flat' };
	if (previous === 0) return { text: `+${current.toLocaleString()} vs ${period}`, direction: 'up' };
	const pct = ((current - previous) / previous) * 100;
	const sign = pct > 0 ? '+' : '−';
	const value = Math.abs(pct) >= 10 ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(1);
	return { text: `${sign}${value}% vs ${period}`, direction: pct > 0 ? 'up' : 'down' };
}

export function rangeLabel(range: RangeKey): string {
	return range === '24h' ? 'last 24 hours' : range === '7d' ? 'last 7 days' : 'last 30 days';
}

export function timeAgo(value: string, now = Date.now()): string {
	const diff = Math.max(0, now - parseUtc(value).getTime());
	const min = Math.round(diff / 60_000);
	if (min < 1) return 'Just now';
	if (min < 60) return `${min} min ago`;
	const h = Math.round(min / 60);
	if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`;
	const d = Math.round(h / 24);
	if (d < 30) return d === 1 ? 'Yesterday' : `${d} days ago`;
	return parseUtc(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function reasonLabel(reason: string | null): string {
	if (!reason) return 'Blocked';
	const text = reason.replace(/_/g, ' ');
	return text.charAt(0).toUpperCase() + text.slice(1);
}
