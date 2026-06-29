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
		expect(new ChartExporter(fakeContainer(0), 'X').hasCharts()).toBeFalsy();
	});
	it('hasCharts es verdadero con al menos un SVG', function () {
		expect(new ChartExporter(fakeContainer(2), 'X').hasCharts()).toBeTruthy();
	});
	it('hasCharts es falso sin contenedor', function () {
		expect(new ChartExporter(null, 'X').hasCharts()).toBeFalsy();
	});
});

describe('ChartExporter — nombre de archivo', function () {
	it('deriva el nombre del título, saneando caracteres', function () {
		var ex = new ChartExporter(fakeContainer(1), 'Población — NBI (%)');
		expect(ex._filename('svg')).toBe('Poblaci_n_NBI.svg');
	});
	it('usa un nombre por defecto si el título queda vacío', function () {
		var ex = new ChartExporter(fakeContainer(1), '###');
		expect(ex._filename('png')).toBe('grafico.png');
	});
	it('respeta guiones y alfanuméricos', function () {
		var ex = new ChartExporter(fakeContainer(1), 'tasa-2010');
		expect(ex._filename('svg')).toBe('tasa-2010.svg');
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
