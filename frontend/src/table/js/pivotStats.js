/**
 * pivotStats.js — primitivas estadísticas ponderadas para los widgets de
 * análisis del dashboard (Resumen, Relaciones, Distribución, Grupos).
 *
 * Toda la batería acepta pesos por observación. El criterio de ponderación lo
 * define cada widget según el régimen de la columna de referencia (ver
 * ActiveDataset (weighting)): por defecto los análisis son ponderados, de modo que
 * una correlación entre porcentajes provinciales pese cada provincia por su
 * total de hogares (o el denominador que corresponda), y no trate a todas las
 * unidades como equivalentes.
 *
 * Convenciones:
 *  - Las funciones reciben arrays paralelos de valores y pesos.
 *  - Pares con valor o peso nulo/NaN se descartan (exclusión por par/fila).
 *  - Peso por defecto = 1 (sin ponderar) cuando no se pasan pesos.
 *  - Ningún método muta sus entradas.
 *
 * No depende de librerías externas; las fórmulas tienen forma cerrada. Para
 * regresión múltiple se usa eliminación gaussiana sobre las ecuaciones normales
 * ponderadas (XᵀWX) β = XᵀW y, suficiente para el número de columnas esperado.
 */

// ── Utilidades internas ───────────────────────────────────────────────────────

function isNum(x) {
	return x !== null && x !== undefined && typeof x === 'number' && !isNaN(x) && isFinite(x);
}

// Empareja valores y pesos descartando posiciones inválidas. weights opcional.
function clean(values, weights) {
	var v = [], w = [];
	for (var i = 0; i < values.length; i++) {
		var val = values[i];
		var wt = weights ? weights[i] : 1;
		if (!isNum(val)) continue;
		if (!isNum(wt) || wt < 0) continue;
		if (weights && wt === 0) continue;   // peso 0 = no aporta
		v.push(val);
		w.push(weights ? wt : 1);
	}
	return { v: v, w: w };
}

// Empareja dos series + pesos, descartando posiciones inválidas en cualquiera.
function cleanPair(xs, ys, weights) {
	var x = [], y = [], w = [];
	for (var i = 0; i < xs.length; i++) {
		var xv = xs[i], yv = ys[i];
		var wt = weights ? weights[i] : 1;
		if (!isNum(xv) || !isNum(yv)) continue;
		if (!isNum(wt) || wt < 0) continue;
		if (weights && wt === 0) continue;
		x.push(xv); y.push(yv); w.push(weights ? wt : 1);
	}
	return { x: x, y: y, w: w };
}

function sum(a) {
	var s = 0;
	for (var i = 0; i < a.length; i++) s += a[i];
	return s;
}

// ── Estadísticos univariados ponderados ───────────────────────────────────────

export function weightedMean(values, weights) {
	var c = clean(values, weights);
	if (c.v.length === 0) return null;
	var sw = sum(c.w);
	if (sw === 0) return null;
	var acc = 0;
	for (var i = 0; i < c.v.length; i++) acc += c.v[i] * c.w[i];
	return acc / sw;
}

// Varianza ponderada (estimador con corrección de frecuencia "reliability":
// divide por sw - (sw2/sw), que se reduce a n-1 cuando todos los pesos son 1).
export function weightedVariance(values, weights) {
	var c = clean(values, weights);
	if (c.v.length < 2) return null;
	var sw = sum(c.w);
	if (sw === 0) return null;
	var mean = 0;
	for (var i = 0; i < c.v.length; i++) mean += c.v[i] * c.w[i];
	mean /= sw;
	var sse = 0, sw2 = 0;
	for (var j = 0; j < c.v.length; j++) {
		var d = c.v[j] - mean;
		sse += c.w[j] * d * d;
		sw2 += c.w[j] * c.w[j];
	}
	var denom = sw - (sw2 / sw);
	if (denom <= 0) return 0;
	return sse / denom;
}

