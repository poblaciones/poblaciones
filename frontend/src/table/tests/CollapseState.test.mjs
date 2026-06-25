import { describe, it, expect, report } from './_harness.mjs';
import CollapseState from '@/table/components/pivot/CollapseState.js';

function keys(n) {
	var k = [];
	for (var i = 0; i < n; i++) k.push('g' + i);
	return k;
}

describe('CollapseState', function () {
	it('todo expandido codifica a cadena vacía', function () {
		var cs = new CollapseState();
		expect(cs.encode(keys(5))).toBe('');
	});

	it('round-trip con algunos colapsados', function () {
		var ks = keys(10);
		var cs = new CollapseState();
		cs.toggle('g1'); cs.toggle('g4'); cs.toggle('g7');
		var enc = cs.encode(ks);
		var back = new CollapseState().decode(enc, ks);
		expect(back.isCollapsed('g1')).toBe(true);
		expect(back.isCollapsed('g4')).toBe(true);
		expect(back.isCollapsed('g7')).toBe(true);
		expect(back.isCollapsed('g0')).toBe(false);
		expect(back.isCollapsed('g9')).toBe(false);
	});

	it('mayoría colapsada usa polaridad invertida y sigue siendo correcto', function () {
		var ks = keys(8);
		var cs = new CollapseState();
		cs.setAll(ks, true);
		cs.toggle('g3');   // queda expandido solo g3
		var enc = cs.encode(ks);
		expect(enc.charAt(0)).toBe('1');   // polaridad invertida
		var back = new CollapseState().decode(enc, ks);
		expect(back.isCollapsed('g0')).toBe(true);
		expect(back.isCollapsed('g3')).toBe(false);
		expect(back.allCollapsed(ks)).toBe(false);
	});

	it('todos colapsados round-trip', function () {
		var ks = keys(6);
		var cs = new CollapseState();
		cs.setAll(ks, true);
		var back = new CollapseState().decode(cs.encode(ks), ks);
		expect(back.allCollapsed(ks)).toBe(true);
	});

	it('allCollapsed y anyCollapsed', function () {
		var ks = keys(3);
		var cs = new CollapseState();
		expect(cs.anyCollapsed(ks)).toBe(false);
		cs.toggle('g1');
		expect(cs.anyCollapsed(ks)).toBe(true);
		expect(cs.allCollapsed(ks)).toBe(false);
		cs.setAll(ks, true);
		expect(cs.allCollapsed(ks)).toBe(true);
	});

	it('decodificar sobre menos claves que las codificadas no rompe', function () {
		var cs = new CollapseState();
		cs.setAll(keys(10), true);
		var enc = cs.encode(keys(10));
		var back = new CollapseState().decode(enc, keys(3));
		expect(back.isCollapsed('g0')).toBe(true);
		expect(back.isCollapsed('g2')).toBe(true);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
