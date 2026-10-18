import { describe, it, expect } from './_harness.mjs';
import { makeCatalogTree } from './fixtures.mjs';
import CatalogTree from '@/map/classes/catalog/CatalogTree';
import CatalogSearch from '@/map/classes/catalog/CatalogSearch';
import SearchResultRows from '@/map/classes/catalog/SearchResultRows';

function regionRows(text) {
	const search = new CatalogSearch(new CatalogTree(makeCatalogTree()));
	return new SearchResultRows(search.tree).Regions(search.FindBranches(text, null), search.FindItems(text, null));
}

describe('searchResultRows: Indicators');

it('arma filas con la forma de los resultados del servidor', () => {
	const categories = makeCatalogTree();
	categories[0].Items[0].Items[0].Versions = [{ Name: '2010' }, { Name: '2022' }];
	const search = new CatalogSearch(new CatalogTree(categories));
	const rows = new SearchResultRows(search.tree).Indicators(search.FindItems('poblacion total', null));
	expect(rows).toHaveLength(1);
	expect(rows[0]).toEqual({
		Key: 'L|111', Type: 'L', Id: '111',
		Caption: 'Población total', Highlighted: 'Población total', Extra: '2010, 2022'
	});
});

it('escapa el HTML del nombre para v-html', () => {
	const categories = [{ Id: 1, Name: 'Cat', Items: [{ Id: 7, Name: 'A & <b>B' }] }];
	const search = new CatalogSearch(new CatalogTree(categories));
	const rows = new SearchResultRows(search.tree).Indicators(search.FindItems('a', null));
	expect(rows[0].Highlighted).toBe('A &amp; &lt;b&gt;B');
	expect(rows[0].Caption).toBe('A & <b>B');
});

describe('searchResultRows: Regions');

it('ofrece primero las delimitaciones (tipo B, Id del nodo) y luego las regiones (tipo C)', () => {
	const rows = regionRows('d');
	expect(rows[0].Type).toBe('B');
	expect(rows[0].Id).toBe(22);
	expect(rows[0].Caption).toBe('Departamentos');
	expect(rows[0].Extra).toBe('1 departamentos');
});

it('no ofrece los agrupadores de delimitaciones', () => {
	const rows = regionRows('limites');
	expect(rows).toHaveLength(0);
});

it('las regiones llevan Type C, Id en texto y "Parent > Tipo" como detalle', () => {
	const rows = regionRows('tandil');
	expect(rows).toHaveLength(1);
	expect(rows[0].Key).toBe('C|221');
	expect(rows[0].Type).toBe('C');
	expect(rows[0].Id).toBe('221');
	expect(rows[0].Extra).toBe('Buenos Aires > Departamentos');
});

it('una región sin Parent muestra el nombre de su tipo', () => {
	const rows = regionRows('cordoba');
	expect(rows).toHaveLength(1);
	expect(rows[0].Extra).toBe('Provincias');
});

describe('searchResultRows: NextLimit');

it('la primera expansión llega a 100 y las siguientes suman 100', () => {
	expect(SearchResultRows.INITIAL_LIMIT).toBe(5);
	expect(SearchResultRows.NextLimit(5)).toBe(100);
	expect(SearchResultRows.NextLimit(100)).toBe(200);
	expect(SearchResultRows.NextLimit(200)).toBe(300);
});
