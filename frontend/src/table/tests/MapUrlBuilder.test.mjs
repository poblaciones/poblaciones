/*
 * MapUrlBuilder.test.mjs — verifica el formato de la URL del visor de mapa.
 *     node --import ./tests/_register-alias.mjs tests/MapUrlBuilder.test.mjs
 */
import { describe, it, expect, report } from './_harness.mjs';
import MapUrlBuilder from '@/table/classes/MapUrlBuilder.js';

function mkVer(id, levels) { return { Version: { Id: id, Name: 'v' + id }, Levels: levels }; }
function mkLvl(id, vars) { return { Id: id, Name: 'L' + id, Variables: vars }; }
function mkVar(id) { return { Id: id, Name: 'var' + id, ValueLabels: [] }; }

function makePivot() {
	var lvl = mkLvl(20, [mkVar(900), mkVar(901)]);
	var versions = [mkVer(1, [lvl]), mkVer(2, [lvl]), mkVer(3, [lvl]), mkVer(4, [lvl])];
	var metric = {
		properties: { Metric: { Id: 6301 }, Versions: versions, SummaryMetric: 'N' },
		// Dos versiones seleccionadas: el builder debe quedarse con la más reciente (índice 3).
		Selections: [
			{ versionId: () => 1, version: versions[0], level: lvl, variable: lvl.Variables[0], labels: [] },
			{ versionId: () => 4, version: versions[3], level: lvl, variable: lvl.Variables[0], labels: [] }
		]
	};
	return { Metrics: [metric], FilterSet: { items: [] }, Regions: { items: [] } };
}

var opts = { origin: 'https://x.org', basePath: '/map/' };

describe('MapUrlBuilder', function () {
	it('toma la versión más reciente y omite los defaults (a0, i0, mN)', function () {
		var url = new MapUrlBuilder(makePivot(), opts).build({ kind: 'item', regionId: 79537 });
		// item sin filtros → recorte en el elemento + el indicador con v=índice 3.
		expect(url).toBe('https://x.org/map/#/&r79537/l=6301!v3');
	});

	it('clic en un tipo de delimitación lo agrega como capa boundary', function () {
		var url = new MapUrlBuilder(makePivot(), opts).build({ kind: 'boundaryType', boundaryId: 5550 });
		expect(url).toBe('https://x.org/map/#/l=6301!v3;5550!tb');
	});

	it('con filtros, un elemento hace zoom (no recorte) en su propio segmento', function () {
		var pivot = makePivot();
		// Un filtro activo (FID 100) → se usa como recorte y el elemento clickeado hace zoom.
		pivot.FilterSet = { items: [ { SelectedVersion: function () { return { Selection: { Items: [ { FID: 100 } ] } }; } } ] };
		var url = new MapUrlBuilder(pivot, opts).build({ kind: 'item', regionId: 79537 });
		expect(url).toBe('https://x.org/map/#/&r100/l=6301!v3/j=r79537');
	});

	it('un corte de control se trata igual que un elemento', function () {
		var url = new MapUrlBuilder(makePivot(), opts).build({ kind: 'group', regionId: 42 });
		expect(url).toBe('https://x.org/map/#/&r42/l=6301!v3');
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
