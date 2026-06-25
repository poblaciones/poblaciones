<template>
	<svg :viewBox="'0 0 ' + W + ' ' + H" class="cat-chart" :style="{ height: H + 'px', width: pxWidth + 'px' }"
			preserveAspectRatio="xMidYMid meet" role="img" :aria-label="ariaLabel">
		<!-- Marco del área de datos -->
		<rect :x="pad.l" :y="pad.t" :width="plotW" :height="plotH" class="plot-frame" />

		<!-- Gridlines de escala (en los cuartos para %) y sus rótulos -->
		<g v-for="(t, i) in yTicks" :key="'yt-' + i">
			<line :x1="pad.l" :y1="sy(t)" :x2="W - pad.r" :y2="sy(t)" class="grid-line" />
			<text :x="pad.l - 5" :y="sy(t) + 3" class="tick-label" text-anchor="end">{{ fmtTick(t) }}</text>
		</g>

		<!-- Apilado multi-año: una columna apilada por año (100%) -->
		<template v-if="stacked && years.length">
			<g v-for="(yr, yi) in stackLayout" :key="'sy-' + yi">
				<template v-if="mode === 'bars'">
					<rect v-for="(seg, si) in yr.segments" :key="'sg-' + yi + '-' + si"
							:x="yr.x" :y="seg.y" :width="yr.w" :height="seg.h"
							:style="{ fill: seg.color }" class="seg">
						<title>{{ seg.title }}</title>
					</rect>
				</template>
				<text :x="yr.cx" :y="H - pad.b + 12" class="x-label" text-anchor="middle">{{ yr.name }}</text>
			</g>
			<!-- Áreas apiladas entre años (modo líneas) -->
			<template v-if="mode === 'lines'">
				<path v-for="(band, bi) in areaBands" :key="'ab-' + bi" :d="band.d" :style="{ fill: band.color }" class="area-band">
					<title>{{ band.name }}</title>
				</path>
			</template>
		</template>

		<!-- Una sola serie (un año): barras o línea -->
		<template v-else>
			<template v-if="mode === 'bars'">
				<rect v-for="(bar, i) in barRects" :key="'b-' + i"
						:x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h"
						:style="{ fill: bar.color }" class="bar">
					<title>{{ bar.title }}</title>
				</rect>
			</template>
			<template v-else>
				<polyline :points="linePoints" class="series-line" />
				<circle v-for="(pt, i) in linePts" :key="'p-' + i"
						:cx="pt.x" :cy="pt.y" r="2.6" :style="{ fill: pt.color }" class="series-dot">
					<title>{{ pt.title }}</title>
				</circle>
			</template>
			<line v-if="showTotalLine && totalValue != null" :x1="pad.l" :y1="sy(totalValue)" :x2="W - pad.r" :y2="sy(totalValue)" class="total-line" />
		</template>
	</svg>
</template>

