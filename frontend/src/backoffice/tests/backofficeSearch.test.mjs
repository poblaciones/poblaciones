import { describe, it, expect } from './_harness.mjs';
import { mountLite } from './fixtures.mjs';
import BackofficeSearch from '@/backoffice/components/BackofficeSearch.vue';

function mountSearch(propsData, mocks) {
	return mountLite(BackofficeSearch, { propsData: propsData, mocks: mocks });
}

const RESULTS = [
	{ id: 1, kind: 'metric', caption: 'Tasa', context: 'Dataset: Datos' },
	{ id: 2, kind: 'cartography', caption: 'Obra', context: '' },
	{ id: 3, kind: 'dataset', caption: 'Datos', context: 'Cartografía: Obra' },
	{ id: 4, kind: 'cartography', caption: 'Otra obra', context: '' },
];

describe('BackofficeSearch: propiedades y estado inicial');

it('arranca sin resultados, sin carga y con el texto de ayuda por defecto', () => {
	const vm = mountSearch({});
	expect(vm.results).toBeNull();
	expect(vm.truncatedKinds).toEqual([]);
	expect(vm.loading).toBeFalsy();
	expect(vm.failed).toBeFalsy();
	expect(vm.placeholder).toBe('Buscar cartografías, datasets o indicadores');
	expect(vm.query).toBe('');
	expect(vm.isOpen).toBeFalsy();
	expect(vm.highlightedIndex).toBe(-1);
	expect(vm.hasQuery).toBeFalsy();
});

describe('BackofficeSearch: grupos de resultados');

it('agrupa en el orden cartografías, datasets, indicadores, sin los grupos vacíos', () => {
	const vm = mountSearch({ results: RESULTS });
	expect(vm.groups.map(function (group) { return group.kind; })).toEqual(['cartography', 'dataset', 'metric']);
	expect(vm.groups[0].title).toBe('Cartografías');
	expect(vm.groups[0].items.map(function (item) { return item.id; })).toEqual([2, 4]);
	const onlyMetrics = mountSearch({ results: [RESULTS[0]] });
	expect(onlyMetrics.groups.map(function (group) { return group.kind; })).toEqual(['metric']);
});

it('marca como truncados los grupos que lo informa el servidor', () => {
	const vm = mountSearch({ results: RESULTS, truncatedKinds: ['dataset'] });
	expect(vm.groups.map(function (group) { return group.truncated; })).toEqual([false, true, false]);
});

it('sin resultados no hay grupos y flatItems recorre los grupos en orden', () => {
	expect(mountSearch({ results: null }).groups).toEqual([]);
	const vm = mountSearch({ results: RESULTS });
	expect(vm.flatItems.map(function (item) { return item.id; })).toEqual([2, 4, 3, 1]);
});

describe('BackofficeSearch: visibilidad del panel');

it('permanece cerrado mientras no está abierto', () => {
	expect(mountSearch({ results: RESULTS }).panelVisible).toBeFalsy();
});

it('abierto con resultados se muestra, y con resultados vacíos se muestra para informar que no hay', () => {
	const withResults = mountSearch({ results: RESULTS });
	withResults.isOpen = true;
	expect(withResults.panelVisible).toBeTruthy();
	const empty = mountSearch({ results: [] });
	empty.isOpen = true;
	expect(empty.panelVisible).toBeTruthy();
});

it('abierto sin resultados ni error permanece cerrado, y con error se muestra', () => {
	const vm = mountSearch({ results: null });
	vm.isOpen = true;
	expect(vm.panelVisible).toBeFalsy();
	const failed = mountSearch({ results: null, failed: true });
	failed.isOpen = true;
	expect(failed.panelVisible).toBeTruthy();
});

it('mientras carga conserva los resultados anteriores y no muestra mensajes', () => {
	const withPrevious = mountSearch({ results: RESULTS, loading: true });
	withPrevious.isOpen = true;
	expect(withPrevious.panelVisible).toBeTruthy();
	const withoutGroups = mountSearch({ results: [], loading: true });
	withoutGroups.isOpen = true;
	expect(withoutGroups.panelVisible).toBeFalsy();
});

