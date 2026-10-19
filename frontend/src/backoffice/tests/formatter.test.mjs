import { describe, it, expect } from './_harness.mjs';
import f from '@/backoffice/classes/Formatter';

describe('Formatter: formatDate');

it('devuelve un guion para null', () => {
	expect(f.formatDate(null)).toBe('-');
});

it('formatea día/mes/año con ceros a la izquierda', () => {
	expect(f.formatDate('2020-03-05T12:00:00')).toBe('05/03/2020');
});

it('no agrega ceros cuando día y mes tienen dos dígitos', () => {
	expect(f.formatDate('2021-11-15T12:00:00')).toBe('15/11/2021');
});

describe('Formatter: formatFullName');

it('devuelve cadena vacía para un usuario null', () => {
	expect(f.formatFullName(null)).toBe('');
});

it('une nombre y apellido', () => {
	expect(f.formatFullName({ Firstname: 'Ana', Lastname: 'Pérez', Email: 'a@x.org' })).toBe('Ana Pérez');
});

it('con un solo componente no deja espacios sobrantes', () => {
	expect(f.formatFullName({ Firstname: 'Ana', Lastname: '', Email: 'a@x.org' })).toBe('Ana');
	expect(f.formatFullName({ Firstname: null, Lastname: 'Pérez', Email: 'a@x.org' })).toBe('Pérez');
});

it('sin nombre ni apellido usa el email', () => {
	expect(f.formatFullName({ Firstname: '', Lastname: '', Email: 'a@x.org' })).toBe('a@x.org');
	expect(f.formatFullName({ Firstname: '  ', Lastname: '', Email: 'a@x.org' })).toBe('a@x.org');
});

describe('Formatter: formatColumn');

it('devuelve cadena vacía para una columna null', () => {
	expect(f.formatColumn(null)).toBe('');
});

it('sin etiqueta (vacía, null o ausente) usa la variable', () => {
	expect(f.formatColumn({ Variable: 'v1', Label: '' })).toBe('v1');
	expect(f.formatColumn({ Variable: 'v1', Label: null })).toBe('v1');
	expect(f.formatColumn({ Variable: 'v1' })).toBe('v1');
});

it('sin etiqueta y sin variable usa el título', () => {
	expect(f.formatColumn({ Caption: 'Título' })).toBe('Título');
});

it('con etiqueta combina variable y etiqueta', () => {
	expect(f.formatColumn({ Variable: 'v1', Label: 'Edad' })).toBe('v1 - Edad');
});

it('con etiqueta y varnameOnly devuelve solo la variable', () => {
	expect(f.formatColumn({ Variable: 'v1', Label: 'Edad' }, true)).toBe('v1');
});

it('varnameOnly no altera el caso sin etiqueta', () => {
	expect(f.formatColumn({ Variable: 'v1', Label: '' }, true)).toBe('v1');
});

describe('Formatter: formatColumnText y formatColumnTooltip');

it('formatColumnText prefiere la etiqueta, luego la variable y por último el título', () => {
	expect(f.formatColumnText({ Variable: 'v1', Label: 'Edad' })).toBe('Edad');
	expect(f.formatColumnText({ Variable: 'v1', Label: '' })).toBe('v1');
	expect(f.formatColumnText({ Caption: 'Título' })).toBe('Título');
});

it('formatColumnTooltip devuelve la etiqueta o cadena vacía si no hay', () => {
	expect(f.formatColumnTooltip({ Label: 'Edad' })).toBe('Edad');
	expect(f.formatColumnTooltip({ Label: '' })).toBe('');
	expect(f.formatColumnTooltip({ Label: null })).toBe('');
	expect(f.formatColumnTooltip({})).toBe('');
});

describe('Formatter: formatFile');

it('informa el tamaño en kb redondeado', () => {
	expect(f.formatFile('PDF', 2048)).toBe('PDF (2 kb)');
	expect(f.formatFile('PDF', 1536)).toBe('PDF (2 kb)');
});

it('informa el tamaño en mb con un decimal por encima de 1 mb', () => {
	expect(f.formatFile('PDF', 1024 * 1024 * 2.54)).toBe('PDF (2.5 mb)');
});

it('exactamente 1 mb todavía se informa en kb', () => {
	expect(f.formatFile('PDF', 1024 * 1024)).toBe('PDF (1024 kb)');
});

it('distingue una página de varias y omite el dato si no se conoce', () => {
	expect(f.formatFile('PDF', 2048, 1)).toBe('PDF (2 kb, 1 página)');
	expect(f.formatFile('PDF', 2048, 12)).toBe('PDF (2 kb, 12 páginas)');
	expect(f.formatFile('PDF', 2048, null)).toBe('PDF (2 kb)');
	expect(f.formatFile('PDF', 2048, undefined)).toBe('PDF (2 kb)');
});

it('combina el bloque de páginas con el tamaño en mb', () => {
	expect(f.formatFile('PDF', 1024 * 1024 * 3, 4)).toBe('PDF (3 mb, 4 páginas)');
});

describe('Formatter: clone');

it('produce una copia profunda independiente del original', () => {
	const original = { a: { b: [1, 2] } };
	const copy = f.clone(original);
	expect(copy).toEqual(original);
	copy.a.b.push(3);
	expect(original.a.b).toHaveLength(2);
});
