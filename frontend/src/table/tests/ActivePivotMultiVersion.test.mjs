/*
 * Integración del modelo multi-censo con el auto-drill de ActivePivot.
 *
 * Reproduce el escenario del bug 2001/2010: dos censos seleccionados a la vez,
 * con jerarquías de nivel distintas. El drill debe ajustar CADA selección por su
 * propia geografía, de modo que ambas columnas queden en el nivel correcto.
 */

import { describe, it, expect, report } from './_harness.mjs';
import ActivePivot from '@/table/classes/ActivePivot.js';
import ActiveRoute from '@/table/classes/ActiveRoute.js';
import ActiveMultiselectedMetric from '@/table/classes/ActiveMultiselectedMetric.js';
import { makeMultiVersionProperties } from './fixtures-multiversion.mjs';

// Boundary simulado: su región declara con qué geografías tiene relación. Una
// relación vacía ([]) significa "no hay datos a ese nivel" → fuerza drill-down;
// ausente significa "relación no cargada" → no fuerza nada.
function fakeBoundary(relations) {
	return {
		SelectedVersion: function () {
			return { Selection: { Region: { GeographyRelations: relations } } };
		}
	};
}

function makeMetric() {
	return new ActiveMultiselectedMetric(makeMultiVersionProperties());
}

describe('Auto-drill por Selection (dos censos)', function () {
	it('cada censo arranca en su nivel 0 (Provincias)', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		m.Selections.forEach(function (sel) { expect(sel.levelName()).toBe('Provincias'); });
	});

	it('drill-down baja la selección cuyo nivel no tiene relación, por su geografía', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');     // 2010 y 2022 en Provincias
		var p = new ActivePivot();
		p.Metrics = [m];
		// Provincias-2010 (G10P) sin relación → debe bajar a Departamentos (G10D).
		// Provincias-2022 (G22P) con relación → se queda.
		p.AllBoundaries = function () {
			return [fakeBoundary({ 'G10P': [], 'G10D': [1], 'G22P': [1], 'G22R': [1] })];
		};
		var drilled = p.NeedAutoDrillDown();
		expect(drilled).toBe(true);
		var s2010 = m.Selections.filter(function (s) { return s.versionId() === '2010'; })[0];
		var s2022 = m.Selections.filter(function (s) { return s.versionId() === '2022'; })[0];
		expect(s2010.levelName()).toBe('Departamentos');
		expect(s2022.levelName()).toBe('Provincias');
	});

	it('GetTuples tras el drill refleja el nivel de cada censo (ambas columnas válidas)', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		var p = new ActivePivot();
		p.Metrics = [m];
		p.AllBoundaries = function () {
			return [fakeBoundary({ 'G10P': [], 'G10D': [1], 'G22P': [1] })];
		};
		p.NeedAutoDrillDown();
		var tuples = m.GetTuples();
		// Una tupla (total) por censo, cada una con su nivel resuelto.
		var byVersion = {};
		tuples.forEach(function (t) { byVersion[t.versionId] = t; });
		expect(byVersion['2010'].levelName).toBe('Departamentos');
		expect(byVersion['2022'].levelName).toBe('Provincias');
		// Ambas con su variable lógica intacta.
		expect(byVersion['2010'].variableName).toBe('Hogares con NBI');
		expect(byVersion['2022'].variableName).toBe('Hogares con NBI');
	});

	it('drill-up sube la selección cuando todas las regiones tienen relación con el padre', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI', ['2010']);
		m.Selections[0].moveToLevelNamed('Departamentos');   // arranca abajo
		var p = new ActivePivot();
		p.Metrics = [m];
		// El padre de Departamentos es Provincias (G10P); con relación → puede subir.
		p.AllBoundaries = function () {
			return [fakeBoundary({ 'G10P': [1], 'G10D': [1] })];
		};
		var up = p.CanAutoDrillUp();
		expect(up).toBe(true);
		expect(m.Selections[0].levelName()).toBe('Provincias');
	});
});

describe('Serialización de columna (round-trip)', function () {
	it('_columnSection → applyColumnState conserva censos, nivel y categorías', function () {
		// Origen: NBI en 2010 (Departamentos, una categoría) y 2022.
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		var s2010 = m.Selections.filter(function (s) { return s.versionId() === '2010'; })[0];
		s2010.moveToLevelNamed('Departamentos');
		s2010.labels = [s2010.variable.ValueLabels[0].Id];

		var p = new ActivePivot();
		var route = new ActiveRoute(p);
		var col = route._columnSection(m);

		expect(col.versionIds).toEqual(['2010', '2022']);

		// Destino: aplica el estado serializado a un metric nuevo.
		var m2 = makeMetric();
		p.applyColumnState(m2, col);
		expect(m2.Selections.length).toBe(2);
		var d2010 = m2.Selections.filter(function (s) { return s.versionId() === '2010'; })[0];
		expect(d2010.levelName()).toBe('Departamentos');
		expect(d2010.labels.length).toBe(1);
	});

	it('aplicar un censo que ya no existe lo descarta, sin romper', function () {
		var m = makeMetric();
		var p = new ActivePivot();
		// Discapacidad solo existe en 2010; pedir 2022 no debe agregarlo.
		p.applyColumnState(m, {
			id: 7, versionIds: ['2010', '2022'],
			levelId: 'L10D',
			variableId: 1030,   // Discapacidad en 2010-Departamentos
			summary: 'P', selection: null
		});
		expect(m.Selections.length).toBe(1);
		expect(m.Selections[0].versionId()).toBe('2010');
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
