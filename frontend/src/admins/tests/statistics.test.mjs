import { describe, it, expect } from './_harness.mjs';
import Statistics from '@/admins/views/Statistics/Statistics.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, captureUnhandled, quiet, makeInvoker,
} from './fixtures.mjs';

const GET_STATS = 'GET /services/admin/GetStatistics';
const PROCESS_STATS = 'GET /services/admin/ProcessStatistics';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const vm = mountLite(Statistics, { refs: { invoker } });
	return { env, vm, invoker };
}

function stats(overrides) {
	return Object.assign({
		IsSummarized: false,
		Works: [{ Id: 1 }],
		Totals: [{ Total: 10 }],
		Resources: [{ Url: 'x' }],
		Metrics: [{ Id: 3 }],
		DownloadTypes: [{ Type: 'csv' }],
		Embedding: [{ Url: 'http://otro.test' }],
		Months: ['2024-05', '2024-04'],
	}, overrides || {});
}

describe('Statistics: datos iniciales');

it('parte vacío, sin mes elegido y todavía sin montar', () => {
	const { vm } = setup();
	expect(vm.works).toEqual([]);
	expect(vm.months).toEqual([]);
	expect(vm.currentMonth).toBeNull();
	expect(vm.mounted).toBe(false);
	expect(vm.isSummarized).toBe(false);
	expect(vm.componentKey).toBe(0);
});

it('canEdit es verdadero solo para el administrador general', () => {
	expect(setup('A').vm.canEdit).toBe(true);
	expect(setup('E').vm.canEdit).toBe(false);
});

describe('Statistics.mounted');

it('se marca como montada y carga las estadísticas', async () => {
	const { vm } = setup();
	serve({ [GET_STATS]: stats() });
	callHook(Statistics, vm, 'mounted');
	await settle();
	expect(vm.mounted).toBe(true);
	expect(axios.calls).toHaveLength(1);
});

describe('Statistics: formatos');

it('formatDate delega en el formateador de fechas', () => {
	expect(setup().vm.formatDate('2024-05-03T12:00:00')).toBe('03/05/2024');
});

it('formatFullName muestra el email de la solicitud si no hay usuario, o su nombre completo', () => {
	const { vm } = setup();
	expect(vm.formatFullName({ UserSubmission: null, UserSubmissionEmail: 'a@a.com' })).toBe('a@a.com');
	expect(vm.formatFullName({ UserSubmission: { Firstname: 'Ana', Lastname: 'Paz', Email: 'a@a.com' } })).toBe('Ana Paz');
});

it('joinArray une con saltos de línea HTML', () => {
	expect(setup().vm.joinArray(['a', 'b', 'c'])).toBe('a<br>b<br>c');
});

it('joinArray con hipervínculos crea un enlace por URL y quita el host propio del texto', () => {
	const { vm } = setup();
	const text = vm.joinArray(['http://server.test/map/1', 'http://otro.test/x'], true);
	expect(text).toBe("<a href='http://server.test/map/1' target='_blank'>/map/1</a><br>"
		+ "<a href='http://otro.test/x' target='_blank'>http://otro.test/x</a>");
});

it('removeProt quita https:// y la barra final', () => {
	const { vm } = setup();
	expect(vm.removeProt('https://sitio.org/')).toBe('sitio.org');
	expect(vm.removeProt('https://sitio.org/ruta')).toBe('sitio.org/ruta');
	expect(vm.removeProt('http://sitio.org/')).toBe('http://sitio.org');
});

describe('Statistics: caché local');

it('toCache guarda los datos bajo el mes actual', () => {
	const { vm } = setup();
	vm.currentMonth = '2024-03';
	const data = stats();
	vm.toCache(data);
	expect(vm.getFromCache('2024-03')).toBe(data);
});

it('toCache sin mes actual usa el primer mes de los datos', () => {
	const { vm } = setup();
	const data = stats({ Months: ['2024-06', '2024-05'] });
	vm.toCache(data);
	expect(vm.getFromCache('2024-06')).toBe(data);
});

it('getFromCache devuelve vacío para un mes sin datos', () => {
	expect(setup().vm.getFromCache('2020-01')).toBe(undefined);
});

describe('Statistics.loadData');

it('no hace nada mientras la vista no esté montada', async () => {
	const { vm } = setup();
	vm.loadData();
	await settle();
	expect(axios.calls).toHaveLength(0);
});

it('pide las estadísticas del mes actual con mensaje de espera, las guarda en caché y las muestra', async () => {
	const { vm, invoker } = setup();
	vm.mounted = true;
	serve({ [GET_STATS]: stats() });
	vm.loadData();
	expect(invoker.message).toBe('Obteniendo estadísticas...');
	await settle();
	expect(axios.calls[0].config.params).toEqual({ m: null });
	expect(vm.getFromCache('2024-05')).toBeTruthy();
	expect(vm.works).toEqual([{ Id: 1 }]);
	expect(vm.months).toEqual(['2024-05', '2024-04']);
});