export function weightedStdDev(values, weights) {
	var varc = weightedVariance(values, weights);
	return (varc === null) ? null : Math.sqrt(varc);
}

// Cuantil ponderado por el método de posiciones acumuladas centradas (Hazen).
// Con pesos iguales reproduce el cuantil clásico (tipo 7 / interpolación lineal).
// q en [0,1]. Devuelve null si no hay datos.
export function weightedQuantile(values, weights, q) {
	var c = clean(values, weights);
	if (c.v.length === 0) return null;
	if (c.v.length === 1) return c.v[0];

	// Ordena por valor manteniendo el peso.
	var pairs = c.v.map(function (val, i) { return { val: val, w: c.w[i] }; });
	pairs.sort(function (a, b) { return a.val - b.val; });

	var sw = 0;
	for (var i = 0; i < pairs.length; i++) sw += pairs[i].w;
	if (sw === 0) return null;

	// Posición acumulada "centrada": a cada punto le corresponde el punto medio
	// de su tramo de peso, normalizado por el peso total. Esto hace que, con
	// pesos iguales, el k-ésimo de n puntos quede en (k - 0.5)/n... pero para
	// reproducir el cuantil tipo 7 clásico usamos la convención de posiciones
	// p_i = (cumBefore + cum)/2 / sw escalado a [0,1] sobre los centros.
	var positions = [];
	var cum = 0;
	for (var j = 0; j < pairs.length; j++) {
		var before = cum;
		cum += pairs[j].w;
		positions.push((before + cum) / 2 / sw);   // centro del tramo, en [0,1]
	}

	// Fuera de rango: clamp a los extremos.
	if (q <= positions[0]) return pairs[0].val;
	if (q >= positions[positions.length - 1]) return pairs[pairs.length - 1].val;

	// Interpola linealmente entre los dos centros que rodean a q.
	for (var k = 1; k < positions.length; k++) {
		if (q <= positions[k]) {
			var p0 = positions[k - 1], p1 = positions[k];
			var frac = (p1 === p0) ? 0 : (q - p0) / (p1 - p0);
			return pairs[k - 1].val + frac * (pairs[k].val - pairs[k - 1].val);
		}
	}
	return pairs[pairs.length - 1].val;
}

export function weightedMedian(values, weights) {
	return weightedQuantile(values, weights, 0.5);
}

// Resumen descriptivo ponderado de una serie.
export function describe(values, weights) {
	var c = clean(values, weights);
	var n = c.v.length;
	if (n === 0) {
		return { n: 0, sumWeights: 0, mean: null, stdDev: null, min: null, max: null,
				 q1: null, median: null, q3: null, iqr: null, missing: values.length };
	}
	var minV = c.v[0], maxV = c.v[0];
	for (var i = 1; i < c.v.length; i++) {
		if (c.v[i] < minV) minV = c.v[i];
		if (c.v[i] > maxV) maxV = c.v[i];
	}
	var q1 = weightedQuantile(values, weights, 0.25);
	var q3 = weightedQuantile(values, weights, 0.75);
	return {
		n: n,
		sumWeights: sum(c.w),
		mean: weightedMean(values, weights),
		stdDev: weightedStdDev(values, weights),
		min: minV,
		max: maxV,
		q1: q1,
		median: weightedMedian(values, weights),
		q3: q3,
		iqr: (q1 != null && q3 != null) ? (q3 - q1) : null,
		missing: values.length - n
	};
}

// ── Covarianza y correlación ponderadas ───────────────────────────────────────

export function weightedCovariance(xs, ys, weights) {
	var c = cleanPair(xs, ys, weights);
	if (c.x.length < 2) return null;
	var sw = sum(c.w);
	if (sw === 0) return null;
	var mx = 0, my = 0;
	for (var i = 0; i < c.x.length; i++) { mx += c.x[i] * c.w[i]; my += c.y[i] * c.w[i]; }
	mx /= sw; my /= sw;
	var acc = 0;
	for (var j = 0; j < c.x.length; j++) acc += c.w[j] * (c.x[j] - mx) * (c.y[j] - my);
	return acc / sw;
}

