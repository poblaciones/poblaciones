import { describe, it, expect } from './_harness.mjs';
import Works from '@/admins/views/Works/Works.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, quiet, bodyOf,
	makeInvoker, makeStepper,
} from './fixtures.mjs';

const GET_WORKS = 'GET /services/admin/GetWorks';

function setup(options) {
	const opts = options || {};
	const env = setupGlobals({ privileges: opts.privileges || 'A' });
	const invoker = makeInvoker();
	const stepper = makeStepper();
	const deleteStepper = makeStepper();
	const vm = mountLite(Works, {
		props: { filter: opts.filter === undefined ? 'R' : opts.filter },
		refs: { invoker, stepper, DeleteStepper: deleteStepper },
	});
	return { env, vm, invoker, stepper, deleteStepper };
}

function work(overrides) {
	return Object.assign({
		Id: 5, Caption: 'Obra', Type: 'R', IsPrivate: false, IsIndexed: false, SegmentedCrawling: false,
		Metadata: {}, MetadataLastOnline: '2024-05-03T12:00:00', HasChanges: 0, Unfinished: false,
		DatasetCount: 2, GeorreferencedCount: 2,
	}, overrides || {});
}

function columnBy(vm, property) {
	return vm.gridColumns.filter(function (c) { return c.property === property; })[0];
}

function actionBy(vm, caption) {
	return vm.gridActions.filter(function (a) { return a.caption === caption; })[0];
}

describe('Works: datos iniciales');

it('parte sin obras, sin filtro de período y con los diálogos cerrados', () => {
	const { vm } = setup();
	expect(vm.works).toEqual([]);
	expect(vm.timeFilter).toBe(0);
	expect(vm.newWorkName).toBe('');
	expect(vm.activateNewWork).toBe(false);
	expect(vm.activateSaveAs).toBe(false);
});

describe('Works: computed');

it('showingWelcome solo es verdadero con las cartografías iniciadas y la lista vacía', () => {
	const { env, vm } = setup();
	env.context.CartographiesStarted = true;
	expect(vm.showingWelcome).toBeTruthy();
	vm.works.push(work());
	expect(vm.showingWelcome).toBeFalsy();
	vm.works.length = 0;
	env.context.CartographiesStarted = false;
	expect(vm.showingWelcome).toBeFalsy();
});

it('isDataAdmin y canEditIndexingColumn dependen de los privilegios', () => {
	expect(setup({ privileges: 'A' }).vm.isDataAdmin).toBe(true);
	expect(setup({ privileges: 'A' }).vm.canEditIndexingColumn).toBe(true);
	expect(setup({ privileges: 'E' }).vm.isDataAdmin).toBe(true);
	expect(setup({ privileges: 'E' }).vm.canEditIndexingColumn).toBe(false);
	expect(setup({ privileges: 'L' }).vm.isDataAdmin).toBe(false);
});

it('entityName nombra la entidad según el filtro', () => {
	expect(setup({ filter: 'P' }).vm.entityName).toEqual({ single: 'datos públicos', plural: 'datos públicos', one: '', article: 'los' });
	expect(setup({ filter: 'R' }).vm.entityName).toEqual({ single: 'cartografía', plural: 'cartografías', one: 'una', article: 'la' });
});

it('un filtro desconocido lanza un texto que nombra el filtro recibido', () => {
	const { vm } = setup({ filter: 'X' });
	let thrown = null;
	try {
		vm.entityName;
	} catch (e) {
		thrown = e;
	}
	expect(thrown).toBe('(entidad desconocida: X)');
});

it('emptyMessage indica si el período está filtrado', () => {
	const { vm } = setup({ filter: 'R' });
	expect(vm.emptyMessage).toBe('No hay cartografías.');
	vm.timeFilter = 30;
	expect(vm.emptyMessage).toBe('No hay cartografías para este período.');
	expect(setup({ filter: 'P' }).vm.emptyMessage).toBe('No hay datos públicos.');
});

