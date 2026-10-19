import { describe, it, expect } from './_harness.mjs';
import { setupBrowser } from './fixtures.mjs';
import web from '@/common/framework/web';

describe('web: getParameterByName');

it('devuelve el valor de un parámetro de la URL indicada', () => {
	expect(web.getParameterByName('a', 'http://x.org/p?a=1&b=2')).toBe('1');
	expect(web.getParameterByName('b', 'http://x.org/p?a=1&b=2')).toBe('2');
});

it('devuelve null si el parámetro no existe o no tiene valor', () => {
	expect(web.getParameterByName('z', 'http://x.org/p?a=1')).toBeNull();
	expect(web.getParameterByName('a', 'http://x.org/p?a=&b=2')).toBeNull();
	expect(web.getParameterByName('a', 'http://x.org/p?a')).toBeNull();
});

it('decodifica porcentajes y convierte + en espacio', () => {
	expect(web.getParameterByName('q', 'http://x.org/p?q=hola+mundo%21')).toBe('hola mundo!');
});

it('corta el valor en & y en #', () => {
	expect(web.getParameterByName('a', 'http://x.org/p?a=1#frag')).toBe('1');
	expect(web.getParameterByName('a', 'http://x.org/p?a=1&b=2')).toBe('1');
});

it('no confunde un parámetro con otro que lo contiene como sufijo', () => {
	expect(web.getParameterByName('a', 'http://x.org/p?xa=9')).toBeNull();
});

it('escapa los corchetes del nombre', () => {
	expect(web.getParameterByName('ids[]', 'http://x.org/p?ids[]=7')).toBe('7');
});

it('sin URL usa la ubicación actual del navegador', () => {
	setupBrowser();
	expect(web.getParameterByName('a')).toBe('1');
});
