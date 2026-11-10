/*
 * ActiveRowTree.test.mjs — árbol de filas: niveles con casillas, elementos
 * desplegables, tipos de hijo, selección desde el visor y serialización.
 *
 *     node --import ./tests/_register-alias.mjs tests/ActiveRowTree.test.mjs
 */

import { describe, it, expect, report } from './_harness.mjs';
import { makeTreePivot } from './fixtures-hierarchy.mjs';

function treeWithRoot() {
	var tree = makeTreePivot(1).RowTree;
	tree.EnsureRoot();
	return tree;
}

function captions(items) {
	var out = [];
	for (var i = 0; i < items.length; i++) out.push(items[i].Caption);
	return out;
}

function chainTo(tree, boundaryId, fid) {
	return tree.Hierarchy().ChainFor(boundaryId, fid);
}

describe('ActiveRowTree — raíz y casillas', function () {
	it('arranca en la raíz por defecto, con todos los elementos', function () {
		var tree = treeWithRoot();
		expect(tree.root.boundary.Name).toBe('Provincias');
		expect(captions(tree.root.ShownItems())).toEqual(['Catamarca', 'Tucumán']);
	});
	it('desmarcar todas las casillas equivale a ver todos', function () {
		var tree = treeWithRoot();
		var items = tree.root.Items();
		tree.root.SetChecked(items, false);
		expect(tree.root.IsAll()).toBeTruthy();
		expect(tree.root.ShownItems()).toHaveLength(2);
		// En el menú, las casillas se ven destildadas (borrador).
		expect(tree.root.IsBoxChecked(10)).toBeFalsy();
	});
	it('quitar el último elemento visible vuelve a mostrar todos', function () {
		var tree = treeWithRoot();
		var catamarca = tree.root.FindItem(10);
		var tucuman = tree.root.FindItem(11);
		tree.root.RemoveItem(tucuman);
		expect(captions(tree.root.ShownItems())).toEqual(['Catamarca']);
		tree.root.RemoveItem(catamarca);
		expect(tree.root.IsAll()).toBeTruthy();
	});
	it('ShowAll vuelve a todos y repliega lo desplegado', function () {
		var tree = treeWithRoot();
		var catamarca = tree.root.FindItem(10);
		tree.root.RestrictTo(catamarca);
		tree.root.ItemState(tree.root.FindItem(11)).open = true;
		tree.root.ShowAll();
		expect(tree.root.IsAll()).toBeTruthy();
		expect(tree.root.ItemState(tree.root.FindItem(11)).open).toBeFalsy();
	});
});

describe('ActiveRowTree — despliegue', function () {
	it('el único elemento visible queda desplegado sin control de colapso', function () {
		var tree = treeWithRoot();
		var catamarca = tree.root.FindItem(10);
		expect(tree.root.IsItemOpen(catamarca)).toBeFalsy();
		tree.root.RestrictTo(catamarca);
		expect(tree.root.IsItemForced(catamarca)).toBeTruthy();
		expect(tree.root.IsItemOpen(catamarca)).toBeTruthy();
	});
	it('cada tipo de hijo es un nivel propio, colapsado por defecto', function () {
		var tree = treeWithRoot();
		var catamarca = tree.root.FindItem(10);
		var types = tree.root.Types(catamarca);
		expect(types).toHaveLength(3);
		expect(types[0].boundary.Name).toBe('Municipios');
		expect(types[0].IsTypeOpen()).toBeFalsy();
		expect(types[0].IsCollapsible()).toBeTruthy();
		expect(captions(types[0].Items())).toEqual(['Belén', 'Andalgalá']);
	});
	it('un tipo de hijo único queda siempre abierto', function () {
		var tree = treeWithRoot();
		var catamarca = tree.root.FindItem(10);
		var departamentos = tree.root.Types(catamarca)[1];
		var ambato = departamentos.FindItem(30);
		var localidades = departamentos.Types(ambato);
		expect(localidades).toHaveLength(1);
		expect(localidades[0].IsTypeOpen()).toBeTruthy();
		expect(localidades[0].IsCollapsible()).toBeFalsy();
	});
	it('el último tipo abierto se recuerda para los siguientes despliegues', function () {
		var tree = treeWithRoot();
		var catamarca = tree.root.FindItem(10);
		var tucuman = tree.root.FindItem(11);
		var catamarcaTypes = tree.root.Types(catamarca);
		catamarcaTypes[1].ToggleOpen();   // Departamentos
		var tucumanTypes = tree.root.Types(tucuman);
		expect(tucumanTypes[0].IsTypeOpen()).toBeFalsy();
		expect(tucumanTypes[1].IsTypeOpen()).toBeTruthy();
		// No altera lo ya creado.
		expect(catamarcaTypes[0].IsTypeOpen()).toBeFalsy();
	});
});