// Correlación de Pearson ponderada. Devuelve { r, n, df } o null.
export function weightedPearson(xs, ys, weights) {
	var c = cleanPair(xs, ys, weights);
	if (c.x.length < 3) {
		return c.x.length >= 2
			? { r: pearsonRaw(c.x, c.y, c.w), n: c.x.length, df: c.x.length - 2 }
			: null;
	}
	return { r: pearsonRaw(c.x, c.y, c.w), n: c.x.length, df: c.x.length - 2 };
}

function pearsonRaw(x, y, w) {
	var sw = sum(w);
	if (sw === 0) return null;
	var mx = 0, my = 0;
	for (var i = 0; i < x.length; i++) { mx += x[i] * w[i]; my += y[i] * w[i]; }
	mx /= sw; my /= sw;
	var sxy = 0, sxx = 0, syy = 0;
	for (var j = 0; j < x.length; j++) {
		var dx = x[j] - mx, dy = y[j] - my;
		sxy += w[j] * dx * dy;
		sxx += w[j] * dx * dx;
		syy += w[j] * dy * dy;
	}
	if (sxx === 0 || syy === 0) return null;
	return sxy / Math.sqrt(sxx * syy);
}

// Correlación de Spearman ponderada: Pearson sobre rangos ponderados.
// Los rangos se calculan con "fractional ranking" que incorpora el peso
// (cada observación ocupa un tramo proporcional a su peso).
export function weightedSpearman(xs, ys, weights) {
	var c = cleanPair(xs, ys, weights);
	if (c.x.length < 2) return null;
	var rx = weightedRanks(c.x, c.w);
	var ry = weightedRanks(c.y, c.w);
	return { r: pearsonRaw(rx, ry, c.w), n: c.x.length, df: c.x.length - 2 };
}

// Rangos ponderados: cada elemento recibe el peso acumulado hasta su centro.
// Empates reciben el rango medio del grupo.
function weightedRanks(values, weights) {
	var idx = values.map(function (v, i) { return i; });
	idx.sort(function (a, b) { return values[a] - values[b]; });
	var ranks = new Array(values.length);
	var cum = 0;
	var i = 0;
	while (i < idx.length) {
		var j = i;
		// Agrupa empates.
		while (j + 1 < idx.length && values[idx[j + 1]] === values[idx[i]]) j++;
		// Peso del grupo y centro.
		var groupW = 0;
		for (var k = i; k <= j; k++) groupW += weights[idx[k]];
		var center = cum + groupW / 2;
		for (var m = i; m <= j; m++) ranks[idx[m]] = center;
		cum += groupW;
		i = j + 1;
	}
	return ranks;
}

// Significancia aproximada de un r de Pearson/Spearman vía t de Student.
// Devuelve el p-valor a dos colas (aproximación, sin tabla t exacta).
export function correlationPValue(r, n) {
	if (r === null || n === null || n < 3) return null;
	if (Math.abs(r) >= 1) return 0;
	var df = n - 2;
	var t = r * Math.sqrt(df / (1 - r * r));
	return studentTwoTailP(Math.abs(t), df);
}

// ── Regresión lineal ponderada (simple y múltiple) ────────────────────────────

