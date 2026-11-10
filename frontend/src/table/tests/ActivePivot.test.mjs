/*
 * ActivePivot.test.mjs — pruebas del modelo del pivot (sort, orden de métricas,
 * tuples y caché de datos por versión-nivel).
 *
 * Usa el alias y stubs del proyecto:
 *     node --import ./tests/_register-alias.mjs tests/ActivePivot.test.mjs
 *
 * Las métricas se simulan con un stub que expone GetTuples(), que es la
 * única superficie que el pivot consume de una métrica para armar columnas.
 */

import { describe, it, expect, report } from './_harness.mjs';
import ActivePivot from '@/table/classes/ActivePivot.js';
import { makeTreePivot, withCountColumn, rowLabels } from './fixtures-hierarchy.mjs';

// Métrica simulada: id + tuples declaradas.
function fakeMetric(metricId, tuples) {
	return {
		properties: { Metric: { Id: metricId, Name: 'M' + metricId } },
		GetTuples: function () { return tuples; }
	};
}

function tuple(metricId, key, versionId, levelId) {
	return { metricId: metricId, key: key, versionId: versionId, levelId: levelId, isEmpty: false, level: { Id: levelId } };
}

describe('ToggleSort / SortStateOf', function () {
	it('cicla sin orden → desc → asc → sin orden', function () {
		var p = new ActivePivot();
		p.MetricTuples.metricTuples = [tuple(1, 'k1', 10, 5)];
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
		p.MetricTuples.metricTuples = [tuple(1, 'k1', 10, 5), tuple(2, 'k2', 10, 5)];
		p.MetricTuples.toggleSort('k1');
		expect(p.MetricTuples.sortStateOf('k1')).toBe('desc');
		p.MetricTuples.toggleSort('k2');
		expect(p.MetricTuples.sortStateOf('k1')).toBeNull();
		expect(p.MetricTuples.sortStateOf('k2')).toBe('desc');
	});
	it('resuelve metricId a la key de su tuple', function () {
		var p = new ActivePivot();
		p.MetricTuples.metricTuples = [tuple(7, 'k7|c:total', 10, 5)];
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

describe('RebuildColumnTuples', function () {
	it('arma las tuples concatenando las de cada métrica', function () {
		var p = new ActivePivot();
		p.Metrics = [
			fakeMetric(1, [tuple(1, 'k1', 10, 5)]),
			fakeMetric(2, [tuple(2, 'k2a', 10, 5), tuple(2, 'k2b', 10, 5)])
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
		var store = { GetMetricData: function (m, v, l) { return Promise.resolve({ Items: [{ tag: v + ':' + l.Id }] }); } };
		var lvl5 = { Id: 5 };
		p.MetricTuples.metricTuples = [
			{ isEmpty: false, level: lvl5, versionId: 2010, levelId: 5, metric: { Store: store }, version: 2010 },
			{ isEmpty: false, level: lvl5, versionId: 2010, levelId: 5, metric: { Store: store }, version: 2010 }, // dup
			{ isEmpty: false, level: lvl5, versionId: 2022, levelId: 5, metric: { Store: store }, version: 2022 }
		];
		await p.Data.load();
		// Dos claves únicas pese a tres tuples (una es duplicada).
		expect(p.Data.itemsFor(2010, 5)[0].tag).toBe('2010:5');
		expect(p.Data.itemsFor(2022, 5)[0].tag).toBe('2022:5');
	});
});

describe('Clear', function () {
	it('vacía tuples, filas, árbol de filas y métricas', function () {
		var p = makeTreePivot(1);
		p.RowTree.EnsureRoot();
		p.MetricTuples.headers = [1]; p.Rows = [1]; p.Metrics = [1];
		p.Clear();
		expect(p.MetricTuples.headers).toHaveLength(0);
		expect(p.Rows).toHaveLength(0);
		expect(p.RowTree.root).toBeNull();
		expect(p.Metrics).toHaveLength(0);
	});
});

describe('manager Columns (API por objeto)', function () {
	it('GetById devuelve la primera tuple de un indicador', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, [tuple(1, 'k1', 10, 5)]), fakeMetric(2, [tuple(2, 'k2', 10, 5)])];
		p.MetricTuples.rebuild();
		expect(p.MetricTuples.GetById(2).key).toBe('k2');
		expect(p.MetricTuples.GetById(99)).toBeNull();
	});
	it('byKey ubica por clave exacta', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, [tuple(1, 'k1a', 10, 5), tuple(1, 'k1b', 10, 5)])];
		p.MetricTuples.rebuild();
		expect(p.MetricTuples.byKey('k1b').key).toBe('k1b');
		expect(p.MetricTuples.byKey('nope')).toBeNull();
	});
	it('allById devuelve todas las tuples de un indicador', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, [tuple(1, 'k1a', 10, 5), tuple(1, 'k1b', 10, 5)]), fakeMetric(2, [tuple(2, 'k2', 10, 5)])];
		p.MetricTuples.rebuild();
		expect(p.MetricTuples.allById(1)).toHaveLength(2);
		expect(p.MetricTuples.allById(2)).toHaveLength(1);
	});
	it('rebuild puebla tuples desde las métricas', function () {
		var p = new ActivePivot();
		p.Metrics = [fakeMetric(1, [tuple(1, 'k1', 10, 5)])];
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
		p.MetricTuples.metricTuples = [tuple(1, 'k1', 10, 5)];
		p.MetricTuples.toggleSort('k1');
		expect(p.MetricTuples.isSortedBy('k1')).toBeTruthy();
		p.MetricTuples.clearSort();
		expect(p.MetricTuples.isSortedBy('k1')).toBeFalsy();
		expect(p.MetricTuples.sortStateOf('k1')).toBeNull();
	});
	it('isSortedBy resuelve metricId además de key', function () {
		var p = new ActivePivot();
		p.MetricTuples.metricTuples = [tuple(7, 'k7', 10, 5)];
		p.MetricTuples.toggleSort('k7');
		expect(p.MetricTuples.isSortedBy(7)).toBeTruthy(); // por metricId
	});
});

