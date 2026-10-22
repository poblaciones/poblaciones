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
	colorbrewer: path.join(stubsDir, 'colorbrewer.cjs'),
	'vue-router': path.join(stubsDir, 'vue-router.mjs'),
	'vue-clickaway': path.join(stubsDir, 'vue-clickaway.mjs'),
	'vue-sidebar-menu': path.join(stubsDir, 'vue-sidebar-menu.mjs'),
};

// Paquetes de interfaz sin lógica que los tests ejerciten: cualquier import
// que empiece con estos prefijos resuelve a un componente vacío.
export const genericStubPrefixes = [
	'split.js', 'vue2-dropzone', 'html2canvas', 'leaflet',
	'jqwidgets-scripts/', 'vue-material-design-icons/',
];
export const genericStub = path.join(stubsDir, 'generic.mjs');

// Las hojas de estilo importadas por los componentes no tienen efecto bajo Node.
export function isStylesheet(specifier) {
	return specifier.endsWith('.css');
}

// Módulos del proyecto que se reemplazan por completo: el helper del visor
// (map) arrastra dependencias de mapa que no corresponden a estos tests.
export const stubbedAliases = {
	'@/map/js/helper': path.join(stubsDir, 'mapHelper.cjs'),
};

// Archivos del proyecto que se reemplazan por completo. Layout arrastra la
// barra lateral y componentes del módulo map; el router solo necesita su
// identidad para saber qué rutas lo usan.
export const stubbedFiles = {
	[path.join(sourceRoot, 'backoffice', 'views', 'Layout', 'Layout.vue')]: path.join(stubsDir, 'layout.mjs'),
};
