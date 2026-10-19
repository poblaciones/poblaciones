// Utilidades compartidas por los tests del módulo credentials.
//
// - setupGlobals(): reinstala los globales del navegador (window, document,
//   localStorage, alert, setTimeout) y el Context real del módulo. Cada test
//   parte de un entorno limpio; no hay estado compartido.
// - mountLite(): instancia el objeto de opciones de un .vue sin Vue ni DOM:
//   data, props, methods y computed enlazados al mismo `this`, y $v armado
//   con los validadores reales de vuelidate (ver buildValidation).
// - Dobles de componentes hijos ($refs): makeWait, makeMessageBox,
//   makeOpenAuth.
import axios from './_stubs/axios.cjs';
import Context from '@/credentials/classes/Context';

export { axios };

// ---------------------------------------------------------------------
// Entorno de navegador
// ---------------------------------------------------------------------

// localStorage real convierte todo valor a texto: setItem(k, null) guarda 'null'.
function makeStorage() {
	const data = new Map();
	return {
		getItem(key) { return data.has(key) ? data.get(key) : null; },
		setItem(key, value) { data.set(key, String(value)); },
		removeItem(key) { data.delete(key); },
		dump() { return Object.fromEntries(data); },
	};
}

// Bus mínimo con la interfaz de eventos de una instancia de Vue
// ($on/$emit): main.js usa una instancia de Vue como window.Messages.
function makeBus() {
	const handlers = {};
	return {
		emitted: [],
		$on(name, fn) {
			(handlers[name] = handlers[name] || []).push(fn);
		},
		$emit(name, ...args) {
			this.emitted.push(name);
			(handlers[name] || []).forEach(function (fn) { fn(...args); });
		},
		listenerCount(name) { return (handlers[name] || []).length; },
	};
}

// setTimeout manual: los tests deciden cuándo vencen los temporizadores.
function makeTimers() {
	const pending = [];
	return {
		pending,
		set(fn, ms) {
			pending.push({ fn, ms });
			return pending.length;
		},
		flush() {
			while (pending.length > 0) {
				pending.shift().fn();
			}
		},
	};
}

export function setupGlobals(options) {
	const opts = options || {};
	const storage = makeStorage();
	const alerts = [];
	const timers = makeTimers();
	const messages = makeBus();
	const listeners = [];
	const opened = [];

	const context = new Context();
	context.ServerLoaded = opts.serverLoaded === true;

	globalThis.localStorage = storage;
	globalThis.alert = function (message) { alerts.push(message); };
	globalThis.setTimeout = timers.set.bind(timers);
	globalThis.document = { location: { href: 'http://localhost/credentials/#/signin' } };
	globalThis.window = {
		host: opts.host || 'http://server.test',
		mainHost: opts.mainHost,
		Context: context,
		Messages: messages,
		onerror: null,
		addEventListener(name, fn) { listeners.push({ action: 'add', name, fn }); },
		removeEventListener(name, fn) { listeners.push({ action: 'remove', name, fn }); },
		open(url, name, features) {
			const win = { url, name, features, closed: false, close() { win.closed = true; } };
			opened.push(win);
			return win;
		},
	};
	axios.reset();
	return { storage, alerts, timers, messages, context, listeners, opened, document: globalThis.document };
}

// Deja correr las cadenas de promesas pendientes (los métodos de las vistas
// no devuelven la promesa que encadenan).
export function settle() {
	return new Promise(function (resolve) { setImmediate(resolve); });
}

// Ejecuta fn y devuelve las promesas rechazadas sin manejar durante su
// ejecución. Las vistas relanzan el error dentro de un catch cuya promesa no
// se devuelve: sin este captador, Node terminaría el proceso.
export async function captureUnhandled(fn) {
	const reasons = [];
	const handler = function (reason) { reasons.push(reason); };
	process.on('unhandledRejection', handler);
	try {
		await fn();
		await settle();
		await settle();
	} finally {
		process.off('unhandledRejection', handler);
	}
	return reasons;
}

// ---------------------------------------------------------------------
// Respuestas del servidor (shape que consumen axiosClient y las vistas)
// ---------------------------------------------------------------------