// Regresión por mínimos cuadrados ponderados.
//   y: array dependiente
//   X: array de arrays (cada fila una observación, cada col una variable indep.)
//      sin la columna de intercepto: se agrega internamente.
//   weights: pesos por observación (opcional)
// Devuelve:
//   { coefficients: [b0, b1, ...], rSquared, adjRSquared, n, k,
//     stdErrors: [...], tValues: [...], pValues: [...], predict(xRow) }
export function weightedLinearRegression(y, X, weights) {
	// Empareja descartando filas con cualquier valor inválido.
	var rows = [];
	for (var i = 0; i < y.length; i++) {
		var yi = y[i];
		var xi = X[i];
		var wt = weights ? weights[i] : 1;
		if (!isNum(yi)) continue;
		if (!xi || xi.some(function (v) { return !isNum(v); })) continue;
		if (!isNum(wt) || wt < 0 || (weights && wt === 0)) continue;
		rows.push({ y: yi, x: [1].concat(xi), w: weights ? wt : 1 });
	}
	var n = rows.length;
	if (n === 0) return null;
	var k = rows[0].x.length;          // incluye intercepto
	if (n <= k) return null;           // sin grados de libertad suficientes

	// Ecuaciones normales ponderadas: A = XᵀWX (k×k), b = XᵀWy (k).
	var A = [], b = [];
	for (var r1 = 0; r1 < k; r1++) {
		A.push(new Array(k).fill(0));
		b.push(0);
	}
	for (var o = 0; o < n; o++) {
		var xr = rows[o].x, yr = rows[o].y, wr = rows[o].w;
		for (var a = 0; a < k; a++) {
			b[a] += wr * xr[a] * yr;
			for (var c = 0; c < k; c++) {
				A[a][c] += wr * xr[a] * xr[c];
			}
		}
	}

	var Ainv = invertMatrix(A);
	if (!Ainv) return null;            // colinealidad: matriz singular
	var coef = multiplyMatrixVector(Ainv, b);

	// R² ponderado.
	var sw = 0, my = 0;
	for (var p = 0; p < n; p++) { sw += rows[p].w; my += rows[p].w * rows[p].y; }
	my /= sw;
	var ssTot = 0, ssRes = 0;
	for (var q = 0; q < n; q++) {
		var pred = 0;
		for (var cc = 0; cc < k; cc++) pred += coef[cc] * rows[q].x[cc];
		var resid = rows[q].y - pred;
		ssRes += rows[q].w * resid * resid;
		var dt = rows[q].y - my;
		ssTot += rows[q].w * dt * dt;
	}
	var rSquared = (ssTot === 0) ? null : (1 - ssRes / ssTot);
	var adj = (ssTot === 0 || n - k <= 0) ? null : (1 - (1 - rSquared) * (n - 1) / (n - k));

	// Errores estándar: sigma² = ssRes / (n - k); var(β) = sigma² · Ainv.
	var sigma2 = ssRes / (n - k);
	var stdErrors = [], tValues = [], pValues = [];
	for (var d = 0; d < k; d++) {
		var se = Math.sqrt(Math.max(0, sigma2 * Ainv[d][d]));
		stdErrors.push(se);
		var tv = se === 0 ? null : coef[d] / se;
		tValues.push(tv);
		pValues.push(tv === null ? null : studentTwoTailP(Math.abs(tv), n - k));
	}

	return {
		coefficients: coef,
		rSquared: rSquared,
		adjRSquared: adj,
		n: n,
		k: k - 1,                       // variables independientes (sin intercepto)
		stdErrors: stdErrors,
		tValues: tValues,
		pValues: pValues,
		sigma: Math.sqrt(sigma2),
		predict: function (xRow) {
			var row = [1].concat(xRow);
			var acc = 0;
			for (var i = 0; i < row.length; i++) acc += coef[i] * row[i];
			return acc;
		}
	};
}

// Atajo para regresión simple ponderada (una variable independiente).
// Devuelve { slope, intercept, rSquared, r, n, slopeP } o null.
export function weightedSimpleRegression(xs, ys, weights) {
	var c = cleanPair(xs, ys, weights);
	if (c.x.length <= 2) return null;
	var reg = weightedLinearRegression(c.y, c.x.map(function (v) { return [v]; }), c.w);
	if (!reg) return null;
	var pear = pearsonRaw(c.x, c.y, c.w);
	return {
		intercept: reg.coefficients[0],
		slope: reg.coefficients[1],
		rSquared: reg.rSquared,
		r: pear,
		n: reg.n,
		slopeP: reg.pValues[1],
		predict: reg.predict
	};
}

