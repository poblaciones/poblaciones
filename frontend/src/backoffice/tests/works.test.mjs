import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import Works from '@/backoffice/views/Work/Works.vue';

function makeInvoker() {
	return {
		messages: [],
		confirms: [],
		confirmDos: [],
		doMessage(title, context, method, ...args) {
			this.messages.push({ title: title, method: method, args: args });
			return Promise.resolve();
		},
		confirm(title, message, callback) {
			this.confirms.push({ title: title, message: message, callback: callback });
		},
		confirmDo(title, message, context, method, id, callback) {
			this.confirmDos.push({ title: title, message: message, method: method, id: id, callback: callback });
		},
	};
}

function makeStepper() {
	return {
		startUrl: null,
		stepUrl: null,
		title: null,
		useClose: null,
		started: 0,
		closed: 0,
		setTitle(text) {
			this.title = text;
		},
		Start() {
			this.started++;
			return Promise.resolve();
		},
		Close() {
			this.closed++;
		},
	};
}

function makeItem(id, overrides) {
	return Object.assign({
		Id: id, Caption: 'Obra ' + id, Type: 'R', IsArchived: false, IsDeleted: false, IsExample: false,
		IsPrivate: false, IsIndexed: false, Privileges: 'E', DatasetCount: 1, GeorreferencedCount: 1, MetricCount: 2,
		HasChanges: 0, Updated: null, MetadataLastOnline: null, UpdateUser: null, LastOnlineUser: null, Metadata: {},
	}, overrides);
}

function setup(filter, items, settings) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	context.CartographiesStarted = true;
	context.Cartographies = items || [];
	context.Configuration = { Help: { guia: 'x' } };
	context.User = { Privileges: 'P', Firstname: 'Ana', Lastname: 'Pérez', Email: 'ana@x.org' };
	const stored = settings || {};
	const db = browser.window.Db;
	db.saved = [];
	db.released = [];
	db.loadWorks = 0;
	db.GetUserSetting = function (key, defaultValue) {
		if (stored[key] !== undefined) {
			return stored[key];
		}
		return defaultValue;
	};
	db.SetUserSetting = function (key, value) { db.saved.push([key, value]); };
	db.ReleaseWork = function (id) { db.released.push(id); };
	db.LoadWorks = function () { db.loadWorks++; };
	db.GetStartWorkDeleteUrl = function (id) { return 'delete-start-' + id; };
	db.GetStepWorkDeleteUrl = function () { return 'delete-step'; };
	db.GetStartWorkPublishUrl = function (id) { return 'publish-start-' + id; };
	db.GetStepWorkPublishUrl = function () { return 'publish-step'; };
	db.GetStartWorkRevokeUrl = function (id) { return 'revoke-start-' + id; };
	db.GetStepWorkRevokeUrl = function () { return 'revoke-step'; };
	db.GetStartWorkCloneUrl = function (id, name) { return 'clone-start-' + id + '-' + name; };
	db.GetStepWorkCloneUrl = function () { return 'clone-step'; };
	db.CreateWork = function () {};
	db.ArchiveWork = function () {};
	db.UnarchiveWork = function () {};
	db.PromoteExample = function () {};
	db.DemoteExample = function () {};
	db.PromoteWork = function () {};
	db.DemoteWork = function () {};
	db.HideExample = function () {};
	const invoker = makeInvoker();
	const stepper = makeStepper();
	const deleteStepper = makeStepper();
	const pushed = [];
	const vm = mountLite(Works, {
		propsData: { filter: filter },
		mocks: {
			$refs: { invoker: invoker, stepper: stepper, DeleteStepper: deleteStepper, activeGrid: { openEditTab() { return true; } } },
			$router: { push(destination) { pushed.push(destination); return { catch() {} }; } },
		},
	});
	return { browser: browser, vm: vm, db: db, context: context, invoker: invoker, stepper: stepper, deleteStepper: deleteStepper, pushed: pushed };
}

function spy(vm, name) {
	const calls = [];
	vm[name] = function (...args) { calls.push(args); };
	return calls;
}

function waitTimers() {
	return new Promise(function (resolve) { setTimeout(resolve, 20); });
}

describe('Works: estado inicial y propiedades');

it('createEnabled es verdadero por defecto y el estado arranca cerrado y sin trabajos', () => {
	const { vm } = setup('R');
	expect(vm.createEnabled).toBeTruthy();
	expect(vm.activateNewWork).toBeFalsy();
	expect(vm.newWorkName).toBe('');
	expect(vm.examplesExpanded).toBeTruthy();
	expect(vm.isBulkDeleting).toBeFalsy();
	expect(vm.bulkDeleteQueue).toEqual([]);
});

