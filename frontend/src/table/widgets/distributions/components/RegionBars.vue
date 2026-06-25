<template>
	<svg :viewBox="'0 0 ' + W + ' ' + H" class="region-bars" :style="{ height: H + 'px' }" preserveAspectRatio="xMinYMin meet" role="img" :aria-label="ariaLabel">
		<g v-for="(t, i) in xTicks" :key="'xt-' + i">
			<line :x1="sx(t)" :y1="pad.t" :x2="sx(t)" :y2="H - pad.b" class="grid-line" />
			<text :x="sx(t)" :y="pad.t - 3" class="tick-label" text-anchor="middle">{{ fmtTick(t) }}</text>
		</g>

		<g v-for="(row, ri) in layout" :key="'r-' + ri">
			<text :x="pad.l - 6" :y="row.labelY" class="region-label" text-anchor="end">
				<tspan v-for="(ln, li) in row.lines" :key="'ln-' + li" :x="pad.l - 6" :dy="li === 0 ? 0 : 14">{{ ln }}</tspan>
			</text>
			<rect v-for="(seg, si) in row.segments" :key="'s-' + ri + '-' + si"
					:x="seg.x" :y="row.y" :width="seg.w" :height="barH"
					:style="{ fill: seg.color }" class="seg">
				<title>{{ seg.title }}</title>
			</rect>
			<text v-if="!stacked" :x="row.totalX + 4" :y="row.cy + 3" class="region-total">{{ fmtVal(row.total) }}</text>
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
			minHeight: { type: Number, default: 0 }
		},
		data: function () {
			return { W: 440, baseBarH: 16, baseRowGap: 7, pad: { l: 176, r: 44, t: 16, b: 6 }, labelCharsPerLine: 22, labelMaxLines: 2, lineH: 14 };
		},
		computed: {
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
			axisMax: function () { return this.stacked ? 100 : (this.scaleMax > 0 ? this.scaleMax : 1); },
			xTicks: function () {
				var m = this.axisMax;
				var ticks = [];
				for (var i = 0; i <= 4; i++) ticks.push(Math.round((m / 4) * i * 100) / 100);
				return ticks;
			},
			layout: function () {
				var loc = this;
				var y = this.pad.t;
				return this.rows.map(function (r) {
					var lines = loc._wrap(r.label);
					var rowH = Math.max(lines.length * loc.lineH, loc.barH);
					var barTop = y + Math.max(0, (rowH - loc.barH) / 2);
					var sum = 0;
					for (var k = 0; k < r.parts.length; k++) sum += (r.parts[k].value || 0);
					var acc = 0;
					var segments = r.parts.map(function (p) {
						var v = p.value || 0;
						var val = loc.stacked ? (sum > 0 ? v / sum * 100 : 0) : v;
						var w = (val / loc.axisMax) * loc.trackW;
						var x = loc.pad.l + (acc / loc.axisMax) * loc.trackW;
						acc += val;
						return { x: x, w: w, color: p.color || '#888780',
							title: r.label + ' · ' + loc.fmtVal(v) + (loc.stacked && sum > 0 ? ' (' + Math.round(v / sum * 100) + '%)' : '') };
					});
					var totalX = loc.pad.l + ((loc.stacked ? 100 : Math.min(sum, loc.axisMax)) / loc.axisMax) * loc.trackW;
					var cy = barTop + loc.barH / 2;
					var labelY = cy - (lines.length - 1) * loc.lineH / 2 + 3;
					var item = { lines: lines, labelY: labelY, y: barTop, cy: cy, segments: segments, total: r.total, totalX: totalX };
					y += rowH + loc.rowGap;
					return item;
				});
			}
		},
		methods: {
			sx: function (v) { return this.pad.l + (v / this.axisMax) * this.trackW; },
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
			fmtTick: function (v) {
				if (this.stacked || this.isPercent) return v + '%';
				return this._fmtMagnitude(v);
			},
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
	.region-bars { width: 100%; min-width: 300px; max-width: 580px; display: block; }
	.grid-line { stroke: #eceff1; stroke-width: 0.5; }
	.tick-label { font-size: 9px; fill: #90a4ae; }
	.region-label { font-size: 15px; fill: #546e7a; }
	.region-total { font-size: 11px; fill: #78909c; }
	.seg { stroke: #fff; stroke-width: 0.5; }
</style>