// ── Modelo multinivel (random intercepts) ─────────────────────────────────────

// Ajuste simplificado de un modelo de interceptos aleatorios por grupo:
//   y_ij = α_j + Xβ + ε,  α_j ~ N(μ, τ²),  ε ~ N(0, σ²)
// Estima vía un esquema iterativo tipo EM. Pensado para INTERPRETABILIDAD
// (reporta el ICC y la variación entre grupos), no para inferencia exacta.
//   y: array dependiente
//   X: array de arrays de independientes (sin intercepto)
//   groups: array con el id de grupo de cada observación
//   weights: opcional
// Devuelve { fixed: [β0, β1...], tau2, sigma2, icc, nGroups, n } o null.
export function weightedMultilevelRegression(y, X, groups, weights, opts) {
	opts = opts || {};
	var maxIter = opts.maxIter || 50;
	var tol = opts.tol || 1e-6;

	// Limpieza conjunta.
	var rows = [];
	for (var i = 0; i < y.length; i++) {
		var yi = y[i], xi = X[i], gi = groups[i];
		var wt = weights ? weights[i] : 1;
		if (!isNum(yi) || gi === null || gi === undefined) continue;
		if (xi && xi.some(function (v) { return !isNum(v); })) continue;
		if (!isNum(wt) || wt < 0 || (weights && wt === 0)) continue;
		rows.push({ y: yi, x: xi || [], w: weights ? wt : 1, g: gi });
	}
	var n = rows.length;
	if (n === 0) return null;

	var groupIds = [];
	var groupIndex = {};
	rows.forEach(function (r) {
		if (!(r.g in groupIndex)) { groupIndex[r.g] = groupIds.length; groupIds.push(r.g); }
	});
	var J = groupIds.length;
	if (J < 2) return null;            // sin variación entre grupos no tiene sentido

	var p = rows[0].x.length;          // independientes (sin intercepto)

	// Inicialización: OLS ponderado plano para los efectos fijos.
	var Xmat = rows.map(function (r) { return r.x; });
	var base = weightedLinearRegression(rows.map(function (r) { return r.y; }), Xmat, rows.map(function (r) { return r.w; }));
	if (!base) {
		// Sin predictores (modelo nulo): solo intercepto.
		base = { coefficients: [weightedMean(rows.map(function (r) { return r.y; }), rows.map(function (r) { return r.w; }))] };
	}
	var beta = base.coefficients.slice();    // [b0, b1, ...]
	var tau2 = 1, sigma2 = 1;

	// Residuos marginales (y - Xβ), sin el efecto de grupo.
	function marginalResidual(r) {
		var pred = beta[0];
		for (var c = 0; c < p; c++) pred += beta[c + 1] * r.x[c];
		return r.y - pred;
	}

	var alpha = new Array(J).fill(0);
	var prevSigma2 = Infinity;

	for (var iter = 0; iter < maxIter; iter++) {
		// E-step: estimar α_j como shrinkage del promedio de residuos del grupo.
		var groupSumW = new Array(J).fill(0);
		var groupSumR = new Array(J).fill(0);
		rows.forEach(function (r) {
			var gi = groupIndex[r.g];
			var res = marginalResidual(r);
			groupSumW[gi] += r.w;
			groupSumR[gi] += r.w * res;
		});
		for (var jg = 0; jg < J; jg++) {
			var meanR = groupSumW[jg] > 0 ? groupSumR[jg] / groupSumW[jg] : 0;
			// Factor de shrinkage hacia 0 (media global) según fiabilidad del grupo.
			var shrink = tau2 / (tau2 + sigma2 / Math.max(groupSumW[jg], 1e-9));
			alpha[jg] = shrink * meanR;
		}

		// M-step: re-estimar efectos fijos con y* = y - α_grupo, vía OLS ponderado.
		var yStar = rows.map(function (r) { return r.y - alpha[groupIndex[r.g]]; });
		var fit = (p > 0)
			? weightedLinearRegression(yStar, Xmat, rows.map(function (r) { return r.w; }))
			: null;
		if (fit) {
			beta = fit.coefficients.slice();
		} else {
			beta[0] = weightedMean(yStar, rows.map(function (r) { return r.w; }));
		}

		// Actualizar componentes de varianza.
		var sse = 0, swTot = 0;
		rows.forEach(function (r) {
			var pred = beta[0] + alpha[groupIndex[r.g]];
			for (var c = 0; c < p; c++) pred += beta[c + 1] * r.x[c];
			var e = r.y - pred;
			sse += r.w * e * e;
			swTot += r.w;
		});
		sigma2 = sse / Math.max(swTot, 1e-9);

		var tauAcc = 0;
		for (var ja = 0; ja < J; ja++) tauAcc += alpha[ja] * alpha[ja];
		tau2 = tauAcc / Math.max(J - 1, 1);

		if (Math.abs(prevSigma2 - sigma2) < tol) break;
		prevSigma2 = sigma2;
	}

	var icc = (tau2 + sigma2) > 0 ? tau2 / (tau2 + sigma2) : null;

	return {
		fixed: beta,
		tau2: tau2,
		sigma2: sigma2,
		icc: icc,
		nGroups: J,
		n: n,
		groupEffects: groupIds.map(function (g, i) { return { group: g, effect: alpha[i] }; })
	};
}

