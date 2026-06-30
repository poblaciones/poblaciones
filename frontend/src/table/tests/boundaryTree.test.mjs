/*
 * boundaryTree.test.mjs — parseo del árbol de GetFabBoundaries en sus tres formas
 * de Items: hojas planas, agrupadores (formato actual con Id/Code) y diccionario
 * (formato anterior). Importa el módulo real por ruta relativa (el alias lo
 * stubbea para otros tests).
 *
 *     node --import ./tests/_register-alias.mjs tests/boundaryTree.test.mjs
 */

import { describe, it, expect, report } from './_harness.mjs';
import { flattenLeaves, findBoundaryNode } from '../classes/boundaryTree.js';

describe('boundaryTree — hojas planas', function () {
	it('aplana un array de hojas sin agrupador', function () {
		var node = { VersionId: 26, Name: 'Provincias', Items: [
			{ Id: 6, Name: 'Buenos Aires', Population: 17, Code: '06' },
			{ Id: 14, Name: 'Córdoba', Population: 3, Code: '14' }
		] };
		var leaves = flattenLeaves(node);
		expect(leaves).toHaveLength(2);
		expect(leaves[0].Caption).toBe('Buenos Aires');
		expect(leaves[0].Code).toBe('06');
		expect(leaves[0].Parent).toBeNull();
		expect(leaves[0].ParentId).toBeNull();
	});
});

describe('boundaryTree — agrupadores (formato actual)', function () {
	var node = { VersionId: 25, Name: 'Departamentos', Items: [
		{ Id: 200, Name: 'Buenos Aires', Code: '02', Items: [
			{ Id: 1, Name: 'La Plata', Population: 7, Code: '02-001' },
			{ Id: 2, Name: 'Quilmes', Population: 5, Code: '02-002' }
		] },
		{ Id: 300, Name: 'Córdoba', Code: '14', Items: [
			{ Id: 3, Name: 'Capital', Population: 13, Code: '14-001' }
		] }
	] };
	var leaves = flattenLeaves(node);

	it('aplana las hojas de cada agrupador', function () {
		expect(leaves).toHaveLength(3);
	});
	it('propaga el nombre del agrupador como Parent', function () {
		expect(leaves[0].Parent).toBe('Buenos Aires');
		expect(leaves[2].Parent).toBe('Córdoba');
	});
	it('propaga el Id del agrupador como ParentId', function () {
		expect(leaves[0].ParentId).toBe(200);
		expect(leaves[2].ParentId).toBe(300);
	});
	it('propaga el Code del agrupador como ParentCode', function () {
		expect(leaves[0].ParentCode).toBe('02');
		expect(leaves[2].ParentCode).toBe('14');
	});
	it('conserva el Code propio de cada hoja', function () {
		expect(leaves[0].Code).toBe('02-001');
	});
});

describe('boundaryTree — diccionario (formato anterior)', function () {
	it('aplana el diccionario { nombreGrupo: [hojas] } sin Id ni Code de grupo', function () {
		var node = { VersionId: 20, Name: 'Municipios', Items: {
			'Buenos Aires': [ { Id: 1, Name: 'La Plata', Population: 7 } ],
			'Córdoba': [ { Id: 3, Name: 'Capital', Population: 13 } ]
		} };
		var leaves = flattenLeaves(node);
		expect(leaves).toHaveLength(2);
		expect(leaves[0].Parent).toBe('Buenos Aires');
		expect(leaves[0].ParentId).toBeNull();
		expect(leaves[0].ParentCode).toBeNull();
	});
});

describe('boundaryTree — findBoundaryNode', function () {
	var tree = [
		{ Id: null, Name: 'Límites políticos', Items: [
			{ Id: 1, Name: 'Provincias', VersionId: 26, Items: [ { Id: 6, Name: 'BA' } ] },
			{ Id: 2, Name: 'Departamentos', VersionId: 25, Items: [
				{ Id: 200, Name: 'BA', Code: '02', Items: [ { Id: 1, Name: 'La Plata' } ] }
			] }
		] }
	];
	it('encuentra un nodo tipo por Id, sin confundir agrupadores con navegables', function () {
		var node = findBoundaryNode(2, tree);
		expect(node).toBeTruthy();
		expect(node.Name).toBe('Departamentos');
		expect(node.VersionId).toBe(25);
	});
	it('devuelve null si el Id no existe', function () {
		expect(findBoundaryNode(999, tree)).toBeNull();
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
