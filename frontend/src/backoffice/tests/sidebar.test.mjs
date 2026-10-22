import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import router from '@/backoffice/router/router';
import Sidebar from '@/backoffice/views/Layout/Sidebar.vue';

function makeWork(overrides) {
	return Object.assign({
		properties: { Id: 3, IsExample: false },
		publicData: false,
		canEdit: true,
		hasChanges: false,
		counts: { DatasetCount: 1, GeorreferencedCount: 1 },
		published: 0,
		IsPublicData() { return this.publicData; },
		CanEdit() { return this.canEdit; },
		HasChanges() { return this.hasChanges; },
		UpdateDatasetGeorreferencedCount() { return this.counts; },
		PreviewTableTarget() { return '_tablePbl3'; },
		WorkPublished() { this.published++; },
		Datasets: [],
	}, overrides);
}

function makeDataset(id, caption, overrides) {
	return {
		properties: Object.assign({ Id: id, Caption: caption, MultilevelMatrix: null, Geography: null, Geocoded: true }, overrides),
	};
}

function setup(workOverrides, routes) {
	const browser = setupBackoffice();
	const work = makeWork(workOverrides);
	browser.window.Context.CurrentWork = work;
	browser.window.Db.published = 0;
	browser.window.Db.RebindCurrentWork = function () { browser.window.Db.published++; };
	browser.window.Db.GetStartWorkPublishUrl = function (id) { return 'publish-start-' + id; };
	browser.window.Db.GetStepWorkPublishUrl = function () { return 'publish-step'; };
	const vm = mountLite(Sidebar, { mocks: { $router: { options: { routes: routes || [] } } } });
	return { vm: vm, work: work, browser: browser };
}

function makeRoute(overrides) {
	return Object.assign({ path: '/cartographies/:workId/x', name: 'Ruta', group: 'Datasets' }, overrides);
}

describe('Sidebar: eventos y propiedades calculadas');

it('Work es el trabajo actual del contexto y sidebar viene del store', () => {
	const { vm, work } = setup();
	vm.$store = { getters: { sidebar: { opened: true } } };
	expect(vm.Work === work).toBeTruthy();
	expect(vm.sidebar).toEqual({ opened: true });
});

it('onCollapse y onItemClick reenvían el evento', () => {
	const { vm } = setup();
	vm.onCollapse(true);
	vm.onItemClick('evento', { title: 'x' });
	expect(vm.$emitted).toEqual([['collapsed', true], ['itemClick', 'evento', { title: 'x' }]]);
});

it('al montar publica en window las funciones que invocan los botones de las insignias', () => {
	const { vm } = setup();
	const calls = [];
	vm.showUpload = function () { calls.push('upload'); };
	vm.publish = function () { calls.push('publish'); };
	Sidebar.mounted.call(vm);
	globalThis.window.openUpload();
	globalThis.window.openPublish();
	expect(calls).toEqual(['upload', 'publish']);
});

describe('Sidebar: replaceParams');

it('reemplaza :workId por el identificador del trabajo actual', () => {
	const { vm } = setup();
	expect(vm.replaceParams('/cartographies/:workId/content')).toBe('/cartographies/3/content');
});

it('sin trabajo actual deja el texto como está', () => {
	const { vm, browser } = setup();
	browser.window.Context.CurrentWork = null;
	expect(vm.replaceParams('/cartographies/:workId/content')).toBe('/cartographies/:workId/content');
});

describe('Sidebar: sortComparer');

it('ordena primero por matriz multinivel, comparándola como texto', () => {
	const { vm } = setup();
	const a = makeDataset(1, 'A', { MultilevelMatrix: 2 });
	const b = makeDataset(2, 'B', { MultilevelMatrix: 10 });
	expect(vm.sortComparer(a, b) > 0).toBeTruthy();
	expect(vm.sortComparer(b, a) < 0).toBeTruthy();
});

it('con la misma matriz ordena por zoom mínimo de la geografía, tomando 0 si no tiene', () => {
	const { vm } = setup();
	const near = makeDataset(1, 'Z', { Geography: { MinZoom: 3 } });
	const far = makeDataset(2, 'A', { Geography: { MinZoom: 8 } });
	const none = makeDataset(3, 'M', { Geography: null });
	expect(vm.sortComparer(near, far)).toBe(-5);
	expect(vm.sortComparer(none, near)).toBe(-3);
});

it('con matriz y zoom iguales ordena por título', () => {
	const { vm } = setup();
	expect(vm.sortComparer(makeDataset(1, 'Alfa'), makeDataset(2, 'Beta')) < 0).toBeTruthy();
	expect(vm.sortComparer(makeDataset(1, 'Alfa'), makeDataset(2, 'Alfa'))).toBe(0);
});