it('al montar lee del usuario si los bloques de ejemplos y archivadas están expandidos', () => {
	const { vm } = setup('R', [], { examplesExpanded: '0', 'worksArchivedExpanded-R': '0' });
	Works.mounted.call(vm);
	expect(vm.examplesExpanded).toBeFalsy();
	expect(vm.archivedExpanded).toBeFalsy();
});

it('al montar expande ambos bloques si no hay preferencia guardada', () => {
	const { vm } = setup('R');
	Works.mounted.call(vm);
	expect(vm.examplesExpanded).toBeTruthy();
	expect(vm.archivedExpanded).toBeTruthy();
});

it('la preferencia de archivadas es independiente para cada filtro', () => {
	const { vm } = setup('P', [], { 'worksArchivedExpanded-R': '0' });
	Works.mounted.call(vm);
	expect(vm.archivedExpanded).toBeTruthy();
});

it('al cambiar la expansión guarda la preferencia como 1 o 0', () => {
	const { vm, db } = setup('R');
	vm.examplesExpanded = false;
	Works.watch.examplesExpanded.call(vm);
	vm.archivedExpanded = true;
	Works.watch.archivedExpanded.call(vm);
	expect(db.saved).toEqual([['examplesExpanded', '0'], ['worksArchivedExpanded-R', '1']]);
});

it('toggle y toggleArchived invierten la expansión', () => {
	const { vm } = setup('R');
	vm.toggle();
	vm.toggleArchived();
	expect(vm.examplesExpanded).toBeFalsy();
	expect(vm.archivedExpanded).toBeFalsy();
});

describe('Works: listas');

const ITEMS = [
	makeItem(1),
	makeItem(2, { IsArchived: true }),
	makeItem(3, { IsExample: true }),
	makeItem(4, { Type: 'P' }),
	makeItem(5, { IsDeleted: true }),
	makeItem(6),
];

it('calculateList separa activas, archivadas y ejemplos del filtro actual, sin las eliminadas', () => {
	const { vm } = setup('R', ITEMS);
	expect(vm.list.map(function (item) { return item.Id; })).toEqual([1, 6]);
	expect(vm.listArchived.map(function (item) { return item.Id; })).toEqual([2]);
	expect(vm.listExamples.map(function (item) { return item.Id; })).toEqual([3]);
});

it('con el filtro P solo muestra los datos públicos', () => {
	const { vm } = setup('P', ITEMS);
	expect(vm.list.map(function (item) { return item.Id; })).toEqual([4]);
});

it('los ejemplos que el usuario ocultó no se listan', () => {
	const { vm } = setup('R', ITEMS, { work_example_hidden_3: '1' });
	expect(vm.listExamples).toEqual([]);
});

it('sin cartografías cargadas las listas están vacías', () => {
	const { vm, context } = setup('R');
	context.Cartographies = null;
	expect(vm.list).toEqual([]);
	expect(vm.calculateList(true, false)).toEqual([]);
});

it('showingWelcome solo es verdadero con la carga iniciada y sin trabajos activos', () => {
	const { vm, context } = setup('R', []);
	expect(vm.showingWelcome).toBeTruthy();
	context.CartographiesStarted = false;
	expect(vm.showingWelcome).toBeFalsy();
	context.CartographiesStarted = true;
	context.Cartographies = [makeItem(1)];
	expect(vm.showingWelcome).toBeFalsy();
});

it('lastest devuelve los cuatro trabajos con fecha más reciente, dejando al final los que no tienen fecha', () => {
	const items = [
		makeItem(1, { Updated: '2024-01-01 10:00:00' }),
		makeItem(2, { Updated: '2024-03-01 10:00:00' }),
		makeItem(3),
		makeItem(4, { Updated: '2024-02-01 10:00:00', MetadataLastOnline: '2024-05-01 10:00:00' }),
		makeItem(5, { Updated: '2023-12-01 10:00:00' }),
	];
	const { vm } = setup('R', items);
	expect(vm.lastest.map(function (item) { return item.Id; })).toEqual([4, 2, 1, 5]);
});

describe('Works: etiquetas según el filtro');

it('entityName y newLabel describen cartografías o datos públicos', () => {
	const regular = setup('R').vm;
	expect(regular.entityName).toEqual({ single: 'cartografía', plural: 'cartografías', one: 'una', article: 'la' });
	expect(regular.newLabel).toBe('Nueva cartografía');
	const publicData = setup('P').vm;
	expect(publicData.entityName).toEqual({ single: 'datos públicos', plural: 'datos públicos', one: '', article: 'los' });
	expect(publicData.newLabel).toBe('Nuevos datos públicos');
});

it('con un filtro desconocido entityName lanza un aviso que lo nombra y newLabel lo marca', () => {
	const { vm } = setup('X');
	let thrown = null;
	try {
		vm.entityName;
	} catch (e) {
		thrown = e;
	}
	expect(thrown).toBe('(entidad desconocida: X)');
	expect(vm.newLabel).toBe('(entidad desconocida)');
});

