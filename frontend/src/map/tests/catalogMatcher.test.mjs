import { describe, it, expect } from './_harness.mjs';
import CatalogMatcher from '@/map/classes/catalog/CatalogMatcher';

describe('catalogMatcher: normalización');

it('Normalize ignora mayúsculas y tildes', () => {
	expect(new CatalogMatcher().Normalize('Proyección')).toBe('proyeccion');
});

describe('catalogMatcher: MatchesWordStart con varias palabras (AND, no frase exacta)');

it('con una palabra, matchea el inicio de cualquier palabra del nombre', () => {
	const matcher = new CatalogMatcher();
	expect(matcher.MatchesWordStart('nivel educativo', 'niv')).toBeTruthy();
	expect(matcher.MatchesWordStart('nivel educativo', 'edu')).toBeTruthy();
});

it('con dos palabras parciales matchea sin importar el orden', () => {
	const matcher = new CatalogMatcher();
	expect(matcher.MatchesWordStart('nivel educativo', 'niv edu')).toBeTruthy();
	expect(matcher.MatchesWordStart('nivel educativo', 'edu niv')).toBeTruthy();
});

it('si alguna palabra del término no matchea ninguna del nombre, no matchea', () => {
	expect(new CatalogMatcher().MatchesWordStart('nivel educativo', 'niv xyz')).toBeFalsy();
});

it('no matchea en mitad de palabra ("pesan" no matchea "san")', () => {
	const matcher = new CatalogMatcher();
	expect(matcher.MatchesWordStart('pesan', 'san')).toBeFalsy();
	expect(matcher.MatchesWordStart('sanar', 'san')).toBeTruthy();
});

it('un término vacío no matchea', () => {
	expect(new CatalogMatcher().MatchesWordStart('nivel educativo', '  ')).toBeFalsy();
});

describe('catalogMatcher: MatchItem (nombre, palabras clave y código)');

it('por nombre devuelve MATCH_NAME', () => {
	const matcher = new CatalogMatcher();
	const item = { Id: 1, Name: 'Nivel educativo' };
	expect(matcher.MatchItem(item, matcher.Prepare('niv edu'))).toBe(CatalogMatcher.MATCH_NAME);
});

it('por palabras clave devuelve MATCH_KEYWORDS, insensible a tildes', () => {
	const matcher = new CatalogMatcher();
	const item = { Id: 1, Name: 'Nivel educativo', Keywords: 'escolaridad, instrucción, Años de estudio' };
	expect(matcher.MatchItem(item, matcher.Prepare('instruccion'))).toBe(CatalogMatcher.MATCH_KEYWORDS);
	expect(matcher.MatchItem(item, matcher.Prepare('estud'))).toBe(CatalogMatcher.MATCH_KEYWORDS);
});

it('las palabras del término pueden repartirse entre el nombre y las palabras clave', () => {
	const matcher = new CatalogMatcher();
	const item = { Id: 1, Name: 'Nivel educativo', Keywords: 'escolaridad' };
	expect(matcher.MatchItem(item, matcher.Prepare('niv escol'))).toBe(CatalogMatcher.MATCH_KEYWORDS);
	expect(matcher.MatchItem(item, matcher.Prepare('niv xyz'))).toBe(0);
});

it('las palabras clave no matchean en mitad de palabra', () => {
	const matcher = new CatalogMatcher();
	const item = { Id: 1, Name: 'Nivel', Keywords: 'escolaridad' };
	expect(matcher.MatchItem(item, matcher.Prepare('laridad'))).toBe(0);
});

it('el código matchea solo si es idéntico al texto escrito', () => {
	const matcher = new CatalogMatcher();
	const item = { Id: 1, Name: 'Población total', Code: 'P01' };
	expect(matcher.MatchItem(item, matcher.Prepare('P01'))).toBe(CatalogMatcher.MATCH_NAME);
	expect(matcher.MatchItem(item, matcher.Prepare('P0'))).toBe(0);
});

it('un ítem sin Keywords ni Code se resuelve solo por nombre', () => {
	const matcher = new CatalogMatcher();
	expect(matcher.MatchItem({ Id: 1, Name: 'Tandil' }, matcher.Prepare('tan'))).toBe(CatalogMatcher.MATCH_NAME);
});

it('si cambian las Keywords del ítem se vuelve a indexar', () => {
	const matcher = new CatalogMatcher();
	const item = { Id: 1, Name: 'Nivel', Keywords: 'escolaridad' };
	expect(matcher.MatchItem(item, matcher.Prepare('instruccion'))).toBe(0);
	item.Keywords = 'instrucción';
	expect(matcher.MatchItem(item, matcher.Prepare('instruccion'))).toBe(CatalogMatcher.MATCH_KEYWORDS);
});