// Programa las respuestas del servidor. Claves: 'GET /ruta' o 'POST /ruta'
// (la ruta se completa con window.host). Un valor Error simula una falla de
// red; cualquier otro es el cuerpo de la respuesta. Lo no programado rechaza.
export function serve(routes) {
	const byMethod = { get: {}, post: {} };
	Object.keys(routes).forEach(function (key) {
		const space = key.indexOf(' ');
		const method = key.substring(0, space).toLowerCase();
		const url = globalThis.window.host + key.substring(space + 1);
		const body = routes[key];
		byMethod[method][url] = body instanceof Error ? body : { data: body };
	});
	axios.respondByUrl('get', byMethod.get);
	axios.respondByUrl('post', byMethod.post);
}

// Silencia console.error/console.log durante fn (errDialog y HandleError
// escriben ahí) y devuelve lo capturado.
export async function quiet(fn) {
	const captured = { errors: [], logs: [] };
	const originalError = console.error;
	const originalLog = console.log;
	console.error = function (...args) { captured.errors.push(args); };
	console.log = function (...args) { captured.logs.push(args); };
	try {
		await fn();
	} finally {
		console.error = originalError;
		console.log = originalLog;
	}
	return captured;
}

// ---------------------------------------------------------------------
// Instanciación de componentes
// ---------------------------------------------------------------------

function makeRouter() {
	const pushed = [];
	return { pushed, push(location) { pushed.push(location); } };
}

// Arma $v con la semántica de vuelidate: cada campo de `validations` tiene
// reglas que se evalúan como regla.call(vm, valor, vm); $invalid del
// componente es verdadero si falla cualquier regla de cualquier campo.
function buildValidation(validations, vm) {
	const v = { $dirty: false };
	const fields = Object.keys(validations);
	fields.forEach(function (field) {
		const rules = validations[field];
		v[field] = {
			$dirty: false,
			get $invalid() {
				return Object.keys(rules).some(function (name) {
					return !rules[name].call(vm, vm[field], vm);
				});
			},
			get $error() { return this.$dirty && this.$invalid; },
		};
	});
	Object.defineProperty(v, '$invalid', {
		get() { return fields.some(function (field) { return v[field].$invalid; }); },
	});
	v.$touch = function () {
		v.$dirty = true;
		fields.forEach(function (field) { v[field].$dirty = true; });
	};
	return v;
}

function propDefault(spec) {
	if (spec && typeof spec === 'object' && 'default' in spec) {
		return typeof spec.default === 'function' ? spec.default() : spec.default;
	}
	return undefined;
}

// options: props, data (pisa los valores de data()), refs, route
// ({ query, path }), router.
export function mountLite(component, options) {
	const opts = options || {};
	const vm = {};
	vm.$emitted = [];
	vm.$emit = function (name, ...args) { vm.$emitted.push({ name, args }); };
	vm.$route = opts.route || { path: '/', query: {} };
	vm.$router = opts.router || makeRouter();
	vm.$refs = opts.refs || {};
	vm.$nextTick = function (callback) {
		if (callback) {
			callback();
		}
		return Promise.resolve();
	};

	// Mismo orden que Vue: props, methods, data, computed.
	const props = component.props || {};
	Object.keys(props).forEach(function (name) {
		vm[name] = (opts.props && name in opts.props) ? opts.props[name] : propDefault(props[name]);
	});
	const methods = component.methods || {};
	Object.keys(methods).forEach(function (name) {
		vm[name] = methods[name].bind(vm);
	});
	if (component.data) {
		Object.assign(vm, component.data.call(vm));
	}
	if (opts.data) {
		Object.assign(vm, opts.data);
	}
	const computed = component.computed || {};
	Object.keys(computed).forEach(function (name) {
		const getter = typeof computed[name] === 'function' ? computed[name] : computed[name].get;
		Object.defineProperty(vm, name, { get: getter.bind(vm), configurable: true });
	});
	if (component.validations) {
		vm.$v = buildValidation(component.validations, vm);
	}
	return vm;
}

export function callHook(component, vm, name) {
	return component[name].call(vm);
}

// ---------------------------------------------------------------------
// Dobles de componentes hijos
// ---------------------------------------------------------------------

export function makeWait() {
	const wait = { started: 0, stopped: 0 };
	wait.Start = function () { wait.started++; };
	wait.Stop = function () { wait.stopped++; };
	return wait;
}

export function makeMessageBox() {
	const box = { messages: [] };
	box.show = function (message) { box.messages.push(message); };
	return box;
}

export function makeOpenAuth() {
	const auth = { shown: [] };
	auth.show = function (url, checkTerms) { auth.shown.push({ url, checkTerms }); };
	return auth;
}
