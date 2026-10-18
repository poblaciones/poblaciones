import { describe, it, expect } from './_harness.mjs';
import { makeCatalogTree } from './fixtures.mjs';
import CatalogTree from '@/map/classes/catalog/CatalogTree';
import CatalogSearch from '@/map/classes/catalog/CatalogSearch';

function makeSearch(categories) {
	return new CatalogSearch(new CatalogTree(categories || makeCatalogTree()));
}

describe('catalogSearch: FindItems');

it('matchea por nombre parcial insensible a tildes', () => {
	const found = makeSearch().FindItems('proyeccion', null);
	expect(found).toHaveLength(1);
	expect(found[0].item.Name).toBe('Proyección 2030');
});

it('con dos palabras parciales encuentra el ítem ("niv edu" -> Nivel educativo)', () => {
	const categories = makeCatalogTree();
	categories.push({ Id: 5, Name: 'Educación', Items: [{ Id: 501, Name: 'Nivel educativo', Code: 'E01' }] });
	const found = makeSearch(categories).FindItems('niv edu', null);
	expect(found).toHaveLength(1);
	expect(found[0].item.Name).toBe('Nivel educativo');
});

it('el match por código es exacto, no parcial', () => {
	const search = makeSearch();
	expect(search.FindItems('P01', null).filter(e => e.item.Code === 'P01')).toHaveLength(1);
	expect(search.FindItems('P0', null)).toHaveLength(0);
});

it('un texto vacío no devuelve nada', () => {
	expect(makeSearch().FindItems('   ', null)).toHaveLength(0);
});

it('deduplica por Id un ítem presente en varias categorías', () => {
	const categories = makeCatalogTree();
	categories.push({ Id: 4, Name: 'Más usados', Items: [{ Id: 111, Name: 'Población total', Code: 'P01' }] });
	expect(makeSearch(categories).FindItems('total', null)).toHaveLength(1);
});

it('se acota al subárbol del nodo indicado', () => {
	const categories = makeCatalogTree();
	const search = makeSearch(categories);
	expect(search.FindItems('población', categories[1])).toHaveLength(0);
	expect(search.FindItems('población', null).length > 0).toBeTruthy();
});

it('encuentra por palabras clave', () => {
	const categories = makeCatalogTree();
	categories[0].Items[0].Items[0].Keywords = 'habitantes, demografía';
	const found = makeSearch(categories).FindItems('demografia', null);
	expect(found).toHaveLength(1);
	expect(found[0].item.Id).toBe(111);
});

it('los que coinciden por nombre van antes que los que solo coinciden por palabras clave', () => {
	const categories = [{
		Id: 1, Name: 'Cat', Items: [
			{ Id: 1, Name: 'Ingresos del hogar', Keywords: 'vivienda' },
			{ Id: 2, Name: 'Viviendas con agua' },
		],
	}];
	const found = makeSearch(categories).FindItems('viv', null);
	expect(found.map(e => e.item.Id)).toEqual([2, 1]);
});

describe('catalogSearch: FindBranches');

it('ofrece los contenedores cuyo nombre coincide', () => {
	const found = makeSearch().FindBranches('provincia', null);
	expect(found).toHaveLength(1);
	expect(found[0].branch.Name).toBe('Provincias');
});

it('los agrupadores de menor profundidad van primero', () => {
	const found = makeSearch().FindBranches('p', null);
	const depths = found.map(e => e.depth);
	expect(depths).toEqual(depths.slice().sort((a, b) => a - b));
	expect(found.length > 1).toBeTruthy();
});

it('un texto vacío no devuelve nada', () => {
	expect(makeSearch().FindBranches('', null)).toHaveLength(0);
});