describe('Works.gridColumns: columnas comunes');

it('el título enlaza a la obra en el backoffice', () => {
	const { vm } = setup();
	expect(columnBy(vm, 'Caption').href(work({ Id: 9 }))).toBe('/users/#/cartographies/9/content');
});

it('el tamaño muestra el total en MB y el detalle de borrador y publicado como tooltip', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'TotalSizeBytes');
	const item = work({
		TotalSizeBytes: 3 * 1024 * 1024,
		DraftDataBytes: 1024 * 1024, DraftIndexBytes: 0, DraftAttachmentBytes: 0,
		DataBytes: 2 * 1024 * 1024, IndexBytes: 0, AttachmentBytes: 0,
	});
	expect(column.sortType).toBe('number');
	expect(column.value(item)).toBe('3.00MB');
	expect(column.tooltip(item)).toBe('BORRADOR\nDatos: 1.00MB\nPUBLICADOS\nDatos: 2.00MB\n');
});

it('los datasets muestran sus nombres como tooltip y los indicadores se ordenan como número', () => {
	const { vm } = setup();
	expect(columnBy(vm, 'DatasetCount').tooltip(work({ DatasetNames: 'A, B' }))).toBe('A, B');
	expect(columnBy(vm, 'MetricCount').sortType).toBe('number');
});

describe('Works.gridColumns: indexación');

it('el administrador general edita Indexado y Segmentado con interruptores', () => {
	const { vm } = setup({ privileges: 'A' });
	expect(columnBy(vm, 'IsIndexed').type).toBe('switch');
	expect(columnBy(vm, 'SegmentedCrawling').type).toBe('switch');
	const segmented = columnBy(vm, 'SegmentedCrawling');
	expect(segmented.disabled(work({ IsIndexed: false }))).toBe(true);
	expect(segmented.disabled(work({ IsIndexed: true }))).toBe(false);
});

it('cambiar Indexado guarda la indexación de la obra en el servidor', async () => {
	const { vm, invoker } = setup({ privileges: 'A' });
	serve({ 'GET /services/admin/UpdateWorkIndexing': {} });
	columnBy(vm, 'IsIndexed').onChange(work({ Id: 5, IsIndexed: true }));
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(axios.calls[0].config.params).toEqual({ w: 5, v: '1' });
});

it('cambiar Segmentado guarda el tipo de indexación de la obra', async () => {
	const { vm } = setup({ privileges: 'A' });
	serve({ 'GET /services/admin/UpdateWorkSegmentedCrawling': {} });
	columnBy(vm, 'SegmentedCrawling').onChange(work({ Id: 5, SegmentedCrawling: true }));
	await settle();
	expect(axios.calls[0].config.params).toEqual({ w: 5, v: '1' });
});

it('los demás perfiles ven Indexado como dato y Segmentado como Sí, No o "-"', () => {
	const { vm } = setup({ privileges: 'E' });
	expect(columnBy(vm, 'IsIndexed').type).toBe('boolean');
	const segmented = columnBy(vm, 'SegmentedCrawling');
	expect(segmented.type).toBe('boolean');
	expect(segmented.value(work({ IsIndexed: false }))).toBe('-');
	expect(segmented.value(work({ IsIndexed: true, SegmentedCrawling: false }))).toBe('No');
	expect(segmented.value(work({ IsIndexed: true, SegmentedCrawling: true }))).toBe('Sí');
});

describe('Works.gridColumns: estado');

it('status calcula el estado de la fila con la regla compartida del backoffice', () => {
	const { vm } = setup();
	expect(vm.status(work({ Unfinished: true })).tag).toBe('unfinished');
	expect(vm.status(work({ MetadataLastOnline: null })).tag).toBe('unpublished');
	expect(vm.status(work({ Metadata: null })).tag).toBe('unpublished');
	expect(vm.status(work({ HasChanges: 1 })).tag).toBe('published_changes');
	expect(vm.status(work()).tag).toBe('published');
	expect(vm.status(work({ IsPrivate: true })).label).toBe('Publicada - Visiblidad: Privada');
});

