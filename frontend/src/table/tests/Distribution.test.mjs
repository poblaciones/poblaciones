/*
 * Distribution.test.mjs — pruebas de las clases del widget de distribución
 * (DistributionModel, DistributionPanel, RegionDistribution).
 *
 * Se corre con el registrador de alias (run-all.mjs ya lo hace):
 *     node --import ./tests/_register-alias.mjs tests/Distribution.test.mjs
 */

import { describe, it, expect, report } from './_harness.mjs';
import DistributionModel from '@/table/widgets/distributions/classes/DistributionModel.js';
import DistributionPanel from '@/table/widgets/distributions/classes/DistributionPanel.js';
import RegionDistribution from '@/table/widgets/distributions/classes/RegionDistribution.js';
import CategoryDistribution from '@/table/widgets/distributions/classes/CategoryDistribution.js';
import { makeDataset } from './fixtures.mjs';

describe('DistributionModel', function () {
	it('agrupa las columnas en un panel por indicador y versión', function () {
		var model = new DistributionModel(makeDataset());
		expect(model.panels()).toHaveLength(2);
	});
	it('agrupa los paneles por indicador', function () {
		var model = new DistributionModel(makeDataset());
		expect(model.indicators()).toHaveLength(2);
	});
	it('con una sola versión por indicador, las categorías se consideran compartidas', function () {
		var model = new DistributionModel(makeDataset());
		expect(model.indicators()[0].sharedCategories).toBeTruthy();
	});
	it('no está vacío cuando hay columnas de medida', function () {
		var model = new DistributionModel(makeDataset());
		expect(model.isEmpty()).toBeFalsy();
	});
});

describe('DistributionPanel', function () {
	var model = new DistributionModel(makeDataset());
	var pob = model.panels()[0];   // Población (conteo, solo total)
	var edu = model.panels()[1];   // Educación (porcentaje, 3 categorías + total)

	it('identifica las categorías y el total del panel de educación', function () {
		expect(edu.categoryColumns()).toHaveLength(3);
		expect(edu.totalColumn() !== null).toBeTruthy();
	});
	it('reconoce el porcentaje y el conteo por la unidad', function () {
		expect(edu.isPercent()).toBeTruthy();
		expect(pob.isPercent()).toBeFalsy();
	});
	it('muestra línea de total solo en porcentaje con total', function () {
		expect(edu.showsTotalLine()).toBeTruthy();
		expect(pob.showsTotalLine()).toBeFalsy();
	});
	it('permite apilar cuando hay varias categorías y total', function () {
		expect(edu.canStack()).toBeTruthy();
		expect(pob.canStack()).toBeFalsy();
	});
	it('la leyenda trae nombre y color curado de cada categoría', function () {
		var leg = edu.legend();
		expect(leg).toHaveLength(3);
		expect(leg[0].color).toBe('#9FE1CB');
	});
	it('la clave del panel combina indicador y versión', function () {
		expect(edu.key()).toBe('2:11');
	});
});

