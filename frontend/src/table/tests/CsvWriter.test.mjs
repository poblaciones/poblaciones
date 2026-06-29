/*
 * CsvWriter.test.mjs — exportación a CSV.
 *
 *     node --import ./tests/_register-alias.mjs tests/CsvWriter.test.mjs
 *
 * Se prueba build() (puro); download() toca el DOM y queda fuera. displayCell se
 * resuelve con el stub de pivotValue (devuelve el valor de la celda).
 */

import { describe, it, expect, report } from './_harness.mjs';
import CsvWriter from '@/table/writers/CsvWriter.js';

function tuple(over) {
	return Object.assign({
		metric: {}, variable: {}, metricName: 'Pob', variableName: '',
		versionName: '2010', labelName: '', isTotal: false
	}, over || {});
}

function headerCell(label) { return { isHeader: true, Label: label }; }
function valueCell(v) { return { Value: v }; }

// Pivot falso: un indicador con dos tuplas (total y una categoría), un
// region-header y dos filas de datos.
function fakePivot() {
	var headers = [
		tuple({ metricName: 'Población', isTotal: true }),
		tuple({ metricName: 'Nivel educativo', variableName: 'Nivel', labelName: 'Primario' })
	];
	return {
		MetricTuples: { headers: headers },
		Rows: [
			[{ isHeader: true, isRegionHeader: true, Label: 'Provincias' }, headerCell('Provincias'), headerCell('')],
			[{ isHeader: true, Label: 'Buenos Aires' }, valueCell(100), valueCell(40)],
			[{ isHeader: true, Label: 'Córdoba, La Docta' }, valueCell(50), valueCell(20)]
		]
	};
}

describe('CsvWriter — grilla', function () {
	it('arma el encabezado aplanando las partes de cada tupla', function () {
		var grid = new CsvWriter(fakePivot()).grid();
		expect(grid.labelHeader).toBe('Regiones');
		expect(grid.columns).toHaveLength(2);
		expect(grid.columns[0].category).toBe('Total');
		expect(grid.columns[1].category).toBe('Primario');
	});
	it('clasifica el indentado por jerarquía', function () {
		var rows = new CsvWriter(fakePivot()).dataRows();
		expect(rows[0].indent).toBe(0);   // region-header
		expect(rows[0].bold).toBeTruthy();
		expect(rows[1].indent).toBe(1);   // item sin padre
	});
});

describe('CsvWriter — serialización', function () {
	it('produce una línea por fila, con encabezado primero', function () {
		var csv = new CsvWriter(fakePivot()).build();
		var lines = csv.split('\n');
		expect(lines).toHaveLength(4); // encabezado + 3 filas
		expect(lines[0]).toBe('Regiones,Población - Total - 2010,Nivel educativo - Nivel - Primario - 2010');
	});
	it('escapa los valores que contienen coma', function () {
		var csv = new CsvWriter(fakePivot()).build();
		var lines = csv.split('\n');
		// "Córdoba, La Docta" lleva coma → va entre comillas.
		expect(lines[3].indexOf('"Córdoba, La Docta"') === 0).toBeTruthy();
	});
	it('build vacío si el pivot no tiene filas', function () {
		var empty = { MetricTuples: { headers: [] }, Rows: [] };
		expect(new CsvWriter(empty).build()).toBe('');
	});
});

describe('CsvWriter — columna de código', function () {
	function pivotWithCodes() {
		var headers = [tuple({ metricName: 'Población', isTotal: true })];
		return {
			MetricTuples: { headers: headers },
			Rows: [
				[{ isHeader: true, isRegionHeader: true, Label: 'Provincias' }, headerCell('Provincias')],
				[{ isHeader: true, Label: 'Buenos Aires', Code: '06' }, valueCell(100)],
				[{ isHeader: true, Label: 'Córdoba', Code: '14' }, valueCell(50)]
			]
		};
	}
	it('expone el código de cada fila en dataRows', function () {
		var rows = new CsvWriter(pivotWithCodes()).dataRows();
		expect(rows[0].code).toBe('');   // encabezado de delimitación, sin código
		expect(rows[1].code).toBe('06');
		expect(rows[2].code).toBe('14');
	});
	it('agrega la columna Código primero cuando hay códigos', function () {
		var csv = new CsvWriter(pivotWithCodes()).build();
		var lines = csv.split('\n');
		expect(lines[0]).toBe('Código,Regiones,Población - Total - 2010');
		expect(lines[2]).toBe('06,Buenos Aires,100');
	});
	it('no agrega columna Código si ninguna fila lo trae', function () {
		var csv = new CsvWriter(fakePivot()).build();
		expect(csv.split('\n')[0].indexOf('Código') === -1).toBeTruthy();
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
