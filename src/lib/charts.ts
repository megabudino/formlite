// Small SVG chart renderers, ported from the design system's components/bundle.js.
// Styling comes from the .fl-chart / .fl-tip / .fl-heat classes in components.css.

const NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof SVGElementTagNameMap>(
	name: K,
	attrs: Record<string, string | number>,
	parent?: Element
): SVGElementTagNameMap[K] {
	const e = document.createElementNS(NS, name);
	for (const k in attrs) e.setAttribute(k, String(attrs[k]));
	if (parent) parent.appendChild(e);
	return e;
}

const fmt = (v: number) => new Intl.NumberFormat().format(v);

function escapeHtml(s: string) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Round a maximum up to a value that splits into four tidy gridlines. Never below 4. */
function nice(max: number): number {
	if (max <= 4) return 4;
	const q = max / 4;
	const p = Math.pow(10, Math.floor(Math.log10(q)));
	const m = q / p;
	// Steps that give whole-number gridlines (no 7.5 or 2.5 when counting single items)
	for (const st of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10]) {
		const step = st * p;
		if (step >= 1 && !Number.isInteger(step)) continue;
		if (m <= st) return step * 4;
	}
	return 40 * p;
}

function makeTip(box: HTMLElement): HTMLDivElement {
	const t = document.createElement('div');
	t.className = 'fl-tip';
	box.appendChild(t);
	return t;
}

/** Left gutter just wide enough for the longest y-axis tick (11px mono ≈ 6.6px per char). */
function gutter(max: number): number {
	return Math.ceil(fmt(max).length * 6.6) + 10;
}

/** In a .fl-chart--fill box the chart takes the box's height; otherwise the default 240px. */
function fillHeight(box: HTMLElement): number {
	return box.classList.contains('fl-chart--fill') && box.clientHeight > 0 ? box.clientHeight : 240;
}

/** Position the tooltip above (x, y) in box pixels, kept inside the box horizontally. */
function placeTip(tip: HTMLDivElement, box: HTMLElement, x: number, y: number) {
	tip.classList.add('on');
	const half = tip.offsetWidth / 2;
	const clamped = Math.max(half, Math.min(box.clientWidth - half, x));
	tip.style.left = `${clamped}px`;
	tip.style.top = `${y}px`;
}

/** Re-draw when the container's width changes. Returns a cleanup function. */
function live(box: HTMLElement, draw: () => void): () => void {
	let lastW = box.clientWidth;
	let lastH = box.clientHeight;
	box.innerHTML = '';
	draw();
	// Width and height both matter: fill-mode charts take the height their card gives them.
	const ro = new ResizeObserver(() => {
		const w = box.clientWidth;
		const h = box.clientHeight;
		if (w && (Math.abs(w - lastW) > 4 || Math.abs(h - lastH) > 4)) {
			lastW = w;
			lastH = h;
			box.innerHTML = '';
			draw();
		}
	});
	ro.observe(box);
	return () => ro.disconnect();
}

// ---------------------------------------------------------------- spark