describe('RefreshData — filas por niveles', function () {
	it('arma el encabezado de la raíz y sus elementos', async function () {
		var p = makeTreePivot(1);
		p.RowTree.EnsureRoot();
		withCountColumn(p, { 10: { Value: 30, Total: 60 }, 11: { Value: 20, Total: 40 } });
		await p.RefreshData();
		expect(rowLabels(p)).toEqual(['Provincias (2)', 'Catamarca', 'Tucumán']);
		expect(p.Rows[0][0].isLevelHeader).toBe(true);
		expect(p.Rows[0][1].Value).toBe(50);
		expect(p.Rows[1][0].depth).toBe(1);
		expect(p.Rows[1][0].inAnalysis).toBe(true);
	});

	it('debajo de un elemento desplegado van sus tipos de hijo; uno colapsado muestra solo su encabezado, sin valores', async function () {
		var p = makeTreePivot(1);
		p.RowTree.EnsureRoot();
		var catamarca = p.RowTree.root.FindItem(10);
		p.RowTree.root.RestrictTo(catamarca);
		p.RowTree.root.Types(catamarca)[0].ToggleOpen();   // Municipios abierto
		withCountColumn(p, { 10: { Value: 30, Total: 60 }, 20: { Value: 12, Total: 20 }, 21: { Value: 8, Total: 15 }, 30: { Value: 29, Total: 58 } });
		await p.RefreshData();
		// Los tipos colapsados se listan con su cantidad de elementos, aunque no
		// tengan datos: sus valores se calculan recién al abrirlos.
		expect(rowLabels(p)).toEqual(['Provincias (1 de 2)', 'Catamarca', 'Municipios (2)', 'Belén', 'Andalgalá',
			'Departamentos (1)', 'Aglomerados (1)']);
		expect(p.Rows[5][1]).toBeNull();
		// El total de Municipios es la suma de los municipios, que puede no
		// coincidir con la provincia (cobertura parcial).
		expect(p.Rows[2][1].Value).toBe(20);
		expect(p.Rows[1][0].forced).toBe(true);
		// El nivel de análisis es el único tipo abierto.
		expect(p.Rows[3][0].inAnalysis).toBe(true);
		expect(p.Rows[1][0].inAnalysis).toBe(false);
	});

	it('oculta los elementos sin datos, salvo los desplegados con filas debajo', async function () {
		var p = makeTreePivot(1);
		p.RowTree.EnsureRoot();
		var tucuman = p.RowTree.root.FindItem(11);
		p.RowTree.root.ToggleItem(tucuman);
		p.RowTree.root.Types(tucuman)[0].ToggleOpen();   // Municipios de Tucumán
		withCountColumn(p, { 10: { Value: 30, Total: 60 }, 22: { Value: 4, Total: 9 } });
		await p.RefreshData();
		expect(rowLabels(p)).toEqual(['Provincias (2)', 'Catamarca', 'Tucumán', 'Municipios (1)', 'Tafí Viejo',
			'Departamentos (1)', 'Aglomerados (1)']);
		expect(p.Rows[2][0].open).toBe(true);
	});

	it('un elemento desplegado sin datos, y sin elementos con datos debajo, no se lista', async function () {
		var p = makeTreePivot(1);
		p.RowTree.EnsureRoot();
		p.RowTree.root.ToggleItem(p.RowTree.root.FindItem(11));
		withCountColumn(p, { 10: { Value: 30, Total: 60 } });
		await p.RefreshData();
		expect(rowLabels(p)).toEqual(['Provincias (1)', 'Catamarca']);
	});

	it('el total del encabezado suma la brecha de sus elementos y calcula el delta', async function () {
		var p = makeTreePivot(1);
		p.RowTree.EnsureRoot();
		withCountColumn(p, {
			10: { Value: 7090, Total: 17379, ValueGap: 6193, TotalGap: 18536 },
			11: { Value: 3200, Total: 9000, ValueGap: 2800, TotalGap: 9500 }
		}, { summary: 'I', variable: { IsGap: true, NormalizationScale: 1 } });
		await p.RefreshData();
		var total = p.Rows[0][1];
		expect(total.ValueGap).toBe(8993);
		expect(total.TotalGap).toBe(28036);
		expect(total.ComputedValue).toBeCloseTo(-17.7698, 3);
	});
});