<script>
	export default {
		name: 'CategoryChart',
		props: {
			bars: { type: Array, default: function () { return []; } },     // un año: [{ name, color, value }]
			years: { type: Array, default: function () { return []; } },    // multi-año apilado: [{ name, bars: [...] }]
			mode: { type: String, default: 'bars' },                        // 'bars' | 'lines'
			stacked: { type: Boolean, default: false },
			isPercent: { type: Boolean, default: false },
			showTotalLine: { type: Boolean, default: false },
			totalValue: { type: Number, default: null },
			height: { type: Number, default: 180 }
		},
		data: function () {
			return { pad: { l: 40, r: 12, t: 12, b: 22 } };
		},
		computed: {
			// Alto efectivo del área de dibujo, con piso para no miniaturizarse: por
			// debajo de 125px no sigue achicándose (el contenedor scrollea).
			H: function () { return Math.max(125, this.height); },
			// Ancho en píxeles. Mientras hay alto (≥275) el gráfico es cuadrado; al
			// achicarse por debajo de 275 conserva el ancho de ese punto (deja de ser
			// cuadrado en vez de angostarse), y nunca baja del piso de 125.
			pxWidth: function () {
				var squareSide = Math.max(125, Math.min(this.H, 275));
				return Math.round(this.W / this.H * squareSide);
			},
			ariaLabel: function () {
				return 'Distribución por categorías' + (this.isPercent ? ' (porcentaje)' : '');
			},
			values: function () {
				return this.bars.map(function (b) { return (b.value == null ? 0 : b.value); });
			},
			scaleMax: function () {
				// Apilado en porcentaje: composición al 100%. Apilado en conteo (N, T,
				// Km²…): suma de valores absolutos, escala real al mayor total por año.
				if (this.stacked) {
					if (this.isPercent) return 100;
					var sm = 0;
					for (var y = 0; y < this.years.length; y++) {
						var s = 0;
						for (var b = 0; b < this.years[y].bars.length; b++) {
							var bv = this.years[y].bars[b].value;
							s += (bv == null ? 0 : bv);
						}
						if (s > sm) sm = s;
					}
					return this._niceMax(sm);
				}
				if (this.isPercent) return 100;
				var m = 0;
				for (var i = 0; i < this.values.length; i++) if (this.values[i] > m) m = this.values[i];
				if (this.showTotalLine && this.totalValue != null && this.totalValue > m) m = this.totalValue;
				return this._niceMax(m);
			},
			plotW: function () { return this.W - this.pad.l - this.pad.r; },
			plotH: function () { return this.H - this.pad.t - this.pad.b; },
			columnCount: function () {
				return this.stacked && this.years.length ? this.years.length : this.bars.length;
			},
			// Hasta 8 columnas el área de ploteo es cuadrada (proporción agradable y
			// compacta); con más, crece en ancho para no amontonar.
			W: function () {
				var cols = Math.max(1, this.columnCount);
				if (cols <= 8) return this.pad.l + this.pad.r + this.plotH;
				return this.pad.l + this.pad.r + cols * 30;
			},
			// Cinco divisiones para tener gridlines intermedios (0/20/.../100 en %).
			yTicks: function () {
				// Cuartos del eje: marca 0/25/50/75/100% (y los equivalentes en N),
				// con líneas en los números de escala y en sus mitades.
				var max = this.scaleMax;
				var ticks = [];
				for (var i = 0; i <= 4; i++) ticks.push(Math.round((max / 4) * i * 100) / 100);
				return ticks;
			},
			bandWidth: function () {
				return this.plotW / Math.max(1, this.bars.length);
			},
			barRects: function () {
				var loc = this;
				return this.bars.map(function (b, i) {
					var v = (b.value == null ? 0 : b.value);
					var h = (v / loc.scaleMax) * loc.plotH;
					var bw = Math.min(loc.bandWidth * 0.45, 22);
					var x = loc.pad.l + i * loc.bandWidth + (loc.bandWidth - bw) / 2;
					return { x: x, y: loc.H - loc.pad.b - h, w: bw, h: h, color: b.color || '#888780', title: b.name + ': ' + loc.fmtVal(v) };
				});
			},
			linePts: function () {
				var loc = this;
				return this.bars.map(function (b, i) {
					var v = (b.value == null ? 0 : b.value);
					var x = loc.pad.l + (i + 0.5) * loc.bandWidth;
					var y = loc.H - loc.pad.b - (v / loc.scaleMax) * loc.plotH;
					return { x: x, y: y, color: b.color || '#888780', title: b.name + ': ' + loc.fmtVal(v) };
				});
			},
			linePoints: function () {
				return this.linePts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
			},
			// Apilado multi-año: una columna por año. En porcentaje los segmentos se
			// normalizan a 100% (composición); en conteo se apilan en su escala real.
			stackLayout: function () {
				var loc = this;
				var n = this.years.length;
				var band = this.plotW / Math.max(1, n);
				return this.years.map(function (yr, yi) {
					var vals = yr.bars.map(function (b) { return (b.value == null ? 0 : b.value); });
					var sum = 0; for (var s = 0; s < vals.length; s++) sum += vals[s];
					var bw = Math.min(band * 0.45, 22);
					var x = loc.pad.l + yi * band + (band - bw) / 2;
					var acc = 0;
					var segments = yr.bars.map(function (b) {
						var v = (b.value == null ? 0 : b.value);
						// Altura del segmento: fracción del total en %, valor/escala en N.
						var unit = loc.isPercent ? (sum > 0 ? v / sum : 0) : (v / loc.scaleMax);
						var h = unit * loc.plotH;
						var y = loc.pad.t + (loc.plotH - (acc + unit) * loc.plotH);
						acc += unit;
						var pct = sum > 0 ? Math.round(v / sum * 100) : 0;
						return { y: y, h: h, color: b.color || '#888780', title: yr.name + ' · ' + b.name + ': ' + loc.fmtVal(v) + (loc.isPercent ? ' (' + pct + '%)' : '') };
					});
					return { name: yr.name, x: x, w: bw, cx: loc.pad.l + yi * band + band / 2, segments: segments };
				});
			},
			// Bandas de área apiladas entre años (modo líneas + apilar).
			areaBands: function () {
				var loc = this;
				var n = this.years.length;
				if (n < 1) return [];
				var cats = this.years[0].bars.length;
				var band = this.plotW / Math.max(1, n);
				var cx = function (yi) { return loc.pad.l + yi * band + band / 2; };
				// Acumulado por año (fracciones).
				var cum = this.years.map(function () { return 0; });
				var bands = [];
				for (var ci = 0; ci < cats; ci++) {
					var top = [], bot = [];
					for (var yi = 0; yi < n; yi++) {
						var yr = loc.years[yi];
						var vals = yr.bars.map(function (b) { return (b.value == null ? 0 : b.value); });
						var sum = 0; for (var s = 0; s < vals.length; s++) sum += vals[s];
						// Porcentaje: fracción del total (composición). Conteo: valor en
						// la escala real del eje.
						var unit = loc.isPercent ? (sum > 0 ? vals[ci] / sum : 0) : (vals[ci] / loc.scaleMax);
						var below = cum[yi];
						var above = below + unit;
						bot.push([cx(yi), loc.pad.t + loc.plotH - below * loc.plotH]);
						top.push([cx(yi), loc.pad.t + loc.plotH - above * loc.plotH]);
						cum[yi] = above;
					}
					var d = 'M' + top.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
					for (var k = bot.length - 1; k >= 0; k--) d += ' L' + bot[k][0].toFixed(1) + ' ' + bot[k][1].toFixed(1);
					d += ' Z';
					bands.push({ d: d, color: loc.years[0].bars[ci].color || '#888780', name: loc.years[0].bars[ci].name });
				}
				return bands;
			}
		},
		methods: {
			_niceMax: function (m) {
				if (m <= 0) return 1;
				var p = Math.pow(10, Math.floor(Math.log10(m)));
				return Math.ceil(m / p) * p;
			},
			sy: function (v) { return this.H - this.pad.b - (v / this.scaleMax) * this.plotH; },
			fmtTick: function (v) {
				if (this.isPercent) return v + '%';
				return this._fmtMagnitude(v);
			},
			// Formato de magnitudes para ejes: millones con "M" y miles con "mil",
			// usando coma decimal (es-AR). Ej: 5600000 → "5,6 M"; 1200 → "1,2 mil".
			_fmtMagnitude: function (v) {
				if (v === 0) return '0';
				var abs = Math.abs(v);
				if (abs >= 1e6) return this._coma(v / 1e6) + ' M';
				if (abs >= 1000) return this._coma(v / 1000) + ' mil';
				return this._coma(v);
			},
			_coma: function (n) {
				var r = Math.round(n * 10) / 10;
				return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ',');
			},
			fmtVal: function (v) {
				var r = Math.round(v * 10) / 10;
				return this.isPercent ? r + '%' : r.toLocaleString('es-AR');
			}
		}
	};
</script>

<style scoped>
	.cat-chart { display: block; }
	.plot-frame { fill: none; stroke: #b0bec5; stroke-width: 1; vector-effect: non-scaling-stroke; }
	.grid-line { stroke: #dde3e7; stroke-width: 1; vector-effect: non-scaling-stroke; }
	.tick-label, .x-label { font-size: 9px; fill: #90a4ae; }
	.bar, .seg { stroke: none; }
	.area-band { opacity: 0.9; }
	.series-line { fill: none; stroke: #888780; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
	.total-line { stroke: #607d8b; stroke-width: 1.5; stroke-dasharray: 4 3; vector-effect: non-scaling-stroke; }
</style>