export function drawSpark(svg: SVGSVGElement, data: number[]) {
	svg.innerHTML = '';
	if (data.length < 2) return;
	const w = svg.clientWidth || 240;
	const h = 44;
	const max = Math.max(...data);
	const min = Math.min(...data);
	svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
	const pts = data.map((v, i) => [
		i * (w / (data.length - 1)),
		4 + (h - 8) * (1 - (v - min) / (max - min || 1))
	]);
	const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
	el('path', { d: `${d}L${w} ${h}L0 ${h}Z`, fill: 'currentColor', opacity: '.14' }, svg);
	el(
		'path',
		{ d, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
		svg
	);
	const l = pts[pts.length - 1];
	el('circle', { cx: l[0], cy: l[1], r: 4, fill: 'currentColor' }, svg);
}

// ---------------------------------------------------------------- trend

export interface TrendSeries {
	name: string;
	/** Series slot 1–4 → --chart-1..4 */
	slot: 1 | 2 | 3 | 4;
	data: number[];
}

export interface TrendOptions {
	labels: string[];
	full?: string[];
	series: TrendSeries[];
	height?: number;
	title?: string;
}

function trend0(box: HTMLElement, o: TrendOptions) {
	const w = box.clientWidth || 600;
	const h = o.height ?? fillHeight(box);
	const max = nice(Math.max(0, ...o.series.flatMap((s) => s.data)));
	const L = gutter(max), R = 8, T = 12, B = 28;
	const iw = w - L - R, ih = h - T - B;
	const n = o.labels.length;
	const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, height: h, role: 'img', 'aria-label': o.title ?? 'Trend' }, box);
	const x = (i: number) => L + (n > 1 ? (i * iw) / (n - 1) : iw / 2);
	const y = (v: number) => T + ih * (1 - v / max);

	for (let g = 0; g <= 4; g++) {
		const gy = T + (ih * g) / 4;
		el('line', { x1: L, x2: w - R, y1: gy, y2: gy, class: g === 4 ? 'base' : 'grid' }, svg);
		el('text', { x: L - 8, y: gy + 4, 'text-anchor': 'end', class: 'tick' }, svg).textContent = fmt(
			Math.round(max * (1 - g / 4))
		);
	}
	const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 72))));
	o.labels.forEach((lb, i) => {
		if ((i % step === 0 && n - 1 - i >= step) || i === n - 1) {
			el(
				'text',
				{ x: x(i), y: h - 8, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', class: 'tick' },
				svg
			).textContent = lb;
		}
	});
	o.series.forEach((s, si) => {
		const d = s.data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('');
		if (si === 0) el('path', { d: `${d}L${x(n - 1)} ${y(0)}L${x(0)} ${y(0)}Z`, class: 'area' }, svg);
		el('path', { d, class: `line s${s.slot}` }, svg);
	});
	const cross = el('line', { y1: T, y2: T + ih, class: 'cross', opacity: 0 }, svg);
	const dots = o.series.map((s) => el('circle', { r: 5, class: `dot f${s.slot}`, opacity: 0 }, svg));
	const tip = makeTip(box);
	const hit = el('rect', { x: L, y: T, width: iw, height: ih, class: 'hit' }, svg);

	hit.addEventListener('pointermove', (ev) => {
		const r = svg.getBoundingClientRect();
		const px = (ev.clientX - r.left) * (w / r.width);
		const i = Math.max(0, Math.min(n - 1, Math.round((px - L) / (iw / Math.max(1, n - 1)))));
		cross.setAttribute('x1', String(x(i)));
		cross.setAttribute('x2', String(x(i)));
		cross.setAttribute('opacity', '1');
		o.series.forEach((s, k) => {
			dots[k].setAttribute('cx', String(x(i)));
			dots[k].setAttribute('cy', String(y(s.data[i])));
			dots[k].setAttribute('opacity', '1');
		});
		tip.innerHTML =
			`<b>${escapeHtml((o.full ?? o.labels)[i])}</b>` +
			o.series
				.map(
					(s) =>
						`<div><span><i style="background:var(--chart-${s.slot})"></i>${escapeHtml(s.name)}</span><span>${fmt(s.data[i])}</span></div>`
				)
				.join('');
		const scale = box.clientWidth / w;
		placeTip(tip, box, x(i) * scale, y(Math.max(...o.series.map((s) => s.data[i]))));
	});
	hit.addEventListener('pointerleave', () => {
		tip.classList.remove('on');
		cross.setAttribute('opacity', '0');
		dots.forEach((d) => d.setAttribute('opacity', '0'));
	});
}

// ---------------------------------------------------------------- bars

export interface BarOptions {
	labels: string[];
	full?: string[];
	data: number[];
	name: string;
	slot?: 1 | 2 | 3 | 4;
	height?: number;
	title?: string;
}