describe('ResolveAllCategories — incidencia sobre el total propio', function () {
	it('calcula la incidencia de la categoría sobre SU total, no sobre el universo', function () {
		// "65% y más": Value 6880 sobre su Total propio 10000 = 68.8%. El total del
		// universo es 96900: si se usara como denominador, daría 7.1% (el bug).
		var p = Object.create(ActivePivot.prototype);
		p.RowTree = { AnalysisEntries: function () { return [{ region: {}, item: { Caption: 'Depto X', FID: 1 } }]; } };
		p._categoryTuples = function () {
			return {
				base: { summary: 'I', variable: { NormalizationScale: 100 }, level: 0, levelId: 0, versionId: 11, variableId: 1 },
				tuples: [ { tuple: { labelId: 103 }, labelId: 103, name: '65% y más', color: '#a' } ],
				totalTuple: { labelId: null, isTotal: true }
			};
		};
		p.ResolveCell = function (tuple) {
			if (tuple.isTotal) return { Empty: false, Value: 6880, Total: 96900 };
			return { Empty: false, Value: 6880, Total: 10000 };
		};
		var res = p.ResolveAllCategories(2, 11);
		expect(res).toHaveLength(1);
		expect(res[0].value).toBeCloseTo(68.8, 1);
	});
});


describe('ResolveAllCategories — incidencia con celdas sin valor', function () {
	it('saltea las celdas sin valor en vez de hundir el promedio', function () {
		// Dos regiones; la categoría tiene dato en una (Value 84 sobre Total 100 →
		// 84%) y '-' en la otra (Value null, pero con Total). Antes, el Total de la
		// celda vacía entraba al denominador y la incidencia caía a ~42%/casi 0. Debe
		// dar 84%.
		var p = Object.create(ActivePivot.prototype);
		var items = [{ Caption: 'Santiago', FID: 1 }, { Caption: 'Catamarca', FID: 2 }];
		p.RowTree = { AnalysisEntries: function () {
			return items.map(function (item) { return { region: {}, item: item }; });
		} };
		p._categoryTuples = function () {
			return {
				base: { summary: 'I', variable: { NormalizationScale: 100 }, level: 0, levelId: 0, versionId: 11, variableId: 1 },
				tuples: [ { tuple: { labelId: 201 }, labelId: 201, name: 'Menor que 85%', color: '#a' } ],
				totalTuple: { labelId: null, isTotal: true }
			};
		};
		p.ResolveCell = function (tuple, region, item) {
			if (tuple.isTotal) return { Empty: false, Value: 100, Total: 100 };
			// La categoría: Santiago tiene 84/100; Catamarca no tiene dato (Value null).
			if (item && item.FID === 1) return { Empty: false, Value: 84, Total: 100 };
			return { Empty: false, Value: null, Total: 100 };
		};
		var res = p.ResolveAllCategories(2, 11);
		expect(res).toHaveLength(1);
		expect(res[0].value).toBeCloseTo(84, 1);
	});
});


