import { describe, it, expect } from './_harness.mjs';
import obj from '@/common/framework/obj';

describe('obj: CloneNonExistentKeysToValues');

it('completa con la clave como valor las que faltan en el destino y conserva las existentes', () => {
	const result = obj.CloneNonExistentKeysToValues({ a: 1, b: 2, c: 3 }, { c: 0 });
	expect(result).toEqual({ a: 'a', b: 'b', c: 0 });
});

it('modifica y devuelve el mismo objeto de destino', () => {
	const destination = {};
	const result = obj.CloneNonExistentKeysToValues({ a: 1 }, destination);
	expect(result).toBe(destination);
	expect(destination.a).toBe('a');
});

it('un valor null en el destino cuenta como existente; undefined no', () => {
	const result = obj.CloneNonExistentKeysToValues({ a: 1, b: 2 }, { a: null, b: undefined });
	expect(result.a).toBeNull();
	expect(result.b).toBe('b');
});

describe('obj: IsObject');

it('es true solo para objetos que no son arreglos ni null', () => {
	expect(obj.IsObject({})).toBeTruthy();
	expect(obj.IsObject([])).toBeFalsy();
	expect(obj.IsObject(null)).toBeFalsy();
	expect(obj.IsObject('texto')).toBeFalsy();
	expect(obj.IsObject(undefined)).toBeFalsy();
	expect(obj.IsObject(5)).toBeFalsy();
});
