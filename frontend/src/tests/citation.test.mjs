/*
 * citation.test.mjs — cita APA7 de un Work y deduplicación entre Selections.
 *
 *     node --import ./tests/_register-alias.mjs tests/citation.test.mjs
 */

import { describe, it, expect, report } from './_harness.mjs';
import { formatCitation, uniqueWorksFromSelections } from '@/table/js/citation.js';

function work(over) {
	return Object.assign({
		Id: 1,
		Url: 'https://poblaciones.org/@109701',
		Metadata: { Authors: '', Date: null, ReleaseDate: '2022-03-08 22:37:17', Name: 'Censo 1980' }
	}, over || {});
}

describe('formatCitation', function () {
	it('caso completo: autor, año y nombre presentes', function () {
		var w = work({ Metadata: { Authors: 'INDEC', Date: '1980', ReleaseDate: null, Name: 'Censo 1980' } });
		expect(formatCitation(w)).toBe('INDEC (1980). Censo 1980, Poblaciones. https://poblaciones.org/@109701');
	});
	it('sin autor: usa el año solo entre paréntesis, sin dejar puntuación huérfana', function () {
		var w = work({ Metadata: { Authors: '', Date: '1980', ReleaseDate: null, Name: 'Censo 1980' } });
		expect(formatCitation(w)).toBe('(1980). Censo 1980, Poblaciones. https://poblaciones.org/@109701');
	});
	it('sin Date: cae a los primeros 4 caracteres de ReleaseDate', function () {
		var w = work({ Metadata: { Authors: 'INDEC', Date: null, ReleaseDate: '2022-03-08 22:37:17', Name: 'Censo 1980' } });
		expect(formatCitation(w)).toBe('INDEC (2022). Censo 1980, Poblaciones. https://poblaciones.org/@109701');
	});
	it('con autor pero sin año (ni Date ni ReleaseDate): autor seguido de punto, sin paréntesis vacío', function () {
		var w = work({ Metadata: { Authors: 'INDEC', Date: null, ReleaseDate: null, Name: 'Censo 1980' } });
		expect(formatCitation(w)).toBe('INDEC. Censo 1980, Poblaciones. https://poblaciones.org/@109701');
	});
	it('sin nombre: la cita no queda con una coma colgando', function () {
		var w = work({ Metadata: { Authors: 'INDEC', Date: '1980', ReleaseDate: null, Name: '' } });
		expect(formatCitation(w)).toBe('INDEC (1980). Poblaciones. https://poblaciones.org/@109701');
	});
	it('sin Metadata: cadena vacía (no revienta)', function () {
		expect(formatCitation({ Id: 1, Url: 'x' })).toBe('');
	});
	it('sin Work: cadena vacía', function () {
		expect(formatCitation(null)).toBe('');
	});
});

describe('uniqueWorksFromSelections', function () {
	function sel(workObj) { return { Version: function () { return { Work: workObj }; } }; }

	it('deduplica por Work.Id, conservando el orden de primera aparición', function () {
		var w1 = work({ Id: 1 });
		var w2 = work({ Id: 2 });
		var selections = [sel(w1), sel(w2), sel(w1)];
		var out = uniqueWorksFromSelections(selections);
		expect(out).toHaveLength(2);
		expect(out[0].Id).toBe(1);
		expect(out[1].Id).toBe(2);
	});
	it('ignora Selections sin Work (versión sin publicación asociada)', function () {
		var out = uniqueWorksFromSelections([{ Version: function () { return {}; } }]);
		expect(out).toHaveLength(0);
	});
	it('lista vacía o nula no revienta', function () {
		expect(uniqueWorksFromSelections([])).toHaveLength(0);
		expect(uniqueWorksFromSelections(null)).toHaveLength(0);
	});
	it('acepta objetos livianos con .version directo (sin método Version())', function () {
		var w1 = work({ Id: 5 });
		var out = uniqueWorksFromSelections([{ version: { Work: w1 } }]);
		expect(out).toHaveLength(1);
		expect(out[0].Id).toBe(5);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
