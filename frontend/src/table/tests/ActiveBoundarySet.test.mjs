/*
 * ActiveBoundarySet.test.mjs — pruebas del manager de delimitaciones.
 *
 * Se prueba en aislamiento inyectando dependencias falsas (buildBoundary,
 * makeSelection, ready, removeItem), sin window.Context ni backend.
 *
 *     node --import ./tests/_register-alias.mjs tests/ActiveBoundarySet.test.mjs
 */

import { describe, it, expect, report } from './_harness.mjs';
import ActiveBoundarySet from '@/table/classes/ActiveBoundarySet.js';

// Selección falsa: registra items y soporta toggle/consulta.
function fakeSelection(region) {
	return {
		Region: region,
		Items: [],
		SelectAllItems: function () { this.Items = ['*']; },
		SelectItems: function (ids) { this.Items = ids.slice(); },
		IsItemSelected: function (id) { return this.Items.indexOf(id) !== -1; },
		ToggleItem: function (id) {
			var i = this.Items.indexOf(id);
			if (i === -1) this.Items.push(id); else this.Items.splice(i, 1);
		}
	};
}

// Delimitación falsa: una versión con su Selection y el nombre en properties.
function fakeBuild(boundaryId) {
	var version = { Id: 1, Name: 'b' + boundaryId, Selection: null };
	var ab = {
		Versions: [version],
		SelectedVersionIndex: 0,
		properties: { Name: 'Delim' + boundaryId },
		SelectedVersion: function () { return this.Versions[this.SelectedVersionIndex]; }
	};
	return { activeBoundary: ab, region: { id: boundaryId } };
}

function makeSet(options) {
	var base = {
		buildBoundary: fakeBuild,
		makeSelection: fakeSelection,
		ready: function (v) { return v; }, // síncrono en tests
		removeItem: function (a, item) { var i = a.indexOf(item); if (i >= 0) a.splice(i, 1); }
	};
	return new ActiveBoundarySet({}, Object.assign(base, options || {}));
}

describe('ActiveBoundarySet — agregar y buscar', function () {
	it('addWholeById crea una delimitación completa', function () {
		var set = makeSet({ prepend: true });
		var b = set.addWholeById(7, 'Prov');
		expect(set.items).toHaveLength(1);
		expect(b.__whole).toBeTruthy();
		expect(b.__boundaryId).toBe(7);
		expect(b.__caption).toBe('Prov');
	});
	it('addWholeById sin caption explícito lo deriva del nombre de la delimitación', function () {
		var set = makeSet({ prepend: true });
		var b = set.addWholeById(7);
		expect(b.__caption).toBe('Delim7');
	});
	it('addItemsById con whole (restauración) deriva el caption del nombre', function () {
		var set = makeSet({ prepend: true });
		var b = set.addItemsById(9, ['a', 'b'], true);
		expect(b.__whole).toBeTruthy();
		expect(b.__caption).toBe('Delim9');
	});
	it('addWholeById sobre una existente la promociona sin duplicar', function () {
		var set = makeSet();
		set.addItemsById(7, ['a']);
		expect(set.items).toHaveLength(1);
		var b = set.addWholeById(7);
		expect(set.items).toHaveLength(1);
		expect(b.__whole).toBeTruthy();
	});
	it('findById ubica por id (laxo) y devuelve null si no está', function () {
		var set = makeSet();
		set.addItemsById(7, ['a']);
		expect(set.findById('7')).toBeTruthy(); // string vs número
		expect(set.findById(99)).toBeNull();
	});
});

describe('ActiveBoundarySet — items y fusión', function () {
	it('addItemsById crea con los items dados', function () {
		var set = makeSet();
		set.addItemsById(7, ['a', 'b']);
		var sel = set.findById(7).SelectedVersion().Selection;
		expect(sel.Items).toHaveLength(2);
	});
	it('addItemsById sobre existente fusiona sin duplicar', function () {
		var set = makeSet();
		set.addItemsById(7, ['a', 'b']);
		set.addItemsById(7, ['b', 'c']); // b ya está
		var sel = set.findById(7).SelectedVersion().Selection;
		expect(sel.Items).toHaveLength(3); // a, b, c
	});
	it('removeItemsById quita items y elimina la delimitación si queda vacía', function () {
		var set = makeSet();
		set.addItemsById(7, ['a', 'b']);
		set.removeItemsById(7, ['a']);
		expect(set.findById(7).SelectedVersion().Selection.Items).toHaveLength(1);
		set.removeItemsById(7, ['b']); // queda vacía
		expect(set.findById(7)).toBeNull();
		expect(set.items).toHaveLength(0);
	});
});

describe('ActiveBoundarySet — orden de inserción y remoción', function () {
	it('prepend inserta al principio; sin prepend al final', function () {
		var pre = makeSet({ prepend: true });
		pre.addItemsById(1, ['a']); pre.addItemsById(2, ['a']);
		expect(pre.items[0].__boundaryId).toBe(2); // el último va primero

		var app = makeSet({ prepend: false });
		app.addItemsById(1, ['a']); app.addItemsById(2, ['a']);
		expect(app.items[0].__boundaryId).toBe(1); // respeta el orden de alta
	});
	it('removeById quita la delimitación completa', function () {
		var set = makeSet();
		set.addItemsById(7, ['a']);
		set.removeById(7);
		expect(set.items).toHaveLength(0);
	});
	it('clear vacía la colección', function () {
		var set = makeSet();
		set.addItemsById(1, ['a']); set.addItemsById(2, ['a']);
		set.clear();
		expect(set.items).toHaveLength(0);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