describe('Sidebar: insignias');

it('createBadge no agrega insignia a un dataset georreferenciado sin matriz multinivel', () => {
	expect(setup().vm.createBadge(makeDataset(1, 'A'))).toBeNull();
});

it('createBadge de un dataset sin georreferenciar agrega el aviso', () => {
	const badge = setup().vm.createBadge(makeDataset(1, 'A', { Geocoded: false }));
	expect(badge.class).toBe('vsm-badge default-badge badgeall badgewith warningIcon');
	expect(badge.attributes.title).toBe('El dataset no ha sido georreferenciado');
});

it('createBadge de un dataset multinivel usa una de diez clases de color según su matriz', () => {
	const { vm } = setup();
	expect(vm.createBadge(makeDataset(1, 'A', { MultilevelMatrix: 1 })).class).toBe('vsm-badge default-badge badgeall badgewith badge0');
	expect(vm.createBadge(makeDataset(1, 'A', { MultilevelMatrix: 11 })).class).toBe('vsm-badge default-badge badgeall badgewith badge0');
	expect(vm.createBadge(makeDataset(1, 'A', { MultilevelMatrix: 4 })).class.endsWith('badge3')).toBeTruthy();
});

it('createBadge de un dataset multinivel sin georreferenciar combina ambos avisos', () => {
	const badge = setup().vm.createBadge(makeDataset(1, 'A', { MultilevelMatrix: 2, Geocoded: false }));
	expect(badge.class.endsWith('badge1 warningIcon')).toBeTruthy();
	expect(badge.attributes.title).toBe('El dataset no ha sido georreferenciado');
});

it('la insignia de carga abre el diálogo de subida', () => {
	const badge = setup().vm.createBadgeUpload();
	expect(badge.attributes.title).toBe('Subir archivo');
	expect(badge.attributes.onclick).toBe('window.openUpload(); return false;');
	expect(badge.class.includes('fa-cloud-upload-alt')).toBeTruthy();
});

it('la insignia de publicación se habilita solo si hay cambios', () => {
	const withChanges = setup({ hasChanges: true }).vm.createBadgePublish();
	expect(withChanges.attributes.title).toBe('Publicar');
	expect(withChanges.attributes.onclick).toBe('window.openPublish(); return false;');
	const withoutChanges = setup({ hasChanges: false }).vm.createBadgePublish();
	expect(withoutChanges.attributes.title).toBe('No hay cambios para publicar');
	expect(withoutChanges.attributes.onclick).toBe('');
	expect(withoutChanges.class.startsWith('badgeDisabled ')).toBeTruthy();
});

describe('Sidebar: datasets en el menú');

it('addDatasets agrega cada dataset ordenado, con su enlace, sus solapas como alias y su insignia si corresponde', () => {
	const { vm, work } = setup();
	work.Datasets = [makeDataset(2, 'Beta', { Geocoded: false }), makeDataset(1, 'Alfa')];
	const ret = [];
	vm.addDatasets(ret);
	expect(ret.map(function (item) { return item.title; })).toEqual(['Alfa', 'Beta']);
	expect(ret[0].href).toBe('/cartographies/3/datasets/1');
	expect(ret[0].icon).toBe('fa fa-table');
	expect(ret[0].alias).toEqual([
		'/cartographies/3/datasets/1/variables', '/cartographies/3/datasets/1/georeference', '/cartographies/3/datasets/1/data',
		'/cartographies/3/datasets/1/metrics', '/cartographies/3/datasets/1/identity', '/cartographies/3/datasets/1/multilevel',
	]);
	expect(ret[0].badge).toBe(undefined);
	expect(ret[1].badge.attributes.title).toBe('El dataset no ha sido georreferenciado');
});

it('addDatasets titula "(Sin título)" a un dataset sin nombre', () => {
	const { vm, work } = setup();
	work.Datasets = [makeDataset(1, '')];
	const ret = [];
	vm.addDatasets(ret);
	expect(ret[0].title).toBe('(Sin título)');
});

describe('Sidebar: createMenuFromRoute');

it('arma el título, el enlace con el trabajo y el ícono por defecto', () => {
	const { vm } = setup();
	const men = vm.createMenuFromRoute(makeRoute({ icon: 'fa fa-tag' }));
	expect(men).toEqual({ title: 'Ruta', href: '/cartographies/3/x', icon: 'fa fa-tag' });
	expect(vm.createMenuFromRoute(makeRoute({})).icon).toBe('fa fa-user');
});

