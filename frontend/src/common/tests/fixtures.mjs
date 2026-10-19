// Dobles mínimos de los globales del navegador que consultan los módulos de
// common (window, document, localStorage, alert). Cada test los reinstala con
// setupBrowser(); no hay estado compartido entre tests.

// localStorage real convierte todo valor a texto: setItem(k, null) guarda 'null'.
export function makeStorage() {
	const data = new Map();
	return {
		getItem(key) {
			if (data.has(key)) {
				return data.get(key);
			}
			return null;
		},
		setItem(key, value) {
			data.set(key, String(value));
		},
		removeItem(key) {
			data.delete(key);
		},
		dump() {
			return Object.fromEntries(data);
		},
	};
}

function makeClassList(initialClasses) {
	const classes = new Set(initialClasses);
	return {
		add(name) { classes.add(name); },
		remove(name) { classes.delete(name); },
		contains(name) { return classes.has(name); },
		toArray() { return Array.from(classes); },
	};
}

export function makeElement(initialClasses) {
	return {
		style: {},
		innerHTML: '',
		classList: makeClassList(initialClasses || []),
	};
}

function makeLocation(href) {
	return { href: href, toString() { return href; } };
}

// byClass / byId: { nombre: elemento(s) }. styleSheets: array de hojas.
export function makeDocument(options) {
	const byClass = (options && options.byClass) || {};
	const byId = (options && options.byId) || {};
	return {
		location: makeLocation('http://localhost/app#/inicio'),
		styleSheets: (options && options.styleSheets) || [],
		getElementsByClassName(name) {
			if (byClass[name]) {
				return byClass[name];
			}
			return [];
		},
		getElementById(id) {
			return byId[id];
		},
	};
}

// Devuelve los dobles instalados para poder inspeccionarlos y ajustarlos.
export function setupBrowser(options) {
	const alerts = [];
	const browser = {
		alerts: alerts,
		storage: makeStorage(),
		document: makeDocument(options),
		window: {
			location: { href: 'https://example.org/app/?a=1', protocol: 'https:', hostname: 'example.org', port: '' },
			mainHost: 'https://main.example.org',
		},
	};
	globalThis.window = browser.window;
	globalThis.document = browser.document;
	globalThis.localStorage = browser.storage;
	globalThis.alert = function (message) { alerts.push(message); };
	return browser;
}

// Ejecuta fn con console.error/console.log capturados y los restaura siempre,
// incluso si fn lanza: un test fallido no debe silenciar el reporte del harness.
export function captureConsole(fn) {
	const captured = { errors: [], logs: [] };
	const originalError = console.error;
	const originalLog = console.log;
	console.error = function (...args) { captured.errors.push(args); };
	console.log = function (...args) { captured.logs.push(args); };
	try {
		fn();
	} finally {
		console.error = originalError;
		console.log = originalLog;
	}
	return captured;
}

// Versión de captureConsole para funciones asíncronas.
export async function captureConsoleAsync(fn) {
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

// Deja correr todas las promesas ya resueltas (las cadenas de .then terminan
// dentro de un mismo ciclo del temporizador).
export function flushPromises() {
	return new Promise(function (resolve) { setTimeout(resolve, 0); });
}
