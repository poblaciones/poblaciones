/*
 * fixtures.mjs — datos fijos reutilizables para las pruebas.
 *
 * Centraliza los conjuntos de datos de ejemplo para no reinventarlos en cada
 * test. Incluye vectores con resultados conocidos (calculados a mano) y un
 * dataset mínimo que respeta el contrato de PivotDataset (columns + dataRows).
 */

// ── Vectores numéricos simples con estadísticos conocidos ────────────────────
// valores: 10,20,30,40,50,60 ; pesos uniformes
export var seriesUniform = {
	values: [10, 20, 30, 40, 50, 60],
	weights: [1, 1, 1, 1, 1, 1],
	// Conocidos (uniforme):
	mean: 35,
	min: 10,
	max: 60,
	// varianza poblacional ponderada = promedio de (x-35)^2 = 291.6667
	variancePop: 291.66666667
};

// valores con pesos no uniformes para verificar ponderación
export var seriesWeighted = {
	values: [10, 20, 15, 25],
	weights: [1000, 2000, 1500, 500],
	// media ponderada = (10*1000+20*2000+15*1500+25*500)/5000 = 85000/5000 = 17
	mean: 17
};

// Par correlacionado positivo perfecto (y = 2x) y negativo perfecto
export var pairs = {
	x: [1, 2, 3, 4, 5],
	yPos: [2, 4, 6, 8, 10],   // r = +1
	yNeg: [10, 8, 6, 4, 2],   // r = -1
	weights: [1, 1, 1, 1, 1]
};

// Tres columnas para matriz de correlación, con pesos que rompen la simetría.
export var corrColumns = [
	{ key: 'A', values: [10, 20, 30, 40, 50, 60], weights: [1, 1, 1, 1, 1, 1] },
	{ key: 'B', values: [12, 19, 33, 38, 52, 59], weights: [5, 1, 1, 1, 1, 1] },
	{ key: 'C', values: [60, 50, 40, 30, 20, 10], weights: [1, 1, 1, 1, 1, 1] }
];

// ── Dataset mínimo que respeta el contrato de PivotDataset ───────────────────
// Dos indicadores: "Población" (solo Total, conteo) y "Educación" (3 categorías
// + su Total). Una sola edición (2010). 4 regiones (provincias).
export function makeDataset() {
	var columns = [
		col('pob_total', 'N', { metricId: 1, metricName: 'Población', variableName: 'Conteo', labelName: null, isTotal: true, isSimpleCount: true, versionName: '2010', versionId: 11 }),
		col('edu_a', '%', { metricId: 2, metricName: 'Educación', variableName: 'Nivel educativo', labelName: '0 a 5%', isTotal: false, isSimpleCount: false, versionName: '2010', versionId: 11 }),
		col('edu_b', '%', { metricId: 2, metricName: 'Educación', variableName: 'Nivel educativo', labelName: '5 a 10%', isTotal: false, isSimpleCount: false, versionName: '2010', versionId: 11 }),
		col('edu_c', '%', { metricId: 2, metricName: 'Educación', variableName: 'Nivel educativo', labelName: '10 a 15%', isTotal: false, isSimpleCount: false, versionName: '2010', versionId: 11 }),
		col('edu_total', '%', { metricId: 2, metricName: 'Educación', variableName: 'Nivel educativo', labelName: 'Total', isTotal: true, isSimpleCount: false, versionName: '2010', versionId: 11 })
	];

	// values[] alineado por orden de columnas (0-based denso).
	var rows = [
		{ type: 'region-header', label: 'Provincias', parentLabel: null, values: [], weights: [] },
		dataRow('Buenos Aires', null, [15000000, 80, 12, 8, 100], [1, 1000, 1000, 1000, 1000]),
		dataRow('Córdoba', null, [3500000, 60, 25, 15, 100], [1, 2000, 2000, 2000, 2000]),
		dataRow('Santa Fe', null, [3200000, 70, 20, 10, 100], [1, 1500, 1500, 1500, 1500]),
		dataRow('Mendoza', null, [1900000, 50, 30, 20, 100], [1, 500, 500, 500, 500])
	];

	var dataset = {
		version: 1,
		title: 'Tabla de prueba',
		regionTypes: ['Provincias'],
		columns: columns,
		rows: rows
	};
	dataset.dataRows = function () {
		return rows.filter(function (r) { return r.type === 'data'; });
	};
	dataset.column = function (key) {
		return columns.find(function (c) { return c.key === key; }) || null;
	};
	dataset.columnIndex = function (key) {
		for (var i = 0; i < columns.length; i++) if (columns[i].key === key) return i;
		return -1;
	};
	return dataset;
}

function col(key, unit, meta) {
	return {
		key: key,
		label: meta.metricName + (meta.labelName ? ' — ' + meta.labelName : ''),
		shortLabel: meta.labelName || meta.variableName,
		unit: unit,
		role: 'measure',
		formatter: function (v) { return (Math.round(v * 100) / 100).toString(); },
		meta: meta
	};
}

function dataRow(label, parentLabel, values, weights) {
	return { type: 'data', label: label, parentLabel: parentLabel, values: values, weights: weights };
}

export default { seriesUniform, seriesWeighted, pairs, corrColumns, makeDataset };
