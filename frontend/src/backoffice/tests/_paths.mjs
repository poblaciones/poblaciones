// Rutas y paquetes reemplazados, compartidos por el registro de CommonJS
// (_register-alias.mjs) y los hooks de ESM (_alias-hooks.mjs).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const testsDir = path.dirname(fileURLToPath(import.meta.url));
export const backofficeRoot = path.resolve(testsDir, '..');
export const sourceRoot = path.resolve(backofficeRoot, '..');

const stubsDir = path.join(testsDir, '_stubs');
const commonStubsDir = path.join(sourceRoot, 'common', 'tests', '_stubs');

// Paquetes de UI y de red que no deben usarse en los tests. El doble de axios
// es el mismo de common: así ambos módulos comparten una única instancia.
export const stubbedPackages = {
	axios: path.join(commonStubsDir, 'axios.cjs'),
	vue: path.join(stubsDir, 'vue.mjs'),
	vuex: path.join(stubsDir, 'vuex.mjs'),
	'js-cookie': path.join(stubsDir, 'js-cookie.mjs'),
};
