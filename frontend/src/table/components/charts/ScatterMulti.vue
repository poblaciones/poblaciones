<template>
	<div class="scatter-multi">
		<svg :viewBox="'0 0 ' + W + ' ' + H" class="sm-svg" preserveAspectRatio="xMidYMid meet">
			<line :x1="pad.l" :y1="H - pad.b" :x2="W - pad.r" :y2="H - pad.b" class="axis" />
			<line :x1="pad.l" :y1="pad.t" :x2="pad.l" :y2="H - pad.b" class="axis" />

			<g v-for="(t, i) in xTicks" :key="'xt-' + i">
				<line :x1="sx(t)" :y1="H - pad.b" :x2="sx(t)" :y2="H - pad.b + 4" class="tick" />
				<text :x="sx(t)" :y="H - pad.b + 15" class="tick-label" text-anchor="middle">{{ fmtTick(t) }}</text>
			</g>
			<g v-for="(t, i) in yTicks" :key="'yt-' + i">
				<line :x1="pad.l - 4" :y1="sy(t)" :x2="pad.l" :y2="sy(t)" class="tick" />
				<text :x="pad.l - 7" :y="sy(t) + 3" class="tick-label" text-anchor="end">{{ fmtTick(t) }}</text>
			</g>

			<template v-for="s in series">
				<circle v-for="(p, i) in scaledPoints(s)" :key="s.key + '-' + i"
						:cx="p.cx" :cy="p.cy" :r="p.r"
						class="dot" :style="{ fill: s.color }">
					<title>{{ (p.label ? p.label + ' — ' : '') }}{{ s.legend || s.letter }} — x: {{ fmtTick(p.rawx) }}, y: {{ fmtTick(p.rawy) }}</title>
				</circle>
			</template>

			<text :x="(pad.l + W - pad.r) / 2" :y="H - 4" class="axis-label" text-anchor="middle">{{ xAxisLabel }}</text>
			<text :x="12" :y="(pad.t + H - pad.b) / 2" class="axis-label" text-anchor="middle"
					:transform="'rotate(-90 12 ' + ((pad.t + H - pad.b) / 2) + ')'">{{ yLabel }}</text>
		</svg>

		<div class="legend">
			<span v-for="s in series" :key="'lg-' + s.key" class="legend-item">
				<span class="swatch" :style="{ background: s.color }"></span>
				{{ s.legend || s.letter }}<span v-if="s.normalized"> (100={{ fmtInt(s.normMax) }})</span>
			</span>
		</div>
	</div>
</template>

<script>
export default {
	name: 'ScatterMulti',
	props: {
		// series: [{ key, letter, color, normalized, normMax, points: [{x,y,w,label}] }]
		series: { type: Array, required: true },
		yLabel: { type: String, default: 'Y' },
		sizeByWeight: { type: Boolean, default: true },
		yMax100: { type: Boolean, default: false },
		width: { type: Number, default: 460 },
		height: { type: Number, default: 320 }
	},
	data() { return { pad: { l: 48, r: 16, t: 14, b: 34 } }; },
	computed: {
		W() { return this.width; },
		H() { return this.height; },
		allPoints() {
			var out = [];
			this.series.forEach(function (s) {
				s.points.forEach(function (p) { if (p && isFinite(p.x) && isFinite(p.y)) out.push(p); });
			});
			return out;
		},
		anyNormalized() { return this.series.some(function (s) { return s.normalized; }); },
		xAxisLabel() { return this.anyNormalized ? 'Normalizado a 100' : ''; },
		xExtent() { return this.extent(this.allPoints.map(function (p) { return p.x; })); },
		yExtent() { return this.yMax100 ? [0, 100] : this.extent(this.allPoints.map(function (p) { return p.y; })); },
		wExtent() { return this.extent(this.allPoints.map(function (p) { return p.w || 1; })); },
		xTicks() { return this.ticks(this.xExtent); },
		yTicks() { return this.ticks(this.yExtent); }
	},
	methods: {
		extent(arr) {
			var nums = arr.filter(function (v) { return v != null && isFinite(v); });
			if (!nums.length) return [0, 1];
			var mn = Math.min.apply(null, nums), mx = Math.max.apply(null, nums);
			if (mn === mx) { mn -= 1; mx += 1; }
			return [mn, mx];
		},
		ticks(ext) {
			var out = [];
			for (var i = 0; i <= 4; i++) out.push(ext[0] + (ext[1] - ext[0]) * i / 4);
			return out;
		},
		sx(x) {
			var e = this.xExtent;
			return this.pad.l + (x - e[0]) / (e[1] - e[0]) * (this.W - this.pad.l - this.pad.r);
		},
		sy(y) {
			var e = this.yExtent;
			return (this.H - this.pad.b) - (y - e[0]) / (e[1] - e[0]) * (this.H - this.pad.t - this.pad.b);
		},
		radius(w) {
			if (!this.sizeByWeight || w == null) return 3;
			var e = this.wExtent;
			if (e[1] === e[0]) return 3.5;
			var t = (Math.sqrt(w) - Math.sqrt(e[0])) / (Math.sqrt(e[1]) - Math.sqrt(e[0]));
			return 2.2 + t * 6;
		},
		scaledPoints(s) {
			var loc = this;
			return s.points.filter(function (p) { return p && isFinite(p.x) && isFinite(p.y); })
				.map(function (p) {
					return { cx: loc.sx(p.x), cy: loc.sy(p.y), r: loc.radius(p.w), rawx: p.x, rawy: p.y, label: p.label };
				});
		},
		fmtTick(v) {
			if (v == null || !isFinite(v)) return '';
			var a = Math.abs(v);
			if (a >= 1000) return Math.round(v).toLocaleString('es-AR');
			if (a >= 10) return v.toFixed(0);
			if (a >= 1) return v.toFixed(1);
			return v.toFixed(2);
		},
		fmtInt(v) {
			return (v == null || !isFinite(v)) ? '—' : Math.round(v).toLocaleString('es-AR');
		}
	}
};
</script>

<style scoped>
	.scatter-multi { width: 100%; }
	.sm-svg { width: 100%; max-width: 480px; height: auto; display: block; margin: 0 auto; }
	.axis { stroke: #b0bec5; stroke-width: 1; }
	.tick { stroke: #cfd8dc; stroke-width: 1; }
	.tick-label { font-size: 9px; fill: #78909c; }
	.axis-label { font-size: 10px; fill: #546e7a; font-weight: 600; }
	.dot { opacity: 0.5; stroke: #fff; stroke-width: 0.4; }
	.legend { display: flex; flex-wrap: wrap; font-size: 13px; color: #546e7a; }
	.legend-item { display: inline-flex; align-items: baseline; line-height: 1.75em; padding-right: 10px; }
	.swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; margin-right: 4px; }
</style>
