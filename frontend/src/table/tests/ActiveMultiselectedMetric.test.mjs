import { describe, it, expect, report } from './_harness.mjs';
import ActiveMultiselectedMetric from '@/table/classes/ActiveMultiselectedMetric.js';
import { makeMultiVersionProperties } from './fixtures-multiversion.mjs';

function makeMetric() { return new ActiveMultiselectedMetric(makeMultiVersionProperties()); }

// makeTuple simple para inspeccionar lo que emite el modelo.
function tupleMaker(sel, labelId, labelName, isTotal) {
	return {
		versionId: sel.versionId(), levelName: sel.levelName(),
		variableName: sel.variable.Name, labelId: labelId, isTotal: isTotal
	};
}

describe('ActiveMultiselectedMetric — oferta', function () {
	it('AvailableVariables es la unión por nombre de todos los censos', function () {
		var m = makeMetric();
		var names = m.AvailableVariables();
		expect(names.indexOf('Hogares con NBI') !== -1).toBe(true);
		expect(names.indexOf('Población con discapacidad') !== -1).toBe(true);
		expect(names.length).toBe(2);
	});

	it('NBI se ofrece en ambos censos', function () {
		var m = makeMetric();
		var vers = m.VersionsForVariable('Hogares con NBI');
		expect(vers.map(function (v) { return v.Version.Id; })).toEqual(['2010', '2022']);
	});

	it('Discapacidad se ofrece solo en 2010 (no existe en 2022)', function () {
		var m = makeMetric();
		var vers = m.VersionsForVariable('Población con discapacidad');
		expect(vers.map(function (v) { return v.Version.Id; })).toEqual(['2010']);
	});
});

describe('ActiveMultiselectedMetric — selección', function () {
	it('SelectByCaption arma una Selection por censo con la variable correcta', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		expect(m.Selections.length).toBe(2);
		m.Selections.forEach(function (sel) {
			expect(sel.variable.Name).toBe('Hogares con NBI');
		});
	});

	it('elegir Discapacidad deja solo el censo que la tiene', function () {
		var m = makeMetric();
		m.SelectByCaption('Población con discapacidad');
		expect(m.Selections.length).toBe(1);
		expect(m.Selections[0].versionId()).toBe('2010');
	});

	it('SelectVersions restringe los años dentro de la variable vigente', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		m.SelectVersions(['2022']);
		expect(m.Selections.length).toBe(1);
		expect(m.Selections[0].versionId()).toBe('2022');
	});
});

describe('ActiveMultiselectedMetric — niveles por censo', function () {
	it('cada Selection mueve su nivel por su propia jerarquía', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		// Ambas arrancan en Provincias (nivel 0 de cada censo).
		m.Selections.forEach(function (sel) { expect(sel.levelName()).toBe('Provincias'); });
		// 2010 puede ir a Departamentos; 2022 no lo tiene.
		var s2010 = m.Selections.filter(function (s) { return s.versionId() === '2010'; })[0];
		var s2022 = m.Selections.filter(function (s) { return s.versionId() === '2022'; })[0];
		expect(s2010.hasLevelNamed('Departamentos')).toBe(true);
		expect(s2022.hasLevelNamed('Departamentos')).toBe(false);
		expect(s2010.moveToLevelNamed('Departamentos')).toBe(true);
		expect(s2010.levelName()).toBe('Departamentos');
		// Al cambiar de nivel, reengancha la variable del mismo nombre en ese nivel.
		expect(s2010.variable.Name).toBe('Hogares con NBI');
	});
});

describe('ActiveMultiselectedMetric — tuplas', function () {
	it('emite una tupla Total por censo cuando solo hay total', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		var tuples = m.emitTuples(tupleMaker);
		expect(tuples.length).toBe(2);
		expect(tuples.every(function (t) { return t.isTotal; })).toBe(true);
		expect(tuples.map(function (t) { return t.versionId; })).toEqual(['2010', '2022']);
	});

	it('con categorías elegidas emite una tupla por categoría + total', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI', ['2010']);
		var sel = m.Selections[0];
		sel.labels = [sel.variable.ValueLabels[0].Id];   // una categoría
		var tuples = m.emitTuples(tupleMaker);
		// 1 categoría + 1 total
		expect(tuples.length).toBe(2);
		expect(tuples.filter(function (t) { return t.isTotal; }).length).toBe(1);
	});
});