it('expone el estado como texto para aria-expanded', () => {
	const vm = mountSearch({ results: RESULTS });
	expect(vm.ariaExpanded).toBe('false');
	vm.isOpen = true;
	expect(vm.ariaExpanded).toBe('true');
});

describe('BackofficeSearch: identificadores y títulos');

it('arma identificadores únicos de lista, grupo y opción a partir de la instancia', () => {
	const first = mountSearch({});
	const second = mountSearch({});
	expect(first.listId === second.listId).toBeFalsy();
	expect(first.groupId({ kind: 'dataset' })).toBe('bs-group-' + first._uid + '-dataset');
	expect(first.optionId({ kind: 'metric', id: 9 })).toBe('bs-option-' + first._uid + '-metric-9');
});

it('itemTitle agrega el contexto solo si existe', () => {
	const vm = mountSearch({});
	expect(vm.itemTitle({ caption: 'Tasa', context: 'Dataset: Datos' })).toBe('Tasa — Dataset: Datos');
	expect(vm.itemTitle({ caption: 'Obra', context: '' })).toBe('Obra');
	expect(vm.itemTitle({ caption: 'Obra' })).toBe('Obra');
});

describe('BackofficeSearch: escritura y selección');

it('onInput guarda el texto, abre el panel y emite la búsqueda', () => {
	const vm = mountSearch({});
	vm.onInput({ target: { value: 'pobl' } });
	expect(vm.query).toBe('pobl');
	expect(vm.hasQuery).toBeTruthy();
	expect(vm.isOpen).toBeTruthy();
	expect(vm.$emitted).toEqual([['search', 'pobl']]);
});

it('open y close abren y cierran el panel', () => {
	const vm = mountSearch({});
	vm.open();
	expect(vm.isOpen).toBeTruthy();
	vm.close();
	expect(vm.isOpen).toBeFalsy();
});

it('clear borra el texto, emite una búsqueda vacía y devuelve el foco al campo', () => {
	let focused = 0;
	const vm = mountSearch({}, { $refs: { input: { focus() { focused++; } } } });
	vm.query = 'pobl';
	vm.clear();
	expect(vm.query).toBe('');
	expect(vm.$emitted).toEqual([['search', '']]);
	expect(focused).toBe(1);
});

it('select cierra el panel y emite el resultado elegido', () => {
	const vm = mountSearch({});
	vm.isOpen = true;
	vm.select(RESULTS[0]);
	expect(vm.isOpen).toBeFalsy();
	expect(vm.$emitted).toEqual([['select', RESULTS[0]]]);
});

describe('BackofficeSearch: clics en un resultado');

function makeClick(modifiers) {
	return Object.assign({ ctrlKey: false, metaKey: false, shiftKey: false, prevented: 0, preventDefault() { this.prevented++; } }, modifiers);
}

it('un clic común en un resultado con enlace lo selecciona y evita abrir el enlace', () => {
	const vm = mountSearch({});
	const event = makeClick({});
	vm.onItemClick(event, { id: 1, kind: 'dataset', href: '/x' });
	expect(event.prevented).toBe(1);
	expect(vm.$emitted).toHaveLength(1);
});

it('con Ctrl, Cmd o Shift deja que el navegador abra el enlace y no selecciona', () => {
	const vm = mountSearch({});
	for (const key of ['ctrlKey', 'metaKey', 'shiftKey']) {
		const event = makeClick({ [key]: true });
		vm.onItemClick(event, { id: 1, kind: 'dataset', href: '/x' });
		expect(event.prevented).toBe(0);
	}
	expect(vm.$emitted).toHaveLength(0);
});

it('un resultado sin enlace siempre se selecciona, aun con tecla modificadora', () => {
	const vm = mountSearch({});
	const event = makeClick({ ctrlKey: true });
	vm.onItemClick(event, { id: 1, kind: 'dataset' });
	expect(event.prevented).toBe(1);
	expect(vm.$emitted).toHaveLength(1);
});