it('canCreate exige poder crear datos públicos solo con el filtro P', () => {
	expect(setup('R').vm.canCreate).toBeTruthy();
	expect(setup('P').vm.canCreate).toBeFalsy();
	const { vm, context } = setup('P');
	context.User.Privileges = 'E';
	context.CanCreatePublicData = function () { return true; };
	expect(vm.canCreate).toBeTruthy();
});

describe('Works: utilidades');

it('ocompare ordena nulos primero, compara textos y números y devuelve 0 si son iguales', () => {
	const { vm } = setup('R');
	expect(vm.ocompare('a', 'a')).toBe(0);
	expect(vm.ocompare(null, 'a')).toBe(-1);
	expect(vm.ocompare('a', null)).toBe(1);
	expect(vm.ocompare('a', 'b')).toBe(-1);
	expect(vm.ocompare('b', 'a')).toBe(1);
	expect(vm.ocompare(1, 2)).toBe(-1);
	expect(vm.ocompare(3, 2)).toBe(1);
});

it('arma la ruta relativa y la dirección absoluta del trabajo', () => {
	const { vm } = setup('R');
	expect(vm.getWorkUri({ Id: 8 })).toBe('/cartographies/8');
	expect(vm.getWorkHref({ Id: 8 })).toBe('/users/#/cartographies/8');
});

it('select navega a la ruta del trabajo', () => {
	const { vm, pushed } = setup('R');
	vm.select({ Id: 8 });
	expect(pushed).toEqual([{ path: '/cartographies/8' }]);
});

it('logInfo y status delegan en el formato y el estado de la lista', () => {
	const { vm } = setup('R');
	expect(vm.logInfo(makeItem(1))).toBe('');
	expect(vm.logInfo(makeItem(1, { Updated: '2024-01-01 10:00:00', UpdateUser: 'Ana' })).startsWith('Editada ')).toBeTruthy();
	expect(vm.status(makeItem(1, { Metadata: null })).tag).toBe('unpublished');
});

describe('Works: columnas de la grilla');

it('define las columnas Título, Modificado y Estado', () => {
	const { vm } = setup('R');
	expect(vm.gridColumns.map(function (column) { return column.property; })).toEqual(['Caption', 'Modificado', 'Estado']);
	expect(vm.gridColumns[0].href({ Id: 4 })).toBe('/users/#/cartographies/4');
});

it('Modificado ordena por la fecha válida y muestra el historial solo si hay datos', () => {
	const { vm } = setup('R');
	const column = vm.gridColumns[1];
	const edited = makeItem(1, { Updated: '2024-01-01 10:00:00', UpdateUser: 'Ana' });
	expect(column.sortType).toBe('date');
	expect(column.sortValue(edited)).toBe('2024-01-01 10:00:00');
	expect(column.icons[0].show(edited)).toBeTruthy();
	expect(column.icons[0].show(makeItem(2))).toBeFalsy();
	expect(column.icons[0].tooltip(edited).startsWith('Editada ')).toBeTruthy();
});

it('Modificado concuerda el singular y el plural en los tooltips de datasets e indicadores', () => {
	const { vm } = setup('R');
	const icons = vm.gridColumns[1].icons;
	expect(icons[1].text(makeItem(1, { DatasetCount: 3 }))).toBe(3);
	expect(icons[1].tooltip(makeItem(1, { DatasetCount: 1 }))).toBe('1 dataset');
	expect(icons[1].tooltip(makeItem(1, { DatasetCount: 2 }))).toBe('2 datasets');
	expect(icons[2].tooltip(makeItem(1, { MetricCount: 1 }))).toBe('1 indicador');
	expect(icons[2].tooltip(makeItem(1, { MetricCount: 0 }))).toBe('0 indicadores');
});

it('Estado toma ícono, color y tooltip del estado de la lista y no es ordenable', () => {
	const { vm } = setup('R');
	const column = vm.gridColumns[2];
	const item = makeItem(1, { Metadata: null });
	expect(column.sortable).toBeFalsy();
	expect(column.icon(item)).toBe(vm.status(item).icon);
	expect(column.color(item)).toBe(vm.status(item).color);
	expect(column.tooltip(item)).toBe(vm.status(item).label);
});

it('Estado marca los trabajos privados y avisa de los publicados sin indexar', () => {
	const { vm } = setup('R');
	const icons = vm.gridColumns[2].icons;
	expect(icons[0].show(makeItem(1, { IsPrivate: true }))).toBeTruthy();
	expect(icons[0].show(makeItem(1, { IsPrivate: false }))).toBeFalsy();
	const published = makeItem(1, { MetadataLastOnline: '2024-01-01 10:00:00', IsIndexed: false });
	expect(icons[1].show(published)).toBeTruthy();
	expect(icons[1].show(makeItem(1, { MetadataLastOnline: '2024-01-01', IsIndexed: true }))).toBeFalsy();
	expect(icons[1].show(makeItem(1, { MetadataLastOnline: '2024-01-01', IsPrivate: true }))).toBeFalsy();
	expect(icons[1].show(makeItem(1, { Metadata: null }))).toBeFalsy();
});

