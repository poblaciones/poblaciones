import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises, captureConsoleAsync } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import Stepper from '@/backoffice/components/Stepper.vue';

const START_URL = 'https://api.example.org/services/backoffice/StartX';
const STEP_URL = 'https://api.example.org/services/backoffice/StepX';
const SUPPORT_TEXT = 'Si el problema persiste, escriba a contacto@poblaciones.org para recibir ayuda para resolver el incidente.';

function mountStepper(propsData) {
	axios.reset();
	const browser = setupBackoffice();
	const vm = mountLite(Stepper, { propsData: propsData });
	return { vm: vm, browser: browser };
}

function progress(step, key) {
	return { data: { done: false, step: step, totalSteps: 3, slice: 0, totalSlices: 0, status: 'Paso ' + step, key: key } };
}

describe('Stepper: estado inicial y propiedades');

it('useClose es verdadero y el destino de la visita es una pestaña nueva por defecto', () => {
	const { vm } = mountStepper({});
	expect(vm.useClose).toBeTruthy();
	expect(vm.visitTarget).toBe('_blank');
	expect(vm.showDialog).toBeFalsy();
	expect(vm.complete).toBeFalsy();
});

describe('Stepper: propiedades calculadas');

it('realTitle prefiere el título asignado por método sobre el de la propiedad', () => {
	const { vm } = mountStepper({ title: 'Título base' });
	expect(vm.realTitle).toBe('Título base');
	vm.setTitle('Publicando cartografía');
	expect(vm.realTitle).toBe('Publicando cartografía');
});

it('completed es verdadero con un error o con el proceso completo', () => {
	const { vm } = mountStepper({});
	expect(vm.completed).toBeFalsy();
	vm.error = 'falló';
	expect(vm.completed).toBeTruthy();
	vm.error = '';
	vm.complete = true;
	expect(vm.completed).toBeTruthy();
});

it('stepsPercentage calcula el avance por pasos, sumando la proporción de partes del paso actual', () => {
	const { vm } = mountStepper({});
	vm.totalSteps = 0;
	expect(vm.stepsPercentage).toBe(0);
	vm.totalSteps = 4;
	vm.step = 1;
	expect(vm.stepsPercentage).toBe(25);
	vm.totalSlices = 4;
	vm.slice = 2;
	expect(vm.stepsPercentage).toBe(37.5);
});

describe('Stepper: Reset, Start y Close');

it('Reset vuelve al estado inicial con el texto Iniciando o el indicado', () => {
	const { vm } = mountStepper({});
	vm.step = 2;
	vm.error = 'x';
	vm.imageSrc = 'a.gif';
	vm.visitUrl = '/v';
	vm.hideProgress = true;
	vm.Reset();
	expect(vm.totalSteps).toBe(1);
	expect(vm.step).toBe(0);
	expect(vm.status).toBe('Iniciando');
	expect(vm.error).toBe('');
	expect(vm.imageSrc).toBe('');
	expect(vm.visitUrl).toBe('');
	expect(vm.hideProgress).toBeFalsy();
	vm.Reset('Preparando');
	expect(vm.status).toBe('Preparando');
});

it('Start muestra el diálogo, reinicia el estado y navega a la dirección de inicio con sus argumentos', () => {
	const { vm } = mountStepper({});
	const navigated = [];
	vm.Navigate = function (url, args) { navigated.push([url, args]); };
	vm.startUrl = START_URL;
	vm.args = { w: 3 };
	vm.complete = true;
	vm.result = 'viejo';
	vm.Start();
	expect(vm.showDialog).toBeTruthy();
	expect(vm.complete).toBeFalsy();
	expect(vm.result).toBeNull();
	expect(navigated).toEqual([[START_URL, { w: 3 }]]);
});

it('Close oculta el diálogo y reinicia el estado', () => {
	const { vm } = mountStepper({});
	vm.showDialog = true;
	vm.step = 2;
	vm.Close();
	expect(vm.showDialog).toBeFalsy();
	expect(vm.step).toBe(0);
});

describe('Stepper: finalización');

it('ShowCompleted oculta el progreso, marca el proceso completo, muestra la imagen y avisa', () => {
	const { vm } = mountStepper({});
	vm.ShowCompleted();
	expect(vm.hideProgress).toBeTruthy();
	expect(vm.complete).toBeTruthy();
	expect(vm.imageSrc).toBe('finished.gif');
	expect(vm.$emitted).toEqual([['completed']]);
});