it('con hijos agrega sus rutas y los alias del último hijo', () => {
	const { vm } = setup();
	const route = makeRoute({
		children: [
			{ path: 'a' },
			{ path: '/cartographies/:workId/b', alias: ['/cartographies/:workId/b2', '/cartographies/:workId/b3'] },
		],
	});
	expect(vm.createMenuFromRoute(route).alias).toEqual(['a', '/cartographies/3/b', '/cartographies/3/b2', '/cartographies/3/b3']);
});

it('sin hijos no define alias', () => {
	expect(setup().vm.createMenuFromRoute(makeRoute({})).alias).toBe(undefined);
});

it('Fuentes secundarias se muestra como Fuentes en los datos públicos', () => {
	const regular = setup({ publicData: false }).vm.createMenuFromRoute(makeRoute({ name: 'Fuentes secundarias' }));
	expect(regular.title).toBe('Fuentes secundarias');
	const publicData = setup({ publicData: true }).vm.createMenuFromRoute(makeRoute({ name: 'Fuentes secundarias' }));
	expect(publicData.title).toBe('Fuentes');
});

it('sin permiso de edición oculta Nuevo dataset y Datasets si no hay ninguno', () => {
	const { vm, work } = setup({ canEdit: false });
	work.Datasets = [];
	const newDataset = makeRoute({ name: 'Nuevo dataset' });
	const datasets = makeRoute({ name: 'Datasets' });
	vm.createMenuFromRoute(newDataset);
	vm.createMenuFromRoute(datasets);
	expect(newDataset.hidden).toBeTruthy();
	expect(datasets.hidden).toBeTruthy();
});

it('sin permiso de edición conserva Datasets si ya hay datasets, y no oculta otras rutas', () => {
	const { vm, work } = setup({ canEdit: false });
	work.Datasets = [makeDataset(1, 'A')];
	const datasets = makeRoute({ name: 'Datasets' });
	const other = makeRoute({ name: 'Contenidos' });
	vm.createMenuFromRoute(datasets);
	vm.createMenuFromRoute(other);
	expect(datasets.hidden).toBe(undefined);
	expect(other.hidden).toBe(undefined);
});

it('con permiso de edición no oculta Nuevo dataset', () => {
	const { vm } = setup({ canEdit: true });
	const newDataset = makeRoute({ name: 'Nuevo dataset' });
	vm.createMenuFromRoute(newDataset);
	expect(newDataset.hidden).toBeFalsy();
});

it('Nuevo dataset vuelve a mostrarse al pasar de una cartografía de solo lectura a una editable', () => {
	const { vm, work } = setup({ canEdit: false });
	const newDataset = makeRoute({ name: 'Nuevo dataset' });
	vm.createMenuFromRoute(newDataset);
	expect(newDataset.hidden).toBeTruthy();
	work.canEdit = true;
	vm.createMenuFromRoute(newDataset);
	expect(newDataset.hidden).toBeFalsy();
});

it('los permisos se ocultan solo en los ejemplos', () => {
	const { vm, work } = setup();
	expect(vm.removePermissionsOnExamples({ name: 'Permisos' })).toBeFalsy();
	work.properties.IsExample = true;
	expect(vm.removePermissionsOnExamples({ name: 'Permisos' })).toBeTruthy();
	expect(vm.removePermissionsOnExamples({ name: 'Otra' })).toBeFalsy();
});

describe('Sidebar: menús');

it('las rutas ocultas no aparecen y las que no tienen grupo no abren encabezado', () => {
	const routes = [
		makeRoute({ group: undefined, name: 'Suelta', path: '/suelta' }),
		makeRoute({ name: 'Oculta', hidden: true }),
		makeRoute({ name: 'Visible' }),
	];
	const { vm } = setup({}, routes);
	expect(vm.menus.top.map(function (item) { return item.title; })).toEqual(['Suelta', 'Datasets', 'Visible']);
	expect(vm.menus.top[1].header).toBeTruthy();
});

it('el encabezado de un grupo se inserta junto a su primer ítem visible y no queda huérfano', () => {
	const routes = [
		makeRoute({ group: 'Datasets', name: 'Oculta A', hidden: true }),
		makeRoute({ group: 'Otros', name: 'Visible B' }),
		makeRoute({ group: 'Otros', name: 'Visible C' }),
	];
	const { vm } = setup({}, routes);
	expect(vm.menus.top.map(function (item) { return item.title; })).toEqual(['Otros', 'Visible B', 'Visible C']);
});