describe('ResolveAllCategoriesByRegion — % de área (modo A) compone bien por región', function () {
	it('usa un denominador común (grandAreaSum) entre categorías: la barra de una región no supera ~100%', function () {
		// Bug observado: una barra en 202% porque cada categoría se medía contra SU
		// PROPIA área total (colAreaSum por columna) en vez de un denominador común
		// entre categorías, igual que ya hacía col% (P) con grandValueSum.
		// Urbano: 30 (región 1) + 40 (región 2) = 70 de área total.
		// Rural:  20 (región 1) + 10 (región 2) = 30 de área total.
		// Gran total de área (todas las categorías, todas las regiones) = 100.
		var p = Object.create(ActivePivot.prototype);
		var items = [{ Caption: 'Región 1', FID: 1 }, { Caption: 'Región 2', FID: 2 }];
		p.RowTree = { AnalysisEntries: function () {
			return items.map(function (item) { return { region: {}, item: item }; });
		} };
		p._categoryTuples = function () {
			return {
				base: { summary: 'A', variable: {}, level: 0, levelId: 0, versionId: 11, variableId: 1 },
				tuples: [
					{ tuple: { labelId: 101 }, labelId: 101, name: 'Urbano', color: '#a' },
					{ tuple: { labelId: 102 }, labelId: 102, name: 'Rural', color: '#b' }
				],
				totalTuple: { labelId: null, isTotal: true }
			};
		};
		p.ResolveCell = function (tuple, region, item) {
			if (tuple.isTotal) return { Empty: false, Value: null, Total: null, Area: null };
			var isUrbano = tuple.labelId === 101;
			if (item.FID === 1) return { Empty: false, Area: isUrbano ? 30 : 20 };
			return { Empty: false, Area: isUrbano ? 40 : 10 };
		};
		var res = p.ResolveAllCategoriesByRegion(2, 11);
		expect(res).toHaveLength(2);
		var region1 = res[0].parts[0].valueOnUniverse + res[0].parts[1].valueOnUniverse;
		var region2 = res[1].parts[0].valueOnUniverse + res[1].parts[1].valueOnUniverse;
		expect(region1).toBeCloseTo(50, 1);   // (30+20)/100*100, no un valor inflado
		expect(region2).toBeCloseTo(50, 1);   // (40+10)/100*100
	});
});


describe('_reorderMetricsBySections — orden de columnas simétrico a la URL', function () {
	it('reordena los indicadores según el orden serializado, con ids laxos', function () {
		// Las altas corren en paralelo y cada una se agrega al resolverse.
		var p = Object.create(ActivePivot.prototype);
		p.Metrics = [fakeMetric(20, []), fakeMetric(10, []), fakeMetric(30, [])];
		p._reorderMetricsBySections([{ id: '10' }, { id: 30 }, { id: 20 }]);
		expect(p.Metrics.map(function (m) { return m.properties.Metric.Id; })).toEqual([10, 30, 20]);
	});
});


if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
