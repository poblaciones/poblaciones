<template>
	<div class="widget relations-widget">
		<header class="widget-head">
			<div class="widget-titles"><span class="widget-kind">Relaciones</span></div>
			<button class="widget-close" @click="requestClose" title="Ocultar">×</button>
		</header>

		<div v-if="availability !== 'ready'" class="widget-empty">{{ emptyMessage() }}</div>
		<div v-else-if="!enoughColumns" class="widget-empty">
			Para analizar relaciones debe haber al menos dos indicadores, series o categorías en la tabla.
		</div>

		<template v-else>
			<div class="tabs">
				<button v-for="t in tabs" :key="t.key" class="tab" :class="{ active: activeTab === t.key }"
						:title="t.tip" @click="activeTab = t.key">{{ t.label }}</button>
			</div>

			<div class="tab-body">
				<!-- ───────── NxN ───────── -->
				<div v-if="activeTab === 'nxn'" class="pane">
					<h4 class="section-title"><span class="sec-ico ico-table">▦</span> Matriz de correlaciones</h4>
					<table class="data-table corr-matrix">
						<thead>
							<tr>
								<th class="corner"></th>
								<th v-for="c in columns" :key="'h-' + c.key" class="cm-head" :title="fullName(c)">{{ c.letter }}</th>
							</tr>
						</thead>
						<tbody>
							<template v-for="(grp, gidx) in matrixGroups">
								<tr v-if="grp.label" :key="'mg-' + gidx" class="grp">
									<td :colspan="columns.length + 1">{{ grp.label }}</td>
								</tr>
								<tr v-for="ci in grp.indices" :key="'r-' + columns[ci].key">
									<th class="cm-rowhead" :title="fullName(columns[ci])">
										<span class="cm-letter">{{ columns[ci].letter }}.</span>
										<span class="cm-cat hand" @click="goTo1xN(columns[ci])" title="Ver relaciones de esta variable (1×N)">{{ matrixRowName(columns[ci]) }}</span>
									</th>
									<td v-for="(cell, j) in matrix.matrix[ci]" :key="'c-' + ci + '-' + j"
											class="cm-cell" :class="cellClass(cell, ci, j)" :style="cellStyle(cell)"
											:title="cellTitle(ci, j, cell)" @click="selectCell(ci, j)" @dblclick="goTo1x1(ci, j)">
										{{ cell.self ? '—' : fmtR(cell.r) }}
									</td>
								</tr>
							</template>
						</tbody>
					</table>

					<p class="matrix-note">
						Cada celda muestra la correlación {{ methodName }} ponderada de la fila con la columna. La matriz es
						asimétrica: cada fila usa el ponderador de su propia variable. En tono atenuado, los pares sin
						significación estadística (p ≥ 0,05). Un clic sobre una celda muestra el gráfico; un doble clic lo abre en 1×1.
					</p>

					<div v-if="selected" class="inline-scatter">
						<div class="chart-block">
							<h4 class="section-title"><span class="sec-ico ico-chart">▥</span> Gráfico de dispersión</h4>
							<div class="chart-subject">{{ fullName(columns[selected.i]) }}</div>
							<scatter-plot :points="pairPoints(selected.i, selected.j)"
								:x-label="axisFull(columns[selected.j])" :y-label="axisMetric(columns[selected.i])"
								:regression="pairRegression(selected.i, selected.j)" :size-by-weight="sizeByWeight"
								:height="150" :y-max100="isPct(columns[selected.i])" :x-max100="isPct(columns[selected.j])" />
						</div>
						<label class="sw-toggle"><input type="checkbox" v-model="sizeByWeight" /><span class="sw-track"><span class="sw-thumb"></span></span><span>Tamaño de puntos según ponderador</span></label>
					</div>

					<div class="corr-method">
						Correlación:
						<label><input type="radio" value="pearson" v-model="method" /> r de Pearson</label>
						<label><input type="radio" value="spearman" v-model="method" /> r de Spearman</label>
					</div>
				</div>

				<!-- ───────── 1xN ───────── -->
				<div v-else-if="activeTab === '1xn'" class="pane">
					<div class="combo-row">
						<label>Analizar:</label>
						<select v-model="depKey" class="combo wide">
							<option v-for="c in columns" :key="'dep-' + c.key" :value="c.key">{{ fullName(c) }}</option>
						</select>
					</div>

					<h4 class="section-title"><span class="sec-ico ico-table">▦</span> Correlaciones</h4>
					<div class="subject-line">{{ depColumn ? fullName(depColumn) : '' }}</div>
					<table class="data-table rel-table">
						<thead>
							<tr>
								<th class="left">Variable</th>
								<th>r de Pearson</th><th>Sig. (p)</th>
								<th>r de Spearman</th><th>Sig. (p)</th>
								<th>filas</th>
							</tr>
						</thead>
						<tbody>
							<template v-for="row in oneToNRows">
								<tr v-if="row.type === 'group'" :key="row.gid" :class="'grp grp-' + row.level"><td :colspan="6">{{ row.label }}</td></tr>
								<tr v-else :key="'c1n-' + row.col.key">
									<td class="rel-cat">{{ catName(row.col) }}</td>
									<td>{{ fmtR(row.pr) }}<sup class="sig-star">{{ stars(row.prP) }}</sup></td>
									<td>{{ fmtP(row.prP) }}</td>
									<td>{{ fmtR(row.sp) }}<sup class="sig-star">{{ stars(row.spP) }}</sup></td>
									<td>{{ fmtP(row.spP) }}</td>
									<td>{{ row.n }}</td>
								</tr>
							</template>
						</tbody>
					</table>

					<h4 class="section-title"><span class="sec-ico ico-calc">∑</span> Regresión
						<span class="r2" v-if="regType === 'linear' && regression">R²aj. {{ fmt2(regression.adjRSquared) }} · n {{ regression.n }}</span>
						<span class="r2" v-else-if="regType === 'logistic' && logitReg">R² McF. {{ fmt2(logitReg.mcFaddenR2) }} · n {{ logitReg.n }}</span>
					</h4>
					<div class="subject-line">Variable dependiente: {{ depColumn ? fullName(depColumn) : '' }}</div>

					<div class="reg-type">Tipo:
						<label><input type="radio" value="linear" v-model="regType" /> lineal</label>
						<label><input type="radio" value="logistic" v-model="regType" /> binomial logística</label>
					</div>

					<div v-if="regType === 'logistic'" class="logit-controls">
						<div class="cut-row" v-if="depRange">
							<label>Punto de corte:</label>
							<input type="range" class="cut-slider" :min="depRange.min" :max="depRange.max" :step="cutStep" v-model.number="logitThreshold" />
							<input type="number" class="cut-input" :min="depRange.min" :max="depRange.max" :step="cutStep" v-model.number="logitThreshold" />
						</div>
						<div class="reg-type">Criterio de inclusión:
							<label><input type="radio" value="greater" v-model="logitDirection" /> mayores</label>
							<label><input type="radio" value="less" v-model="logitDirection" /> menores</label>
						</div>
						<p class="matrix-note">
							Se tomará como variable dicotómica independiente = 1 a los casos con valores
							{{ thresholdSign }} a {{ fmt2(logitThreshold) }}.
						</p>
					</div>

					<!-- Resultado lineal -->
					<table v-if="regType === 'linear' && regression" class="data-table rel-table">
						<thead>
							<tr><th class="left">Variable</th><th>Coef.</th><th>EE</th><th>t</th><th>Sig.</th></tr>
						</thead>
						<tbody>
							<tr class="intercept">
								<td>(Intercepto)</td>
								<td>{{ fmt2(regression.coefficients[0]) }}</td><td>{{ fmt2(regression.stdErrors[0]) }}</td>
								<td>{{ fmt2(regression.tValues[0]) }}</td><td>{{ fmtP(regression.pValues[0]) }}<sup class="sig-star">{{ stars(regression.pValues[0]) }}</sup></td>
							</tr>
							<template v-for="row in regressionRows">
								<tr v-if="row.type === 'group'" :key="'rg-' + row.gid" :class="'grp grp-' + row.level"><td :colspan="5">{{ row.label }}</td></tr>
								<tr v-else :key="'reg-' + row.col.key">
									<td class="rel-cat indent">{{ catName(row.col) }}</td>
									<td>{{ fmt2(row.coef) }}</td><td>{{ fmt2(row.se) }}</td>
									<td>{{ fmt2(row.t) }}</td><td>{{ fmtP(row.p) }}<sup class="sig-star">{{ stars(row.p) }}</sup></td>
								</tr>
							</template>
						</tbody>
					</table>
					<p v-else-if="regType === 'linear'" class="matrix-note">No hay datos suficientes para estimar la regresión.</p>

					<!-- Resultado logístico -->
					<table v-if="regType === 'logistic' && logitReg" class="data-table rel-table">
						<thead>
							<tr><th class="left">Variable</th><th>Coef. (B)</th><th>EE</th><th>Wald</th><th>z</th><th>Sig.</th><th title="Exp(B) = e^B: razón de chances (odds ratio). Factor por el que se multiplican las chances de que la dependiente sea 1 al aumentar la variable en una unidad.">Exp(B)</th></tr>
						</thead>
						<tbody>
							<tr class="intercept">
								<td>(Intercepto)</td>
								<td>{{ fmt2(logitReg.coefficients[0]) }}</td><td>{{ fmt2(logitReg.stdErrors[0]) }}</td>
								<td>{{ fmt2(logitReg.waldValues[0]) }}</td>
								<td>{{ fmt2(logitReg.zValues[0]) }}</td><td>{{ fmtP(logitReg.pValues[0]) }}<sup class="sig-star">{{ stars(logitReg.pValues[0]) }}</sup></td>
								<td>{{ fmt2(logitReg.oddsRatios[0]) }}</td>
							</tr>
							<template v-for="row in logitRows">
								<tr v-if="row.type === 'group'" :key="'lg-' + row.gid" :class="'grp grp-' + row.level"><td :colspan="7">{{ row.label }}</td></tr>
								<tr v-else :key="'lreg-' + row.col.key">
									<td class="rel-cat indent">{{ catName(row.col) }}</td>
									<td>{{ fmt2(row.coef) }}</td><td>{{ fmt2(row.se) }}</td>
									<td>{{ fmt2(row.wald) }}</td>
									<td>{{ fmt2(row.z) }}</td><td>{{ fmtP(row.p) }}<sup class="sig-star">{{ stars(row.p) }}</sup></td>
									<td>{{ fmt2(row.or) }}</td>
								</tr>
							</template>
						</tbody>
					</table>
					<div v-if="regType === 'logistic' && logitReg" class="pair-stats">
						<div>Pseudo-R² de McFadden: <b>{{ fmt2(logitReg.mcFaddenR2) }}</b> · R² de Nagelkerke: <b>{{ fmt2(logitReg.nagelkerkeR2) }}</b></div>
						<div>Log-verosimilitud: {{ fmt2(logitReg.logLik) }} · n: {{ logitReg.n }}</div>
					</div>
					<p v-if="regType === 'logistic' && logitReg" class="matrix-note">
						Las chances (OR) indican por qué factor se multiplican las chances de que la dependiente sea 1 al aumentar cada variable en una unidad: mayor que 1 las aumenta, menor que 1 las reduce.
					</p>
					<p v-else-if="regType === 'logistic'" class="matrix-note">No hay datos suficientes para estimar la regresión logística (se requieren ambas clases presentes según el punto de corte).</p>

					<p class="footnote">*p &lt; 0,05; **p &lt; 0,01; ***p &lt; 0,001. A menor p, mayor nivel de confianza estadística.</p>

					<div class="chart-block">
						<h4 class="section-title"><span class="sec-ico ico-chart">▥</span> Gráfico de dispersión</h4>
						<div class="chart-subject">{{ (depColumn ? fullName(depColumn) : '') }} según indicadores seleccionados</div>
						<scatter-multi :series="multiSeries" :y-label="depColumn ? axisMetric(depColumn) : ''"
							:size-by-weight="sizeByWeight" :height="150" :y-max100="depColumn ? isPct(depColumn) : false" />
					</div>
					<label class="sw-toggle"><input type="checkbox" v-model="sizeByWeight" /><span class="sw-track"><span class="sw-thumb"></span></span><span>Tamaño de puntos según ponderador</span></label>
				</div>

				<!-- ───────── 1x1 ───────── -->
				<div v-else class="pane">
					<div class="combo-stack">
						<div class="combo-line"><label>Analizar:</label>
							<select v-model="xKey" class="combo wide">
								<option v-for="c in columns" :key="'x-' + c.key" :value="c.key">{{ fullName(c) }}</option>
							</select>
						</div>
						<div class="combo-line"><label>con:</label>
							<select v-model="yKey" class="combo wide">
								<option v-for="c in yOptions" :key="'y-' + c.key" :value="c.key">{{ fullName(c) }}</option>
							</select>
						</div>
					</div>

					<div class="pair-stats" v-if="pairStats">
						<div>Correlación (r de Pearson): <b>{{ fmtR(pairStats.prF) }}</b>. Sig. (p): {{ fmtP(pairStats.prFP) }} {{ sigPhrase(pairStats.prFP) }}</div>
						<div>Correlación (r de Spearman): <b>{{ fmtR(pairStats.spF) }}</b>. Sig. (p): {{ fmtP(pairStats.spFP) }} {{ sigPhrase(pairStats.spFP) }}</div>
						<div v-if="pairReg">R²: {{ fmt2(pairReg.rSquared) }} · pendiente: {{ fmt2(pairReg.slope) }}</div>
					</div>

					<div class="chart-block" v-if="xKey !== yKey">
						<h4 class="section-title"><span class="sec-ico ico-chart">▥</span> Gráfico de dispersión</h4>
						<div class="chart-subject">{{ colByKey[xKey] ? fullName(colByKey[xKey]) : '' }}</div>
						<scatter-plot :points="pairPointsByKey(xKey, yKey)" :x-label="axisFullKey(yKey)" :y-label="axisMetricKey(xKey)"
							:regression="pairReg" :size-by-weight="sizeByWeight" :height="150"
							:y-max100="isPctKey(xKey)" :x-max100="isPctKey(yKey)" />
					</div>
					<p v-else class="matrix-note">Deben elegirse dos variables distintas.</p>
					<label class="sw-toggle"><input type="checkbox" v-model="sizeByWeight" /><span class="sw-track"><span class="sw-thumb"></span></span><span>Tamaño de puntos según ponderador</span></label>

					<div class="chart-block" v-if="xKey !== yKey">
						<h4 class="section-title"><span class="sec-ico ico-chart">▥</span> Histogramas</h4>
						<div class="chart-subject">{{ histSubjectKeys(xKey, yKey) }}</div>
						<dual-histogram :a="pairColumn(xKey)" :b="pairColumn(yKey)"
							:a-label="colByKey[xKey] ? fullName(colByKey[xKey]) : ''"
							:b-label="colByKey[yKey] ? fullName(colByKey[yKey]) : ''" :height="150" />
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<script>
import widgetMixin from '@/table/widgets/widgetMixin.js';
import ScatterPlot from '@/table/components/charts/ScatterPlot.vue';
import ScatterMulti from '@/table/components/charts/ScatterMulti.vue';
import DualHistogram from '@/table/components/charts/DualHistogram.vue';

