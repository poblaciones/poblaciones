import { describe, it, expect } from './_harness.mjs';
import Coordinates from '@/map/js/coordinate-parser/coordinates';
import Validator from '@/map/js/coordinate-parser/validator';
import CoordinateNumber from '@/map/js/coordinate-parser/coordinate-number';

// Parser de coordenadas vendido en el módulo (CoffeeScript → CommonJS), que
// _alias-hooks.mjs carga con require real (wrapper createRequire). Se prueba
// la librería directamente. Ojo: el wrapper ParseCoordinate.js del módulo
// asigna globals sin declarar y bajo ESM/strict lanza siempre; se testea la
// librería, no ese wrapper.

describe('coordinate-parser: Validator');

it('acepta decimales, orientaciones N/S/E/W y grados DMS', () => {
	const validator = new Validator();
	expect(validator.isValid('40.123, -74.123')).toBe(true);
	expect(validator.isValid('40.5 S, 74.5 W')).toBe(true);
	expect(validator.isValid('40°26′46″S, 58°58′52″W')).toBe(true);
});

it('rechaza letras ajenas, cantidades impares, más de 6 números y orientaciones imposibles', () => {
	const validator = new Validator();
	expect(validator.isValid('hola')).toBe(false);
	expect(validator.isValid('40')).toBe(false);
	expect(validator.isValid('40x')).toBe(false);
	expect(validator.isValid('1,2,3,4,5,6,7')).toBe(false);
	expect(validator.isValid('n40 e74 w10')).toBe(false);
});

it('validate lanza con el motivo exacto', () => {
	const validator = new Validator();
	let thrown = null;
	try {
		validator.validate('40');
	} catch (e) {
		thrown = e;
	}
	if (thrown === null) {
		throw new Error('validate debería lanzar');
	}
	expect(thrown.message).toBe('Uneven count of latitude/longitude numbers');
});

describe('coordinate-parser: Coordinates');

it('parsea grados decimales con signo y con orientación', () => {
	let c = new Coordinates('40.123, -74.123');
	expect(c.getLatitude()).toBeCloseTo(40.123, 6);
	expect(c.getLongitude()).toBeCloseTo(-74.123, 6);
	c = new Coordinates('S 40.5 W 74.5');
	expect(c.getLatitude()).toBeCloseTo(-40.5, 6);
	expect(c.getLongitude()).toBeCloseTo(-74.5, 6);
});

it('normaliza la coma decimal española', () => {
	const c = new Coordinates('40,5, -74,25');
	expect(c.getLatitude()).toBeCloseTo(40.5, 6);
	expect(c.getLongitude()).toBeCloseTo(-74.25, 6);
});

it('parsea DMS con grados, minutos y segundos', () => {
	const c = new Coordinates('40°26′46″S, 58°58′52″W');
	expect(c.getLatitude()).toBeCloseTo(-40.446111, 5);
	expect(c.getLongitude()).toBeCloseTo(-58.981111, 5);
});

it('parsea los formatos compactos: DMS pegado, grados+minutos y milisegundos de arco', () => {
	let c = new Coordinates('402646, 745852');
	expect(c.getLatitude()).toBeCloseTo(40.446111, 5);
	expect(c.getLongitude()).toBeCloseTo(74.981111, 5);
	c = new Coordinates('4026.5, 7458.25');
	expect(c.getLatitude()).toBeCloseTo(40.441667, 5);
	expect(c.getLongitude()).toBeCloseTo(74.970833, 5);
	c = new Coordinates('145431000, 264003000');
	expect(c.getLatitude()).toBeCloseTo(40.3975, 5);
	expect(c.getLongitude()).toBeCloseTo(73.334167, 5);
});

it('lanza ante entrada no coordenable', () => {
	let thrown = null;
	try {
		new Coordinates('no es una coordenada');
	} catch (e) {
		thrown = e;
	}
	if (thrown === null) {
		throw new Error('Coordinates debería lanzar');
	}
	expect(thrown.message).toBe('Coordinate contains invalid alphanumeric characters.');
});

describe('coordinate-parser: CoordinateNumber');

it('combina grados, minutos y segundos con el signo del primer número', () => {
	expect(new CoordinateNumber([40, 26, 46]).toDecimal()).toBeCloseTo(40.446111, 5);
	expect(new CoordinateNumber(['-74.5']).toDecimal()).toBeCloseTo(-74.5, 5);
});

it('detectSpecialFormats interpreta los formatos compactos', () => {
	const dms = new CoordinateNumber(['402646']);
	dms.detectSpecialFormats();
	expect(dms.toDecimal()).toBeCloseTo(40.446111, 5);
	const dm = new CoordinateNumber(['4026.5']);
	dm.detectSpecialFormats();
	expect(dm.toDecimal()).toBeCloseTo(40.441667, 5);
	const ms = new CoordinateNumber(['145431000']);
	ms.detectSpecialFormats();
	expect(ms.toDecimal()).toBeCloseTo(40.3975, 5);
});
