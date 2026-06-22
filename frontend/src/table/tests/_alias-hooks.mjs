/*
 * _alias-hooks.mjs — hook de resolución para los tests.
 *
 * Mapea:
 *   - "@/table/..."  → la ruta real bajo table/
 *   - dependencias del proyecto (arr, promises, RegionSelection, ActiveBoundary,
 *     pivotValue, boundaryTree) → stubs mínimos en tests/_stubs, para poder
 *     cargar clases (p. ej. ActivePivot) que las importan sin arrastrar todo el
 *     framework del proyecto.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as pathResolve } from 'node:path';

function here() { return dirname(fileURLToPath(import.meta.url)); } // .../table/tests

// Especificadores del proyecto → archivo de stub.
var STUBS = {
	'@/common/framework/arr': '_stubs/arr.mjs',
	'@/common/framework/promises': '_stubs/promises.mjs',
	'@/table/classes/RegionSelection': '_stubs/RegionSelection.mjs',
	'@/map/classes/ActiveBoundary': '_stubs/ActiveBoundary.mjs',
	'@/table/classes/pivotValue.js': '_stubs/pivotValue.mjs',
	'@/table/classes/boundaryTree.js': '_stubs/boundaryTree.mjs'
};

export async function resolve(specifier, context, nextResolve) {
	// Stubs del proyecto.
	if (Object.prototype.hasOwnProperty.call(STUBS, specifier)) {
		var stubAbs = pathResolve(here(), STUBS[specifier]);
		return { url: pathToFileURL(stubAbs).href, shortCircuit: true };
	}
	// Alias @/table/... → ruta real.
	if (specifier.startsWith('@/table/')) {
		var root = pathResolve(here(), '..'); // .../table
		var abs = pathResolve(root, specifier.slice('@/table/'.length));
		return { url: pathToFileURL(abs).href, shortCircuit: true };
	}
	return nextResolve(specifier, context);
}