it('la columna Estado toma ícono, color y tooltip del estado y no es ordenable', () => {
	const { vm } = setup();
	const column = columnBy(vm, 'Estado');
	expect(column.sortable).toBe(false);
	expect(column.icon(work())).toBe('check_circle_outline');
	expect(column.color(work())).toBe('#44b10f');
	expect(column.tooltip(work({ MetadataLastOnline: null }))).toBe('Sin publicar');
});

it('muestra el candado en las obras privadas y la advertencia de no indexada solo si corresponde', () => {
	const { vm } = setup();
	const icons = columnBy(vm, 'Estado').icons;
	const lock = icons.filter(function (i) { return i.icon === 'lock'; })[0];
	const warning = icons.filter(function (i) { return i.icon === 'error_outline'; })[0];
	expect(lock.show(work({ IsPrivate: true }))).toBe(true);
	expect(lock.show(work({ IsPrivate: false }))).toBe(false);
	expect(warning.show(work({ IsPrivate: false, IsIndexed: false }))).toBe(true);
	expect(warning.show(work({ IsPrivate: true, IsIndexed: false }))).toBe(false);
	expect(warning.show(work({ IsPrivate: false, IsIndexed: true }))).toBe(false);
	expect(warning.show(work({ IsPrivate: false, IsIndexed: false, MetadataLastOnline: null }))).toBe(false);
});

describe('Works.gridActions: habilitación');

it('quien puede editar ve las acciones de edición; quien no, solo Consultar', () => {
	const item = work();
	['A', 'E'].forEach(function (privileges) {
		const { vm } = setup({ privileges });
		expect(actionBy(vm, 'Consultar').isEnabled(item)).toBe(false);
		expect(actionBy(vm, 'Modificar').isEnabled(item)).toBe(true);
		expect(actionBy(vm, 'Duplicar').isEnabled(item)).toBe(true);
	});
	['L', 'P'].forEach(function (privileges) {
		const { vm } = setup({ privileges });
		expect(actionBy(vm, 'Consultar').isEnabled(item)).toBe(true);
		expect(actionBy(vm, 'Modificar').isEnabled(item)).toBe(false);
		expect(actionBy(vm, 'Duplicar').isEnabled(item)).toBe(false);
	});
});

it('Publicar requiere cambios o no estar publicada; Revocar requiere estar publicada', () => {
	const { vm } = setup();
	const publish = actionBy(vm, 'Publicar');
	const revoke = actionBy(vm, 'Revocar publicación');
	expect(publish.isEnabled(work({ MetadataLastOnline: null }))).toBe(true);
	expect(publish.isEnabled(work({ HasChanges: 1 }))).toBe(true);
	expect(publish.isEnabled(work({ HasChanges: 0 }))).toBe(false);
	expect(revoke.isEnabled(work({ MetadataLastOnline: null }))).toBe(false);
	expect(revoke.isEnabled(work())).toBe(true);
});

it('Publicar y Revocar no se habilitan sin permiso de edición', () => {
	const { vm } = setup({ privileges: 'L' });
	expect(actionBy(vm, 'Publicar').isEnabled(work({ HasChanges: 1 }))).toBe(false);
	expect(actionBy(vm, 'Revocar publicación').isEnabled(work())).toBe(false);
});

it('promover y convertir dependen del permiso de crear datos públicos y del tipo de obra', () => {
	const { vm } = setup({ privileges: 'E' });
	expect(actionBy(vm, 'Promover a Dato público').isEnabled(work({ Type: 'R' }))).toBe(true);
	expect(actionBy(vm, 'Promover a Dato público').isEnabled(work({ Type: 'P' }))).toBe(false);
	expect(actionBy(vm, 'Convertir en Cartografía').isEnabled(work({ Type: 'P' }))).toBe(true);
	expect(actionBy(vm, 'Convertir en Cartografía').isEnabled(work({ Type: 'R' }))).toBe(false);
	const reader = setup({ privileges: 'L' }).vm;
	expect(actionBy(reader, 'Promover a Dato público').isEnabled(work({ Type: 'R' }))).toBe(false);
	expect(actionBy(reader, 'Convertir en Cartografía').isEnabled(work({ Type: 'P' }))).toBe(false);
});

