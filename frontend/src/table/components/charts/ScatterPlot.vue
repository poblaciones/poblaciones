<template>
	<svg :viewBox="'0 0 ' + W + ' ' + H" class="scatter" preserveAspectRatio="xMidYMid meet">
		<!-- ejes -->
		<line :x1="pad.l" :y1="H - pad.b" :x2="W - pad.r" :y2="H - pad.b" class="axis" />
		<line :x1="pad.l" :y1="pad.t" :x2="pad.l" :y2="H - pad.b" class="axis" />

		<!-- ticks X -->
		<g v-for="(t, i) in xTicks" :key="'xt-' + i">
			<line :x1="sx(t)" :y1="H - pad.b" :x2="sx(t)" :y2="H - pad.b + 4" class="tick" />
			<text :x="sx(t)" :y="H - pad.b + 15" class="tick-label" text-anchor="middle">{{ fmtTick(t) }}</text>
		</g>
		<!-- ticks Y -->
		<g v-for="(t, i) in yTicks" :key="'yt-' + i">
			<line :x1="pad.l - 4" :y1="sy(t)" :x2="pad.l" :y2="sy(t)" class="tick" />
			<text :x="pad.l - 7" :y="sy(t) + 3" class="tick-label" text-anchor="end">{{ fmtTick(t) }}</text>
		</g>

		<!-- recta de regresión -->
		<line v-if="line" :x1="sx(line.x1)" :y1="sy(line.y1)" :x2="sx(line.x2)" :y2="sy(line.y2)" class="reg-line" />

		<!-- puntos -->
		<circle v-for="(p, i) in plotted" :key="'p-' + i"
				:cx="p.cx" :cy="p.cy" :r="p.r"
				class="dot" :style="{ fill: color }">
			<title>{{ p.title }}</title>
		</circle>

		<!-- etiquetas de eje -->
		<text :x="(pad.l + W - pad.r) / 2" :y="H - 4" class="axis-label" text-anchor="middle">{{ xLabel }}</text>
		<text :x="12" :y="(pad.t + H - pad.b) / 2" class="axis-label" text-anchor="middle"
				:transform="'rotate(-90 12 ' + ((pad.t + H - pad.b) / 2) + ')'">{{ yLabel }}</text>
	</svg>
</template>

<script>
export default {
	name: 'ScatterPlot',
	props: {
		// Puntos: [{ x, y, w, label }]
		points: { type: Array, required: true },
		xLabel: { type: String, default: 'X' },
		yLabel: { type: String, default: 'Y' },
		color: { type: String, default: '#1976d2' },
		// Recta de regresión opcional: { slope, intercept }
		regression: { type: Object, default: null },
		// Si true, el radio del punto escala con el peso.
		sizeByWeight: { type: Boolean, default: true },
		xMax100: { type: Boolean, default: false },
		yMax100: { type: Boolean, default: false },
		width: { type: Number, default: 440 },
		height: { type: Number, default: 300 }
	},
	data() {
		return { pad: { l: 48, r: 16, t: 14, b: 34 } };
	},
	computed: {
		W() { return this.width; },
		H() { return this.height; },
		valid() {
			return this.points.filter(function (p) {
				return p && isFinite(p.x) && isFinite(p.y);
			});
		},
		xExtent() { return this.xMax100 ? [0, 100] : this.extent(this.valid.map(function (p) { return p.x; })); },
		yExtent() { return this.yMax100 ? [0, 100] : this.extent(this.valid.map(function (p) { return p.y; })); },
		wExtent() { return this.extent(this.valid.map(function (p) { return p.w || 1; })); },
		xTicks() { return this.ticks(this.xExtent); },
		yTicks() { return this.ticks(this.yExtent); },
		plotted() {
			var loc = this;
			return this.valid.map(function (p) {
				return {
					cx: loc.sx(p.x),
					cy: loc.sy(p.y),
					r: loc.radius(p.w),
					title: (p.label ? p.label + ' — ' : '') + 'x: ' + loc.fmtTick(p.x) + ', y: ' + loc.fmtTick(p.y)
				};
			});
		},
		line() {
			if (!this.regression) return null;
			var e = this.xExtent;
			var s = this.regression.slope, b = this.regression.intercept;
			if (!isFinite(s) || !isFinite(b)) return null;
			return { x1: e[0], y1: b + s * e[0], x2: e[1], y2: b + s * e[1] };
		}
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
			var steps = 4;
			var out = [];
			for (var i = 0; i <= steps; i++) out.push(ext[0] + (ext[1] - ext[0]) * i / steps);
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
			if (!this.sizeByWeight || w == null) return 3.2;
			var e = this.wExtent;
			if (e[1] === e[0]) return 4;
			// Raíz para que el área no aplaste a las observaciones chicas, con
			// radio mínimo garantizado para que ninguna desaparezca.
			var t = (Math.sqrt(w) - Math.sqrt(e[0])) / (Math.sqrt(e[1]) - Math.sqrt(e[0]));
			return 2.5 + t * 7;
		},
		fmtTick(v) {
			if (v == null || !isFinite(v)) return '';
			var a = Math.abs(v);
			if (a >= 1000) return Math.round(v).toLocaleString('es-AR');
			if (a >= 10) return v.toFixed(0);
			if (a >= 1) return v.toFixed(1);
			return v.toFixed(2);
		}
	}
};
</script>

<style scoped>
	.scatter { width: 100%; max-width: 480px; height: auto; display: block; margin: 0 auto; }
	.axis { stroke: #b0bec5; stroke-width: 1; }
	.tick { stroke: #cfd8dc; stroke-width: 1; }
	.tick-label { font-size: 9px; fill: #78909c; }
	.axis-label { font-size: 10px; fill: #546e7a; font-weight: 600; }
	.dot { opacity: 0.55; stroke: #fff; stroke-width: 0.5; }
	.reg-line { stroke: #e53935; stroke-width: 1.5; stroke-dasharray: 4 3; }
</style>