function bars0(box: HTMLElement, o: BarOptions) {
	const w = box.clientWidth || 600;
	const h = o.height ?? fillHeight(box);
	const max = nice(Math.max(0, ...o.data));
	const L = gutter(max), T = 12, B = 28;
	const iw = w - L, ih = h - T - B;
	const n = o.data.length;
	const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, height: h, role: 'img', 'aria-label': o.title ?? 'Bars' }, box);
	for (let g = 0; g <= 4; g++) {
		const gy = T + (ih * g) / 4;
		el('line', { x1: L, x2: w, y1: gy, y2: gy, class: g === 4 ? 'base' : 'grid' }, svg);
		el('text', { x: L - 8, y: gy + 4, 'text-anchor': 'end', class: 'tick' }, svg).textContent = fmt(
			Math.round(max * (1 - g / 4))
		);
	}
	const slotW = iw / n;
	const bw = Math.max(4, Math.min(44, slotW * 0.55));
	const tip = makeTip(box);
	const rects: SVGPathElement[] = [];
	const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 56))));
	const cls = `f${o.slot ?? 1}`;

	o.data.forEach((v, i) => {
		const bh = (ih * v) / max;
		const bx = L + i * slotW + (slotW - bw) / 2;
		const by = T + ih - bh;
		const r = Math.min(4, bw / 2, bh);
		const d = `M${bx} ${T + ih}V${by + r}Q${bx} ${by} ${bx + r} ${by}H${bx + bw - r}Q${bx + bw} ${by} ${bx + bw} ${by + r}V${T + ih}Z`;
		rects.push(el('path', { d, class: `bar ${cls}` }, svg));
		if (i % labelEvery === 0) {
			// 11px mono is about 6.6px per character; truncate to the room this label has.
			const room = Math.max(3, Math.floor((slotW * labelEvery - 8) / 6.6));
			const text = o.labels[i].length > room ? `${o.labels[i].slice(0, room - 1)}…` : o.labels[i];
			el('text', { x: bx + bw / 2, y: h - 8, 'text-anchor': 'middle', class: 'tick' }, svg).textContent = text;
		}
		const hit = el('rect', { x: L + i * slotW, y: T, width: slotW, height: ih, class: 'hit' }, svg);
		hit.addEventListener('pointerenter', () => {
			rects.forEach((q, k) => q.classList.toggle('dim', k !== i));
			tip.innerHTML = `<b>${escapeHtml((o.full ?? o.labels)[i])}</b><div><span>${escapeHtml(o.name)}</span><span>${fmt(v)}</span></div>`;
			placeTip(tip, box, (bx + bw / 2) * (box.clientWidth / w), by);
		});
		hit.addEventListener('pointerleave', () => {
			rects.forEach((q) => q.classList.remove('dim'));
			tip.classList.remove('on');
		});
	});
	// Label only the tallest bar
	const top = Math.max(...o.data);
	if (top > 0) {
		const mi = o.data.indexOf(top);
		el(
			'text',
			{
				x: L + mi * slotW + slotW / 2,
				y: T + ih * (1 - top / max) - 8,
				'text-anchor': 'middle',
				class: 'tick',
				style: 'fill:var(--text);font-weight:500'
			},
			svg
		).textContent = fmt(top);
	}
}

// ---------------------------------------------------------------- heatmap

export interface HeatOptions {
	rows: number[][];
	days: string[];
}

function heat0(box: HTMLElement, o: HeatOptions) {
	const max = Math.max(0, ...o.rows.flat());
	const tip = makeTip(box);
	o.rows.forEach((row, d) => {
		const lb = document.createElement('span');
		lb.className = 'r';
		lb.textContent = o.days[d];
		box.appendChild(lb);
		row.forEach((v, hr) => {
			const c = document.createElement('span');
			const q = v === 0 || max === 0 ? 0 : Math.min(5, 1 + Math.floor((4.999 * v) / max));
			const hh = String(hr).padStart(2, '0');
			c.className = `c q${q}`;
			c.setAttribute('role', 'img');
			c.setAttribute('aria-label', `${o.days[d]} ${hh}:00, ${v} submissions`);
			box.appendChild(c);
			c.addEventListener('pointerenter', () => {
				const b = box.getBoundingClientRect();
				const r = c.getBoundingClientRect();
				tip.innerHTML = `<b>${o.days[d]} · ${hh}:00</b><div><span>Submissions</span><span>${fmt(v)}</span></div>`;
				placeTip(tip, box, r.left - b.left + r.width / 2, r.top - b.top);
			});
			c.addEventListener('pointerleave', () => tip.classList.remove('on'));
		});
	});
}

// ---------------------------------------------------------------- Svelte actions

type Chart =
	| { type: 'trend'; options: TrendOptions }
	| { type: 'bars'; options: BarOptions }
	| { type: 'heat'; options: HeatOptions };

function render(box: HTMLElement, c: Chart): () => void {
	if (c.type === 'heat') {
		box.innerHTML = '';
		heat0(box, c.options);
		return () => {};
	}
	return live(box, () => (c.type === 'trend' ? trend0(box, c.options) : bars0(box, c.options)));
}

export function chart(box: HTMLElement, c: Chart) {
	let cleanup = render(box, c);
	return {
		update(next: Chart) {
			cleanup();
			cleanup = render(box, next);
		},
		destroy() {
			cleanup();
		}
	};
}

export function spark(svg: SVGSVGElement, data: number[]) {
	drawSpark(svg, data);
	const ro = new ResizeObserver(() => drawSpark(svg, data));
	ro.observe(svg);
	return {
		update(next: number[]) {
			data = next;
			drawSpark(svg, data);
		},
		destroy() {
			ro.disconnect();
		}
	};
}
