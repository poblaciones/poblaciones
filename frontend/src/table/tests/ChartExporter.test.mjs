/*
 * ChartExporter.test.mjs — parte testeable sin navegador.
 *
 * La composición del SVG y la descarga tocan el DOM (document, XMLSerializer,
 * canvas), que no existen en Node; quedan fuera. Se prueban la derivación del
 * nombre de archivo y la detección de gráficos con un contenedor simulado.
 *
 *     node --import ./tests/_register-alias.mjs tests/ChartExporter.test.mjs
 */

import { describe, it, expect, report } from './_harness.mjs';
import ChartExporter from '@/table/writers/ChartExporter.js';

// Contenedor simulado: querySelectorAll('svg') devuelve la lista dada.
function fakeContainer(svgCount) {
	var svgs = [];
	for (var i = 0; i < svgCount; i++) svgs.push({ tag: 'svg' });
	return {
		querySelectorAll: function (sel) { return sel === 'svg' ? svgs : []; }
	};
}

describe('ChartExporter — detección de gráficos', function () {
	it('hasCharts es falso sin SVGs', function () {
		expect(new ChartExporter(fakeContainer(0), { indicator: 'X' }).hasCharts()).toBeFalsy();
	});
	it('hasCharts es verdadero con al menos un SVG', function () {
		expect(new ChartExporter(fakeContainer(2), { indicator: 'X' }).hasCharts()).toBeTruthy();
	});
	it('hasCharts es falso sin contenedor', function () {
		expect(new ChartExporter(null, { indicator: 'X' }).hasCharts()).toBeFalsy();
	});
});

describe('ChartExporter — nombre de archivo', function () {
	it('combina indicador y variable, saneando caracteres', function () {
		var ex = new ChartExporter(fakeContainer(1), { indicator: 'Población', variable: 'NBI (%)' });
		expect(ex._filename('svg')).toBe('Poblaci_n_NBI.svg');
	});
	it('usa un nombre por defecto si el título queda vacío', function () {
		var ex = new ChartExporter(fakeContainer(1), { indicator: '###' });
		expect(ex._filename('png')).toBe('grafico.png');
	});
	it('respeta guiones y alfanuméricos', function () {
		var ex = new ChartExporter(fakeContainer(1), { indicator: 'tasa-2010' });
		expect(ex._filename('svg')).toBe('tasa-2010.svg');
	});
});

describe('ChartExporter — leyenda (helpers puros, sin DOM)', function () {
	it('_layoutLegend: todos los ítems entran en una fila si el ancho alcanza', function () {
		var legend = [{ name: 'A', color: '#a' }, { name: 'B', color: '#b' }];
		var ex = new ChartExporter(fakeContainer(1), { legend: legend });
		var rows = ex._layoutLegend(1000);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toHaveLength(2);
	});
	it('_layoutLegend: pasa a una segunda fila si no entran en el ancho', function () {
		var legend = [
			{ name: 'Categoría bastante larga uno', color: '#a' },
			{ name: 'Categoría bastante larga dos', color: '#b' },
			{ name: 'Categoría bastante larga tres', color: '#c' }
		];
		var ex = new ChartExporter(fakeContainer(1), { legend: legend });
		var rows = ex._layoutLegend(200);
		expect(rows.length > 1).toBeTruthy();
	});
	it('_layoutLegend: sin ítems, no hay filas', function () {
		var ex = new ChartExporter(fakeContainer(1), { legend: [] });
		expect(ex._layoutLegend(500)).toHaveLength(0);
	});
	it('_estimateTextWidth: crece con la longitud del texto y el tamaño de fuente', function () {
		var ex = new ChartExporter(fakeContainer(1), {});
		expect(ex._estimateTextWidth('abcdefgh', 11) > ex._estimateTextWidth('abcd', 11)).toBeTruthy();
		expect(ex._estimateTextWidth('abcd', 16) > ex._estimateTextWidth('abcd', 11)).toBeTruthy();
	});
});

describe('ChartExporter — opciones por defecto', function () {
	it('legend y sources quedan como arrays vacíos si no se pasan', function () {
		var ex = new ChartExporter(fakeContainer(1), { indicator: 'X' });
		expect(ex.legend).toHaveLength(0);
		expect(ex.sources).toHaveLength(0);
	});
	it('sources descarta entradas vacías/falsy', function () {
		var ex = new ChartExporter(fakeContainer(1), { sources: ['a', '', null, 'b'] });
		expect(ex.sources).toHaveLength(2);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
