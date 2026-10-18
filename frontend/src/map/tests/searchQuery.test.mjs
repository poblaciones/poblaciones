import { describe, it, expect } from './_harness.mjs';
import SearchQuery from '@/map/classes/catalog/SearchQuery';

function makeQuery() {
	return new SearchQuery({
		Stopwords: ['de', 'el', 'la'],
		Autocomplete: { 'bs as': 'buenos aires' },
	});
}

describe('searchQuery: Resolve');

it('descarta las palabras vacías completas, sin tocar las que solo las contienen', () => {
	expect(makeQuery().Resolve('escuelas de la ciudad')).toBe('escuelas ciudad');
	expect(makeQuery().Resolve('delta')).toBe('delta');
});

it('compara las palabras vacías sin distinguir mayúsculas ni tildes', () => {
	expect(makeQuery().Resolve('Mapa DE Él')).toBe('Mapa');
});

it('si todas las palabras son vacías conserva el texto original', () => {
	expect(makeQuery().Resolve('de')).toBe('de');
});

it('aplica el autocompletado sin distinguir mayúsculas', () => {
	expect(makeQuery().Resolve('Bs As centro')).toBe('buenos aires centro');
});

it('las claves del autocompletado no se interpretan como expresiones regulares', () => {
	const query = new SearchQuery({ Stopwords: [], Autocomplete: { 'a.b': 'x' } });
	expect(query.Resolve('a.b axb')).toBe('x axb');
});

it('sin configuración deja el texto recortado', () => {
	const query = new SearchQuery({ Stopwords: [], Autocomplete: [] });
	expect(query.Resolve('  tandil ')).toBe('tandil');
});