describe('BackofficeSearch: navegación por teclado');

function mountOpen(propsData, mocks) {
	const defaults = { $el: { querySelector() { return null; } } };
	const vm = mountSearch(Object.assign({ results: RESULTS }, propsData), Object.assign(defaults, mocks));
	vm.isOpen = true;
	return vm;
}

it('highlight resalta el ítem y isHighlighted lo reconoce', () => {
	const vm = mountOpen({});
	vm.highlight(vm.flatItems[2]);
	expect(vm.highlightedIndex).toBe(2);
	expect(vm.isHighlighted(vm.flatItems[2])).toBeTruthy();
	expect(vm.isHighlighted(vm.flatItems[0])).toBeFalsy();
	expect(mountOpen({}).isHighlighted(RESULTS[0])).toBeFalsy();
});

it('moveHighlight con el panel cerrado solo lo abre', () => {
	const vm = mountSearch({ results: RESULTS });
	vm.moveHighlight(1);
	expect(vm.isOpen).toBeTruthy();
	expect(vm.highlightedIndex).toBe(-1);
});

it('moveHighlight avanza, retrocede y da la vuelta en los extremos', () => {
	const vm = mountOpen({});
	vm.moveHighlight(1);
	expect(vm.highlightedIndex).toBe(0);
	vm.moveHighlight(-1);
	expect(vm.highlightedIndex).toBe(3);
	vm.moveHighlight(1);
	expect(vm.highlightedIndex).toBe(0);
	vm.highlightedIndex = 3;
	vm.moveHighlight(1);
	expect(vm.highlightedIndex).toBe(0);
});

it('moveHighlight sin ítems que resaltar no cambia el índice', () => {
	const vm = mountOpen({ results: [] });
	vm.moveHighlight(1);
	expect(vm.highlightedIndex).toBe(-1);
});

it('moveHighlight desplaza la vista hasta la fila resaltada', async () => {
	let scrolled = null;
	const row = { scrollIntoView(options) { scrolled = options; } };
	const vm = mountOpen({}, { $el: { querySelector() { return row; } } });
	vm.moveHighlight(1);
	await Promise.resolve();
	expect(scrolled).toEqual({ block: 'nearest' });
});

it('scrollHighlightedIntoView no hace nada si no hay fila resaltada', () => {
	const vm = mountOpen({}, { $el: { querySelector() { return null; } } });
	vm.scrollHighlightedIntoView();
});

it('activeDescendantId indica la opción resaltada solo con el panel visible', () => {
	const vm = mountOpen({});
	expect(vm.activeDescendantId).toBeNull();
	vm.highlightedIndex = 2;
	expect(vm.activeDescendantId).toBe(vm.optionId(vm.flatItems[2]));
	vm.isOpen = false;
	expect(vm.activeDescendantId).toBeNull();
	vm.isOpen = true;
	vm.highlightedIndex = 9;
	expect(vm.activeDescendantId).toBeNull();
});

it('selectHighlighted elige el resaltado o, sin resaltado, el primero', () => {
	const vm = mountOpen({});
	vm.selectHighlighted();
	expect(vm.$emitted[0][1].id).toBe(2);
	const highlighted = mountOpen({});
	highlighted.highlightedIndex = 2;
	highlighted.selectHighlighted();
	expect(highlighted.$emitted[0][1].id).toBe(3);
});

it('selectHighlighted no hace nada con el panel cerrado o sin ítems', () => {
	const closed = mountSearch({ results: RESULTS });
	closed.selectHighlighted();
	expect(closed.$emitted).toHaveLength(0);
	const empty = mountOpen({ results: [] });
	empty.selectHighlighted();
	expect(empty.$emitted).toHaveLength(0);
});

it('al cambiar los resultados se descarta el resaltado', () => {
	const vm = mountOpen({});
	vm.highlightedIndex = 2;
	BackofficeSearch.watch.results.call(vm);
	expect(vm.highlightedIndex).toBe(-1);
});
