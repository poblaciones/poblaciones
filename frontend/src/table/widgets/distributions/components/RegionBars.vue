<template>
	<svg :viewBox="'0 0 ' + W + ' ' + H" class="region-bars" :style="{ width: renderW + 'px', height: (H * renderW / W) + 'px' }" preserveAspectRatio="xMinYMin meet" role="img" :aria-label="ariaLabel">
		<!-- Marco del área de datos -->
		<rect :x="pad.l" :y="pad.t" :width="trackW" :height="H - pad.t - pad.b" class="plot-frame" />
		<!-- Guías intermedias (entre cada par de ticks), más suaves -->
		<line v-for="(t, i) in xMidTicks" :key="'xm-' + i"
				:x1="sx(t)" :y1="pad.t" :x2="sx(t)" :y2="H - pad.b" class="grid-line-soft" />
		<g v-for="(t, i) in xTicks" :key="'xt-' + i">
			<line :x1="sx(t)" :y1="pad.t" :x2="sx(t)" :y2="H - pad.b" class="grid-line" />
			<text :x="sx(t)" :y="pad.t - 3" class="tick-label" text-anchor="middle">{{ fmtTick(t) }}</text>
		</g>
		<!-- Unidad del eje, una sola vez (las unidades de % van pegadas a cada número). -->
		<text v-if="axisUnit" :x="pad.l + trackW" :y="pad.t - 3" class="axis-unit" text-anchor="end">{{ axisUnit }}</text>
		<line :x1="zeroX" :y1="pad.t" :x2="zeroX" :y2="H - pad.b" class="zero-line" />

		<g v-for="(row, ri) in layout" :key="'r-' + ri">
			<text :x="pad.l - 6" :y="row.labelY" class="region-label" :class="{ 'region-label-group': row.isGroup }" text-anchor="end">
				<tspan v-for="(ln, li) in row.lines" :key="'ln-' + li" :x="pad.l - 6" :dy="li === 0 ? 0 : lineH">{{ ln }}</tspan>
			</text>
			<rect v-for="(seg, si) in row.segments" :key="'s-' + ri + '-' + si"
					:x="seg.x" :y="row.y" :width="seg.w" :height="barH"
					:style="{ fill: seg.color }" class="seg">
				<title>{{ seg.title }}</title>
			</rect>
			<text v-if="!stacked && !allHundred" :x="row.totalX + 4" :y="row.cy + 3" class="region-total" :class="{ 'region-total-group': row.isGroup }">{{ fmtVal(row.total) }}</text>
		</g>
	</svg>
</template>

