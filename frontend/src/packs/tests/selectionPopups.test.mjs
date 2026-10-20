import { describe, it, expect } from './_harness.mjs';
import ItemsListPopup from '@/packs/components/popups/ItemsListPopup.vue';
import TreePickerPopup from '@/packs/components/popups/TreePickerPopup.vue';
import GeographySelectionPopup from '@/packs/components/popups/GeographySelectionPopup.vue';
import ClippingRegionSelectionPopup from '@/packs/components/popups/ClippingRegionSelectionPopup.vue';
import { setupGlobals, mountLite, settle } from './fixtures.mjs';
import { describeEscapeHandling } from './_popupContracts.mjs';

function setup(component) {
	const env = setupGlobals({ privileges: 'A' });
	const vm = mountLite(component);
	return { env, vm };
}

// ---------------------------------------------------------------------

describe('ItemsListPopup: datos iniciales');

it('parte cerrado, vacío y sin cargar', () => {
	const { vm } = setup(ItemsListPopup);
	expect(vm.activateEdit).toBe(false);
	expect(vm.visible).toBe(false);
	expect(vm.items).toEqual([]);
	expect(vm.total).toBe(0);
	expect(vm.loading).toBe(false);
	expect(vm.hasMore).toBe(false);
});

describe('ItemsListPopup.show / loadMore');

function pager(pages) {
	const calls = [];
	const fetch = function (offset, size) {
		calls.push([offset, size]);
		return Promise.resolve(pages.shift());
	};
	fetch.calls = calls;
	return fetch;
}

it('show abre el popup y pide el primer lote de 500 ítems', async () => {
	const { vm } = setup(ItemsListPopup);
	const columns = [{ property: 'Caption', caption: 'Nombre' }];
	const fetch = pager([{ Items: [{ Id: 1 }, { Id: 2 }], Total: 2 }]);
	vm.show('Ítems de algo', columns, fetch);
	expect(vm.title).toBe('Ítems de algo');
	expect(vm.gridColumns).toBe(columns);
	expect(vm.visible).toBe(true);
	expect(vm.activateEdit).toBe(true);
	expect(vm.loading).toBe(true);
	await settle();
	expect(fetch.calls).toEqual([[0, 500]]);
	expect(vm.items).toEqual([{ Id: 1 }, { Id: 2 }]);
	expect(vm.total).toBe(2);
	expect(vm.loading).toBe(false);
	expect(vm.hasMore).toBe(false);
});

it('loadMore pide el lote siguiente desde la cantidad ya cargada y lo agrega', async () => {
	const { vm } = setup(ItemsListPopup);
	const fetch = pager([
		{ Items: [{ Id: 1 }, { Id: 2 }], Total: 3 },
		{ Items: [{ Id: 3 }], Total: 3 },
	]);
	vm.show('x', [], fetch);
	await settle();
	expect(vm.hasMore).toBe(true);
	vm.loadMore();
	await settle();
	expect(fetch.calls).toEqual([[0, 500], [2, 500]]);
	expect(vm.items.map(function (i) { return i.Id; })).toEqual([1, 2, 3]);
	expect(vm.hasMore).toBe(false);
});

it('show descarta los ítems de una apertura anterior', async () => {
	const { vm } = setup(ItemsListPopup);
	vm.show('a', [], pager([{ Items: [{ Id: 1 }], Total: 1 }]));
	await settle();
	vm.show('b', [], pager([{ Items: [{ Id: 9 }], Total: 1 }]));
	expect(vm.items).toEqual([]);
	expect(vm.total).toBe(0);
	await settle();
	expect(vm.items).toEqual([{ Id: 9 }]);
});

describeEscapeHandling(ItemsListPopup, 'ItemsListPopup', 'activateEdit');

// ---------------------------------------------------------------------

describe('TreePickerPopup.show');