describe('Works.gridActions: acciones');

it('cada acción invoca el método correspondiente de la vista con la fila', () => {
	const { vm } = setup();
	const item = work();
	const called = [];
	['select', 'onPublish', 'onRevoke', 'onDuplicate', 'onPromotePublic', 'onDemotePublic'].forEach(function (name) {
		vm[name] = function (arg) { called.push([name, arg]); };
	});
	const expected = {
		'Consultar': 'select', 'Publicar': 'onPublish', 'Revocar publicación': 'onRevoke', 'Modificar': 'select',
		'Duplicar': 'onDuplicate', 'Promover a Dato público': 'onPromotePublic', 'Convertir en Cartografía': 'onDemotePublic',
	};
	Object.keys(expected).forEach(function (caption) {
		actionBy(vm, caption).onClick(null, item);
	});
	expect(called.map(function (c) { return c[0]; })).toEqual(Object.values(expected));
	expect(called.every(function (c) { return c[1] === item; })).toBe(true);
});

describe('Works: carga de datos');

it('mounted carga las obras solo en la vista de datos públicos', async () => {
	const pub = setup({ filter: 'P' });
	serve({ [GET_WORKS]: [work()] });
	callHook(Works, pub.vm, 'mounted');
	await settle();
	expect(axios.calls).toHaveLength(1);
	expect(pub.vm.works).toHaveLength(1);
	const reg = setup({ filter: 'R' });
	callHook(Works, reg.vm, 'mounted');
	await settle();
	expect(axios.calls).toHaveLength(0);
});

it('refreshWorks pide las obras con el filtro y el período, con mensaje de espera', async () => {
	const { vm, invoker } = setup({ filter: 'R' });
	const list = vm.works;
	vm.timeFilter = 30;
	serve({ [GET_WORKS]: [work({ Id: 1 }), work({ Id: 2 })] });
	vm.refreshWorks();
	expect(invoker.message).toBe('Obteniendo cartografías...');
	await settle();
	expect(axios.calls[0].config.params).toEqual({ f: 'R', t: 30 });
	expect(vm.works).toBe(list);
	expect(vm.works.map(function (w) { return w.Id; })).toEqual([1, 2]);
});

it('loadData consulta solo si la lista está vacía', async () => {
	const { vm } = setup();
	serve({ [GET_WORKS]: [work()] });
	vm.loadData();
	await settle();
	vm.loadData();
	await settle();
	expect(axios.calls).toHaveLength(1);
});

it('onTimeFilterChanged usa el valor recibido y recarga', async () => {
	const { vm } = setup();
	serve({ [GET_WORKS]: [] });
	vm.onTimeFilterChanged(90);
	await settle();
	expect(vm.timeFilter).toBe(90);
	expect(axios.calls[0].config.params).toEqual({ f: 'R', t: 90 });
});

it('calculateUsage recalcula el espacio y luego recarga las obras', async () => {
	const { vm, invoker } = setup();
	serve({ 'GET /services/admin/UpdateWorkSpaceUsage': {}, [GET_WORKS]: [work()] });
	vm.calculateUsage();
	expect(invoker.message).toBe('Calculando espacio...');
	await settle();
	expect(axios.calls.map(function (c) { return c.url.split('/').pop(); })).toEqual(['UpdateWorkSpaceUsage', 'GetWorks']);
});

describe('Works: formatos y permisos');

it('getWorkUri, select y onRowClick abren la obra en una pestaña nueva', () => {
	const { env, vm } = setup();
	expect(vm.getWorkUri({ Id: 9 })).toBe('/cartographies/9/content');
	vm.select({ Id: 9 });
	vm.onRowClick(null, { Id: 10 });
	expect(env.opened).toEqual([
		{ url: '/users/#/cartographies/9/content', target: '_blank' },
		{ url: '/users/#/cartographies/10/content', target: '_blank' },
	]);
});