describe('ActiveRowTree — niveles abiertos', function () {
	it('un tipo de hijo colapsado no cuenta como nivel abierto (no pide relaciones)', function () {
		var tree = treeWithRoot();
		var catamarca = tree.root.FindItem(10);
		tree.root.ToggleItem(catamarca);
		expect(tree.OpenLevels()).toHaveLength(1);
		tree.root.Types(catamarca)[1].ToggleOpen();   // Departamentos
		var names = [];
		var levels = tree.OpenLevels();
		for (var i = 0; i < levels.length; i++) names.push(levels[i].boundary.Name);
		// Ambato es el único departamento: queda desplegado, con su único tipo abierto.
		expect(names).toEqual(['Provincias', 'Departamentos', 'Localidades']);
	});
});

describe('ActiveRowTree — selección desde una cadena', function () {
	it('ReplaceSelection deja solo la cadena, con el último desplegado', function () {
		var tree = treeWithRoot();
		tree.ReplaceSelection(chainTo(tree, 2, 20));   // Catamarca › Belén
		expect(captions(tree.root.ShownItems())).toEqual(['Catamarca']);
		var municipios = tree.root.Types(tree.root.FindItem(10))[0];
		expect(municipios.IsTypeOpen()).toBeTruthy();
		expect(captions(municipios.ShownItems())).toEqual(['Belén']);
	});
	it('AddSelection suma a lo que ya se ve', function () {
		var tree = treeWithRoot();
		tree.ReplaceSelection(chainTo(tree, 1, 10));
		tree.AddSelection(chainTo(tree, 1, 11));
		expect(captions(tree.root.ShownItems())).toEqual(['Catamarca', 'Tucumán']);
		expect(tree.root.ItemState(tree.root.FindItem(11)).open).toBeTruthy();
	});
	it('una cadena de otra raíz cambia la raíz', function () {
		var tree = treeWithRoot();
		tree.ReplaceSelection(chainTo(tree, 4, 40));
		expect(tree.root.boundary.Name).toBe('Regiones');
	});
	it('la sugerencia se acepta como selección o se descarta', function () {
		var tree = treeWithRoot();
		tree.SetSuggestion([999, 21]);
		expect(tree.suggestion.chain[1].item.Caption).toBe('Andalgalá');
		tree.AcceptSuggestion();
		expect(tree.suggestion).toBeNull();
		expect(captions(tree.root.ShownItems())).toEqual(['Catamarca']);
	});
});

describe('ActiveRowTree — nivel de análisis y selección explícita', function () {
	it('baja mientras haya un único elemento con un único tipo abierto', function () {
		var tree = treeWithRoot();
		expect(tree.AnalysisLevel().boundary.Name).toBe('Provincias');
		tree.ReplaceSelection(chainTo(tree, 2, 20));
		var municipios = tree.root.Types(tree.root.FindItem(10))[0];
		municipios.ShowAll();
		expect(tree.AnalysisLevel().boundary.Name).toBe('Municipios');
		expect(tree.AnalysisEntries()).toHaveLength(2);
	});
	it('RemoveSelectedItem quita una región elegida; la última vuelve a mostrar todos', function () {
		var tree = treeWithRoot();
		tree.ReplaceSelection(chainTo(tree, 2, 20));
		tree.AddSelection(chainTo(tree, 2, 21));
		tree.RemoveSelectedItem(20);
		var municipios = tree.root.Types(tree.root.FindItem(10))[0];
		expect(captions(municipios.ShownItems())).toEqual(['Andalgalá']);
		tree.RemoveSelectedItem(21);
		expect(municipios.IsAll()).toBeTruthy();
	});
	it('SelectionLeaves devuelve el elemento más profundo de cada rama', function () {
		var tree = treeWithRoot();
		tree.ReplaceSelection(chainTo(tree, 2, 20));
		var leaves = tree.SelectionLeaves();
		expect(leaves).toHaveLength(1);
		expect(leaves[0].item.Caption).toBe('Belén');
	});
});

describe('ActiveRowTree — serialización', function () {
	it('ToSection y Restore reconstruyen el mismo árbol', function () {
		var pivot = makeTreePivot(1);
		var tree = pivot.RowTree;
		tree.EnsureRoot();
		tree.ReplaceSelection(chainTo(tree, 2, 20));
		var catamarca = tree.root.FindItem(10);
		tree.root.Types(catamarca)[1].ToggleOpen();   // Departamentos abierto
		var section = tree.ToSection();

		var other = makeTreePivot(1).RowTree;
		other.Restore(section);
		expect(other.ToSection()).toEqual(section);
		var municipios = other.root.Types(other.root.FindItem(10))[0];
		expect(captions(municipios.ShownItems())).toEqual(['Belén']);
	});
	it('Restore ignora entradas que ya no existen en el catálogo', function () {
		var tree = makeTreePivot(1).RowTree;
		tree.Restore({ root: 1, checked: [10, 777], entries: [{ path: [777, 2], open: true, checked: null }] });
		expect(captions(tree.root.ShownItems())).toEqual(['Catamarca']);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