describe('ActiveMultiselectedMetric — serialización', function () {
	it('round-trip conserva variable, censos, nivel y total', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		m.Selections.filter(function (s) { return s.versionId() === '2010'; })[0].moveToLevelNamed('Departamentos');
		var str = m.serialize();

		var m2 = makeMetric();
		m2.restore(str);
		expect(m2.variableName()).toBe('Hogares con NBI');
		expect(m2.Selections.length).toBe(2);
		var s2010 = m2.Selections.filter(function (s) { return s.versionId() === '2010'; })[0];
		expect(s2010.levelName()).toBe('Departamentos');
	});

	it('restaurar una variable que ya no existe no rompe (queda sin cambios)', function () {
		var m = makeMetric();
		m.restore(encodeURIComponent('Variable inexistente') + '~0:0::t');
		// No aplica la restauración; conserva la selección inicial por defecto.
		expect(m.variableName()).toBe('Hogares con NBI');
	});
});

describe('ActiveMultiselectedMetric — GetTuples (formato pivot)', function () {
	it('GetTuples arma tuplas con key, version, level, variable', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		var tuples = m.GetTuples();
		expect(tuples.length).toBe(2);
		var t = tuples[0];
		expect(t.metricId).toBe(7);
		expect(t.versionId).toBe('2010');
		expect(t.levelName).toBe('Provincias');
		expect(t.variableName).toBe('Hogares con NBI');
		expect(t.isTotal).toBe(true);
		expect(typeof t.key).toBe('string');
	});
});

describe('ActiveMultiselectedMetric — colores y modos', function () {
	it('GetStyleColorDictionary cubre labelId de TODAS las versiones', function () {
		var m = makeMetric();
		var dict = m.GetStyleColorDictionary();
		// labelId de NBI en 2010-Provincias (1011) y en 2022-Provincias (2211).
		expect(Object.prototype.hasOwnProperty.call(dict, 1011)).toBe(true);
		expect(Object.prototype.hasOwnProperty.call(dict, 2211)).toBe(true);
	});

	it('getValidMetrics es agnóstico (recibe variable y nivel)', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI');
		var sel = m.Selections[0];
		var modes = m.getValidMetrics(sel.variable, sel.level);
		expect(modes.some(function (x) { return x.Key === 'N'; })).toBe(true);
		expect(modes.some(function (x) { return x.Key === 'P'; })).toBe(true);
	});
});

describe('ActiveMultiselectedMetric — toggleVersion y preservación', function () {
	it('toggleVersion agrega y quita censos, sin bajar de uno', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI', ['2010']);
		expect(m.Selections.length).toBe(1);
		m.toggleVersion('2022');
		expect(m.Selections.length).toBe(2);
		m.toggleVersion('2022');
		expect(m.Selections.length).toBe(1);
		m.toggleVersion('2010');   // intentar quitar el último: no procede
		expect(m.Selections.length).toBe(1);
	});

	it('al cambiar de años se preserva el nivel/categorías de los censos que siguen', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI', ['2010']);
		var s = m.Selections[0];
		s.moveToLevelNamed('Departamentos');
		s.labels = [s.variable.ValueLabels[0].Id];
		m.toggleVersion('2022');   // agrega 2022, 2010 debe conservar su estado
		var s2010 = m.Selections.filter(function (x) { return x.versionId() === '2010'; })[0];
		expect(s2010.levelName()).toBe('Departamentos');
		expect(s2010.labels.length).toBe(1);
	});

	it('cambiar de variable lógica parte la selección de categorías de cero', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI', ['2010']);
		m.Selections[0].labels = [m.Selections[0].variable.ValueLabels[0].Id];
		m.SelectByCaption('Población con discapacidad');
		expect(m.Selections[0].labels.length).toBe(0);
	});
});

describe('ActiveMultiselectedMetric — disponibilidad por nivel', function () {
	it('selectionResolvesData es true cuando la variable existe en el nivel actual', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI', ['2010']);
		expect(m.selectionResolvesData('2010')).toBe(true);
	});

	it('es false cuando la variable no existe en el nivel al que quedó la selección', function () {
		var m = makeMetric();
		// Discapacidad solo existe en 2010-Departamentos. Si la selección queda en
		// Provincias (donde no está), no resuelve datos a ese nivel.
		m.SelectByCaption('Población con discapacidad', ['2010']);
		var sel = m.Selections[0];
		// Forzar el nivel Provincias (sin esa variable).
		sel.level = sel.version.Levels.filter(function (l) { return l.Name === 'Provincias'; })[0];
		expect(m.selectionResolvesData('2010')).toBe(false);
	});
});

describe('ActiveMultiselectedMetric — placeholder sin columnas', function () {
	it('emite una tupla placeholder cuando no hay categorías ni total', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI', ['2010']);
		m.Selections[0].includeTotal = false;
		m.Selections[0].labels = [];
		var tuples = m.GetTuples();
		expect(tuples).toHaveLength(1);
		expect(tuples[0].isPlaceholder).toBe(true);
	});

	it('no emite placeholder si hay al menos el total', function () {
		var m = makeMetric();
		m.SelectByCaption('Hogares con NBI', ['2010']);
		var tuples = m.GetTuples();
		expect(tuples.some(function (t) { return t.isPlaceholder; })).toBe(false);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