it('OnCompleted resuelve la promesa de Start y OnClosed informa si el proceso estaba completo', async () => {
	const { vm } = mountStepper({});
	vm.Navigate = function () {};
	const promise = vm.Start();
	await Promise.resolve();
	vm.OnCompleted();
	await promise;
	vm.OnClosed();
	expect(vm.$emitted).toEqual([['completed'], ['closed', false]]);
	vm.complete = true;
	vm.OnClosed();
	expect(vm.$emitted[2]).toEqual(['closed', true]);
});

it('ShowError oculta el progreso y deja el mensaje general con el detalle', () => {
	const { vm } = mountStepper({});
	vm.ShowError('detalle');
	expect(vm.hideProgress).toBeTruthy();
	expect(vm.error).toBe('El proceso no ha podido ser completado.');
	expect(vm.errorDetail).toBe('detalle');
});

describe('Stepper: formatError');

it('sin respuesta del servidor devuelve el mensaje del error', () => {
	const { vm } = mountStepper({});
	expect(vm.formatError({ message: 'Network Error' })).toBe('Network Error');
});

it('una respuesta con el prefijo [PE-E] muestra el texto del servidor, convirtiendo los saltos de línea', () => {
	const { vm } = mountStepper({});
	const error = { message: 'x', response: { data: '  [PE-E]: Primera línea\n\nSegundo párrafo\nOtra línea  ' } };
	expect(vm.formatError(error)).toBe('Primera línea</p><p>Segundo párrafo<br>Otra línea');
});

it('una respuesta de texto sin el prefijo conserva el mensaje del error', () => {
	const { vm } = mountStepper({});
	expect(vm.formatError({ message: 'x', response: { data: 'otra cosa' } })).toBe('x');
});

it('una respuesta que no es texto (objeto) conserva el mensaje en lugar de fallar', () => {
	const { vm } = mountStepper({});
	expect(vm.formatError({ message: 'Ha ocurrido un error.', response: { data: { done: false } } })).toBe('Ha ocurrido un error.');
});

it('el encabezado [PD-E] agrega el detalle de depuración y asegura el punto final', () => {
	const { vm } = mountStepper({});
	const header = encodeURIComponent('[PD-E]: Falló\nen la línea 3');
	const error = { message: 'x', response: { data: 'texto', headers: { 'error-header': header } } };
	expect(vm.formatError(error)).toBe(' [DEBUG]  Falló<br>en la línea 3.');
});

it('un encabezado sin el prefijo de depuración se ignora', () => {
	const { vm } = mountStepper({});
	const error = { message: 'x', response: { data: 'texto', headers: { 'error-header': 'cualquiera' } } };
	expect(vm.formatError(error)).toBe('x');
});

it('el error 500 genérico se reemplaza por el aviso de contacto con soporte', () => {
	const { vm } = mountStepper({});
	expect(vm.formatError({ message: 'Request failed with status code 500' })).toBe(SUPPORT_TEXT);
});

describe('Stepper: IterateLocalSteps');

it('ejecuta los pasos locales en orden, con su contexto, informando el estado y el avance', async () => {
	const { vm } = mountStepper({});
	const order = [];
	const container = { nombre: 'contenedor' };
	vm.clientSteps = [
		{ status: 'Uno', container: container, do() { order.push(['uno', this === container, vm.status, vm.slice]); return Promise.resolve(); } },
		{ status: 'Dos', container: container, do() { order.push(['dos', this === container, vm.status, vm.slice]); return Promise.resolve(); } },
	];
	await vm.IterateLocalSteps();
	expect(order).toEqual([['uno', true, 'Uno', 0], ['dos', true, 'Dos', 1]]);
	expect(vm.totalSlices).toBe(2);
	expect(vm.slice).toBe(2);
});

it('sin pasos locales deja el avance en cero', async () => {
	const { vm } = mountStepper({});
	await vm.IterateLocalSteps();
	expect(vm.totalSlices).toBe(0);
	expect(vm.slice).toBe(0);
});

describe('Stepper: Navigate');