// ── Matriz de correlación (NxN y 1xN) ──────────────────────────────────────────

// Matriz de correlación entre columnas. Recibe:
//   columns: [{ key, values: [...] }]
//   options: { method: 'pearson'|'spearman', weighting: { mode, weightByKey, weightsByCol } }
// El modo de ponderación 1: el peso de la celda (i,j) es el de la columna i
// (la "fila" de la matriz), lo que la vuelve asimétrica salvo pesos iguales.
//
// weightsByCol: { key: [pesos...] } pesos por columna (alineados a values).
// Si weighting.mode === 'off', no se ponderan.
// Si weighting.mode === 'external', usa weighting.externalWeights para todas.
export function correlationMatrix(columns, options) {
	options = options || {};
	var method = options.method === 'spearman' ? weightedSpearman : weightedPearson;
	var weighting = options.weighting || { mode: 'auto' };
	var n = columns.length;
	var matrix = [];

	for (var i = 0; i < n; i++) {
		var rowArr = [];
		for (var j = 0; j < n; j++) {
			if (i === j) {
				rowArr.push({ r: 1, n: null, p: null, self: true });
				continue;
			}
			var w = resolveWeights(columns, i, j, weighting);
			var res = method(columns[i].values, columns[j].values, w);
			var p = res ? correlationPValue(res.r, res.n) : null;
			rowArr.push(res ? { r: res.r, n: res.n, p: p } : { r: null, n: 0, p: null });
		}
		matrix.push(rowArr);
	}
	return {
		keys: columns.map(function (c) { return c.key; }),
		matrix: matrix,
		symmetric: weighting.mode === 'off' || weighting.mode === 'external'
	};
}

// Correlaciones 1×N: una columna de referencia contra las demás, ponderando
// por el peso de la referencia. Devuelve lista ordenable por |r|.
export function correlations1xN(refColumn, otherColumns, options) {
	options = options || {};
	var method = options.method === 'spearman' ? weightedSpearman : weightedPearson;
	var weighting = options.weighting || { mode: 'auto' };
	var out = [];
	for (var i = 0; i < otherColumns.length; i++) {
		var w = null;
		if (weighting.mode === 'off') w = null;
		else if (weighting.mode === 'external') w = weighting.externalWeights || null;
		else w = refColumn.weights || null;          // 'auto': peso de la referencia
		var res = method(refColumn.values, otherColumns[i].values, w);
		var p = res ? correlationPValue(res.r, res.n) : null;
		out.push({
			key: otherColumns[i].key,
			r: res ? res.r : null,
			n: res ? res.n : 0,
			p: p
		});
	}
	return out;
}

