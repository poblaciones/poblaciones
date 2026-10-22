// Punto de registro del loader (se pasa con --import). Los módulos se
// requieren entre sí por el alias '@/', que fuera de webpack no existe. Se
// resuelve en dos lugares:
//  - require() de CommonJS: se intercepta Module._resolveFilename (API no
//    documentada de Node, pero es el mecanismo estándar de los paquetes de alias).
//  - import de ESM: hooks de _alias-hooks.mjs.
import Module, { register } from 'node:module';
import path from 'node:path';
import { genericStub, genericStubPrefixes, isStylesheet, sourceRoot, stubbedAliases, stubbedPackages } from './_paths.mjs';

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
	if (stubbedPackages[request]) {
		return stubbedPackages[request];
	}
	for (const prefix of genericStubPrefixes) {
		if (request.startsWith(prefix)) {
			return genericStub;
		}
	}
	if (isStylesheet(request)) {
		return genericStub;
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

// Los componentes requieren imágenes (require('../assets/x.gif').default);
// bajo Node se resuelven al nombre del archivo, que alcanza para verificarlas.
for (const extension of ['.gif', '.png', '.jpg', '.svg']) {
	Module._extensions[extension] = function (module, filename) {
		module.exports = { default: path.basename(filename) };
	};
}

register('./_alias-hooks.mjs', import.meta.url);