describe('Works: acciones de la grilla');

function findAction(actions, caption) {
	return actions.find(function (action) { return action.caption === caption; });
}

it('lista las acciones comunes en orden y agrega Archivar o Desarchivar según la lista', () => {
	const { vm } = setup('R');
	const base = ['Consultar', 'Publicar', 'Revocar publicación', 'Modificar', 'Duplicar',
		'Promover a Dato público', 'Convertir a ejemplo', 'Convertir en Cartografía'];
	expect(vm.baseWorkActions.map(function (action) { return action.caption; })).toEqual(base);
	expect(vm.activeActions.map(function (action) { return action.caption; })).toEqual(base.concat(['Archivar']));
	expect(vm.archivedActions.map(function (action) { return action.caption; })).toEqual(base.concat(['Desarchivar']));
	expect(findAction(vm.activeActions, 'Archivar').multiSelect).toBeTruthy();
});

it('Consultar se habilita solo sin permiso de edición y Modificar y Duplicar solo con él', () => {
	const { vm } = setup('R');
	const readOnly = makeItem(1, { Privileges: 'V' });
	const editable = makeItem(1, { Privileges: 'E' });
	expect(findAction(vm.baseWorkActions, 'Consultar').isEnabled(readOnly)).toBeTruthy();
	expect(findAction(vm.baseWorkActions, 'Consultar').isEnabled(editable)).toBeFalsy();
	expect(findAction(vm.baseWorkActions, 'Modificar').isEnabled(editable)).toBeTruthy();
	expect(findAction(vm.baseWorkActions, 'Modificar').isEnabled(readOnly)).toBeFalsy();
	expect(findAction(vm.baseWorkActions, 'Duplicar').isEnabled(editable)).toBeTruthy();
});

it('Publicar y Revocar dependen de que haya cambios o publicación previa', () => {
	const { vm } = setup('R');
	const never = makeItem(1, { MetadataLastOnline: null, HasChanges: 0 });
	const clean = makeItem(1, { MetadataLastOnline: '2024-01-01', HasChanges: 0 });
	const publish = findAction(vm.baseWorkActions, 'Publicar');
	const revoke = findAction(vm.baseWorkActions, 'Revocar publicación');
	expect(publish.isEnabled(never)).toBeTruthy();
	expect(publish.isEnabled(clean)).toBeFalsy();
	expect(revoke.isEnabled(never)).toBeFalsy();
	expect(revoke.isEnabled(clean)).toBeTruthy();
});

it('las acciones de promoción dependen de los privilegios y del tipo del trabajo', () => {
	const { vm, context } = setup('R');
	context.User.Privileges = 'A';
	context.IsAdmin = function () { return true; };
	context.CanCreatePublicData = function () { return true; };
	const promote = findAction(vm.baseWorkActions, 'Promover a Dato público');
	const example = findAction(vm.baseWorkActions, 'Convertir a ejemplo');
	const demote = findAction(vm.baseWorkActions, 'Convertir en Cartografía');
	expect(promote.isEnabled(makeItem(1, { Type: 'R' }))).toBeTruthy();
	expect(example.isEnabled(makeItem(1, { Type: 'R' }))).toBeTruthy();
	expect(demote.isEnabled(makeItem(1, { Type: 'R' }))).toBeFalsy();
	expect(demote.isEnabled(makeItem(1, { Type: 'P' }))).toBeTruthy();
});

it('cada acción invoca la apertura de la solapa o la acción seleccionada que le corresponde', () => {
	const { vm } = setup('R');
	const selected = spy(vm, 'actionSelected');
	const opened = [];
	const grid = { openEditTab(item) { opened.push(item); } };
	const item = makeItem(1);
	const expected = {
		'Publicar': 'PUBLISH', 'Revocar publicación': 'REVOKE', 'Duplicar': 'DUPLICATE',
		'Promover a Dato público': 'PROMOTE', 'Convertir a ejemplo': 'PROMOTEEXAMPLE', 'Convertir en Cartografía': 'DEMOTE',
	};
	for (const caption of Object.keys(expected)) {
		findAction(vm.baseWorkActions, caption).onClick(grid, item);
	}
	expect(selected.map(function (call) { return call[0]; })).toEqual(Object.values(expected));
	findAction(vm.baseWorkActions, 'Consultar').onClick(grid, item);
	findAction(vm.baseWorkActions, 'Modificar').onClick(grid, item);
	expect(opened).toHaveLength(2);
});

