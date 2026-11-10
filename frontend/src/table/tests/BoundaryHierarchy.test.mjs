/*
 * BoundaryHierarchy.test.mjs — jerarquía de delimitaciones: agrupación por padre
 * declarada (prevalece) y ancestros de cada item.
 *
 *     node --import ./tests/_register-alias.mjs tests/BoundaryHierarchy.test.mjs
 */

import { describe, it, expect, report } from './_harness.mjs';
import { makeHierarchy } from './fixtures-hierarchy.mjs';

function names(boundaries) {
	var out = [];
	for (var i = 0; i < boundaries.length; i++) out.push(boundaries[i].Name);
	return out;
}

function captions(items) {
	var out = [];
	for (var i = 0; i < items.length; i++) out.push(items[i].Caption);
	return out;
}

describe('BoundaryHierarchy — raíces e hijas', function () {
	var hierarchy = makeHierarchy(1);
	it('son raíces las delimitaciones sin agrupación por padre declarada', function () {
		expect(names(hierarchy.RootBoundaries())).toEqual(['Provincias', 'Aglomerados', 'Regiones']);
	});
	it('una delimitación agrupada se ofrece solo bajo su padre declarado', function () {
		expect(names(hierarchy.ChildBoundaries(1))).toEqual(['Municipios', 'Departamentos', 'Aglomerados']);
		expect(names(hierarchy.ChildBoundaries(3))).toEqual(['Localidades']);
		expect(names(hierarchy.ChildBoundaries(6))).toEqual(['Barrios']);
		expect(hierarchy.ChildBoundaries(4)).toHaveLength(0);
	});
	it('el padre declarado se reconoce aunque sea de otra versión (por nombre)', function () {
		expect(hierarchy.IsRoot(7)).toBeFalsy();
		expect(captions(hierarchy.ChildItems(7, 60))).toEqual(['Centro']);
	});
	it('los items hijos se toman del agrupador o, sin agrupación, de los ancestros', function () {
		expect(captions(hierarchy.ChildItems(2, 10))).toEqual(['Belén', 'Andalgalá']);
		expect(captions(hierarchy.ChildItems(5, 30))).toEqual(['San Isidro']);
		expect(captions(hierarchy.ChildItems(6, 10))).toEqual(['Gran Catamarca']);
		// Localidades no se ofrece directo bajo Catamarca: su padre declarado es Departamentos.
		expect(hierarchy.ChildItems(5, 10)).toHaveLength(0);
	});
	it('la raíz por defecto es la configurada si es raíz; si no, la primera', function () {
		expect(makeHierarchy(4).DefaultRoot().Name).toBe('Regiones');
		expect(makeHierarchy(2).DefaultRoot().Name).toBe('Provincias');
		expect(makeHierarchy(null).DefaultRoot().Name).toBe('Provincias');
	});
	it('Descendants recorre todos los niveles alcanzables desde una raíz', function () {
		expect(names(makeHierarchy(1).Descendants(1))).toEqual(['Provincias', 'Municipios', 'Departamentos', 'Aglomerados', 'Localidades', 'Barrios']);
	});
});

describe('BoundaryHierarchy — ubicación de un elemento', function () {
	var hierarchy = makeHierarchy(1);
	it('Locate prefiere la delimitación raíz cuando el item está en varias', function () {
		expect(hierarchy.Locate(10).boundary.Name).toBe('Provincias');
		expect(hierarchy.Locate(20).boundary.Name).toBe('Municipios');
		expect(hierarchy.Locate(999)).toBeNull();
	});
	it('ChainFor sube por los padres declarados hasta una raíz', function () {
		expect(captions(hierarchy.ChainFor(2, 20).map(function (s) { return s.item; }))).toEqual(['Catamarca', 'Belén']);
		expect(captions(hierarchy.ChainFor(5, 50).map(function (s) { return s.item; }))).toEqual(['Catamarca', 'Ambato', 'San Isidro']);
		expect(captions(hierarchy.ChainFor(7, 70).map(function (s) { return s.item; }))).toEqual(['Gran Catamarca', 'Centro']);
		expect(hierarchy.ChainFor(6, 60)).toHaveLength(1);
	});
	it('ChainForCandidates usa el primer id que esté en el catálogo', function () {
		var chain = hierarchy.ChainForCandidates([777, 21, 10]);
		expect(chain[chain.length - 1].item.Caption).toBe('Andalgalá');
		expect(hierarchy.ChainForCandidates([777])).toHaveLength(0);
	});
});

if (import.meta.url === 'file://' + process.argv[1]) {
	process.exit(await report() ? 0 : 1);
}