describe('RegionDistribution', function () {
	var dataset = makeDataset();
	var model = new DistributionModel(dataset);
	var edu = model.panels()[1];
	var rd = new RegionDistribution(edu, dataset);

	it('arma una barra por región', function () {
		expect(rd.rows()).toHaveLength(4);
	});
	it('respeta el orden de la pivot (primera región = Buenos Aires)', function () {
		expect(rd.rows()[0].label).toBe('Buenos Aires');
	});
	it('cada barra suma las contribuciones de sus categorías', function () {
		// Buenos Aires: edu_a=80, edu_b=12, edu_c=8 → total 100.
		expect(rd.rows()[0].total).toBeCloseTo(100, 1e-9);
	});
	it('cada barra desglosa por categoría con su color', function () {
		var parts = rd.rows()[0].parts;
		expect(parts).toHaveLength(3);
		expect(parts[0].value).toBe(80);
		expect(parts[0].color).toBe('#9FE1CB');
	});
	it('maxTotal es el mayor de los totales mostrados', function () {
		expect(rd.maxTotal()).toBeCloseTo(100, 1e-9);
	});
	it('isComposed es verdadero con varias categorías por barra', function () {
		expect(rd.isComposed()).toBeTruthy();
	});
	it('panel solo-total compone por categoría vía Camino 1 (ResolveAllCategoriesByRegion)', function () {
		var pob = model.panels()[0];
		var fakePivot = {
			ResolveAllCategoriesByRegion: function () {
				return [
					{ label: 'Buenos Aires', fid: 1, parts: [
						{ labelId: 1, name: 'Bajo', color: '#aaa', value: 30 },
						{ labelId: 2, name: 'Alto', color: '#bbb', value: 70 }
					] }
				];
			}
		};
		var rdPob = new RegionDistribution(pob, dataset, { pivot: fakePivot });
		expect(rdPob.rows()).toHaveLength(1);
		expect(rdPob.rows()[0].parts).toHaveLength(2);
		expect(rdPob.rows()[0].total).toBeCloseTo(100, 1e-9);
		// El Camino 1 arma las partes, pero un conteo no se apila (apilar solo en %).
		expect(rdPob.isComposed()).toBeFalsy();
	});
	it('el Camino 1 reordena las barras según el orden de la pivot (sort)', function () {
		var pob = model.panels()[0];
		// dataRows del dataset define el orden (sort) de la pivot; las regiones que
		// resuelve ResolveAllCategoriesByRegion llegan en otro orden y deben alinearse.
		var pivotOrder = dataset.dataRows()
			.filter(function (r) { return r.fid != null; })
			.map(function (r) { return r.fid; });
		// Se devuelven en orden inverso al de la pivot, para verificar el reordenamiento.
		var reversed = pivotOrder.slice().reverse();
		var fakePivot = {
			ResolveAllCategoriesByRegion: function () {
				return reversed.map(function (fid) {
					return { label: 'r' + fid, fid: fid, parts: [
						{ labelId: 1, name: 'A', color: '#a', value: 10 },
						{ labelId: 2, name: 'B', color: '#b', value: 20 }
					] };
				});
			}
		};
		var rdPob = new RegionDistribution(pob, dataset, { pivot: fakePivot });
		var resultFids = rdPob.rows().map(function (r) { return r.fid; });
		// Tras el reordenamiento, el chart sigue el orden de la pivot, no el de origen.
		expect(resultFids).toEqual(pivotOrder);
	});
	it('no recorta: muestra todas las filas visibles', function () {
		// Sin límite de regiones; el chart refleja todas las filas de la pivot.
		expect(rd.rows()).toHaveLength(4);
		expect(rd.totalCount()).toBe(4);
	});
	it('incidencia solo-total: agrega sobre el universo igual que con las categorías elegidas', function () {
		// Sin categorías elegidas (solo total), una incidencia debe componer la barra
		// con la MISMA suma sobre el universo que cuando se eligen todas. Antes este
		// camino sumaba las incidencias propias de cada categoría (62+67=129).
		var fakePanel = {
			categoryColumns: function () { return []; },
			totalColumn: function () { return { meta: {} }; },
			isGap: function () { return false; },
			isPercent: function () { return true; },
			metricId: function () { return 7; },
			versionId: function () { return 11; }
		};
		var fakePivot = {
			ResolveAllCategoriesByRegion: function () {
				return [{ label: 'X', fid: 1, delta: null, parts: [
					{ labelId: 101, name: 'A', color: '#a', value: 62, valueOnUniverse: 30 },
					{ labelId: 102, name: 'B', color: '#b', value: 67, valueOnUniverse: 47 }
				] }];
			}
		};
		var rd = new RegionDistribution(fakePanel, dataset, { pivot: fakePivot });
		var row = rd.rows()[0];
		expect(row.total).toBeCloseTo(77, 1e-9);   // 30 + 47, no 62 + 67
		expect(row.parts).toHaveLength(2);
	});

	it('incidencia con categorías: la barra suma los valores sobre el universo, no las incidencias propias', function () {
		// edu es porcentaje con categorías elegidas. Cada categoría trae su incidencia
		// sobre su propio total (value, p. ej. 62 y 67, que NO deben sumarse) y su
		// incidencia sobre el universo (valueOnUniverse, aditivas). La barra debe medir
		// la suma de estas últimas (la incidencia del conjunto), no 62+67=129.
		var edu = model.panels()[1];
		var fakePivot = {
			ResolveAllCategoriesByRegion: function () {
				return [{ label: 'X', fid: 1, parts: [
					{ labelId: 101, name: 'A', color: '#a', value: 62, valueOnUniverse: 30 },
					{ labelId: 102, name: 'B', color: '#b', value: 67, valueOnUniverse: 47 }
				] }];
			}
		};
		var rdEdu = new RegionDistribution(edu, dataset, { pivot: fakePivot });
		var row = rdEdu.rows()[0];
		expect(row.total).toBeCloseTo(77, 1e-9);          // 30 + 47, no 62 + 67
		expect(row.parts[0].value).toBe(30);              // segmentos en magnitud aditiva
		expect(row.parts[1].value).toBe(47);
	});

	it('incluye agrupadores (isGroup) y excluye hijos de grupos colapsados', function () {
		// Dataset con un agrupador (group-header) y dos hijos.
		var cols = edu.categoryColumns();
		var hierDataset = {
			columns: dataset.columns,
			dataRows: function () {
				return [
					{ type: 'group-header', label: 'Buenos Aires', parentLabel: null, fid: null, values: dataset.dataRows()[0].values },
					{ type: 'data', label: 'La Plata', parentLabel: 'Buenos Aires', fid: 1, values: dataset.dataRows()[0].values },
					{ type: 'data', label: 'Mar del Plata', parentLabel: 'Buenos Aires', fid: 2, values: dataset.dataRows()[1].values }
				];
			}
		};
		// Sin colapso: agrupador + 2 hijos = 3 filas; el agrupador marcado isGroup.
		var full = new RegionDistribution(edu, hierDataset, {});
		expect(full.rows()).toHaveLength(3);
		expect(full.rows()[0].isGroup).toBe(true);
		expect(full.rows()[1].isGroup).toBe(false);
		// Con el grupo colapsado: queda solo el agrupador (sus hijos se excluyen).
		var collapsed = new RegionDistribution(edu, hierDataset, { excludedGroups: ['Buenos Aires'] });
		expect(collapsed.rows()).toHaveLength(1);
		expect(collapsed.rows()[0].isGroup).toBe(true);
	});
});

