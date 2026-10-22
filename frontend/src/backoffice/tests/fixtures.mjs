// Dobles de los globales que consultan las clases de backoffice (window.Context,
// window.Db, window.host) sobre los dobles de navegador de common. Cada test
// los reinstala con setupBackoffice(); no hay estado compartido entre tests.
import querystring from 'node:querystring';
import { setupBrowser } from '@/common/tests/fixtures.mjs';

export { captureConsole, captureConsoleAsync, flushPromises } from '@/common/tests/fixtures.mjs';

// Reemplaza el usuario de window.Context con las reglas reales de privilegios:
// A administrador, E editor, L lector, P estándar.
function makeContext(privileges) {
	const context = {
		User: { Privileges: privileges },
		ErrorSignaled: { value: 0 },
		CurrentWork: null,
		IsAdmin() {
			return context.User.Privileges === 'A';
		},
		CanCreatePublicData() {
			return context.User.Privileges === 'A' || context.User.Privileges === 'E';
		},
	};
	return context;
}

export function setupBackoffice(privileges) {
	const browser = setupBrowser();
	browser.window.host = 'https://api.example.org';
	browser.window.Context = makeContext(privileges || 'P');
	browser.window.Db = {};
	return browser;
}

// Cuerpo de un POST registrado por el doble de axios, ya separado en campos
// (los valores que eran objetos llegan como texto JSON).
export function parseBody(call) {
	return querystring.parse(call.body);
}

// El doble de axios de common no incluye CancelToken, que ActiveDataset usa en
// SetColumnOrder. El token invoca al ejecutor con una función de cancelación
// identificable, que el test recupera a través del valor de retorno.
export function installCancelToken(axios) {
	const cancel = function cancel() {};
	axios.CancelToken = function CancelToken(executor) {
		executor(cancel);
	};
	return cancel;
}

function resolvePropDefault(definition) {
	if (definition === null || definition === undefined) {
		return undefined;
	}
	if (typeof definition === 'function') {
		if (definition === Boolean) {
			return false;
		}
		return undefined;
	}
	if (definition.default !== undefined) {
		if (typeof definition.default === 'function' && definition.type !== Function) {
			return definition.default();
		}
		return definition.default;
	}
	if (definition.type === Boolean) {
		return false;
	}
	return undefined;
}

// "Instancia" el objeto de opciones de un componente sin Vue: defaults de
// props, data(), methods enlazados, computed como getters sin caché y $emit
// registrado en $emitted. No ejercita template, DOM ni watchers (para esos,
// el test invoca component.watch[nombre].call(vm)).
//  options.propsData: valores de props.   options.mocks: $route, $router, $refs, etc.
let nextUid = 1;

export function mountLite(component, options) {
	const settings = options || {};
	const vm = {
		_uid: nextUid++,
		$emitted: [],
		$refs: {},
		$t(key) {
			return key;
		},
		$emit(name, ...args) {
			vm.$emitted.push([name, ...args]);
		},
		$nextTick(callback) {
			return Promise.resolve().then(callback);
		},
		$set(target, key, value) {
			target[key] = value;
		},
	};
	const props = component.props || {};
	const propNames = Array.isArray(props) ? props : Object.keys(props);
	for (const name of propNames) {
		if (Array.isArray(props)) {
			vm[name] = undefined;
		} else {
			vm[name] = resolvePropDefault(props[name]);
		}
	}
	Object.assign(vm, settings.propsData || {});
	if (component.data) {
		Object.assign(vm, component.data.call(vm));
	}
	for (const [name, method] of Object.entries(component.methods || {})) {
		vm[name] = method.bind(vm);
	}
	for (const [name, definition] of Object.entries(component.computed || {})) {
		const descriptor = { configurable: true, enumerable: true };
		if (typeof definition === 'function') {
			descriptor.get = definition.bind(vm);
		} else {
			descriptor.get = definition.get.bind(vm);
			if (definition.set) {
				descriptor.set = definition.set.bind(vm);
			}
		}
		Object.defineProperty(vm, name, descriptor);
	}
	Object.assign(vm, settings.mocks || {});
	return vm;
}
