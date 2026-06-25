/**
 * AnalysisColumns.js — modelo de columnas para el analizador de relaciones.
 *
 * Reemplaza las funciones sueltas de relationsData por objetos con
 * comportamiento:
 *
 *   - AnalysisColumn: una columna de medida del dataset. Sabe sus valores y
 *     pesos, su letra de referencia, sus flags (total / conteo) y, sobre todo,
 *     darse sus propios nombres (categoría, nombre completo, etiqueta con letra).
 *
 *   - AnalysisColumns: la colección (manager stateful). Se construye desde el
 *     dataset al que pertenece, mantiene las columnas con sus letras asignadas y
 *     resuelve las operaciones de conjunto: subconjunto para regresión, escala
 *     compartida, frase de tipos de región y las estadísticas (matriz de
 *     correlación, 1×N, regresión) delegando en pivotStats.
 *
 * Uso típico desde el widget:
 *     var cols = new AnalysisColumns(dataset, { weighted: true });
 *     cols.all();                       // [AnalysisColumn]
 *     cols.byKey('edu_a');              // AnalysisColumn | null
 *     cols.correlationMatrix('pearson');
 *     cols.oneToN(depKey, 'pearson');
 *     cols.regression(depKey);
 */

import stats from '@/table/js/pivotStats.js';

function letterFor(index) {
	var s = '';
	do {
		s = String.fromCharCode(65 + (index % 26)) + s;
		index = Math.floor(index / 26) - 1;
	} while (index >= 0);
	return s;
}

// ── AnalysisColumn ───────────────────────────────────────────────────────────

function AnalysisColumn(source, values, weights, letter) {
	this.key = source.key;
	this.label = source.label;
	this.shortLabel = source.shortLabel;
	this.unit = source.unit;
	this.formatter = source.formatter;
	this.meta = source.meta || {};
	this.values = values;
	this.weights = weights; // null si no ponderado
	this.letter = letter;
	this.isTotal = !!this.meta.isTotal;
	this.isSimpleCount = !!this.meta.isSimpleCount;
	this.normScale = this.meta.normalizationScale || null;
}

// Nombre de la "parte variable" según la regla de conteo: si es conteo simple,
// el nombre del indicador; si no, el de la variable.
AnalysisColumn.prototype.variablePart = function () {
	if (this.meta.isSimpleCount) return this.meta.metricName || '';
	return this.meta.variableName || this.meta.metricName || '';
};

// Nombre corto de la categoría (sin contexto).
AnalysisColumn.prototype.categoryName = function () {
	if (this.meta.isTotal) return 'Total';
	if (this.meta.labelName) return this.meta.labelName;
	return this.variablePart();
};

// Nombre completo estilo columnSpec: "<variable o indicador>: <categoría> (<edición>)".
AnalysisColumn.prototype.fullName = function () {
	var base = this.variablePart();
	var cat = this.meta.isTotal ? 'Total' : (this.meta.labelName || '');
	var ed = this.meta.versionName ? ' (' + this.meta.versionName + ')' : '';
	if (cat) return base + ': ' + cat + ed;
	return base + ed;
};

// Etiqueta con letra para la matriz: "A. 10 a 15%".
AnalysisColumn.prototype.letterLabel = function () {
	return this.letter + '. ' + this.categoryName();
};

// Rótulo de fila de la matriz: categoría + edición (la versión no figura en los
// cortes de control de la matriz, así que se agrega aquí).
AnalysisColumn.prototype.matrixRowName = function () {
	var base = this.categoryName();
	return this.meta.versionName ? base + ' (' + this.meta.versionName + ')' : base;
};

// Etiqueta de eje: nombre completo + métrica entre paréntesis.
AnalysisColumn.prototype.axisFull = function () {
	return this.fullName() + (this.unit ? ' (' + this.unit + ')' : '');
};

// ¿Es porcentaje? (para fijar la escala del eje a 0–100).
AnalysisColumn.prototype.isPercent = function () {
	return this.unit === '%';
};

// ── AnalysisColumns (colección / manager) ────────────────────────────────────

function AnalysisColumns(dataset, options) {
	options = options || {};
	this.dataset = dataset;
	this.weighted = options.weighted !== false;
	// stats se puede inyectar (tests); por defecto usa el módulo importado.
	this._stats = options.stats || stats;
	this._columns = this._build();
}

