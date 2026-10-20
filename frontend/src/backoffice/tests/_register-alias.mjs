// Punto de registro del loader (se pasa con --import). Los módulos se
// requieren entre sí por el alias '@/', que fuera de webpack no existe. Se
// resuelve en dos lugares:
//  - require() de CommonJS: se intercepta Module._resolveFilename (API no
//    documentada de Node, pero es el mecanismo estándar de los paquetes de alias).
//  - import de ESM: hooks de _alias-hooks.mjs.
import Module, { register } from 'node:module';
import path from 'node:path';
import { sourceRoot, stubbedAliases, stubbedPackages } from './_paths.mjs';

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
	if (stubbedPackages[request]) {
		return stubbedPackages[request];
	}
	if (stubbedAliases[request]) {
		return stubbedAliases[request];
	}
	if (request.startsWith('@/')) {
		const target = path.join(sourceRoot, request.substring(2));
		return resolveFilename.call(this, target, parent, isMain, options);
	}
	return resolveFilename.call(this, request, parent, isMain, options);
};

register('./_alias-hooks.mjs', import.meta.url);