function resolveWeights(columns, i, j, weighting) {
	if (weighting.mode === 'off') return null;
	if (weighting.mode === 'external') return weighting.externalWeights || null;
	// 'auto': peso de la columna i (fila de la matriz).
	return columns[i].weights || null;
}

// ── Helpers numéricos ─────────────────────────────────────────────────────────

// Inversa por Gauss-Jordan. Devuelve null si es singular.
function invertMatrix(M) {
	var n = M.length;
	var A = M.map(function (row, i) {
		var r = row.slice();
		for (var j = 0; j < n; j++) r.push(i === j ? 1 : 0);
		return r;
	});
	for (var col = 0; col < n; col++) {
		// Pivoteo parcial.
		var pivot = col;
		for (var r = col + 1; r < n; r++) {
			if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
		}
		if (Math.abs(A[pivot][col]) < 1e-12) return null;
		var tmp = A[col]; A[col] = A[pivot]; A[pivot] = tmp;
		var pv = A[col][col];
		for (var c = 0; c < 2 * n; c++) A[col][c] /= pv;
		for (var rr = 0; rr < n; rr++) {
			if (rr === col) continue;
			var factor = A[rr][col];
			for (var cc = 0; cc < 2 * n; cc++) A[rr][cc] -= factor * A[col][cc];
		}
	}
	return A.map(function (row) { return row.slice(n); });
}

function multiplyMatrixVector(M, v) {
	return M.map(function (row) {
		var acc = 0;
		for (var i = 0; i < v.length; i++) acc += row[i] * v[i];
		return acc;
	});
}

// p-valor a dos colas de la t de Student por integración de la densidad
// (regla de Simpson). Suficientemente preciso para marcar significancia.
function studentTwoTailP(t, df) {
	if (df <= 0) return null;
	if (!isFinite(t)) return 0;
	// p(|T| > t) = 2 * (1 - CDF(t)). Integramos la densidad de 0 a t.
	var area = simpsonStudent(0, t, df, 200);
	var p = 2 * (0.5 - area);
	if (p < 0) p = 0;
	if (p > 1) p = 1;
	return p;
}

// Integra la densidad t de Student de a..b con n pasos (Simpson).
function simpsonStudent(a, b, df, steps) {
	if (steps % 2 === 1) steps++;
	var h = (b - a) / steps;
	var c = studentDensityConst(df);
	function f(x) { return c * Math.pow(1 + (x * x) / df, -(df + 1) / 2); }
	var s = f(a) + f(b);
	for (var i = 1; i < steps; i++) {
		s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
	}
	return (h / 3) * s;
}

// Constante de normalización de la densidad t: Γ((df+1)/2) / (√(df·π)·Γ(df/2)).
function studentDensityConst(df) {
	return Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2)) / Math.sqrt(df * Math.PI);
}

// log Γ por aproximación de Lanczos.
function logGamma(x) {
	var g = 7;
	var c = [
		0.99999999999980993, 676.5203681218851, -1259.1392167224028,
		771.32342877765313, -176.61502916214059, 12.507343278686905,
		-0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
	];
	if (x < 0.5) {
		return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
	}
	x -= 1;
	var a = c[0];
	var tt = x + g + 0.5;
	for (var i = 1; i < g + 2; i++) a += c[i] / (x + i);
	return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(tt) - tt + Math.log(a);
}

export default {
	weightedMean, weightedVariance, weightedStdDev,
	weightedQuantile, weightedMedian, describe,
	weightedCovariance, weightedPearson, weightedSpearman, correlationPValue,
	weightedLinearRegression, weightedSimpleRegression, weightedMultilevelRegression,
	correlationMatrix, correlations1xN
};