// Construye las AnalysisColumn extrayendo valores y pesos del dataset, alineados
// por el índice posicional de cada columna (mismo orden que values[] de cada fila).
AnalysisColumns.prototype._build = function () {
	var dataset = this.dataset;
	if (!dataset) return [];
	var all = dataset.columns || [];
	var indexByKey = {};
	all.forEach(function (c, i) { indexByKey[c.key] = i; });

	var rows = (typeof dataset.dataRows === 'function') ? dataset.dataRows() : [];
	var measures = all.filter(function (c) { return c.role === 'measure' && !(c.meta && c.meta.isEmpty); });

	var weighted = this.weighted;
	return measures.map(function (col, i) {
		var idx = indexByKey[col.key];
		var values = [], weights = [];
		for (var r = 0; r < rows.length; r++) {
			var row = rows[r];
			values.push(row.values ? row.values[idx] : null);
			weights.push(weighted && row.weights ? row.weights[idx] : 1);
		}
		return new AnalysisColumn(col, values, weighted ? weights : null, letterFor(i));
	});
};

// Todas las columnas analizables (incluye totales: el Total es elegible en
// combos, gráficos y correlaciones).
AnalysisColumns.prototype.all = function () {
	return this._columns;
};

AnalysisColumns.prototype.length = function () {
	return this._columns.length;
};

AnalysisColumns.prototype.byKey = function (key) {
	for (var i = 0; i < this._columns.length; i++) {
		if (this._columns[i].key === key) return this._columns[i];
	}
	return null;
};

AnalysisColumns.prototype.at = function (i) {
	return this._columns[i] || null;
};

// Subconjunto para la regresión: excluye los Total de indicadores que además
// tienen categorías (colinealidad). Un indicador con solo Total se conserva.
AnalysisColumns.prototype.regressionSet = function () {
	var byMetric = {};
	this._columns.forEach(function (c) {
		var m = c.meta.metricId;
		if (!byMetric[m]) byMetric[m] = { cats: 0 };
		if (!c.isTotal) byMetric[m].cats++;
	});
	return this._columns.filter(function (c) {
		if (!c.isTotal) return true;
		return byMetric[c.meta.metricId].cats === 0;
	});
};

// ¿Comparten todas las columnas (o el subconjunto dado) una escala comparable?
AnalysisColumns.prototype.shareScale = function (subset) {
	var cols = subset || this._columns;
	if (cols.length < 2) return true;
	var u = cols[0].unit, ns = cols[0].normScale;
	return cols.every(function (c) { return c.unit === u && c.normScale === ns; });
};

// Tipos de región en lenguaje natural: "provincias", "provincias y departamentos".
AnalysisColumns.prototype.regionTypesPhrase = function () {
	var types = (this.dataset && this.dataset.regionTypes) ? this.dataset.regionTypes.slice() : [];
	types = types.map(function (t) { return t ? t.charAt(0).toLowerCase() + t.slice(1) : t; }).filter(Boolean);
	if (!types.length) return '';
	if (types.length === 1) return types[0];
	if (types.length === 2) return types[0] + ' y ' + types[1];
	return types.slice(0, -1).join(', ') + ' y ' + types[types.length - 1];
};

// Etiquetas de cada fila de datos (región y, si tiene, su padre), alineadas por
// índice con los valores. Se usan en el tooltip de los gráficos.
AnalysisColumns.prototype.rowLabels = function () {
	if (!this.dataset || typeof this.dataset.dataRows !== 'function') return [];
	return this.dataset.dataRows().map(function (row) {
		var name = row.label || '';
		return row.parentLabel ? name + ' (' + row.parentLabel + ')' : name;
	});
};

// ── Estadísticas de conjunto (delegan en pivotStats) ─────────────────────────

// Matriz de correlación N×N (asimétrica por los ponderadores).
AnalysisColumns.prototype.correlationMatrix = function (method) {
	var statCols = this._columns.map(function (c) {
		return { key: c.key, values: c.values, weights: c.weights };
	});
	return this._stats.correlationMatrix(statCols, { method: method, weighting: { mode: 'auto' } });
};