it('toma título, ítems y excluidos, y se abre; sin excluidos usa una lista vacía', () => {
	const { vm } = setup(TreePickerPopup);
	const items = [{ Id: 1, Level: 0, Caption: 'A' }];
	vm.show('Elegir padre', items, [7]);
	expect(vm.title).toBe('Elegir padre');
	expect(vm.flatItems).toBe(items);
	expect(vm.excludeIds).toEqual([7]);
	expect(vm.activateDialog).toBe(true);
	vm.show('Otro', items);
	expect(vm.excludeIds).toEqual([]);
});

describe('TreePickerPopup.treeList');

it('arma el árbol según el nivel de cada ítem', () => {
	const { vm } = setup(TreePickerPopup);
	vm.show('x', [
		{ Id: 1, Level: 0 }, { Id: 2, Level: 1 }, { Id: 3, Level: 2 }, { Id: 4, Level: 0 },
	]);
	const tree = vm.treeList;
	expect(tree.map(function (n) { return n.Id; })).toEqual([1, 4]);
	expect(tree[0].Items.map(function (n) { return n.Id; })).toEqual([2]);
	expect(tree[0].Items[0].Items.map(function (n) { return n.Id; })).toEqual([3]);
});

describe('TreePickerPopup: formato');

it('formatCaption agrega la revisión o, si no hay, la versión', () => {
	const { vm } = setup(TreePickerPopup);
	expect(vm.formatCaption({ Caption: 'Provincias' })).toBe('Provincias');
	expect(vm.formatCaption({ Caption: 'Provincias', Revision: '2022' })).toBe('Provincias (2022)');
	expect(vm.formatCaption({ Caption: 'Provincias', Version: 'v2' })).toBe('Provincias (v2)');
	expect(vm.formatCaption({ Caption: 'Provincias', Revision: '2022', Version: 'v2' })).toBe('Provincias (2022)');
});

it('la columna Nombre marca los ítems ya agregados', () => {
	const { vm } = setup(TreePickerPopup);
	vm.show('x', [], [2]);
	const column = vm.gridColumns[0];
	expect(column.property).toBe('Caption');
	expect(column.value({ Id: 1, Caption: 'A' })).toBe('A');
	expect(column.value({ Id: 2, Caption: 'B' })).toBe('B (ya agregada)');
});

describe('TreePickerPopup.onRowClick');

it('un ítem excluido no hace nada', () => {
	const { vm } = setup(TreePickerPopup);
	vm.show('x', [], [2]);
	vm.onRowClick(null, { Id: 2 });
	expect(vm.activateDialog).toBe(true);
	expect(vm.$emitted).toEqual([]);
});

it('un ítem disponible se selecciona: cierra el popup y avisa con el ítem', () => {
	const { vm } = setup(TreePickerPopup);
	vm.show('x', [], [2]);
	const item = { Id: 1 };
	vm.onRowClick(null, item);
	expect(vm.activateDialog).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'selected', args: [item] }]);
});

describeEscapeHandling(TreePickerPopup, 'TreePickerPopup', 'activateDialog');

// ---------------------------------------------------------------------

function geo(id, parentId, caption, rootCaption) {
	return { Id: id, ParentId: parentId, Caption: caption, RootCaption: rootCaption === undefined ? null : rootCaption };
}

describe('GeographySelectionPopup.show');

it('ordena las geografías por árbol, recuerda las asociadas y las deja tildadas', () => {
	const { vm } = setup(GeographySelectionPopup);
	vm.show([geo(2, 1, 'Dptos'), geo(1, null, 'Provincias', 'Censo')], [1]);
	expect(vm.allGeographies.map(function (g) { return g.Id; })).toEqual([1, 2]);
	expect(vm.associatedIds).toEqual([1]);
	expect(vm.checkedIds).toEqual({ 1: true });
	expect(vm.activateEdit).toBe(true);
});

describe('GeographySelectionPopup.groupedByRootCaption');

it('agrupa por RootCaption (o por su propio nombre si no lo tiene) conservando el orden', () => {
	const { vm } = setup(GeographySelectionPopup);
	vm.allGeographies = [
		geo(1, null, 'Provincias', 'Censo'), geo(2, 1, 'Dptos', 'Censo'), geo(3, null, 'Radios'),
	];
	const groups = vm.groupedByRootCaption;
	expect(groups.map(function (g) { return g.caption; })).toEqual(['Censo', 'Radios']);
	expect(groups[0].items.map(function (g) { return g.Id; })).toEqual([1, 2]);
	expect(groups[1].items.map(function (g) { return g.Id; })).toEqual([3]);
});