var ALPHA = 0.05;

export default {
	name: 'RelationsWidget',
	components: { ScatterPlot, ScatterMulti, DualHistogram },
	mixins: [widgetMixin],
	data() {
		var cfg = this.config || {};
		return {
			activeTab: cfg.tab || 'nxn',
			method: cfg.method || 'pearson',
			sizeByWeight: cfg.sizeByWeight !== undefined ? cfg.sizeByWeight : true,
			depKey: cfg.depKey || null,
			xKey: cfg.xKey || null,
			yKey: cfg.yKey || null,
			regType: cfg.regType || 'linear',
			logitThreshold: cfg.logitThreshold != null ? cfg.logitThreshold : null,
			logitDirection: cfg.logitDirection || 'greater',
			selected: null,
			tabs: [
				{ key: 'nxn', label: 'N×N', tip: 'Analizar relaciones entre todas las variables' },
				{ key: '1xn', label: '1×N', tip: 'Analizar relaciones entre una variable y las demás' },
				{ key: '1x1', label: '1×1', tip: 'Analizar relaciones entre dos variables' }
			]
		};
	},
	computed: {
		// Colección de columnas del análisis: la vista que la pivot ya montó sobre
		// su dataset (pivot.Dataset.Columns). null si todavía no hay dataset.
		cols() { return this.dataset ? this.dataset.Columns : null; },
		// Vista de array para el template (cada elemento es una AnalysisColumn).
		columns() { return this.cols ? this.cols.all() : []; },
		enoughColumns() { return this.columns.length >= 2; },
		colByKey() { var m = {}; this.columns.forEach(function (c) { m[c.key] = c; }); return m; },
		// Etiquetas de fila (región + padre), alineadas por índice. Tooltip de gráficos.
		rowLabels() { return this.cols ? this.cols.rowLabels() : []; },
		methodName() { return this.method === 'spearman' ? 'de Spearman' : 'de Pearson'; },
		matrix() { return this.cols ? this.cols.correlationMatrix(this.method) : { matrix: [] }; },
		// Cortes de control de la matriz: agrupa índices por indicador/variable.
		matrixGroups() {
			var groups = [], last = null, cur = null;
			this.columns.forEach(function (c, i) {
				var key = (c.meta.metricId || '') + '|' + (c.meta.variableId || '');
				if (key !== last) {
					cur = { label: c.meta.isSimpleCount ? (c.meta.metricName || '') : (c.meta.variableName || c.meta.metricName || ''), indices: [] };
					groups.push(cur); last = key;
				}
				cur.indices.push(i);
			});
			if (groups.length === 1) groups[0].label = '';
			return groups;
		},
		depColumn() { return this.colByKey[this.depKey] || this.columns[0]; },
		oneToNRows() { return this.cols ? this.withControlBreaks(this.cols.oneToN(this.depColumn ? this.depColumn.key : null)) : []; },
		regressionResult() { return this.cols ? this.cols.regression(this.depColumn ? this.depColumn.key : null) : null; },
		regression() { return this.regressionResult ? this.regressionResult.regression : null; },
		regOthers() { return this.regressionResult ? this.regressionResult.others : []; },
		regressionRows() {
			if (!this.regressionResult) return [];
			var reg = this.regressionResult.regression, others = this.regressionResult.others;
			var rowsRaw = others.map(function (c, i) {
				return { col: c, coef: reg.coefficients[i + 1], se: reg.stdErrors[i + 1], t: reg.tValues[i + 1], p: reg.pValues[i + 1] };
			});
			return this.withControlBreaks(rowsRaw);
		},
		depRange() { return this.cols && this.depColumn ? this.cols.dependentRange(this.depColumn.key) : null; },
		thresholdSign() { return this.logitDirection === 'greater' ? '>' : '<'; },
		cutStep() {
			var r = this.depRange;
			if (!r || r.max === r.min) return 1;
			// Enteros en general; un decimal solo si el rango es chico (≤ 10 unidades).
			return (r.max - r.min) <= 10 ? 0.1 : 1;
		},
		logitResult() {
			if (this.regType !== 'logistic' || !this.cols || !this.depColumn) return null;
			return this.cols.logisticRegression(this.depColumn.key, this.logitThreshold, this.logitDirection);
		},
		logitReg() { return this.logitResult ? this.logitResult.regression : null; },
		logitRows() {
			if (!this.logitResult) return [];
			var reg = this.logitResult.regression, others = this.logitResult.others;
			var rowsRaw = others.map(function (c, i) {
				return { col: c, coef: reg.coefficients[i + 1], se: reg.stdErrors[i + 1], wald: reg.waldValues[i + 1], z: reg.zValues[i + 1], p: reg.pValues[i + 1], or: reg.oddsRatios[i + 1] };
			});
			return this.withControlBreaks(rowsRaw);
		},
		multiSeries() {
			var dep = this.depColumn;
			if (!dep || !this.cols) return [];
			var others = this.columns.filter(function (c) { return c.key !== dep.key; });
			var labels = this.rowLabels;
			var normalize = !this.cols.shareScale(others.concat([dep]));
			var palette = ['#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00897b', '#c0ca33', '#6d4c41', '#e53935'];
			return others.map(function (c, i) {
				var clean = c.values.filter(function (v) { return v != null && isFinite(v); });
				var max = clean.length ? Math.max.apply(null, clean) : 0;
				var pts = [];
				for (var r = 0; r < dep.values.length; r++) {
					var xv = c.values[r];
					if (normalize && max > 0 && xv != null) xv = xv / max * 100;
					pts.push({ x: xv, y: dep.values[r], w: dep.weights ? dep.weights[r] : 1, label: labels[r] || '' });
				}
				return { key: c.key, legend: c.fullName(), color: palette[i % palette.length], normalized: normalize, normMax: max, points: pts };
			});
		},
		yOptions() { var xk = this.xKey; return this.columns.filter(function (c) { return c.key !== xk; }); },
		// El ponderador lo aporta la fila elegida (primer combo, xKey): se pasa como
		// segundo argumento, que es el que define el ponderador en estas funciones.
		pairStats() { return this.cols ? this.cols.pairCorrelation(this.yKey, this.xKey) : null; },
		pairReg() { return this.cols ? this.cols.pairRegression(this.yKey, this.xKey) : null; }
	},
	watch: {
		columns() {
			var keys = {};
			this.columns.forEach(function (c) { keys[c.key] = true; });

			if (this.columns.length) {
				// Reasigna o llena combos vacíos o que apunten a columnas que ya no existen.
				if (!this.depKey || !keys[this.depKey]) this.depKey = this.columns[0].key;
				if (!this.xKey || !keys[this.xKey]) this.xKey = this.columns[0].key;
				if (!this.yKey || !keys[this.yKey]) {
					var xk = this.xKey;
					var alt = this.columns.find(function (c) { return c.key !== xk; });
					this.yKey = alt ? alt.key : this.columns[0].key;
				}
				if (this.selected && (this.selected.i >= this.columns.length || this.selected.j >= this.columns.length)) {
					this.selected = this.columns.length >= 2 ? { i: 0, j: 1 } : null;
				}
			}

			// Al quedar en exactamente dos columnas (viniendo de otra cantidad), el
			// único análisis con sentido es el 1×1: se salta a ese tab con ambas
			// columnas seleccionadas. Vale tanto al agregar (1→2) como al quitar (3+→2).
			if (this.columns.length === 2 && this._prevColumnCount !== 2) {
				this.xKey = this.columns[0].key;
				this.yKey = this.columns[1].key;
				this.activeTab = '1x1';
				this.persist({ tab: '1x1', xKey: this.xKey, yKey: this.yKey });
			}
			this._prevColumnCount = this.columns.length;
		},
		activeTab(v) { this.persist({ tab: v }); },
		method(v) { this.persist({ method: v }); },
		sizeByWeight(v) { this.persist({ sizeByWeight: v }); },
		depKey(v) {
			this.persist({ depKey: v });
			// La dependiente cambió: el umbral previo ya no aplica, se recentra.
			if (this.regType === 'logistic') this.resetThresholdToMid();
		},
		xKey(v) {
			this.persist({ xKey: v });
			if (this.yKey === v) { var alt = this.columns.find(function (c) { return c.key !== v; }); if (alt) this.yKey = alt.key; }
		},
		yKey(v) { this.persist({ yKey: v }); },
		regType(v) {
			this.persist({ regType: v });
			if (v === 'logistic' && this.logitThreshold == null) this.resetThresholdToMid();
		},
		logitThreshold(v) {
			var r = this.roundToCut(v);
			if (r !== v) { this.logitThreshold = r; return; }
			this.persist({ logitThreshold: v });
		},
		logitDirection(v) { this.persist({ logitDirection: v }); }
	},
	created() {
		if (!this.depKey && this.columns.length) this.depKey = this.columns[0].key;
		if (!this.xKey && this.columns.length) this.xKey = this.columns[0].key;
		if (!this.yKey && this.columns.length > 1) this.yKey = this.columns[1].key;
		// Preselecciona la primera celda fuera de la diagonal para que el gráfico
		// del tab NxN ya esté visible.
		if (this.columns.length >= 2) this.selected = { i: 0, j: 1 };
		this._prevColumnCount = this.columns.length;
	},
	methods: {
		persist(patch) { this.updateConfig(patch); },
		// Redondea un valor al paso del corte (entero, o 1 decimal en rangos chicos).
		roundToCut(v) {
			if (v == null || !isFinite(v)) return v;
			return this.cutStep < 1 ? Math.round(v * 10) / 10 : Math.round(v);
		},
		// Punto de corte al centro del rango de la dependiente (al activar la
		// logística o al cambiar de dependiente).
		resetThresholdToMid() {
			var r = this.depRange;
			this.logitThreshold = r ? this.roundToCut((r.min + r.max) / 2) : null;
		},
		// Delegan en la columna (AnalysisColumn): el template los usa como métodos.
		catName(c) { return c.categoryName(); },
		matrixRowName(c) { return c.matrixRowName(); },
		fullName(c) { return c.fullName(); },
		letterLabel(c) { return c.letterLabel(); },
		axisMetric(c) { return c.unit || ''; },
		axisMetricKey(k) { var c = this.colByKey[k]; return c ? (c.unit || '') : ''; },
		axisFull(c) { return c.axisFull(); },
		axisFullKey(k) { var c = this.colByKey[k]; return c ? c.axisFull() : ''; },
		isPct(c) { return !!c && c.isPercent(); },
		isPctKey(k) { var c = this.colByKey[k]; return this.isPct(c); },
		regionPhrase() { var p = this.cols ? this.cols.regionTypesPhrase() : ''; return p ? ' en ' + p : ''; },
		scatterSubject(rowCol, colCol) { return rowCol.fullName() + ' y ' + colCol.fullName() + this.regionPhrase(); },
		scatterSubjectKeys(xk, yk) {
			var x = this.colByKey[xk], y = this.colByKey[yk];
			if (!x || !y || xk === yk) return '';
			return y.fullName() + ' y ' + x.fullName() + this.regionPhrase();
		},
		histSubjectKeys(xk, yk) {
			var x = this.colByKey[xk], y = this.colByKey[yk];
			if (!x || !y || xk === yk) return '';
			return x.fullName() + ' y ' + y.fullName();
		},
		// Inserta filas de corte de control (indicador/variable/edición).
		withControlBreaks(rows) {
			var out = [], lastM = null, lastV = null, lastE = null, gid = 0;
			rows.forEach(function (row) {
				var meta = row.col.meta;
				if ((meta.metricName || '') !== lastM) {
					out.push({ type: 'group', level: 0, label: (meta.isSimpleCount ? meta.metricName : (meta.variableName || meta.metricName)) || '', gid: 'g' + (gid++) });
					lastM = meta.metricName || ''; lastV = meta.variableName || ''; lastE = null;
				} else if ((meta.variableName || '') !== lastV && !meta.isSimpleCount) {
					if (meta.variableName) out.push({ type: 'group', level: 0, label: meta.variableName, gid: 'g' + (gid++) });
					lastV = meta.variableName || ''; lastE = null;
				}
				if ((meta.versionName || '') !== lastE) {
					if (meta.versionName) out.push({ type: 'group', level: 2, label: meta.versionName, gid: 'g' + (gid++) });
					lastE = meta.versionName || '';
				}
				out.push(row);
			});
			return out;
		},
		fmtR(r) { return (r == null || !isFinite(r)) ? '—' : r.toFixed(2).replace('.', ','); },
		fmt2(v) { return (v == null || !isFinite(v)) ? '—' : v.toFixed(2).replace('.', ','); },
		fmtP(p) { if (p == null || !isFinite(p)) return '—'; if (p < 0.001) return '<0,001'; return p.toFixed(3).replace('.', ','); },
		stars(p) { if (p == null || !isFinite(p)) return ''; if (p < 0.001) return '***'; if (p < 0.01) return '**'; if (p < 0.05) return '*'; return ''; },
		sigPhrase(p) { if (p == null || !isFinite(p)) return ''; return p < ALPHA ? '' : '(sin asociación estadística)'; },
		cellClass(cell, i, j) {
			if (cell.self) return 'self';
			var sel = this.selected && this.selected.i === i && this.selected.j === j;
			return { selectedcell: sel, hand: true };
		},
		cellStyle(cell) {
			if (cell.self || cell.r == null) return {};
			var insig = cell.p == null || cell.p >= ALPHA;
			var a = Math.min(1, Math.abs(cell.r));
			var rgb = cell.r >= 0 ? '25,118,210' : '229,57,53';
			var bg = 'rgba(' + rgb + ',' + (0.08 + a * 0.5) + ')';
			return insig ? { backgroundColor: bg, opacity: 0.5 } : { backgroundColor: bg };
		},
		cellTitle(i, j, cell) {
			if (cell.self) return '';
			return this.columns[i].fullName() + ' × ' + this.columns[j].fullName() + '  r=' + this.fmtR(cell.r) + '  p=' + this.fmtP(cell.p) + '  (n ' + cell.n + ')';
		},
		selectCell(i, j) { if (i !== j) this.selected = { i: i, j: j }; },
		pairPoints(i, j) { return this.pairPointsCols(this.columns[i], this.columns[j]); },
		pairPointsByKey(xk, yk) { return this.pairPointsCols(this.colByKey[xk], this.colByKey[yk]); },
		pairPointsCols(rowCol, colCol) {
			if (!rowCol || !colCol) return [];
			var labels = this.rowLabels;
			var pts = [];
			for (var r = 0; r < rowCol.values.length; r++) {
				pts.push({
					x: colCol.values[r], y: rowCol.values[r],
					w: rowCol.weights ? rowCol.weights[r] : 1,
					label: labels[r] || ''
				});
			}
			return pts;
		},
		pairRegression(i, j) {
			if (!this.cols) return null;
			var reg = this.cols.pairRegression(this.columns[j].key, this.columns[i].key);
			return reg ? { slope: reg.slope, intercept: reg.intercept } : null;
		},
		pairColumn(key) { return this.colByKey[key]; },
		goTo1x1(i, j) { this.xKey = this.columns[i].key; this.yKey = this.columns[j].key; this.activeTab = '1x1'; },
		goTo1xN(c) { this.depKey = c.key; this.activeTab = '1xn'; }
	}
};
</script>