it('formatMB y totalSizeMB convierten bytes a MB con dos decimales', () => {
	const { vm } = setup();
	expect(vm.formatMB(0)).toBe('0.00MB');
	expect(vm.formatMB(1536 * 1024)).toBe('1.50MB');
	expect(vm.totalSizeMB({ TotalSizeBytes: 2 * 1024 * 1024 })).toBe('2.00MB');
});

it('formatSizes detalla solo los bloques con contenido', () => {
	const { vm } = setup();
	const zero = { DraftDataBytes: 0, DraftIndexBytes: 0, DraftAttachmentBytes: 0, DataBytes: 0, IndexBytes: 0, AttachmentBytes: 0 };
	const MB = 1024 * 1024;
	expect(vm.formatSizes(zero)).toBe('');
	expect(vm.formatSizes(Object.assign({}, zero, { DraftAttachmentBytes: MB }))).toBe('BORRADOR\nAdjuntos: 1.00MB\n');
	expect(vm.formatSizes(Object.assign({}, zero, { DraftDataBytes: MB, DraftIndexBytes: MB }))).toBe('BORRADOR\nDatos: 2.00MB\n');
	expect(vm.formatSizes(Object.assign({}, zero, { AttachmentBytes: MB }))).toBe('PUBLICADOS\nAdjuntos: 1.00MB');
	expect(vm.formatSizes(Object.assign({}, zero, { DataBytes: MB, IndexBytes: MB, AttachmentBytes: MB })))
		.toBe('PUBLICADOS\nDatos: 2.00MB\nAdjuntos: 1.00MB');
});

it('publishDisabled y revokeDisabled según el estado de publicación', () => {
	const { vm } = setup();
	expect(vm.publishDisabled(work({ MetadataLastOnline: null, HasChanges: 0 }))).toBe(false);
	expect(vm.publishDisabled(work({ HasChanges: 2 }))).toBe(false);
	expect(vm.publishDisabled(work({ HasChanges: 0 }))).toBe(true);
	expect(vm.revokeDisabled(work({ MetadataLastOnline: null }))).toBe(true);
	expect(vm.revokeDisabled(work())).toBe(false);
});

it('canEdit es verdadero solo para administradores generales y editores de datos', () => {
	expect(setup({ privileges: 'A' }).vm.canEdit(work())).toBe(true);
	expect(setup({ privileges: 'E' }).vm.canEdit(work())).toBe(true);
	expect(setup({ privileges: 'L' }).vm.canEdit(work())).toBe(false);
	expect(setup({ privileges: 'P' }).vm.canEdit(work())).toBe(false);
});

describe('Works: eliminación');

it('el mensaje de confirmación nombra la obra', () => {
	expect(setup().vm.deleteConfirmMessage({ Caption: 'Mi obra' }))
		.toBe("Los datasets, indicadores y metadatos correspondientes a 'Mi obra' serán eliminados");
});

it('onItemDelete inicia el proceso de borrado con las URLs y el título de la entidad', async () => {
	const { vm, deleteStepper } = setup({ filter: 'R' });
	serve({ 'GET /services/backoffice/StartDeleteWork?w=5': { done: true } });
	vm.onItemDelete(work({ Id: 5 }));
	expect(deleteStepper.startUrl).toBe('http://server.test/services/backoffice/StartDeleteWork?w=5');
	expect(deleteStepper.stepUrl).toBe('http://server.test/services/backoffice/StepDeleteWork');
	expect(deleteStepper.titleByMethod).toBe('Eliminando cartografía');
	await settle();
	expect(deleteStepper.complete).toBe(true);
	expect(deleteStepper.$emitted.map(function (e) { return e.name; })).toEqual(['completed']);
});

