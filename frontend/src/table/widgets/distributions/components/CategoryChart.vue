<template>
	<svg :viewBox="'0 0 ' + W + ' ' + H" class="cat-chart" :style="{ height: H + 'px', width: pxWidth + 'px' }"
			preserveAspectRatio="xMidYMid meet" role="img" :aria-label="ariaLabel">
		<template v-if="hasData">
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

		<!-- Etiquetas de categoría/año bajo cada columna, envueltas en dos líneas -->
		<g v-for="(lab, li) in xLabels" :key="'xl-' + li">
			<text :x="lab.cx" :y="H - pad.b + labelLineH + 2" class="x-label" text-anchor="middle">
				<tspan v-for="(ln, k) in lab.lines" :key="'xln-' + k" :x="lab.cx" :dy="k === 0 ? 0 : labelLineH">{{ ln }}</tspan>
			</text>
		</g>
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
			isGap: { type: Boolean, default: false },
			valueUnit: { type: String, default: '' },
			showTotalLine: { type: Boolean, default: false },
			totalValue: { type: Number, default: null },
			height: { type: Number, default: 180 }
		},
		data: function () {
			return {
				// Espacio inferior (pad.b) reservado para las etiquetas de categoría en
				// hasta dos líneas; el resto del padding enmarca el área de datos.
				pad: { l: 44, r: 14, t: 14, b: 40 },
				colWidth: 46,        // ancho fijo por columna (rectangular, no cuadrado)
				barMaxWidth: 26,     // ancho máximo de la barra dentro de su columna
				labelLineH: 11,      // interlineado de las etiquetas de categoría
				labelMaxLines: 2,    // hasta dos líneas por etiqueta
				labelCharsPerLine: 9 // corte aproximado para envolver la etiqueta
			};
		},
		computed: {
			// ¿Hay algún valor para dibujar? Sin datos no se dibuja marco ni ejes.
			hasData: function () {
				if (this.stacked) {
					for (var y = 0; y < this.years.length; y++) {
						for (var b = 0; b < this.years[y].bars.length; b++) {
							if (this.years[y].bars[b].value != null) return true;
						}
					}
					return false;
				}
				return this.bars.some(function (b) { return b.value != null; });
			},
			// Alto efectivo del área de dibujo, con piso para no miniaturizarse.
			H: function () { var h = Number(this.height); return Math.max(125, (isNaN(h) ? 180 : h)); },
			// Ancho fijo: cada columna ocupa colWidth, así el gráfico es rectangular y
			// mantiene su ancho aunque cambie el alto (deja de achicarse/cuadrarse).
			W: function () {
				var cols = Math.max(1, this.columnCount);
				return this.pad.l + this.pad.r + cols * this.colWidth;
			},
			pxWidth: function () { return this.W; },
			ariaLabel: function () {
				return 'Distribución por categorías' + (this.isPercent ? ' (porcentaje)' : '');
			},
			values: function () {
				return this.bars.map(function (b) { return (b.value == null ? 0 : b.value); });
			},
			// Mínimo del eje. Normalmente 0; con brecha puede haber valores negativos
			// (deltas), y el eje baja hasta el menor para que las barras se vean.
			scaleMin: function () {
				if (!this.isGap || this.stacked) return 0;
				var mn = 0;
				for (var i = 0; i < this.values.length; i++) if (this.values[i] < mn) mn = this.values[i];
				if (mn === 0) return 0;
				return -this._niceMax(-mn);
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
				if (this.isGap && m === 0 && this.scaleMin === 0) return 1;
				return this._niceMax(m);
			},
			scaleSpan: function () {
				var span = this.scaleMax - this.scaleMin;
				return span > 0 ? span : 1;
			},
			plotW: function () { return this.W - this.pad.l - this.pad.r; },
			plotH: function () { return this.H - this.pad.t - this.pad.b; },
			columnCount: function () {
				return this.stacked && this.years.length ? this.years.length : this.bars.length;
			},
			// Cinco divisiones para tener gridlines intermedios (0/20/.../100 en %).
			yTicks: function () {
				var ticks = [];
				for (var i = 0; i <= 4; i++) {
					ticks.push(Math.round((this.scaleMin + this.scaleSpan / 4 * i) * 100) / 100);
				}
				return ticks;
			},
			bandWidth: function () {
				// Ancho fijo por columna (no se reparte el ancho disponible).
				return this.colWidth;
			},
			barRects: function () {
				var loc = this;
				var yZero = this.sy(0);
				return this.bars.map(function (b, i) {
					var v = (b.value == null ? 0 : b.value);
					var yVal = loc.sy(v);
					var bw = Math.min(loc.colWidth * 0.6, loc.barMaxWidth);
					var x = loc.pad.l + i * loc.colWidth + (loc.colWidth - bw) / 2;
					// La barra va del cero al valor; el alto es la distancia (nunca
					// negativa) y la y, el extremo superior.
					return { x: x, y: Math.min(yZero, yVal), w: bw, h: Math.abs(yVal - yZero), color: b.color || '#888780', title: b.name + ': ' + loc.fmtVal(v) };
				});
			},
			// Etiquetas de categoría bajo cada columna, envueltas en hasta dos líneas
			// y centradas, con su espacio reservado en pad.b (no se superponen con el
			// área de datos).
			xLabels: function () {
				var loc = this;
				var src = (this.stacked && this.years.length)
					? this.years.map(function (y) { return y.name; })
					: this.bars.map(function (b) { return b.name; });
				return src.map(function (name, i) {
					return {
						cx: loc.pad.l + i * loc.colWidth + loc.colWidth / 2,
						lines: loc._wrapLabel(name)
					};
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
				var band = this.colWidth;
				return this.years.map(function (yr, yi) {
					var vals = yr.bars.map(function (b) { return (b.value == null ? 0 : b.value); });
					var sum = 0; for (var s = 0; s < vals.length; s++) sum += vals[s];
					var bw = Math.min(band * 0.6, loc.barMaxWidth);
					var x = loc.pad.l + yi * band + (band - bw) / 2;
					var acc = 0;
					var segments = yr.bars.map(function (b) {
						var v = (b.value == null ? 0 : b.value);
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
				var band = this.colWidth;
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
			// Envuelve una etiqueta en hasta labelMaxLines líneas, cortando por
			// palabras; si la última línea desborda, la trunca con elipsis.
			_wrapLabel: function (text) {
				var s = String(text == null ? '' : text);
				var max = this.labelCharsPerLine;
				var words = s.split(/\s+/);
				var lines = [];
				var cur = '';
				for (var i = 0; i < words.length; i++) {
					var test = cur ? (cur + ' ' + words[i]) : words[i];
					if (test.length > max && cur) {
						lines.push(cur);
						cur = words[i];
						if (lines.length === this.labelMaxLines - 1) break;
					} else {
						cur = test;
					}
				}
				var rest = cur;
				for (var j = i + 1; j < words.length; j++) rest += ' ' + words[j];
				if (rest) lines.push(rest);
				if (lines.length > this.labelMaxLines) lines = lines.slice(0, this.labelMaxLines);
				var last = lines[lines.length - 1];
				if (last && last.length > max) lines[lines.length - 1] = last.slice(0, max - 1) + '…';
				return lines;
			},
			_niceMax: function (m) {
				if (m <= 0) return 1;
				var p = Math.pow(10, Math.floor(Math.log10(m)));
				return Math.ceil(m / p) * p;
			},
			sy: function (v) { return this.H - this.pad.b - ((v - this.scaleMin) / this.scaleSpan) * this.plotH; },
			fmtTick: function (v) {
				if (this.isGap) return this._coma(v) + ' pp';
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
				if (this.isGap) return this._coma(r) + ' pp';
				return this.isPercent ? r + '%' : r.toLocaleString('es-AR');
			}
		}
	};
</script>

<style scoped>
	.cat-chart { display: block; flex: none; align-self: flex-start; }
	.plot-frame { fill: none; stroke: #b0bec5; stroke-width: 1; vector-effect: non-scaling-stroke; }
	.grid-line { stroke: #dde3e7; stroke-width: 1; vector-effect: non-scaling-stroke; }
	.tick-label, .x-label { font-size: 10px; fill: #90a4ae; }
	.bar, .seg { stroke: none; }
	.area-band { opacity: 0.9; }
	.series-line { fill: none; stroke: #888780; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
	.total-line { stroke: #607d8b; stroke-width: 1.5; stroke-dasharray: 4 3; vector-effect: non-scaling-stroke; }
</style>
