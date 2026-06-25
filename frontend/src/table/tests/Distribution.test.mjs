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
	it('recorta al máximo de regiones y reporta las ocultas', function () {
		var rd2 = new RegionDistribution(edu, dataset, { maxRegions: 2 });
		expect(rd2.rows()).toHaveLength(2);
		expect(rd2.hiddenCount()).toBe(2);
		expect(rd2.totalCount()).toBe(4);
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
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