it('onRowClick abre la solapa de edición del trabajo', () => {
	const { vm } = setup('R');
	const opened = [];
	vm.onRowClick({ openEditTab(item) { opened.push(item); } }, { Id: 1 });
	expect(opened).toEqual([{ Id: 1 }]);
});

it('Archivar y Desarchivar delegan en los enrutadores de la grilla', () => {
	const { vm } = setup('R');
	const archive = spy(vm, 'onArchiveAction');
	const unarchive = spy(vm, 'onUnarchiveAction');
	const grid = {};
	findAction(vm.activeActions, 'Archivar').onClick(grid, [1]);
	findAction(vm.archivedActions, 'Desarchivar').onClick(grid, [2]);
	expect(archive).toEqual([[grid, [1]]]);
	expect(unarchive).toEqual([[grid, [2]]]);
});

it('los permisos de eliminación distinguen la lista activa de la archivada', () => {
	const { vm } = setup('R');
	const administered = makeItem(1, { Privileges: 'A' });
	expect(vm.canDeleteActive(administered)).toBeTruthy();
	expect(vm.canDeleteArchived(administered)).toBeTruthy();
	expect(vm.canDeleteActive(makeItem(1, { Privileges: 'E' }))).toBeFalsy();
});

describe('Works: enrutado de acciones');

it('actionSelected despacha cada código a su manejador', () => {
	const { vm } = setup('R');
	const handlers = {
		VIEW: 'select', EDIT: 'select', PUBLISH: 'onPublish', PROMOTEEXAMPLE: 'onPromoteExample',
		DEMOTEEXAMPLE: 'onDemoteExample', REVOKE: 'onRevoke', PROMOTE: 'onPromotePublic', DEMOTE: 'onDemotePublic',
		ARCHIVE: 'onArchive', UNARCHIVE: 'onUnarchive', PURGE: 'onPurge', RESTORE: 'onRestore',
	};
	const spies = {};
	for (const name of new Set(Object.values(handlers))) {
		spies[name] = spy(vm, name);
	}
	const item = makeItem(1);
	for (const code of Object.keys(handlers)) {
		vm.actionSelected(code, item);
	}
	expect(spies.select).toHaveLength(2);
	for (const name of Object.keys(spies)) {
		if (name !== 'select') {
			expect(spies[name]).toHaveLength(1);
		}
	}
});

it('DELETE elimina un ejemplo con su propio manejador y el resto con el común', () => {
	const { vm } = setup('R');
	const deleteExample = spy(vm, 'onDeleteExample');
	const deleteWork = spy(vm, 'onDelete');
	vm.actionSelected('DELETE', makeItem(1, { IsExample: true }));
	vm.actionSelected('DELETE', makeItem(2));
	expect(deleteExample).toHaveLength(1);
	expect(deleteWork).toHaveLength(1);
});

it('DUPLICATE informa si el ítem es un ejemplo y un código desconocido no hace nada', () => {
	const { vm } = setup('R');
	const duplicate = spy(vm, 'onDuplicate');
	const item = makeItem(1, { IsExample: true });
	vm.actionSelected('DUPLICATE', item);
	vm.actionSelected('OTRO', item);
	expect(duplicate).toEqual([[item, true]]);
});

it('onArchiveAction y onUnarchiveAction separan la selección múltiple de la individual', () => {
	const { vm } = setup('R');
	const bulkArchive = spy(vm, 'startBulkArchive');
	const single = spy(vm, 'onArchive');
	const bulkUnarchive = spy(vm, 'startBulkUnarchive');
	const singleUnarchive = spy(vm, 'onUnarchive');
	let cleared = 0;
	const grid = { clearSelection() { cleared++; } };
	vm.onArchiveAction(grid, [makeItem(1), makeItem(2)]);
	vm.onArchiveAction(grid, makeItem(3));
	vm.onUnarchiveAction(grid, [makeItem(4)]);
	vm.onUnarchiveAction(grid, makeItem(5));
	expect(bulkArchive).toHaveLength(1);
	expect(single).toHaveLength(1);
	expect(bulkUnarchive).toHaveLength(1);
	expect(singleUnarchive).toHaveLength(1);
	bulkArchive[0][1]();
	bulkUnarchive[0][1]();
	expect(cleared).toBe(2);
});

it('onItemDelete elimina en lote una selección múltiple y de a uno un ítem', () => {
	const { vm } = setup('R');
	const bulk = spy(vm, 'runBulkDelete');
	const single = spy(vm, 'runDelete');
	vm.onItemDelete([makeItem(1)]);
	vm.onItemDelete(makeItem(2));
	expect(bulk).toHaveLength(1);
	expect(single).toHaveLength(1);
});

it('deleteConfirmMessage describe la eliminación de uno o de varios', () => {
	const { vm } = setup('R');
	expect(vm.deleteConfirmMessage(makeItem(1, { Caption: 'Mi obra' })))
		.toBe("Los datasets, indicadores y metadatos correspondientes a 'Mi obra' serán eliminados.");
	expect(vm.deleteConfirmMessage([makeItem(1), makeItem(2)]))
		.toBe('Los datasets, indicadores y metadatos de las 2 cartografías seleccionadas serán eliminados permanentemente. Esta operación no puede deshacerse.');
});

