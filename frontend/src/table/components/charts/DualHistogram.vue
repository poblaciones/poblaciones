<template>
	<div class="dual-hist">
		<svg :viewBox="'0 0 ' + W + ' ' + H" class="dh-svg" preserveAspectRatio="xMidYMid meet">
			<!-- frame -->
			<rect :x="pad.l" :y="pad.t" :width="W - pad.l - pad.r" :height="H - pad.t - pad.b" class="frame" />

			<!-- barras A (relleno translúcido) -->
			<rect v-for="(bar, i) in barsA" :key="'a-' + i"
					:x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h"
					:style="{ fill: aColor }" class="bar-a" />
			<!-- barras B (contorno) -->
			<rect v-for="(bar, i) in barsB" :key="'b-' + i"
					:x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h"
					:style="{ stroke: bColor }" class="bar-b" />

			<!-- ticks de frecuencia (eje Y, compartido) -->
			<g v-for="(t, i) in countTicks" :key="'fy-' + i">
				<line :x1="pad.l - 3" :y1="syCount(t)" :x2="pad.l" :y2="syCount(t)" class="tick" />
				<text :x="pad.l - 5" :y="syCount(t) + 3" class="tick-label freq" text-anchor="end">{{ t }}</text>
			</g>

			<!-- eje X inferior (A) -->
			<g v-for="(t, i) in aTicks" :key="'ax-' + i">
				<text :x="sxA(t)" :y="H - pad.b + 13" class="tick-label" :style="{ fill: aTickColor }" text-anchor="middle">{{ fmtTick(t) }}</text>
			</g>
			<!-- eje X superior (B) -->
			<g v-for="(t, i) in bTicks" :key="'bx-' + i">
				<text :x="sxB(t)" :y="pad.t - 4" class="tick-label" :style="{ fill: bColor }" text-anchor="middle">{{ fmtTick(t) }}</text>
			</g>

			<!-- leyenda de eje Y (frecuencia), vertical en ambos lados -->
			<text :x="11" :y="(pad.t + H - pad.b) / 2" class="axis-label" fill="#607d8b" text-anchor="middle"
					:transform="'rotate(-90 11 ' + ((pad.t + H - pad.b) / 2) + ')'">Frecuencia</text>
			<text :x="W - 9" :y="(pad.t + H - pad.b) / 2" class="axis-label" fill="#607d8b" text-anchor="middle"
					:transform="'rotate(-90 ' + (W - 9) + ' ' + ((pad.t + H - pad.b) / 2) + ')'">Frecuencia</text>
		</svg>
		<div class="legend">
			<span class="legend-item"><span class="swatch" :style="{ background: aColor }"></span>{{ aLabel }} (eje inferior)</span>
			<span class="legend-item"><span class="swatch" :style="{ background: bColor }"></span>{{ bLabel }} (eje superior)</span>
		</div>
	</div>
</template>

<script>
export default {
	name: 'DualHistogram',
	props: {
		a: { type: Object, required: true },   // columna { values, weights }
		b: { type: Object, required: true },
		aLabel: { type: String, default: 'A' },
		bLabel: { type: String, default: 'B' },
		bins: { type: Number, default: 12 },
		width: { type: Number, default: 460 },
		height: { type: Number, default: 240 }
	},
	data() {
		return {
			pad: { l: 38, r: 38, t: 26, b: 32 },
			aColor: '#81d4fa',
			aTickColor: '#3585bf',
			bColor: 'rgb(108, 165, 217)'
		};
	},
	computed: {
		W() { return this.width; },
		H() { return this.height; },
		aClean() { return this.clean(this.a); },
		bClean() { return this.clean(this.b); },
		aExtent() { return this.extent(this.aClean); },
		bExtent() { return this.extent(this.bClean); },
		histA() { return this.histogram(this.aClean, this.aExtent); },
		histB() { return this.histogram(this.bClean, this.bExtent); },
		maxCount() {
			var a = Math.max.apply(null, this.histA.concat([0]));
			var b = Math.max.apply(null, this.histB.concat([0]));
			return Math.max(a, b, 1);
		},
		aTicks() { return this.ticks(this.aExtent); },
		bTicks() { return this.ticks(this.bExtent); },
		countTicks() {
			var mx = this.maxCount;
			var step = Math.max(1, Math.ceil(mx / 4));
			var out = [];
			for (var v = 0; v <= mx; v += step) out.push(v);
			return out;
		},
		barsA() { return this.bars(this.histA, this.aExtent, this.sxA, 0); },
		barsB() { return this.bars(this.histB, this.bExtent, this.sxB, 1); }
	},
	methods: {
		clean(col) {
			if (!col || !col.values) return [];
			return col.values.filter(function (v) { return v != null && isFinite(v); });
		},
		extent(arr) {
			if (!arr.length) return [0, 1];
			var mn = Math.min.apply(null, arr), mx = Math.max.apply(null, arr);
			if (mn === mx) { mn -= 1; mx += 1; }
			return [mn, mx];
		},
		histogram(arr, ext) {
			var bins = this.bins;
			var counts = new Array(bins).fill(0);
			var span = ext[1] - ext[0] || 1;
			for (var k = 0; k < arr.length; k++) {
				var idx = Math.floor((arr[k] - ext[0]) / span * bins);
				if (idx >= bins) idx = bins - 1;
				if (idx < 0) idx = 0;
				counts[idx]++;
			}
			return counts;
		},
		ticks(ext) {
			var out = [];
			for (var i = 0; i <= 4; i++) out.push(ext[0] + (ext[1] - ext[0]) * i / 4);
			return out;
		},
		sxA(v) {
			var e = this.aExtent;
			return this.pad.l + (v - e[0]) / (e[1] - e[0]) * (this.W - this.pad.l - this.pad.r);
		},
		sxB(v) {
			var e = this.bExtent;
			return this.pad.l + (v - e[0]) / (e[1] - e[0]) * (this.W - this.pad.l - this.pad.r);
		},
		sy(count) {
			return (this.H - this.pad.b) - (count / this.maxCount) * (this.H - this.pad.t - this.pad.b);
		},
		syCount(count) { return this.sy(count); },
		bars(hist, ext, sxFn, inset) {
			var loc = this;
			var span = ext[1] - ext[0];
			var binW = span / this.bins;
			var pxW = (this.W - this.pad.l - this.pad.r) / this.bins;
			return hist.map(function (count, i) {
				var x0 = sxFn.call(loc, ext[0] + i * binW);
				var y = loc.sy(count);
				return {
					x: x0 + inset * pxW * 0.18 + pxW * 0.08,
					y: y,
					w: pxW * 0.76,
					h: (loc.H - loc.pad.b) - y
				};
			});
		},
		fmtTick(v) {
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
	.dual-hist { width: 100%; }
	.dh-svg { width: 100%; max-width: 525px; height: auto; display: block; margin: 0 auto; }
	.frame { fill: none; stroke: #cfd8dc; stroke-width: 1; }
	.tick { stroke: #cfd8dc; stroke-width: 1; }
	.tick-label { font-size: 9px; }
	.tick-label.freq { fill: #90a4ae; }
	.axis-label { font-size: 10px; font-weight: 600; }
	.bar-a { opacity: 0.85; }
	.bar-b { fill: none; stroke-width: 1.25; }
	.legend { display: flex; flex-wrap: wrap; font-size: 13px; color: #546e7a; width: 100%; }
	.legend-item { display: inline-flex; align-items: baseline; line-height: 1.75em; padding-right: 10px; }
	.swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; margin-right: 4px; }
</style>
