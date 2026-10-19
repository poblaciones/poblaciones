import { describe, it, expect } from './_harness.mjs';
import { setupBrowser } from './fixtures.mjs';
import citationAPA from '@/common/js/citationAPA';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function retrievalText() {
	const now = new Date();
	return 'Recuperado el ' + now.getDate() + ' de ' + MONTHS[now.getMonth()] + ', ' + now.getFullYear();
}

describe('citationAPA: onlineMapCitation');

it('arma autor, año, título en cursiva, fecha de recuperación y URL', () => {
	setupBrowser();
	const citation = citationAPA.onlineMapCitation('Pérez, J.', '2020', 'Mapa social', 'https://poblaciones.org/m/1');
	expect(citation).toBe('Pérez, J. (2020). <i>Mapa social</i>. ' + retrievalText() + ', de https://poblaciones.org/m/1');
});

it('con noformat el título va sin cursiva', () => {
	setupBrowser();
	const citation = citationAPA.onlineMapCitation('Pérez, J.', '2020', 'Mapa social', 'https://x.org', true);
	expect(citation.startsWith('Pérez, J. (2020). Mapa social. Recuperado')).toBeTruthy();
});

it('sin autor, el título ocupa su lugar y no se repite', () => {
	setupBrowser();
	const citation = citationAPA.onlineMapCitation('', '2020', 'Mapa social', 'https://x.org');
	expect(citation.startsWith('Mapa social (2020). Recuperado')).toBeTruthy();
});

it('de una fecha con barras toma el último componente', () => {
	setupBrowser();
	const citation = citationAPA.onlineMapCitation('Pérez, J.', '15/03/2019', 'Mapa', 'https://x.org');
	expect(citation.startsWith('Pérez, J. (2019). ')).toBeTruthy();
});

it('sin fecha (vacía o el texto "null") usa (s/f)', () => {
	setupBrowser();
	expect(citationAPA.onlineMapCitation('A', '', 'T', 'https://x.org').startsWith('A (s/f). ')).toBeTruthy();
	expect(citationAPA.onlineMapCitation('A', 'null', 'T', 'https://x.org').startsWith('A (s/f). ')).toBeTruthy();
});

it('una fecha null (no el texto) lanza TypeError (comportamiento actual)', () => {
	setupBrowser();
	let thrown = null;
	try {
		citationAPA.onlineMapCitation('A', null, 'T', 'https://x.org');
	} catch (e) {
		thrown = e;
	}
	expect(thrown instanceof TypeError).toBeTruthy();
});

it('sin URL usa la dirección base del sitio actual', () => {
	setupBrowser();
	const citation = citationAPA.onlineMapCitation('A', '2020', 'T', null);
	expect(citation.endsWith(', de https://example.org/')).toBeTruthy();
});