it('si el mes ya está en caché lo muestra sin consultar al servidor', async () => {
	const { vm } = setup();
	vm.mounted = true;
	vm.currentMonth = '2024-04';
	vm.toCache(stats({ Works: [{ Id: 7 }] }));
	vm.loadData();
	await settle();
	expect(axios.calls).toHaveLength(0);
	expect(vm.works).toEqual([{ Id: 7 }]);
});

describe('Statistics.receiveData');

it('llena cada lista conservando su referencia y toma el indicador de resumen', () => {
	const { vm } = setup();
	const lists = { works: vm.works, totals: vm.totals, resources: vm.resources, metrics: vm.metrics, downloadTypes: vm.downloadTypes, embedding: vm.embedding, months: vm.months };
	vm.receiveData(stats({ IsSummarized: true }));
	expect(vm.isSummarized).toBe(true);
	Object.keys(lists).forEach(function (name) {
		expect(vm[name]).toBe(lists[name]);
	});
	expect(vm.totals).toEqual([{ Total: 10 }]);
	expect(vm.resources).toEqual([{ Url: 'x' }]);
	expect(vm.metrics).toEqual([{ Id: 3 }]);
	expect(vm.downloadTypes).toEqual([{ Type: 'csv' }]);
	expect(vm.embedding).toEqual([{ Url: 'http://otro.test' }]);
});

it('sin meses en los datos no modifica la lista de meses ni el mes actual', () => {
	const { vm } = setup();
	vm.months.push('2024-01');
	vm.currentMonth = '2024-01';
	vm.receiveData(stats({ Months: [] }));
	expect(vm.months).toEqual(['2024-01']);
	expect(vm.currentMonth).toBe('2024-01');
});

it('a los 50 ms incrementa la clave del componente para forzar su redibujado', () => {
	const { env, vm } = setup();
	vm.receiveData(stats());
	expect(env.timers.pending).toHaveLength(1);
	expect(env.timers.pending[0].ms).toBe(50);
	expect(vm.componentKey).toBe(0);
	env.timers.flush();
	expect(vm.componentKey).toBe(1);
});

it('comportamiento actual: el mes actual se lee antes de llenar la lista de meses, por eso la primera carga lo deja indefinido', () => {
	const { vm } = setup();
	vm.receiveData(stats());
	expect(vm.months).toEqual(['2024-05', '2024-04']);
	expect(vm.currentMonth).toBe(undefined);
	vm.receiveData(stats());
	expect(vm.currentMonth).toBe('2024-05');
});

describe('Statistics.calculateStats');

it('con un mes elegido recalcula en el servidor, descarta la caché de ese mes y vuelve a consultar', async () => {
	const { vm, invoker } = setup();
	vm.mounted = true;
	vm.currentMonth = '2024-05';
	vm.toCache(stats({ Works: [{ Id: 1 }] }));
	serve({ [PROCESS_STATS]: {}, [GET_STATS]: stats({ Works: [{ Id: 2 }] }) });
	vm.calculateStats();
	expect(invoker.message).toBe('Calculando estadísticas...');
	await settle();
	expect(axios.calls.map(function (c) { return c.url.split('/').pop(); })).toEqual(['ProcessStatistics', 'GetStatistics']);
	expect(axios.calls[0].config.params).toEqual({ m: '2024-05' });
	expect(axios.calls[1].config.params).toEqual({ m: '2024-05' });
	expect(vm.works).toEqual([{ Id: 2 }]);
});

it('defecto conocido: sin un mes elegido falla al descartar la caché y no vuelve a consultar', async () => {
	const { vm } = setup();
	vm.mounted = true;
	serve({ [PROCESS_STATS]: {} });
	let reasons = [];
	await quiet(async function () {
		reasons = await captureUnhandled(function () { vm.calculateStats(); });
	});
	expect(axios.calls).toHaveLength(1);
	expect(reasons).toHaveLength(1);
	expect(reasons[0] instanceof TypeError).toBe(true);
});

describe('Statistics: navegación');

it('arma las rutas del mapa de una obra y de un indicador', () => {
	const { vm } = setup();
	expect(vm.getWorkUri({ Id: 12 })).toBe('/map/12');
	expect(vm.getMetricUri({ Id: 34 })).toBe('/map/#/l=34');
});

it('select y selectMetric las abren en una pestaña nueva', () => {
	const { env, vm } = setup();
	vm.select({ Id: 12 });
	vm.selectMetric({ Id: 34 });
	expect(env.opened).toEqual([
		{ url: '/map/12', target: '_blank' },
		{ url: '/map/#/l=34', target: '_blank' },
	]);
});