describe('Works: eliminación');

it('onDelete confirma con el nombre del trabajo y recién entonces lo elimina', () => {
	const { vm, invoker, deleteStepper } = setup('R');
	vm.onDelete(makeItem(7, { Caption: 'Mi obra' }));
	expect(invoker.confirms[0].title).toBe('Eliminar cartografía');
	expect(invoker.confirms[0].message.includes("'Mi obra'")).toBeTruthy();
	expect(deleteStepper.started).toBe(0);
	invoker.confirms[0].callback();
	expect(deleteStepper.started).toBe(1);
});

it('runDelete prepara el avance con las direcciones del trabajo y permite cerrarlo al terminar', () => {
	const { vm, deleteStepper } = setup('R');
	const item = makeItem(7);
	vm.runDelete(item);
	expect(vm.source === item).toBeTruthy();
	expect(deleteStepper.startUrl).toBe('delete-start-7');
	expect(deleteStepper.stepUrl).toBe('delete-step');
	expect(deleteStepper.title).toBe('Eliminando cartografía');
	expect(deleteStepper.useClose).toBeTruthy();
	expect(deleteStepper.started).toBe(1);
});

it('runBulkDelete arma la cola y arranca por el primero, informando el avance', () => {
	const { vm, deleteStepper } = setup('R');
	vm.runBulkDelete([makeItem(1), makeItem(2), makeItem(3)]);
	expect(vm.isBulkDeleting).toBeTruthy();
	expect(vm.bulkDeleteTotal).toBe(3);
	expect(vm.bulkDeleteIndex).toBe(0);
	expect(deleteStepper.startUrl).toBe('delete-start-1');
	expect(deleteStepper.title).toBe('Eliminando cartografías (1/3)');
	expect(deleteStepper.useClose).toBeFalsy();
	expect(deleteStepper.started).toBe(1);
});

it('onDeleteComplete quita el trabajo eliminado de las cartografías', () => {
	const first = makeItem(1);
	const second = makeItem(2);
	const { vm, context } = setup('R', [first, second]);
	vm.source = first;
	vm.onDeleteComplete();
	expect(context.Cartographies).toEqual([second]);
});

it('en un borrado en lote pasa al siguiente tras cerrar el avance actual', async () => {
	const items = [makeItem(1), makeItem(2)];
	const { vm, deleteStepper } = setup('R', items.slice());
	vm.runBulkDelete(items);
	vm.onDeleteComplete();
	expect(vm.bulkDeleteIndex).toBe(1);
	await waitTimers();
	await flushPromises();
	expect(deleteStepper.closed).toBe(1);
	expect(deleteStepper.title).toBe('Eliminando cartografías (2/2)');
	expect(deleteStepper.startUrl).toBe('delete-start-2');
	expect(deleteStepper.started).toBe(2);
});

it('al terminar el último del lote deja el avance abierto para cierre manual', () => {
	const items = [makeItem(1)];
	const { vm, deleteStepper } = setup('R', items.slice());
	vm.runBulkDelete(items);
	vm.onDeleteComplete();
	expect(deleteStepper.useClose).toBeTruthy();
	expect(vm.isBulkDeleting).toBeFalsy();
	expect(deleteStepper.closed).toBe(0);
});

describe('Works: archivo y ejemplos');

it('onArchive y onUnarchive marcan el ítem una vez confirmada la operación', async () => {
	const { vm, invoker, db } = setup('R');
	const item = makeItem(4);
	vm.onArchive(item);
	await flushPromises();
	expect(item.IsArchived).toBeTruthy();
	expect(invoker.messages[0].title).toBe('Archivando cartografía');
	expect(invoker.messages[0].method === db.ArchiveWork).toBeTruthy();
	expect(invoker.messages[0].args).toEqual([4]);
	vm.onUnarchive(item);
	await flushPromises();
	expect(item.IsArchived).toBeFalsy();
	expect(invoker.messages[1].method === db.UnarchiveWork).toBeTruthy();
});

it('onPromoteExample y onDemoteExample marcan o desmarcan el ejemplo', async () => {
	const { vm, invoker } = setup('R');
	const item = makeItem(4);
	vm.onPromoteExample(item);
	await flushPromises();
	expect(item.IsExample).toBeTruthy();
	expect(invoker.messages[0].title).toBe('Creando ejemplo');
	vm.onDemoteExample(item);
	await flushPromises();
	expect(item.IsExample).toBeFalsy();
	expect(invoker.messages[1].title).toBe('Quitando ejemplo');
});