it('onDeleteComplete quita de la lista la obra que se estaba eliminando', () => {
	const { vm } = setup();
	const a = work({ Id: 1 });
	const b = work({ Id: 2 });
	vm.works.push(a, b);
	vm.onItemDelete = undefined;
	vm.source = b;
	vm.onDeleteComplete();
	expect(vm.works).toEqual([a]);
});

describe('Works: publicar y revocar');

it('onPublish avisa y no inicia nada si hay datasets sin georreferenciar', () => {
	const { env, vm, stepper } = setup();
	vm.onPublish(work({ DatasetCount: 3, GeorreferencedCount: 2 }));
	expect(env.alerts).toEqual(['Todos los datasets deben estar georreferenciados para poder realizarse la publicación.']);
	expect(stepper.startUrl).toBe('');
	expect(axios.calls).toHaveLength(0);
});

it('onPublish ejecuta el proceso y, al completarse, marca la obra como publicada', async () => {
	const { vm, stepper } = setup({ filter: 'P' });
	serve({ 'GET /services/backoffice/StartPublishWork?w=5': { done: true } });
	const item = work({ Id: 5, HasChanges: 2, MetadataLastOnline: null, PreviewId: 99 });
	vm.onPublish(item);
	expect(stepper.startUrl).toBe('http://server.test/services/backoffice/StartPublishWork?w=5');
	expect(stepper.stepUrl).toBe('http://server.test/services/backoffice/StepPublishWork');
	expect(stepper.titleByMethod).toBe('Publicando datos públicos');
	await settle();
	expect(item.HasChanges).toBe(0);
	expect(item.MetadataLastOnline instanceof Date).toBe(true);
	expect(item.PreviewId).toBeNull();
});

it('onPublish con datasets igualmente georreferenciados no bloquea', async () => {
	const { env, vm } = setup();
	serve({ 'GET /services/backoffice/StartPublishWork?w=5': { done: true } });
	vm.onPublish(work({ Id: 5, DatasetCount: 2, GeorreferencedCount: 2 }));
	await settle();
	expect(env.alerts).toHaveLength(0);
});

it('si el proceso de publicación falla, la obra no se modifica y el diálogo muestra el error', async () => {
	const { vm, stepper } = setup();
	serve({ 'GET /services/backoffice/StartPublishWork?w=5': new Error('Network Error') });
	const item = work({ Id: 5, HasChanges: 2 });
	await quiet(async function () {
		vm.onPublish(item);
		await settle();
	});
	expect(item.HasChanges).toBe(2);
	expect(stepper.error).toBe('El proceso no ha podido ser completado.');
	expect(stepper.errorDetail).toBe('Network Error');
});

it('onRevoke ejecuta el proceso y, al completarse, deja la obra sin publicar', async () => {
	const { vm, stepper } = setup();
	serve({ 'GET /services/backoffice/StartRevokeWork?w=5': { done: true } });
	const item = work({ Id: 5, PreviewId: 7 });
	vm.onRevoke(item);
	expect(stepper.startUrl).toBe('http://server.test/services/backoffice/StartRevokeWork?w=5');
	expect(stepper.stepUrl).toBe('http://server.test/services/backoffice/StepRevokeWork');
	expect(stepper.titleByMethod).toBe('Revocando publicación');
	await settle();
	expect(item.MetadataLastOnline).toBeNull();
	expect(item.PreviewId).toBeNull();
});

it('un proceso de varios pasos continúa con la URL de paso hasta completarse', async () => {
	const { vm } = setup();
	serve({
		'GET /services/backoffice/StartRevokeWork?w=5': { done: false, key: 'K1', totalSteps: 2, step: 1 },
		'GET /services/backoffice/StepRevokeWork?k=K1': { done: true },
	});
	const item = work({ Id: 5 });
	vm.onRevoke(item);
	await settle();
	expect(axios.calls.map(function (c) { return c.url; })).toEqual([
		'http://server.test/services/backoffice/StartRevokeWork?w=5',
		'http://server.test/services/backoffice/StepRevokeWork?k=K1',
	]);
	expect(item.MetadataLastOnline).toBeNull();
});

