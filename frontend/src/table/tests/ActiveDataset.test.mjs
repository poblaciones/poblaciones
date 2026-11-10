/*
 * ActiveDataset.test.mjs — pruebas de la vista plana de resultados.
 *
 *     node --import ./tests/_register-alias.mjs tests/ActiveDataset.test.mjs
 *
 * Se arma un "pivot" mínimo (MetricTuples + Rows con la forma que produce
 * RefreshData) y se proyecta con ActiveDataset, sin depender del pipeline real.
 */

import { describe, it, expect, report } from './_harness.mjs';
import ActiveDataset from '@/table/classes/ActiveDataset.js';

// Tuple de columna con la forma mínima que consume ActiveDataset.
function tuple(over) {
	return Object.assign({
		key: 'k', metricId: 1, metricName: 'Pob', variableName: '', labelName: '',
		versionName: '2010', versionId: 2010, levelId: 5, levelName: 'Prov',
		variableId: 0, labelId: null, isTotal: false, isEmpty: false,
		metric: {}, variable: { Decimals: 0 }, summary: 'N',
		level: { HasArea: false }
	}, over || {});
}

// Celda con ComputedValue (lo que ResolveCell deja en cada celda).
function cell(value, total) {
	return { Value: value, Total: total, Area: null, ComputedValue: value };
}

// Pivot mínimo: dos columnas (un total de población, una categoría educativa) y
// dos filas del nivel de análisis bajo el encabezado de nivel.
function fakePivot() {
	var tuples = [
		tuple({ key: 'pob', metricName: 'Población', summary: 'N', isTotal: true }),
		tuple({ key: 'edu', metricName: 'Nivel educativo', variableName: 'Nivel', labelName: '0 a 5%', summary: 'P' })
	];
	var level = { boundary: { Id: 7, Name: 'Provincias' }, parentItem: null };
	var header = [{ Label: 'Provincias (2)', isHeader: true, isLevelHeader: true, boundaryId: 7, level: level, depth: 0 }, cell(100), cell(40)];
	var rowA = [{ Label: 'Buenos Aires', FID: 1, isHeader: true, isItem: true, inAnalysis: true, boundaryId: 7, level: level, depth: 1 }, cell(60), cell(25)];
	var rowB = [{ Label: 'Córdoba', FID: 2, isHeader: true, isItem: true, inAnalysis: true, boundaryId: 7, level: level, depth: 1 }, cell(40), cell(15)];
	return {
		MetricTuples: { metricTuples: tuples },
		Rows: [header, rowA, rowB],
		RowTree: { SelectionLeaves: function () { return []; } }
	};
}

describe('ActiveDataset — estructura', function () {
	it('expone columns públicas sin campos internos', function () {
		var ds = new ActiveDataset(fakePivot());
		expect(ds.columns).toHaveLength(2);
		expect(ds.columns[0].key).toBe('pob');
		expect(ds.columns[0]._columnIndex === undefined).toBeTruthy(); // interno, no se expone
	});
	it('clasifica filas por tipo', function () {
		var ds = new ActiveDataset(fakePivot());
		expect(ds.levelHeaders()).toHaveLength(1);
		expect(ds.dataRows()).toHaveLength(2);
	});
	it('alinea values[] por índice de columna', function () {
		var ds = new ActiveDataset(fakePivot());
		var rows = ds.dataRows();
		expect(rows[0].label).toBe('Buenos Aires');
		expect(rows[0].values[0]).toBe(60); // pob
		expect(rows[0].values[1]).toBe(25); // edu
	});
	it('regionTypes lista la delimitación de las filas analizadas', function () {
		var ds = new ActiveDataset(fakePivot());
		expect(ds.regionTypes).toHaveLength(1);
		expect(ds.regionTypes[0]).toBe('Provincias');
	});
});

describe('ActiveDataset — filas fuera del nivel de análisis', function () {
	it('un elemento de otro nivel se lista como item y no entra en dataRows', function () {
		var pivot = fakePivot();
		pivot.Rows[2][0].inAnalysis = false;
		var ds = new ActiveDataset(pivot);
		expect(ds.dataRows()).toHaveLength(1);
		expect(ds.rows[2].type).toBe('item');
	});
	it('el parentLabel es el elemento del que cuelga el nivel', function () {
		var pivot = fakePivot();
		var child = { boundary: { Id: 9, Name: 'Municipios' }, parentItem: { FID: 1, Caption: 'Buenos Aires' } };
		pivot.Rows.push([{ Label: 'Tandil', FID: 50, isHeader: true, isItem: true, inAnalysis: false, boundaryId: 9, level: child, depth: 3 }, cell(5), cell(1)]);
		var ds = new ActiveDataset(pivot);
		expect(ds.rows[3].parentLabel).toBe('Buenos Aires');
		expect(ds.rows[3].levelCaption).toBe('Municipios');
	});
});

describe('ActiveDataset — búsquedas y frames', function () {
	it('column y columnIndex ubican por clave', function () {
		var ds = new ActiveDataset(fakePivot());
		expect(ds.columnIndex('edu')).toBe(1);
		expect(ds.column('edu').key).toBe('edu');
		expect(ds.columnIndex('nope')).toBe(-1);
	});
	it('numericFrame arma la matriz densa de valores', function () {
		var ds = new ActiveDataset(fakePivot());
		var frame = ds.numericFrame();
		expect(frame.keys).toHaveLength(2);
		expect(frame.rows).toHaveLength(2);     // dos filas de datos
		expect(frame.rows[0]).toHaveLength(2);  // dos columnas
		expect(frame.rows[1][0]).toBe(40);      // Córdoba, pob
	});
	it('weightedFrame proyecta respecto de una columna de referencia', function () {
		var ds = new ActiveDataset(fakePivot());
		var wf = ds.weightedFrame('pob');
		expect(wf.refKey).toBe('pob');
		expect(wf.otherKeys).toHaveLength(1);
		expect(wf.rows[0].ref).toBe(60);
	});
});

describe('ActiveDataset — vista de columnas de análisis', function () {
	it('expone Columns como AnalysisColumns montado sobre el dataset', function () {
		var ds = new ActiveDataset(fakePivot());
		expect(typeof ds.Columns).toBe('object');
		expect(ds.Columns.all()).toHaveLength(2);
		expect(ds.Columns.byKey('edu').key).toBe('edu');
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
