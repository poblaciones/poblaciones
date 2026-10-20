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