describe('GeographySelectionPopup: selección');

it('las asociadas arrancan marcadas y no cuentan como selección nueva', () => {
	const { vm } = setup(GeographySelectionPopup);
	vm.show([geo(1, null, 'A'), geo(2, null, 'B')], [1]);
	expect(vm.isAlreadyAssociated(1)).toBe(true);
	expect(vm.isAlreadyAssociated(2)).toBe(false);
	expect(vm.getNewlyCheckedIds()).toEqual([]);
	expect(vm.hasNewSelection).toBe(false);
});

it('al tildar otra geografía hay selección nueva, como número', () => {
	const { vm } = setup(GeographySelectionPopup);
	vm.show([geo(1, null, 'A'), geo(2, null, 'B')], [1]);
	vm.checkedIds = { 1: true, 2: true };
	expect(vm.getNewlyCheckedIds()).toEqual([2]);
	expect(vm.hasNewSelection).toBe(true);
});

it('las geografías destildadas no cuentan', () => {
	const { vm } = setup(GeographySelectionPopup);
	vm.show([geo(1, null, 'A'), geo(2, null, 'B')], []);
	vm.checkedIds = { 1: false, 2: true };
	expect(vm.getNewlyCheckedIds()).toEqual([2]);
});

it('accept cierra el popup y avisa con los ids recién elegidos', () => {
	const { vm } = setup(GeographySelectionPopup);
	vm.show([geo(1, null, 'A'), geo(2, null, 'B'), geo(3, null, 'C')], [1]);
	vm.checkedIds = { 1: true, 2: true, 3: true };
	vm.accept();
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'selected', args: [[2, 3]] }]);
});

describeEscapeHandling(GeographySelectionPopup, 'GeographySelectionPopup', 'activateEdit');

// ---------------------------------------------------------------------

describe('ClippingRegionSelectionPopup.show');

it('toma la lista, recuerda las asociadas y las deja tildadas', () => {
	const { vm } = setup(ClippingRegionSelectionPopup);
	const list = [{ Id: 1, Caption: 'A', Level: 0 }, { Id: 2, Caption: 'B', Level: 1 }];
	vm.show(list, [2]);
	expect(vm.flatList).toBe(list);
	expect(vm.associatedIds).toEqual([2]);
	expect(vm.checkedIds).toEqual({ 2: true });
	expect(vm.activateEdit).toBe(true);
});

describe('ClippingRegionSelectionPopup: formato y selección');

it('formatClippingRegion agrega la versión separada por coma', () => {
	const { vm } = setup(ClippingRegionSelectionPopup);
	expect(vm.formatClippingRegion({ Caption: 'Provincias' })).toBe('Provincias');
	expect(vm.formatClippingRegion({ Caption: 'Provincias', Version: '2022' })).toBe('Provincias, 2022');
});

it('solo cuenta como selección nueva lo tildado que no estaba asociado', () => {
	const { vm } = setup(ClippingRegionSelectionPopup);
	vm.show([{ Id: 1 }, { Id: 2 }], [1]);
	expect(vm.isAlreadyAssociated(1)).toBe(true);
	expect(vm.hasNewSelection).toBe(false);
	vm.checkedIds = { 1: true, 2: true };
	expect(vm.getNewlyCheckedIds()).toEqual([2]);
	expect(vm.hasNewSelection).toBe(true);
});

it('accept cierra el popup y avisa con los ids recién elegidos', () => {
	const { vm } = setup(ClippingRegionSelectionPopup);
	vm.show([{ Id: 1 }, { Id: 2 }, { Id: 3 }], [1]);
	vm.checkedIds = { 1: true, 2: false, 3: true };
	vm.accept();
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'selected', args: [[3]] }]);
});

describeEscapeHandling(ClippingRegionSelectionPopup, 'ClippingRegionSelectionPopup', 'activateEdit');