describe('CategoryDistribution', function () {
	var dataset = makeDataset();
	var model = new DistributionModel(dataset);
	var edu = model.panels()[1];
	var pob = model.panels()[0];
	var cdEdu = new CategoryDistribution(edu, dataset);
	var cdPob = new CategoryDistribution(pob, dataset);

	it('agrega cada categoría de porcentaje como media ponderada', function () {
		expect(cdEdu.bars()[0].value).toBeCloseTo(66.0, 1e-9);
	});
	it('mantiene el color curado en cada barra', function () {
		expect(cdEdu.bars()[0].color).toBe('#9FE1CB');
	});
	it('expone el total agregado para la línea de referencia', function () {
		expect(cdEdu.totalValue()).toBeCloseTo(100, 1e-9);
	});
	it('el panel solo-total resuelve las categorías cuando hay pivot (Camino 1)', function () {
		var fakePivot = {
			ResolveAllCategories: function () {
				return [
					{ labelId: 1, name: 'Bajo', color: '#aaa', value: 40 },
					{ labelId: 2, name: 'Alto', color: '#bbb', value: 60 }
				];
			}
		};
		var cd = new CategoryDistribution(pob, dataset, fakePivot);
		expect(cd.bars()).toHaveLength(2);
		expect(cd.bars()[1].name).toBe('Alto');
		expect(cd.bars()[1].value).toBe(60);
	});
	it('isComposed es verdadero con varias categorías', function () {
		expect(cdEdu.isComposed()).toBeTruthy();
	});
	it('isComposed es falso para un panel solo-total sin pivot', function () {
		expect(cdPob.isComposed()).toBeFalsy();
	});
	it('un panel de porcentaje con varias categorías sí es apilable (isComposed)', function () {
		var edu = model.panels()[1];   // Educación: porcentaje, 3 categorías
		var cd = new CategoryDistribution(edu, dataset);
		expect(cd.isComposed()).toBeTruthy();
	});
	it('un conteo solo-total NO es apilable aunque el Camino 1 resuelva categorías', function () {
		// Apilar/componer solo aplica a porcentaje; un conteo (como Población) no se
		// apila aunque el Camino 1 pueda resolver sus categorías.
		var fakePivot = {
			ResolveAllCategories: function () {
				return [
					{ labelId: 1, name: 'Bajo', color: '#aaa', value: 40 },
					{ labelId: 2, name: 'Alto', color: '#bbb', value: 60 }
				];
			}
		};
		var cd = new CategoryDistribution(pob, dataset, fakePivot);
		expect(cd.isComposed()).toBeFalsy();
	});
});

describe('Brecha (gap) no apilable', function () {
	// Columna mínima con la forma que esperan las clases (meta + role measure).
	function gapCol(key, labelId, labelName) {
		return {
			key: key, label: labelName, shortLabel: labelName, unit: 'pp.', role: 'measure',
			weighting: { kind: 'self', label: 'Valor', available: true },
			meta: { metricId: 9, metricName: 'Brecha', variableName: 'Δ', labelId: labelId,
				labelName: labelName, fillColor: '#888', isTotal: labelId == null, isGap: true,
				versionName: '2010', versionId: 11 }
		};
	}
	it('un panel de brecha con varias categorías no apila (canStack falso)', function () {
		var panel = new DistributionPanel([gapCol('g_a', 1, 'A'), gapCol('g_b', 2, 'B')]);
		expect(panel.isGap()).toBeTruthy();
		expect(panel.canStack()).toBeFalsy();
	});
	it('isPercent es falso para una brecha (escala no se fija 0-100)', function () {
		var panel = new DistributionPanel([gapCol('g_a', 1, 'A'), gapCol('g_b', 2, 'B')]);
		expect(panel.isPercent()).toBeFalsy();
		expect(panel.valueUnit()).toBe('pp.');
	});
	it('Camino 1 de regiones para brecha: longitud = delta, partes con peso', function () {
		var dataset = makeDataset();
		var model = new DistributionModel(dataset);
		var pob = model.panels()[0];
		// El panel real no es gap; se fuerza isGap para ejercitar la rama.
		pob.isGap = function () { return true; };
		var fakePivot = {
			ResolveAllCategoriesByRegion: function () {
				return [{ label: 'X', fid: 1, delta: -20, isGap: true, parts: [
					{ labelId: 1, name: 'A', color: '#a', value: -8, weight: 5000 },
					{ labelId: 2, name: 'B', color: '#b', value: -12, weight: 5000 }
				] }];
			}
		};
		var rd = new RegionDistribution(pob, dataset, { pivot: fakePivot });
		var rows = rd.rows();
		expect(rows).toHaveLength(1);
		// La longitud de la barra es el delta del total (no la suma de las partes).
		expect(rows[0].total).toBe(-20);
		expect(rows[0].parts[0].weight).toBe(5000);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
