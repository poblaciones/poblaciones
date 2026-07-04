// Punto de registro del loader (se pasa con --import). Instala:
//  1. Los hooks de resolución/carga (_alias-hooks.mjs): mapean los alias @/...
//     del proyecto a los fuentes reales del módulo o a stubs, extraen el
//     <script> de los .vue y adaptan los módulos CommonJS (helper.js).
//  2. globalThis.__stubRequire: reemplazo de los require() inline que quedan
//     dentro de módulos ESM del proyecto (multigeojson, parse-svg, querystring,
//     form-data) y de los require() de helper.js. Devuelve stubs mínimos; si
//     un test ejercita una rama que requiere un paquete no contemplado, se
//     agrega acá su stub.
import { register } from 'node:module';

// window mínimo disponible desde la carga de módulos: el patrón de herencia
// X.prototype = new Y() ejecuta constructores base que consultan window.SegMap
// en import time. setupWindow() (fixtures) lo reemplaza por el mock completo.
globalThis.window = { SegMap: null, Use: {}, Embedded: { Active: false } };

globalThis.__stubRequire = function (specifier) {
	switch (specifier) {
		case '@tweenjs/tween.js':
			return { Tween: function () {}, update: function () {} };
		case '@/common/framework/str':
			return {
				EscapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
				Wrap(s) { return s; },
			};
		case 'multigeojson':
			return { explode: function (g) { return [g]; } };
		case 'parse-svg':
			return function () { return { nodeType: 1 }; };
		case 'querystring':
			return { stringify: (o) => JSON.stringify(o) };
		case 'form-data':
			return function () { this.append = function () {}; };
		default:
			throw new Error('__stubRequire: paquete no contemplado: ' + specifier);
	}
};

register('./_alias-hooks.mjs', import.meta.url);
