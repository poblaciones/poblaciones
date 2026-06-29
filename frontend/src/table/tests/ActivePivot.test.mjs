/*
 * ActivePivot.test.mjs — pruebas del modelo del pivot (sort, orden de métricas,
 * specs y caché de datos por versión-nivel).
 *
 * Usa el alias y stubs del proyecto:
 *     node --import ./tests/_register-alias.mjs tests/ActivePivot.test.mjs
 *
 * Las métricas se simulan con un stub que expone GetTuples(), que es la
 * única superficie que el pivot consume de una métrica para armar columnas.
 */

import { describe, it, expect, report } from './_harness.mjs';
import ActivePivot from '@/table/classes/ActivePivot.js';

// Métrica simulada: id + specs declaradas.
function fakeMetric(metricId, specs) {
	return {
		properties: { Metric: { Id: metricId, Name: 'M' + metricId } },
		GetTuples: function () { return specs; }
	};
}

function spec(metricId, key, versionId, levelId) {
	return { metricId: metricId, key: key, versionId: versionId, levelId: levelId, isEmpty: false, level: { Id: levelId } };
}

describe('ToggleSort / SortStateOf', function () {
	it('cicla sin orden → desc → asc → sin orden', function () {
		var p = new ActivePivot();
		p.MetricTuples.metricTuples = [spec(1, 'k1', 10, 5)];
		expect(p.MetricTuples.sortStateOf('k1')).toBeNull();
		p.MetricTuples.toggleSort('k1');
		expect(p.MetricTuples.sortStateOf('k1')).toBe('desc');
		p.MetricTuples.toggleSort('k1');
		expect(p.MetricTuples.sortStateOf('k1')).toBe('asc');
		p.MetricTuples.toggleSort('k1');
		expect(p.MetricTuples.sortStateOf('k1')).toBeNull();
	});
	it('al ordenar otra columna, la anterior queda sin orden', function () {
		var p = new ActivePivot();
		p.MetricTuples.metricTuples = [spec(1, 'k1', 10, 5), spec(2, 'k2', 10, 5)];
		p.MetricTuples.toggleSort('k1');
		expect(p.MetricTuples.sortStateOf('k1')).toBe('desc');
		p.MetricTuples.toggleSort('k2');
		expect(p.MetricTuples.sortStateOf('k1')).toBeNull();
		expect(p.MetricTuples.sortStateOf('k2')).toBe('desc');
	});
	it('resuelve metricId a la key de su spec', function () {
		var p = new ActivePivot();
		p.MetricTuples.metricTuples = [spec(7, 'k7|c:total', 10, 5)];
		p.MetricTuples.toggleSort(7);  // por metricId
		expect(p.MetricTuples.sortStateOf('k7|c:total')).toBe('desc');
	});
});

describe('MoveMetric', function () {
	it('reordena el array de métricas', function () {
		var p = new ActivePivot();
		var a = fakeMetric(1, []), b = fakeMetric(2, []), c = fakeMetric(3, []);
		p.Metrics = [a, b, c];
		var ok = p.MoveMetric(0, 2);   // a al final
		expect(ok).toBeTruthy();
		expect(p.Metrics[0]).toBe(b);
		expect(p.Metrics[1]).toBe(c);
		expect(p.Metrics[2]).toBe(a);
	});
	it('no hace nada si from === to', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, []), fakeMetric(2, [])];
		expect(p.MoveMetric(1, 1)).toBeFalsy();
	});
	it('ignora índices fuera de rango', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, [])];
		expect(p.MoveMetric(0, 5)).toBeFalsy();
	});
});

describe('RebuildColumnSpecs', function () {
	it('arma las specs concatenando las de cada métrica', function () {
		var p = new ActivePivot();
		p.Metrics = [
			fakeMetric(1, [spec(1, 'k1', 10, 5)]),
			fakeMetric(2, [spec(2, 'k2a', 10, 5), spec(2, 'k2b', 10, 5)])
		];
		p.MetricTuples.rebuild();
		expect(p.MetricTuples.metricTuples).toHaveLength(3);
		expect(p.MetricTuples.metricTuples[0].key).toBe('k1');
		expect(p.MetricTuples.metricTuples[2].key).toBe('k2b');
	});
});

describe('caché de datos (manager Data)', function () {
	it('el constructor compone el manager Data vacío', function () {
		var p = new ActivePivot();
		expect(typeof p.Data).toBe('object');
		expect(p.Data.itemsFor(2010, 5)).toBeNull();
	});
	it('itemsFor indexa por (versionId, levelId) sin pisar entre versiones', function () {
		var p = new ActivePivot();
		// Simula dos versiones que comparten el mismo level (mismo levelId).
		p.Data._byVersionLevel['2010:5'] = [{ Value: 89.7 }];
		p.Data._byVersionLevel['2022:5'] = [{ Value: 42.3 }];
		expect(p.Data.itemsFor(2010, 5)[0].Value).toBe(89.7);
		expect(p.Data.itemsFor(2022, 5)[0].Value).toBe(42.3);
	});
	it('invalidateVersion borra solo las claves de esa versión', function () {
		var p = new ActivePivot();
		p.Data._byVersionLevel['2010:5'] = [{ Value: 1 }];
		p.Data._byVersionLevel['2010:6'] = [{ Value: 2 }];
		p.Data._byVersionLevel['2022:5'] = [{ Value: 3 }];
		p.Data.invalidateVersion(2010);
		expect(p.Data.itemsFor(2010, 5)).toBeNull();
		expect(p.Data.itemsFor(2010, 6)).toBeNull();
		expect(p.Data.itemsFor(2022, 5)[0].Value).toBe(3);
	});
	it('load resuelve y cachea los datos de cada (versión, nivel) único', async function () {
		var p = new ActivePivot();
		var store = { GetMetricData: function (m, v, l) { return Promise.resolve([{ tag: v + ':' + l.Id }]); } };
		var lvl5 = { Id: 5 };
		p.MetricTuples.metricTuples = [
			{ isEmpty: false, level: lvl5, versionId: 2010, levelId: 5, metric: { Store: store }, version: 2010 },
			{ isEmpty: false, level: lvl5, versionId: 2010, levelId: 5, metric: { Store: store }, version: 2010 }, // dup
			{ isEmpty: false, level: lvl5, versionId: 2022, levelId: 5, metric: { Store: store }, version: 2022 }
		];
		await p.Data.load();
		// Dos claves únicas pese a tres specs (una es duplicada).
		expect(p.Data.itemsFor(2010, 5)[0].tag).toBe('2010:5');
		expect(p.Data.itemsFor(2022, 5)[0].tag).toBe('2022:5');
	});
});

