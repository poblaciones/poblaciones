// Punto de registro del loader (se pasa con --import). Los módulos de common
// son CommonJS que se requieren entre sí por el alias '@/', que fuera de
// webpack no existe. Se resuelve en dos lugares:
//  - require() de CommonJS: se intercepta Module._resolveFilename (API no
//    documentada de Node, pero es el mecanismo estándar de los paquetes de alias).
//  - import de ESM (tests y módulos ESM de common): hooks de _alias-hooks.mjs.
import Module, { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(testsDir, '..', '..');

// Paquetes de red que no deben usarse en los tests: se reemplazan por dobles.
const stubbedPackages = {
	axios: path.join(testsDir, '_stubs', 'axios.cjs'),
};

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
	if (stubbedPackages[request]) {
		return stubbedPackages[request];
	}
	if (request.startsWith('@/')) {
		const target = path.join(sourceRoot, request.substring(2));
		return resolveFilename.call(this, target, parent, isMain, options);
	}
	return resolveFilename.call(this, request, parent, isMain, options);
};

register('./_alias-hooks.mjs', import.meta.url);