it('el archivo en lote confirma con la cantidad y luego archiva de a uno informando el avance', async () => {
	const items = [makeItem(1), makeItem(2), makeItem(3)];
	const { vm, invoker, db } = setup('R');
	let confirmed = 0;
	vm.startBulkArchive(items, function () { confirmed++; });
	expect(invoker.confirms[0].title).toBe('Archivar 3 cartografías');
	expect(invoker.confirms[0].message).toBe('Las 3 cartografías seleccionadas serán archivadas.');
	invoker.confirms[0].callback();
	await flushPromises();
	expect(confirmed).toBe(1);
	expect(invoker.messages.map(function (message) { return message.title; })).toEqual([
		'Archivando cartografías (1/3)', 'Archivando cartografías (2/3)', 'Archivando cartografías (3/3)',
	]);
	expect(invoker.messages[0].method === db.ArchiveWork).toBeTruthy();
	expect(invoker.messages.map(function (message) { return message.args[0]; })).toEqual([1, 2, 3]);
	expect(items.every(function (item) { return item.IsArchived; })).toBeTruthy();
});

it('el desarchivo en lote reactiva de a uno y confirma con su propio texto', async () => {
	const items = [makeItem(1, { IsArchived: true }), makeItem(2, { IsArchived: true })];
	const { vm, invoker, db } = setup('R');
	vm.startBulkUnarchive(items);
	expect(invoker.confirms[0].title).toBe('Reactivar 2 cartografías');
	expect(invoker.confirms[0].message).toBe('Las 2 cartografías archivadas serán reactivadas.');
	invoker.confirms[0].callback();
	await flushPromises();
	expect(invoker.messages[0].title).toBe('Reactivando cartografías (1/2)');
	expect(invoker.messages[0].method === db.UnarchiveWork).toBeTruthy();
	expect(items.every(function (item) { return !item.IsArchived; })).toBeTruthy();
});

describe('Works: promoción, publicación y revocación');

it('promover a dato público confirma y, al aceptar, cambia el tipo del ítem', () => {
	const { vm, invoker, db } = setup('R');
	const item = makeItem(5);
	vm.onPromotePublic(item);
	const confirmDo = invoker.confirmDos[0];
	expect(confirmDo.title).toBe('Promover cartografía');
	expect(confirmDo.method === db.PromoteWork).toBeTruthy();
	expect(confirmDo.id).toBe(5);
	confirmDo.callback();
	expect(item.Type).toBe('P');
	expect(vm.source === item).toBeTruthy();
});

it('revocar la promoción convierte el dato público en cartografía', () => {
	const { vm, invoker, db } = setup('P');
	const item = makeItem(5, { Type: 'P' });
	vm.onDemotePublic(item);
	expect(invoker.confirmDos[0].title).toBe('Revocar promoción de datos públicos');
	expect(invoker.confirmDos[0].method === db.DemoteWork).toBeTruthy();
	invoker.confirmDos[0].callback();
	expect(item.Type).toBe('R');
});

it('eliminar un ejemplo lo quita de las cartografías al confirmar', () => {
	const item = makeItem(5, { IsExample: true });
	const other = makeItem(6);
	const { vm, invoker, context, db } = setup('R', [item, other]);
	vm.onDeleteExample(item);
	expect(invoker.confirmDos[0].title).toBe('Eliminar ejemplo');
	expect(invoker.confirmDos[0].method === db.HideExample).toBeTruthy();
	invoker.confirmDos[0].callback();
	expect(context.Cartographies).toEqual([other]);
});

it('onPublish avisa y no publica si hay datasets sin georreferenciar', () => {
	const { vm, browser, stepper } = setup('R');
	vm.onPublish(makeItem(5, { DatasetCount: 3, GeorreferencedCount: 2 }));
	expect(browser.alerts).toEqual(['Todos los datasets deben estar georreferenciados para poder realizarse la publicación.']);
	expect(stepper.started).toBe(0);
});

it('onPublish inicia el avance y, al terminar, deja el ítem publicado y libera el trabajo cacheado', async () => {
	const { vm, stepper, db } = setup('R');
	const item = makeItem(5, { HasChanges: 1, PreviewId: 'p1' });
	vm.onPublish(item);
	expect(stepper.startUrl).toBe('publish-start-5');
	expect(stepper.stepUrl).toBe('publish-step');
	expect(stepper.title).toBe('Publicando cartografía');
	await flushPromises();
	expect(item.HasChanges).toBe(0);
	expect(item.UpdateUser).toBe('Ana Pérez');
	expect(item.LastOnlineUser).toBe('Ana Pérez');
	expect(item.PreviewId).toBeNull();
	expect(/^\d{4}-\d{2}-\d{2} /.test(item.MetadataLastOnline)).toBeTruthy();
	expect(/^\d{4}-\d{2}-\d{2} /.test(item.Updated)).toBeTruthy();
	expect(db.released).toEqual([5]);
});

