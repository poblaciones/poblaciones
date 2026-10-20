// Punto de registro del loader (se pasa con --import). Los fuentes que se
// ejecutan (credentials, common, backoffice) mezclan ESM y CommonJS y se
// referencian entre sí por el alias '@/', que fuera de webpack no existe:
//  - require() de CommonJS: se intercepta Module._resolveFilename.
//  - import de ESM (vistas .vue, módulos ESM): hooks de _alias-hooks.mjs.
// Solo se reemplazan paquetes de terceros (ver _stubs/); el código del
// proyecto se carga siempre real.
import Module, { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(testsDir, '..', '..');

const stubbedPackages = {
	axios: path.join(testsDir, '_stubs', 'axios.cjs'),
};

// Los assets (imágenes) los resuelve webpack a una URL; bajo Node se
// resuelven a un módulo cuyo export default es una URL ficticia.
const assetStub = path.join(testsDir, '_stubs', 'asset.cjs');

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
	if (stubbedPackages[request]) {
		return stubbedPackages[request];
	}
	if (/\.(gif|png|jpg|jpeg|svg)$/.test(request)) {
		return assetStub;
	}
	if (request.startsWith('@/')) {
		const target = path.join(sourceRoot, request.substring(2));
		return resolveFilename.call(this, target, parent, isMain, options);
	}
	return resolveFilename.call(this, request, parent, isMain, options);
};

register('./_alias-hooks.mjs', import.meta.url);
