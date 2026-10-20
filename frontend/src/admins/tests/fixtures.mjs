// Utilidades compartidas por los tests del módulo admins.
//
// - setupGlobals(): reinstala los globales del navegador (window, document,
//   localStorage, alert, confirm, navigator, setTimeout) y crea el Context y
//   el Db reales del módulo. Cada test parte de un entorno limpio.
// - mountLite(): instancia el objeto de opciones de un .vue sin Vue ni DOM:
//   props, methods, data y computed enlazados al mismo `this`.
// - makeInvoker() / makeStepper(): instancias de los componentes reales
//   Invoker y Stepper del backoffice, usadas como $refs de las vistas. Solo se
//   reemplaza el diálogo de confirmación (un componente visual).
// - serve(): programa las respuestas del servidor sobre el doble de axios.
import querystring from 'node:querystring';
import axios from './_stubs/axios.cjs';
import Context from '@/admins/classes/Context';
import Db from '@/admins/classes/Db';
import Invoker from '@/backoffice/components/Invoker.vue';
import Stepper from '@/backoffice/components/Stepper.vue';

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

// options.privileges: privilegios del usuario actual (sin él, no hay usuario).
// options.initialize: false evita crear los catálogos del Context.
export function setupGlobals(options) {
	const opts = options || {};
	const storage = makeStorage();
	const alerts = [];
	const confirms = [];
	const timers = makeTimers();
	const opened = [];
	const clipboard = [];
	const env = { confirmAnswer: true };

	globalThis.localStorage = storage;
	globalThis.alert = function (message) { alerts.push(message); };
	globalThis.confirm = function (message) {
		confirms.push(message);
		return env.confirmAnswer;
	};
	globalThis.setTimeout = timers.set.bind(timers);
	globalThis.document = { location: { href: 'http://localhost/admins/#/public' }, title: '' };
	Object.defineProperty(globalThis, 'navigator', {
		value: { clipboard: { writeText(text) { clipboard.push(text); } } },
		configurable: true,
		writable: true,
	});
	globalThis.window = {
		host: opts.host || 'http://server.test',
		mainHost: opts.mainHost,
		onerror: null,
		open(url, target) {
			opened.push({ url, target });
		},
	};
	const context = new Context();
	if (opts.privileges) {
		context.User = { Privileges: opts.privileges, User: opts.userEmail || 'yo@mail.com', Id: 1 };
	}
	globalThis.window.Context = context;
	if (opts.initialize !== false) {
		context.Initialize();
	}
	globalThis.window.Db = new Db();
	axios.reset();
	return Object.assign(env, { storage, alerts, confirms, timers, opened, clipboard, context, db: globalThis.window.Db, document: globalThis.document });
}

// Deja correr las cadenas de promesas pendientes.
export function settle() {
	return new Promise(function (resolve) { setImmediate(resolve); });
}

// Ejecuta fn y devuelve las promesas rechazadas sin manejar durante su
// ejecución (Node terminaría el proceso si nadie las escucha).
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

// Silencia console.error/console.log durante fn y devuelve lo capturado.
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
// Servidor
// ---------------------------------------------------------------------

// Programa las respuestas del servidor. Claves: 'GET /ruta' o 'POST /ruta'
// (la ruta se completa con window.host) o 'GET http://otro-host/ruta'. Un
// valor Error simula una falla de red; cualquier otro es el cuerpo de la
// respuesta. Lo no programado rechaza.
export function serve(routes) {
	const byMethod = { get: {}, post: {} };
	Object.keys(routes).forEach(function (key) {
		const space = key.indexOf(' ');
		const method = key.substring(0, space).toLowerCase();
		const target = key.substring(space + 1);
		const url = target.startsWith('http') ? target : globalThis.window.host + target;
		const body = routes[key];
		byMethod[method][url] = body instanceof Error ? body : { data: body };
	});
	axios.respondByUrl('get', byMethod.get);
	axios.respondByUrl('post', byMethod.post);
}

// Cuerpo de un POST como objeto: los valores serializados como JSON por
// axiosClient (objetos y arrays) se decodifican; el resto queda como texto.
export function bodyOf(call) {
	const parsed = querystring.parse(call.body);
	const result = {};
	Object.keys(parsed).forEach(function (key) {
		const value = parsed[key];
		result[key] = (value.startsWith('{') || value.startsWith('[')) ? JSON.parse(value) : value;
	});
	return result;
}

// ---------------------------------------------------------------------
// Instanciación de componentes
// ---------------------------------------------------------------------

function makeRouter() {
	const pushed = [];
	return { pushed, push(location) { pushed.push(location); } };
}

// Como Vue: el default de una prop de tipo Function es la función misma;
// para cualquier otro tipo, un default función es una fábrica.
function propDefault(spec) {
	if (spec && typeof spec === 'object' && 'default' in spec) {
		if (spec.type === Function) {
			return spec.default;
		}
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
	vm.$set = function (target, key, value) { target[key] = value; };
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
	return vm;
}

export function callHook(component, vm, name) {
	return component[name].call(vm);
}

// Dispara el watcher `name` como lo haría Vue al cambiar el valor.
export function triggerWatch(component, vm, name, newValue, oldValue) {
	const watcher = component.watch[name];
	const handler = typeof watcher === 'function' ? watcher : watcher.handler;
	return handler.call(vm, newValue, oldValue);
}

// ---------------------------------------------------------------------
// Componentes reales usados como $refs
// ---------------------------------------------------------------------

// Invoker real. Solo el diálogo de confirmación es un doble: registra que se
// mostró; el usuario "acepta" llamando a invoker.confirmed().
export function makeInvoker() {
	const confirmDialog = { shown: 0, show() { confirmDialog.shown++; } };
	const invoker = mountLite(Invoker, { refs: { confirmDialog } });
	invoker.confirmDialog = confirmDialog;
	return invoker;
}

// Stepper real: usa el doble de axios. Para completar un proceso, el
// servidor responde { done: true } a la URL de inicio.
export function makeStepper(props) {
	return mountLite(Stepper, { props });
}

// Doble de un popup hijo: registra los argumentos de show().
export function makePopup() {
	const popup = { shown: [] };
	popup.show = function (...args) { popup.shown.push(args); };
	return popup;
}

// Foco: elemento con focus() contabilizado.
export function makeFocusable() {
	const element = { focused: 0 };
	element.focus = function () { element.focused++; };
	return element;
}

// Deja un catálogo (AsyncCatalog real) como si ya hubiera cargado `list`.
export function preload(catalog, list) {
	catalog.list = list;
	catalog.hasData = true;
}