it('onRevoke inicia el avance y, al terminar, quita la fecha de publicación y libera el trabajo', async () => {
	const { vm, stepper, db } = setup('R');
	const item = makeItem(5, { MetadataLastOnline: '2024-01-01 10:00:00', PreviewId: 'p1' });
	vm.onRevoke(item);
	expect(stepper.startUrl).toBe('revoke-start-5');
	expect(stepper.title).toBe('Revocando publicación');
	await flushPromises();
	expect(item.MetadataLastOnline).toBeNull();
	expect(item.PreviewId).toBeNull();
	expect(db.released).toEqual([5]);
});

describe('Works: alta y duplicado');

it('onNewWork abre el diálogo de alta con el nombre vacío', () => {
	const { vm } = setup('R');
	vm.newWorkName = 'viejo';
	vm.onNewWork();
	expect(vm.newWorkName).toBe('');
	expect(vm.activateNewWork).toBeTruthy();
});

it('onNewWorkStart sin nombre avisa y vuelve a abrir el diálogo', async () => {
	const { vm, browser, invoker } = setup('R');
	vm.newWorkName = '   ';
	vm.onNewWorkStart();
	expect(browser.alerts).toEqual(['Debe indicar un nombre.']);
	expect(invoker.messages).toHaveLength(0);
	await flushPromises();
	expect(vm.activateNewWork).toBeTruthy();
});

it('onNewWorkStart crea el trabajo con el nombre sin espacios sobrantes, lo abre y recarga el listado', async () => {
	const { vm, invoker, db } = setup('R');
	const opened = [];
	vm.$refs.activeGrid = { openEditTab(work) { opened.push(work); return true; } };
	invoker.doMessage = function (title, context, method, ...args) {
		invoker.messages.push({ title: title, method: method, args: args });
		return Promise.resolve({ Id: 9 });
	};
	vm.newWorkName = '  Mi obra  ';
	vm.onNewWorkStart();
	await flushPromises();
	expect(invoker.messages[0].title).toBe('Creando cartografía');
	expect(invoker.messages[0].method === db.CreateWork).toBeTruthy();
	expect(invoker.messages[0].args).toEqual(['Mi obra', 'R']);
	expect(opened).toEqual([{ Id: 9 }]);
	expect(db.loadWorks).toBe(1);
});

it('openCreatedWork navega en la pestaña actual si el navegador bloqueó la apertura', () => {
	const { vm, pushed } = setup('R');
	vm.$refs.activeGrid = { openEditTab() { return null; } };
	vm.openCreatedWork({ Id: 9 });
	expect(pushed).toEqual([{ path: '/cartographies/9' }]);
});

it('openCreatedWork no navega si la solapa se abrió', () => {
	const { vm, pushed } = setup('R');
	vm.openCreatedWork({ Id: 9 });
	expect(pushed).toHaveLength(0);
});

it('onDuplicate de un trabajo propio pide el nombre de la copia', () => {
	const { vm } = setup('R');
	const item = makeItem(3);
	vm.onDuplicate(item, false);
	expect(vm.source === item).toBeTruthy();
	expect(vm.activateSaveAs).toBeTruthy();
	expect(vm.newWorkName).toBe('');
});

it('onDuplicate de un ejemplo duplica directamente sin pedir nombre', () => {
	const { vm } = setup('R');
	const start = spy(vm, 'onDuplicateStart');
	vm.onDuplicate(makeItem(3), true);
	expect(vm.newWorkName).toBeNull();
	expect(vm.activateSaveAs).toBeFalsy();
	expect(start).toHaveLength(1);
});

it('onDuplicateStart sin nombre avisa y vuelve a abrir el diálogo', async () => {
	const { vm, browser, stepper } = setup('R');
	vm.source = makeItem(3);
	vm.newWorkName = '';
	vm.onDuplicateStart();
	expect(browser.alerts).toEqual(['Debe indicar un nombre.']);
	expect(stepper.started).toBe(0);
	await flushPromises();
	expect(vm.activateSaveAs).toBeTruthy();
});

it('onDuplicateStart inicia el avance de la copia y recarga el listado al terminar', async () => {
	const { vm, stepper, db } = setup('R');
	vm.source = makeItem(3);
	vm.newWorkName = 'Copia';
	vm.onDuplicateStart();
	expect(stepper.startUrl).toBe('clone-start-3-Copia');
	expect(stepper.stepUrl).toBe('clone-step');
	expect(stepper.title).toBe('Duplicando cartografía');
	await flushPromises();
	expect(db.loadWorks).toBe(1);
});

it('onDuplicateStart con nombre null (ejemplo) también inicia el avance', () => {
	const { vm, stepper } = setup('R');
	vm.source = makeItem(3);
	vm.newWorkName = null;
	vm.onDuplicateStart();
	expect(stepper.started).toBe(1);
});