// Correlaciones de una columna (por key) contra las demás, en ambos métodos.
// Devuelve [{ col, pr, prP, sp, spP, n }].
AnalysisColumns.prototype.oneToN = function (depKey) {
	var dep = this.byKey(depKey) || this._columns[0];
	if (!dep) return [];
	var st = this._stats;
	return this._columns
		.filter(function (c) { return c.key !== dep.key; })
		.map(function (c) {
			var pr = st.weightedPearson(dep.values, c.values, dep.weights);
			var sp = st.weightedSpearman(dep.values, c.values, dep.weights);
			return {
				col: c,
				pr: pr ? pr.r : null, prP: pr ? st.correlationPValue(pr.r, pr.n) : null,
				sp: sp ? sp.r : null, spP: sp ? st.correlationPValue(sp.r, sp.n) : null,
				n: pr ? pr.n : 0
			};
		});
};

// Regresión lineal de una columna (dependiente) explicada por las demás del
// subconjunto de regresión. Devuelve { regression, others } o null.
AnalysisColumns.prototype.regression = function (depKey) {
	var dep = this.byKey(depKey) || this._columns[0];
	if (!dep) return null;
	var others = this.regressionSet().filter(function (c) { return c.key !== dep.key; });
	if (others.length < 1) return null;
	var X = [];
	for (var r = 0; r < dep.values.length; r++) {
		X.push(others.map(function (c) { return c.values[r]; }));
	}
	var reg = this._stats.weightedLinearRegression(dep.values, X, dep.weights);
	return reg ? { regression: reg, others: others } : null;
};

// Rango [min, max] de los valores válidos de la dependiente, para el control de
// punto de corte de la regresión logística. null si no hay valores.
AnalysisColumns.prototype.dependentRange = function (depKey) {
	var dep = this.byKey(depKey) || this._columns[0];
	if (!dep) return null;
	var min = null, max = null;
	for (var i = 0; i < dep.values.length; i++) {
		var v = dep.values[i];
		if (v == null || !isFinite(v)) continue;
		if (min === null || v < min) min = v;
		if (max === null || v > max) max = v;
	}
	return min === null ? null : { min: min, max: max };
};

// Regresión logística binomial: dicotomiza la dependiente por un punto de corte
// (1 si cumple el criterio respecto del umbral, 0 si no) y la explica con las
// mismas independientes que la lineal. direction 'greater' → 1 si valor >
// umbral; 'less' → 1 si valor < umbral. Devuelve { regression, others } o null.
AnalysisColumns.prototype.logisticRegression = function (depKey, threshold, direction) {
	var dep = this.byKey(depKey) || this._columns[0];
	if (!dep || threshold == null || !isFinite(threshold)) return null;
	var others = this.regressionSet().filter(function (c) { return c.key !== dep.key; });
	if (others.length < 1) return null;

	var greater = direction !== 'less';
	var binary = [];
	var X = [];
	for (var r = 0; r < dep.values.length; r++) {
		var v = dep.values[r];
		if (v == null || !isFinite(v)) { binary.push(null); }
		else binary.push((greater ? v > threshold : v < threshold) ? 1 : 0);
		X.push(others.map(function (c) { return c.values[r]; }));
	}
	var reg = this._stats.weightedLogisticRegression(binary, X, dep.weights);
	return reg ? { regression: reg, others: others } : null;
};

// Correlación de un par (ambos métodos, dirección Y←X usando peso de Y).
AnalysisColumns.prototype.pairCorrelation = function (xKey, yKey) {
	var x = this.byKey(xKey), y = this.byKey(yKey);
	if (!x || !y || xKey === yKey) return null;
	var pr = this._stats.weightedPearson(y.values, x.values, y.weights);
	var sp = this._stats.weightedSpearman(y.values, x.values, y.weights);
	return {
		prF: pr ? pr.r : null, prFP: pr ? this._stats.correlationPValue(pr.r, pr.n) : null,
		spF: sp ? sp.r : null, spFP: sp ? this._stats.correlationPValue(sp.r, sp.n) : null
	};
};

// Regresión simple de un par (x explica y).
AnalysisColumns.prototype.pairRegression = function (xKey, yKey) {
	var x = this.byKey(xKey), y = this.byKey(yKey);
	if (!x || !y || xKey === yKey) return null;
	return this._stats.weightedSimpleRegression(x.values, y.values, y.weights);
};

export { AnalysisColumn, AnalysisColumns };
export default AnalysisColumns;
