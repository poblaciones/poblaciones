import { describe, it, expect } from './_harness.mjs';
import io from '@/common/framework/io';

describe('io: GetExtension');

it('devuelve la parte posterior al último punto', () => {
	expect(io.GetExtension('datos.csv')).toBe('csv');
	expect(io.GetExtension('archivo.tar.gz')).toBe('gz');
});

it('no cambia mayúsculas ni minúsculas', () => {
	expect(io.GetExtension('FOTO.JPG')).toBe('JPG');
});

it('devuelve vacío sin punto, con punto inicial o con punto final', () => {
	expect(io.GetExtension('sinextension')).toBe('');
	expect(io.GetExtension('.gitignore')).toBe('');
	expect(io.GetExtension('termina.')).toBe('');
});

it('trata un nombre nulo o indefinido como vacío', () => {
	expect(io.GetExtension(null)).toBe('');
	expect(io.GetExtension(undefined)).toBe('');
});

describe('io: ExtensionIn');

it('indica si la extensión está en la lista, distinguiendo mayúsculas', () => {
	expect(io.ExtensionIn('a.csv', ['csv', 'xls'])).toBeTruthy();
	expect(io.ExtensionIn('a.doc', ['csv', 'xls'])).toBeFalsy();
	expect(io.ExtensionIn('a.CSV', ['csv'])).toBeFalsy();
});

it('un nombre sin extensión no está en una lista que no incluya el texto vacío', () => {
	expect(io.ExtensionIn('sinextension', ['csv'])).toBeFalsy();
});