it('recorre los pasos del servidor hasta que termina y entonces completa el proceso', async () => {
	const { vm } = mountStepper({});
	axios.respondByUrl('get', {
		[START_URL]: progress(1, 'abc'),
		[STEP_URL + '?k=abc']: { data: { done: true, visitUrl: '/mapa', visitCaption: 'Ver el mapa', stepperResult: { Id: 9 } } },
	});
	vm.startUrl = START_URL;
	vm.stepUrl = STEP_URL;
	const promise = vm.Start();
	await promise;
	expect(axios.calls.map(function (call) { return call.url; })).toEqual([START_URL, STEP_URL + '?k=abc']);
	expect(vm.complete).toBeTruthy();
	expect(vm.visitUrl).toBe('/mapa');
	expect(vm.visitCaption).toBe('Ver el mapa');
	expect(vm.result).toEqual({ Id: 9 });
});

it('mientras el proceso avanza informa pasos, partes, estado y clave y navega al paso siguiente', async () => {
	const { vm } = mountStepper({});
	axios.respondByUrl('get', {
		[START_URL]: { data: { done: false, step: 1, totalSteps: 3, slice: 2, totalSlices: 5, status: 'Procesando', key: 'abc' } },
	});
	const first = vm.Navigate;
	const next = [];
	vm.Navigate = function (url, args) {
		if (url === START_URL) {
			return first(url, args);
		}
		next.push([url, args]);
	};
	vm.stepUrl = STEP_URL;
	vm.Navigate(START_URL, {});
	await flushPromises();
	expect(vm.step).toBe(1);
	expect(vm.totalSteps).toBe(3);
	expect(vm.slice).toBe(2);
	expect(vm.totalSlices).toBe(5);
	expect(vm.status).toBe('Procesando');
	expect(vm.key).toBe('abc');
	expect(next).toEqual([[STEP_URL + '?k=abc', null]]);
});

it('envía la dirección completa de la página en el encabezado Full-Url', async () => {
	const { vm } = mountStepper({});
	axios.respond('get', { data: { done: true } });
	vm.Navigate(START_URL, { w: 3 });
	await flushPromises();
	expect(axios.calls[0].config.params).toEqual({ w: 3 });
	expect(typeof axios.calls[0].config.headers['Full-Url']).toBe('string');
});

it('ejecuta los pasos locales antes de completar cuando el servidor termina', async () => {
	const { vm } = mountStepper({});
	axios.respond('get', { data: { done: true } });
	let executed = 0;
	vm.clientSteps = [{ status: 'Local', container: {}, do() { executed++; return Promise.resolve(); } }];
	vm.Navigate(START_URL, {});
	await flushPromises();
	expect(executed).toBe(1);
	expect(vm.complete).toBeTruthy();
});

it('si un paso local falla muestra el error y lo registra, sin completar', async () => {
	const { vm, browser } = mountStepper({});
	axios.respond('get', { data: { done: true } });
	vm.clientSteps = [{ status: 'Local', container: {}, do() { return Promise.reject(new Error('paso local')); } }];
	await captureConsoleAsync(async function () {
		vm.Navigate(START_URL, {});
		await flushPromises();
	});
	expect(vm.complete).toBeFalsy();
	expect(vm.error).toBe('El proceso no ha podido ser completado.');
	expect(vm.errorDetail).toBe('paso local');
	expect(browser.window.Context.ErrorSignaled.value).toBe(1);
});

it('si el servidor no devuelve clave ni terminó muestra un error general, sin detalles técnicos', async () => {
	const { vm } = mountStepper({});
	axios.respond('get', { data: { done: false, step: 1, totalSteps: 3, slice: 0, totalSlices: 0, status: 'x', key: null } });
	await captureConsoleAsync(async function () {
		vm.Navigate(START_URL, {});
		await flushPromises();
	});
	expect(vm.error).toBe('El proceso no ha podido ser completado.');
	expect(vm.errorDetail).toBe('Ha ocurrido un error.');
	expect(axios.calls).toHaveLength(1);
});

it('un fallo de red muestra el error con el mensaje del servidor', async () => {
	const { vm, browser } = mountStepper({});
	axios.respond('get', new Error('Network Error'));
	await captureConsoleAsync(async function () {
		vm.Navigate(START_URL, {});
		await flushPromises();
	});
	expect(vm.error).toBe('El proceso no ha podido ser completado.');
	expect(vm.errorDetail).toBe('Network Error');
	expect(browser.window.Context.ErrorSignaled.value).toBe(1);
});