<script>
	export default {
		name: 'RegionBars',
		props: {
			rows: { type: Array, default: function () { return []; } },
			scaleMax: { type: Number, default: 100 },
			stacked: { type: Boolean, default: false },
			isPercent: { type: Boolean, default: false },
			isGap: { type: Boolean, default: false },
			gapInPoints: { type: Boolean, default: true },
			valueUnit: { type: String, default: '' },
			minHeight: { type: Number, default: 0 }
		},
		data: function () {
			return { W: 440, renderW: 350, baseBarH: 16, baseRowGap: 7, pad: { l: 176, r: 44, t: 16, b: 6 }, labelCharsPerLine: 22, labelMaxLines: 2, lineH: 19 };
		},
		computed: {
			// Unidad mostrada una vez en el eje. Para porcentaje (y brecha de puntos)
			// la unidad va pegada a cada número, así que acá no se repite. Para el resto
			// (km², habitantes, etc.) se muestra la unidad propia, o "miles"/"millones"
			// queda implícito en cada número.
			axisUnit: function () {
				if (this._isPointUnit()) return '';
				return this.valueUnit || '';
			},
			// ¿Todas las barras valen ~100%? (fil%: cada región reparte su propio 100).
			// En ese caso, mostrar "100%" en cada fila no aporta y se omite.
			allHundred: function () {
				if (!this.isPercent || !this.rows.length) return false;
				return this.rows.every(function (r) {
					return r.total != null && Math.abs(r.total - 100) < 0.5;
				});
			},
			ariaLabel: function () {
				return 'Distribución por regiones' + (this.stacked ? ', composición al 100%' : '');
			},
			// Alto natural (filas con su wrap). Si hay más espacio disponible
			// (minHeight), se reparte el sobrante entre alto de barra y separación,
			// para que las barras crezcan con el panel en vez de quedar chicas.
			naturalH: function () {
				var loc = this;
				var total = this.pad.t + this.pad.b;
				this.rows.forEach(function (r) { total += loc._lineCount(r.label) * loc.lineH + loc.baseRowGap; });
				return Math.max(total, this.pad.t + this.pad.b + 20);
			},
			growth: function () {
				if (!this.minHeight || !this.rows.length) return 1;
				var g = (this.minHeight) / this.naturalH;
				return Math.max(1, Math.min(g, 3));
			},
			barH: function () { return this.baseBarH * this.growth; },
			rowGap: function () { return this.baseRowGap * this.growth; },
			H: function () {
				var loc = this;
				var total = this.pad.t + this.pad.b;
				this.rows.forEach(function (r) { total += Math.max(loc._lineCount(r.label) * loc.lineH, loc.barH) + loc.rowGap; });
				return Math.max(total, this.pad.t + this.pad.b + 20);
			},
			trackW: function () { return this.W - this.pad.l - this.pad.r; },
			// Rango de valores de las barras. Con deltas de brecha puede haber
			// negativos: el eje incluye ambos lados y las barras divergen desde el cero.
			// En brecha la longitud de la barra es su delta total (r.total), no la suma
			// de partes (las partes solo reparten el color por peso).
			valueRange: function () {
				var min = 0, max = 0;
				var loc = this;
				this.rows.forEach(function (r) {
					if (loc.isGap) {
						var d = r.total || 0;
						if (d < min) min = d;
						if (d > max) max = d;
						return;
					}
					var v = loc.stacked ? 0 : (r.total || 0);
					if (!loc.stacked) {
						for (var k = 0; k < r.parts.length; k++) {
							var pv = r.parts[k].value || 0;
							if (pv < min) min = pv;
							if (pv > max) max = pv;
						}
					}
					if (v < min) min = v;
					if (v > max) max = v;
				});
				if (min === 0 && max === 0) max = 1;
				// Todo negativo: se deja un margen positivo (~25% del alcance negativo)
				// para que se vea el terreno positivo y se entienda la referencia al cero.
				if (max === 0 && min < 0) max = -min * 0.25;
				return { min: min, max: max };
			},
			hasNegative: function () { return this.valueRange.min < 0; },
			axisMax: function () { return this.stacked ? 100 : (this.scaleMax > 0 ? this.scaleMax : 1); },
			xTicks: function () {
				var ticks = [];
				if (this.hasNegative) {
					var range = this.valueRange;
					for (var i = 0; i <= 4; i++) {
						ticks.push(Math.round((range.min + (range.max - range.min) / 4 * i) * 100) / 100);
					}
					return ticks;
				}
				var m = this.axisMax;
				for (var j = 0; j <= 4; j++) ticks.push(Math.round((m / 4) * j * 100) / 100);
				return ticks;
			},
			// Puntos medios entre ticks consecutivos: guías verticales más suaves.
			xMidTicks: function () {
				var mids = [];
				var lo = this.hasNegative ? this.valueRange.min : 0;
				var hi = this.hasNegative ? this.valueRange.max : this.axisMax;
				var step = (hi - lo) / 4;
				for (var i = 0; i < 4; i++) mids.push(lo + step * (i + 0.5));
				return mids;
			},
			layout: function () {
				var loc = this;
				var y = this.pad.t;
				var neg = this.hasNegative;
				var range = this.valueRange;
				// Con negativos, el dominio va de min a max y el cero cae en su lugar;
				// las barras parten del cero. Sin negativos, comportamiento clásico
				// (desde el borde izquierdo, escala 0..axisMax).
				var span = neg ? (range.max - range.min) : this.axisMax;
				if (span <= 0) span = 1;
				var zeroX = neg ? (this.pad.l + ((0 - range.min) / span) * this.trackW) : this.pad.l;
				return this.rows.map(function (r) {
					var lines = loc._wrap(r.label);
					var rowH = Math.max(lines.length * loc.lineH, loc.barH);
					var barTop = y + Math.max(0, (rowH - loc.barH) / 2);

					// Brecha compuesta: la barra va del cero al delta total (con signo) y
					// se subdivide por el peso de cada categoría (value+valueGap). El peso
					// es positivo y aditivo, así que reparte una longitud sin importar que
					// el delta sea negativo.
					if (loc.isGap) {
						var delta = r.total || 0;
						var xEnd = loc.pad.l + ((delta - range.min) / span) * loc.trackW;
						var wsum = 0;
						for (var wi = 0; wi < r.parts.length; wi++) wsum += Math.max(0, r.parts[wi].weight || 0);
						var totalLen = xEnd - zeroX;            // con signo (negativo si delta<0)
						var off = 0;
						var gapSegments = r.parts.map(function (p) {
							var frac = wsum > 0 ? Math.max(0, p.weight || 0) / wsum : 0;
							var segLen = totalLen * frac;
							var xa = zeroX + off;
							off += segLen;
							return { x: Math.min(xa, xa + segLen), w: Math.abs(segLen), color: p.color || '#888780',
								title: '[' + p.name + ']: Δ ' + loc.fmtVal(delta) };
						});
						var cyG = barTop + loc.barH / 2;
						var labelYG = cyG - (lines.length - 1) * loc.lineH / 2 + 3;
						var itemG = { lines: lines, labelY: labelYG, y: barTop, cy: cyG, segments: gapSegments,
							total: delta, totalX: xEnd, isGroup: !!r.isGroup };
						y += rowH + loc.rowGap;
						return itemG;
					}

					var sum = 0;
					for (var k = 0; k < r.parts.length; k++) sum += (r.parts[k].value || 0);
					var acc = 0;
					var segments = r.parts.map(function (p) {
						var v = p.value || 0;
						var seg;
						if (neg) {
							// Barra desde el cero hacia el lado del signo. El ancho es la
							// magnitud; nunca negativo (eso rompía el atributo width).
							var x0 = loc.pad.l + ((0 - range.min) / span) * loc.trackW;
							var x1 = loc.pad.l + ((v - range.min) / span) * loc.trackW;
							seg = { x: Math.min(x0, x1), w: Math.abs(x1 - x0) };
						} else {
							var val = loc.stacked ? (sum > 0 ? v / sum * 100 : 0) : v;
							var w = (val / loc.axisMax) * loc.trackW;
							var x = loc.pad.l + (acc / loc.axisMax) * loc.trackW;
							acc += val;
							seg = { x: x, w: Math.max(0, w) };
						}
						return { x: seg.x, w: seg.w, color: p.color || '#888780',
							title: (p.name ? '[' + p.name + ']: ' : '') + loc.fmtVal(v) };
					});
					var totalX = neg
						? loc.pad.l + ((Math.max(range.min, Math.min(sum, range.max)) - range.min) / span) * loc.trackW
						: loc.pad.l + ((loc.stacked ? 100 : Math.min(sum, loc.axisMax)) / loc.axisMax) * loc.trackW;
					var cy = barTop + loc.barH / 2;
					var labelY = cy - (lines.length - 1) * loc.lineH / 2 + 3;
					var item = { lines: lines, labelY: labelY, y: barTop, cy: cy, segments: segments, total: r.total, totalX: totalX, isGroup: !!r.isGroup };
					y += rowH + loc.rowGap;
					return item;
				});
			},
			zeroX: function () {
				var range = this.valueRange;
				var span = (range.max - range.min) || 1;
				return this.hasNegative ? (this.pad.l + ((0 - range.min) / span) * this.trackW) : this.pad.l;
			}
		},
		methods: {
			sx: function (v) {
				if (this.hasNegative) {
					var range = this.valueRange;
					var span = (range.max - range.min) || 1;
					return this.pad.l + ((v - range.min) / span) * this.trackW;
				}
				return this.pad.l + (v / this.axisMax) * this.trackW;
			},
			_wrap: function (label) {
				var s = String(label == null ? '' : label);
				var max = this.labelCharsPerLine;
				if (s.length <= max) return [s];
				var words = s.split(' ');
				var lines = [], cur = '';
				for (var i = 0; i < words.length; i++) {
					var test = cur ? cur + ' ' + words[i] : words[i];
					if (test.length > max && cur) { lines.push(cur); cur = words[i]; }
					else cur = test;
					if (lines.length === this.labelMaxLines - 1 && (cur.length > max)) break;
				}
				if (cur) lines.push(cur);
				if (lines.length > this.labelMaxLines) {
					lines = lines.slice(0, this.labelMaxLines);
					lines[this.labelMaxLines - 1] = lines[this.labelMaxLines - 1].slice(0, max - 1) + '…';
				}
				return lines;
			},
			_lineCount: function (label) { return this._wrap(label).length; },
			// ¿La unidad se repite en cada número? Solo cuando es porcentaje (incluida
			// la brecha de puntos porcentuales): un "%" o "pp" junto a cada valor se lee
			// bien. Las demás unidades (km², miles, etc.) van una sola vez en el título
			// del eje, no pegadas a cada número.
			_isPointUnit: function () {
				if (this.isGap) return this.gapInPoints !== false;   // brecha de % → pp.
				return this.isPercent || this.stacked;
			},
			_pointSuffix: function () {
				if (this.isGap) return ' pp';
				return '%';
			},
			fmtTick: function (v) {
				if (this._isPointUnit()) return this._fmtMagnitude(v) + this._pointSuffix();
				return this._fmtMagnitude(v);
			},
			// Formato de magnitud: números grandes (≥2000) abreviados a "1,1 M" o
			// "123 mil" para no quedar larguísimos; el resto, con coma decimal.
			_fmtMagnitude: function (v) {
				if (v === 0) return '0';
				var abs = Math.abs(v);
				if (abs >= 1e6) return this._coma(v / 1e6) + ' M';
				if (abs >= 2000) return Math.round(v / 1000) + ' mil';
				return this._coma(v);
			},
			_coma: function (n) {
				var r = Math.round(n * 10) / 10;
				return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ',');
			},
			fmtVal: function (v) {
				if (this._isPointUnit()) return this._fmtMagnitude(v) + this._pointSuffix();
				return this._fmtMagnitude(v);
			}
		}
	};
</script>

<style scoped>
	.region-bars { max-width: 580px; display: block; flex: none; align-self: flex-start; }
	.plot-frame { fill: none; stroke: #b0bec5; stroke-width: 1; vector-effect: non-scaling-stroke; }
	.axis-unit { font-size: 10px; fill: #78909c; }
	.grid-line { stroke: #898989; stroke-width: 0.5; }
	.grid-line-soft { stroke: #c7c7c7; stroke-width: 0.25; }
	.zero-line { stroke: #5e5e5e; stroke-width: 1.2; }
	.tick-label { font-size: 10px; fill: #90a4ae; }
	.region-label { font-size: 15px; fill: #546e7a; }
	.region-label-group { font-weight: 700; fill: #37474f; }
	.region-total { font-size: 11px; fill: #78909c; }
	.region-total-group { font-weight: 700; fill: #546e7a; }
	.seg { stroke: #5e5e5e; stroke-width: 0.1; vector-effect: non-scaling-stroke; }
</style>