it('el grupo Publicar va a la lista inferior', () => {
	const routes = [
		makeRoute({ group: 'Datasets', name: 'Datos' }),
		makeRoute({ group: 'Publicar', name: 'Contenidos' }),
	];
	const { vm } = setup({}, routes);
	expect(vm.topMenuItems.map(function (item) { return item.title; })).toEqual(['Datasets', 'Datos']);
	expect(vm.bottomMenuItems.map(function (item) { return item.title; })).toEqual(['Publicar', 'Contenidos']);
});

it('Nuevo dataset lleva la insignia de carga y va seguido de los datasets del trabajo', () => {
	const routes = [makeRoute({ name: 'Nuevo dataset' })];
	const { vm, work } = setup({}, routes);
	work.Datasets = [makeDataset(1, 'Alfa')];
	const top = vm.menus.top;
	expect(top.map(function (item) { return item.title; })).toEqual(['Datasets', 'Nuevo dataset', 'Alfa']);
	expect(top[1].badge.attributes.title).toBe('Subir archivo');
});

it('Personalizar lleva la insignia de publicación', () => {
	const routes = [makeRoute({ name: 'Personalizar', group: 'Publicar' })];
	const { vm } = setup({ hasChanges: true }, routes);
	expect(vm.menus.bottom[1].badge.attributes.title).toBe('Publicar');
});

it('Bienvenida solo se muestra en los datos públicos', () => {
	const routes = [makeRoute({ name: 'Bienvenida', group: 'Publicar', hidden: false })];
	expect(setup({ publicData: false }, routes.map(function (route) { return Object.assign({}, route); })).vm.menus.bottom).toEqual([]);
	const publicRoutes = routes.map(function (route) { return Object.assign({}, route); });
	expect(setup({ publicData: true }, publicRoutes).vm.menus.bottom.map(function (item) { return item.title; })).toEqual(['Publicar', 'Bienvenida']);
});

it('Permisos no se muestra en los ejemplos', () => {
	const routes = [makeRoute({ name: 'Permisos', group: 'Publicar' })];
	const { vm } = setup({ properties: { Id: 3, IsExample: true } }, routes);
	expect(vm.menus.bottom).toEqual([]);
});

it('con la tabla de rutas real arma el menú de una cartografía editable sin datasets', () => {
	const routes = router.options.routes.map(function (route) { return Object.assign({}, route); });
	const { vm } = setup({}, routes);
	expect(vm.menus.top.map(function (item) { return item.title; })).toEqual(['Datasets', 'Nuevo dataset']);
	expect(vm.menus.bottom).toEqual([]);
});

it('con la tabla de rutas real los datos públicos suman Bienvenida y una cartografía de solo lectura no ofrece Nuevo dataset', () => {
	const publicRoutes = router.options.routes.map(function (route) { return Object.assign({}, route); });
	const publicMenus = setup({ publicData: true }, publicRoutes).vm.menus;
	expect(publicMenus.bottom.map(function (item) { return item.title; })).toEqual(['Publicar', 'Bienvenida']);
	const readOnlyRoutes = router.options.routes.map(function (route) { return Object.assign({}, route); });
	expect(setup({ canEdit: false }, readOnlyRoutes).vm.menus.top).toEqual([]);
});

describe('Sidebar: acciones');

it('showUpload abre el diálogo de importación', () => {
	const { vm } = setup();
	let shown = null;
	vm.$refs.importPopup = { show(value) { shown = value; } };
	vm.showUpload();
	expect(shown).toBe(true);
});

it('publish avisa y no publica si hay datasets sin georreferenciar', () => {
	const { vm, browser } = setup({ counts: { DatasetCount: 3, GeorreferencedCount: 2 } });
	let started = 0;
	vm.$refs.stepper = { Start() { started++; return Promise.resolve(); } };
	vm.publish();
	expect(browser.alerts).toEqual(['Todos los datasets deben estar georreferenciados para poder realizarse la publicación.']);
	expect(started).toBe(0);
});

it('publish configura el avance, lo inicia y, al terminar, marca el trabajo publicado y lo vuelve a cargar', async () => {
	const { vm, work, browser } = setup();
	const stepper = {
		title: null, started: 0, setTitle(text) { this.title = text; }, Start() { this.started++; return Promise.resolve(); },
	};
	vm.$refs.stepper = stepper;
	vm.publish();
	expect(stepper.startUrl).toBe('publish-start-3');
	expect(stepper.stepUrl).toBe('publish-step');
	expect(stepper.visitTarget).toBe('_tablePbl3');
	expect(stepper.title).toBe('Publicando');
	await flushPromises();
	expect(work.published).toBe(1);
	expect(browser.window.Db.published).toBe(1);
});