describe('Clear', function () {
	it('vacía specs, filas, filtros, regiones y métricas', function () {
		var p = new ActivePivot();
		p.MetricTuples.headers = [1]; p.Rows = [1]; p.FilterSet.items = [1]; p.Regions.items = [1]; p.Metrics = [1];
		p.Clear();
		expect(p.MetricTuples.headers).toHaveLength(0);
		expect(p.Rows).toHaveLength(0);
		expect(p.FilterSet.items).toHaveLength(0);
		expect(p.Regions.items).toHaveLength(0);
		expect(p.Metrics).toHaveLength(0);
	});
});

describe('manager Columns (API por objeto)', function () {
	it('GetById devuelve la primera spec de un indicador', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, [spec(1, 'k1', 10, 5)]), fakeMetric(2, [spec(2, 'k2', 10, 5)])];
		p.MetricTuples.rebuild();
		expect(p.MetricTuples.GetById(2).key).toBe('k2');
		expect(p.MetricTuples.GetById(99)).toBeNull();
	});
	it('byKey ubica por clave exacta', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, [spec(1, 'k1a', 10, 5), spec(1, 'k1b', 10, 5)])];
		p.MetricTuples.rebuild();
		expect(p.MetricTuples.byKey('k1b').key).toBe('k1b');
		expect(p.MetricTuples.byKey('nope')).toBeNull();
	});
	it('allById devuelve todas las specs de un indicador', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, [spec(1, 'k1a', 10, 5), spec(1, 'k1b', 10, 5)]), fakeMetric(2, [spec(2, 'k2', 10, 5)])];
		p.MetricTuples.rebuild();
		expect(p.MetricTuples.allById(1)).toHaveLength(2);
		expect(p.MetricTuples.allById(2)).toHaveLength(1);
	});
	it('rebuild puebla specs desde las métricas', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, [spec(1, 'k1', 10, 5)])];
		p.MetricTuples.rebuild();
		expect(p.MetricTuples.metricTuples).toHaveLength(1);
		expect(p.MetricTuples.metricTuples[0].key).toBe('k1');
	});
	it('totalColumns cuenta headers + columna de labels', function () {
		var p = new ActivePivot();
		p.MetricTuples.headers = [{}, {}, {}];
		expect(p.MetricTuples.totalColumns()).toBe(4);
	});
	it('clearSort quita el orden activo', function () {
		var p = new ActivePivot();
		p.MetricTuples.metricTuples = [spec(1, 'k1', 10, 5)];
		p.MetricTuples.toggleSort('k1');
		expect(p.MetricTuples.isSortedBy('k1')).toBeTruthy();
		p.MetricTuples.clearSort();
		expect(p.MetricTuples.isSortedBy('k1')).toBeFalsy();
		expect(p.MetricTuples.sortStateOf('k1')).toBeNull();
	});
	it('isSortedBy resuelve metricId además de key', function () {
		var p = new ActivePivot();
		p.MetricTuples.metricTuples = [spec(7, 'k7', 10, 5)];
		p.MetricTuples.toggleSort('k7');
		expect(p.MetricTuples.isSortedBy(7)).toBeTruthy(); // por metricId
	});
});

describe('GroupRowsByParent — subtotal con brecha (gap)', function () {
	it('el subtotal del corte de control suma el gap de los hijos y calcula el delta', function () {
		var p = new ActivePivot();
		var variable = { IsGap: true, NormalizationScale: 1 };
		// Una columna en modo incidencia con variable de brecha.
		p.MetricTuples.metricTuples = [{
			metricId: 1, key: 'k1', versionId: 10, levelId: 5, isEmpty: false,
			metric: { properties: { SummaryMetric: 'I' } }, variable: variable
		}];
		// Dos filas hijas del mismo padre, con datos de brecha.
		var rows = [
			[{ Label: 'A', FID: 1, Parent: 'P' }, { Value: 7090, Total: 17379, ValueGap: 6193, TotalGap: 18536 }],
			[{ Label: 'B', FID: 2, Parent: 'P' }, { Value: 3200, Total: 9000, ValueGap: 2800, TotalGap: 9500 }]
		];
		var grouped = p.GroupRowsByParent(rows);
		// La primera fila del resultado es el subtotal del grupo (isGroupHeader).
		var subtotal = grouped[0];
		expect(subtotal[0].isGroupHeader).toBe(true);
		var subCell = subtotal[1];
		// Sumó los dos universos de los hijos.
		expect(subCell.ValueGap).toBe(8993);
		expect(subCell.TotalGap).toBe(28036);
		// Y calculó el delta (no quedó en null/'-').
		expect(subCell.ComputedValue).toBeCloseTo(-17.7698, 3);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
