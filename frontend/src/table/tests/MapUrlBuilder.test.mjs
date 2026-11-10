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
		// Dos versiones seleccionadas: el builder refleja solo la MÁS RECIENTE
		// (mayor índice, v4→índice 3), ignorando el resto del multiselect. Reflejar
		// cada versión como una aparición repetida del indicador resultaba confuso
		// en el visor.
		Selections: [
			{ versionId: () => 1, version: versions[0], level: lvl, variable: lvl.Variables[0], labels: [] },
			{ versionId: () => 4, version: versions[3], level: lvl, variable: lvl.Variables[0], labels: [] }
		]
	};
	return { Metrics: [metric], RowTree: withSelection([]) };
}

// Árbol de filas mínimo: solo los elementos elegidos (SelectionLeaves).
function withSelection(fids) {
	return {
		SelectionLeaves: function () {
			return fids.map(function (fid) { return { level: null, item: { FID: fid } }; });
		}
	};
}

var opts = { origin: 'https://x.org', basePath: '/map/' };

describe('MapUrlBuilder', function () {
	it('emite una sola aparición del metric, con la versión seleccionada más reciente', function () {
		var url = new MapUrlBuilder(makePivot(), opts).build({ kind: 'item', regionId: 79537 });
		// item sin filtros → recorte en el elemento + el indicador en v3 (la más reciente).
		expect(url).toBe('https://x.org/map/#/&r79537/l=6301!v3');
	});

	it('un nivel se agrega como capa, recortado en el elemento del que cuelga', function () {
		var url = new MapUrlBuilder(makePivot(), opts).build({ kind: 'level', boundaryId: 5550, parentFid: 10 });
		expect(url).toBe('https://x.org/map/#/&r10/l=6301!v3;5550!tb');
	});

	it('el nivel raíz se recorta en la selección vigente', function () {
		var pivot = makePivot();
		pivot.RowTree = withSelection([100, 101]);
		var url = new MapUrlBuilder(pivot, opts).build({ kind: 'level', boundaryId: 5550, parentFid: null });
		expect(url).toBe('https://x.org/map/#/&r100,101/l=6301!v3;5550!tb');
	});

	it('un elemento de fila recorta en sí mismo aunque haya selección (la elección manda)', function () {
		var pivot = makePivot();
		pivot.RowTree = withSelection([100]);
		var url = new MapUrlBuilder(pivot, opts).build({ kind: 'item', regionId: 79537 });
		expect(url).toBe('https://x.org/map/#/&r79537/l=6301!v3');
	});

	it('sin destino, usa la selección vigente como recorte', function () {
		var pivot = makePivot();
		pivot.RowTree = withSelection([100]);
		var url = new MapUrlBuilder(pivot, opts).build();
		expect(url).toBe('https://x.org/map/#/&r100/l=6301!v3');
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