<style scoped>
	@import '@/table/widgets/widgetStyles.css';

	.widget { font-size: 14px; }
	.widget-kind { font-size: 14px; }
	.widget-empty { font-size: 14px; }

	.tabs { display: flex; gap: 2px; padding: 6px 10px 0; background: #fafafa; border-bottom: 1px solid #eee; }
	.tab { border: 1px solid transparent; border-bottom: none; background: #eceff1; color: #607d8b; font-size: 13px; font-weight: 600; padding: 5px 12px; border-radius: 5px 5px 0 0; cursor: pointer; }
	.tab.active { background: #fff; color: #1976d2; border-color: #e0e0e0; }

	.tab-body { flex: 1; overflow: auto; padding: 12px; min-height: 0; }
	.pane { min-width: 0; }

	.section-title { font-size: 14px; font-weight: 700; color: #37474f; margin: 16px 0 6px; display: flex; align-items: baseline; gap: 6px; }
	.section-title:first-child { margin-top: 0; }
	.sec-ico { font-size: 12px; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: #dddddd; color: #919191; }
	.r2 { font-size: 12px; font-weight: 400; color: #78909c; }

	.subject-line { font-size: 14px; font-weight: 600; color: #37474f; margin: 0 0 6px; }

	/* Tablas de datos: sombra tenue */
	.data-table { border-collapse: collapse; box-shadow: 0px 0px 1px 0px rgb(0 0 0 / 70%); background: #fff; }

	.corr-matrix { font-size: 14px; margin-bottom: 8px; }
	.corr-matrix .corner { background: #fafafa; }
	.cm-head { padding: 4px 8px; color: #607d8b; font-weight: 700; text-align: center; border-bottom: 1px solid #eceff1; }
	.cm-rowhead { padding: 3px 8px; text-align: left; white-space: nowrap; font-weight: 500; min-width: 300px; }
	.cm-letter { color: #607d8b; font-weight: 700; margin-right: 3px; }
	.cm-cat { color: #1976d2; }
	.cm-cell { padding: 3px 8px; text-align: center; border: 1px solid #f0f0f0; min-width: 40px; }
	.cm-cell.self { background: #f5f5f5; color: #b0bec5; }
	.cm-cell.selectedcell { outline: 2px solid #1976d2; outline-offset: -2px; }

	.matrix-note { font-size: 13px; color: #90a4ae; margin: 6px 0 12px; line-height: 1.4; }
	.footnote { font-size: 13px; color: #78909c; margin: 8px 0 4px; line-height: 1.4; }

	.combo-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
	.combo-row label { font-size: 14px; color: #546e7a; }
	.combo-stack { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
	.combo-line { display: flex; align-items: center; gap: 8px; }
	.combo-line label { font-size: 14px; color: #546e7a; min-width: 56px; }
	.combo { font-size: 14px; border: 1px solid #d0d7de; border-radius: 4px; padding: 4px 16px 4px 6px; color: #37474f; max-width: 100%; }
	.combo.wide { flex: 1; min-width: 0; margin-right: 30px; }

	.rel-table { width: 100%; font-size: 14px; }
	.rel-table thead th { font-size: 14px; font-weight: 600; color: #455a64; text-align: right; padding: 4px 8px; border-bottom: 2px solid #cfd8dc; background: #f7f9fb; }
	.rel-table thead th.left { text-align: left; }
	.rel-table td { text-align: right; padding: 2px 8px; border-bottom: 1px solid #f5f5f5; color: #455a64; }
	.rel-table td.rel-cat { text-align: left; color: #37474f; padding-left: 14px; }
	.rel-table td.rel-cat.indent { padding-left: 22px; }
	.rel-table tr.intercept td { font-style: italic; color: #90a4ae; }
	/* Corte de control: versión/año bien a la izquierda, poco padding, jerarquía menor que los encabezados de columna */
	.rel-table tr.grp td { font-weight: 600; background: #eef2f5; color: #546e7a; text-align: left; padding: 1px 8px; font-size: 14px; }
	.rel-table tr.grp-2 td { background-color: #ffffff; color: #78909c; padding-left: 8px; }
	.sig-star { color: #1976d2; font-weight: 700; }

	.pair-stats { display: flex; flex-direction: column; gap: 4px; font-size: 14px; color: #455a64; margin: 6px 0 10px; }

	/* Bloques de gráfico: título en dos líneas, centrado al ancho del gráfico */
	.inline-scatter { border-top: 1px solid #eceff1; padding-top: 8px; margin-top: 10px; }
	.chart-block { margin: 6px 0 4px; }
	.chart-subject { font-size: 14px; text-align: center; color: #607d8b; line-height: 1.5; font-weight: 600; margin-bottom: 4px; }

	.corr-method { margin-top: 14px; padding-top: 10px; border-top: 1px solid #eceff1; font-size: 13px; color: #546e7a; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
	.corr-method label { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; }

	.weight-toggle { color: #607d8b; margin-top: 6px; }
	.hand { cursor: pointer; }
	.reg-type { font-size: 14px; color: #455a64; margin: 6px 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
	.reg-type label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }
	.logit-controls { margin: 4px 0 10px; }
	.cut-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 14px; color: #455a64; }
	.cut-slider { flex: 0 1 auto; width: 45%; min-width: 80px; }
	.cut-input { width: 90px; padding: 2px 6px; border: 1px solid #cfd8dc; border-radius: 4px; font-size: 13px; }
</style>