describe('Works: duplicar');

it('onDuplicate recuerda la obra y abre el diálogo con el nombre vacío', () => {
	const { vm } = setup();
	const item = work();
	vm.newWorkName = 'residuo';
	vm.onDuplicate(item);
	expect(vm.source).toBe(item);
	expect(vm.newWorkName).toBe('');
	expect(vm.activateSaveAs).toBe(true);
});

it('onDuplicateStart con nombre vacío o de espacios avisa, reabre el diálogo y no inicia el proceso', () => {
	for (const name of ['', '   ']) {
		const { env, vm, stepper } = setup();
		vm.source = work();
		vm.newWorkName = name;
		vm.activateSaveAs = false;
		vm.onDuplicateStart();
		expect(env.alerts).toEqual(['Debe indicar un nombre.']);
		expect(vm.activateSaveAs).toBe(true);
		expect(stepper.startUrl).toBe('');
	}
});

it('onDuplicateStart inicia el clonado con el nombre codificado y, al terminar, recarga las obras', async () => {
	const { vm, stepper } = setup({ filter: 'R' });
	serve({
		'GET /services/backoffice/StartCloneWork?w=5&n=Copia%20%26%20m%C3%A1s': { done: true },
		[GET_WORKS]: [work({ Id: 5 }), work({ Id: 6 })],
	});
	vm.source = work({ Id: 5 });
	vm.newWorkName = 'Copia & más';
	vm.onDuplicateStart();
	expect(stepper.stepUrl).toBe('http://server.test/services/backoffice/StepCloneWork');
	expect(stepper.titleByMethod).toBe('Duplicando cartografía');
	await settle();
	expect(vm.works.map(function (w) { return w.Id; })).toEqual([5, 6]);
});

it('el nombre se valida y se envía recortado', async () => {
	const { vm, stepper } = setup();
	serve({ 'GET /services/backoffice/StartCloneWork?w=5&n=Copia': { done: true }, [GET_WORKS]: [] });
	vm.source = work({ Id: 5 });
	vm.newWorkName = ' Copia ';
	vm.onDuplicateStart();
	expect(stepper.startUrl).toBe('http://server.test/services/backoffice/StartCloneWork?w=5&n=Copia');
	await settle();
});

describe('Works: promover a dato público y revocar');

it('onPromotePublic pide confirmación y no llama al servidor hasta aceptar', () => {
	const { vm, invoker } = setup({ filter: 'R' });
	vm.onPromotePublic(work({ Id: 5 }));
	expect(invoker.confirmTitle).toBe('Promover cartografía');
	expect(invoker.confirmQuestion.startsWith('La cartografía será convertida a dato público.')).toBe(true);
	expect(invoker.confirmQuestion.endsWith('.')).toBe(true);
	expect(axios.calls).toHaveLength(0);
});

it('al aceptar la promoción la obra pasa a dato público y sale de la lista', async () => {
	const { vm, invoker } = setup({ filter: 'R' });
	serve({ 'POST /services/backoffice/PromoteWork': {} });
	const item = work({ Id: 5, Type: 'R' });
	const other = work({ Id: 6 });
	vm.works.push(item, other);
	vm.onPromotePublic(item);
	invoker.confirmed();
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ w: '5' });
	expect(item.Type).toBe('P');
	expect(vm.works).toEqual([other]);
});

it('al aceptar la revocación el dato público vuelve a ser cartografía y sale de la lista', async () => {
	const { vm, invoker } = setup({ filter: 'P' });
	serve({ 'POST /services/backoffice/DemoteWork': {} });
	const item = work({ Id: 5, Type: 'P' });
	vm.works.push(item);
	vm.onDemotePublic(item);
	expect(invoker.confirmTitle).toBe('Revocar promoción de datos públicos');
	invoker.confirmed();
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ w: '5' });
	expect(item.Type).toBe('R');
	expect(vm.works).toEqual([]);
});
