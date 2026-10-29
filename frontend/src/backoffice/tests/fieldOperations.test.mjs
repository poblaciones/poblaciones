import { describe, it, expect } from './_harness.mjs';
import FieldOperations from '@/backoffice/classes/FieldOperations';
import { makeActive, makeColumn, idsOf, captionsOf } from './activeDatasetFixtures.mjs';

const NUMBER = 5;
const STRING = 1;

function makeDataset(propertyOverrides) {
	const dataset = makeActive(propertyOverrides);
	dataset.Columns = [makeColumn(1, 'edad', NUMBER), makeColumn(2, 'nombre', STRING), makeColumn(3, 'peso', NUMBER)];
	return dataset;
}

describe('FieldOperations: catálogo');

it('ofrece las quince operaciones en el orden indicado', () => {
	const operations = new FieldOperations().GetAll();
	expect(captionsOf(operations)).toEqual([
		'Imputar', 'Sumar', 'Restar', 'Dividir', 'Multiplicar', 'Resto', 'Porcentaje', 'Entero', 'Absoluto',
		'Valor', 'Concatenar', 'Subcadena', 'Trim', 'Cadena', 'Largo',
	]);
});

it('cada operación tiene clave única y cantidad, tipos y rótulos coherentes', () => {
	const operations = new FieldOperations().GetAll();
	const keys = {};
	for (let i = 0; i < operations.length; i++) {
		const operation = operations[i];
		keys[operation.Key] = true;
		expect(operation.Types).toHaveLength(operation.Count);
		expect(operation.Labels).toHaveLength(operation.Count);
	}
	expect(Object.keys(keys)).toHaveLength(operations.length);
});

it('la operación predeterminada es Sumar y su descripción explica qué hace', () => {
	const operation = new FieldOperations().GetDefault();
	expect(operation.Key).toBe('add');
	expect(operation.Description).toBe('Suma(número1, número2): adiciona dos valores numéricos retornando su resultado.');
});

it('Imputar es unaria, Porcentaje binaria y Subcadena recibe una cadena y dos números', () => {
	const operations = new FieldOperations();
	expect(operations.GetByKey('impute').Types).toEqual(['all']);
	expect(operations.GetByKey('percent').Types).toEqual(['number', 'number']);
	expect(operations.GetByKey('substring').Types).toEqual(['text', 'number', 'number']);
	expect(operations.GetByKey('value').Types).toEqual(['text']);
	expect(operations.GetByKey('string').Types).toEqual(['number']);
});

it('GetByKey de una clave inexistente informa el error', () => {
	let message = '';
	try {
		new FieldOperations().GetByKey('xyz');
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe("No existe la operación 'xyz'.");
});

describe('FieldOperations: operandos');

it('NewOperands crea un operando con [Valor] vacío por cada variable de la operación', () => {
	const operations = new FieldOperations();
	expect(operations.NewOperands(operations.GetByKey('abs'))).toEqual([{ Source: 'value', Value: '' }]);
	expect(operations.NewOperands(operations.GetByKey('substring'))).toHaveLength(3);
});

it('las opciones numéricas empiezan por [Valor] y [Nulo] y siguen con las columnas numéricas', () => {
	const options = new FieldOperations().GetOperandOptions(makeDataset(), 'number');
	expect(idsOf(options)).toEqual(['value', 'null', -100, 1, 3]);
	expect(options[0].Caption).toBe('[Valor]');
	expect(options[1].Caption).toBe('[Nulo]');
});

it('las opciones de texto ofrecen solo las columnas de texto y las de todos los tipos todas las columnas', () => {
	const operations = new FieldOperations();
	expect(idsOf(operations.GetOperandOptions(makeDataset(), 'text'))).toEqual(['value', 'null', -100, 2]);
	expect(idsOf(operations.GetOperandOptions(makeDataset(), 'all'))).toEqual(['value', 'null', -100, 1, 2, 3]);
});

it('las variables especiales se ofrecen solo para operandos numéricos de un dataset georreferenciado', () => {
	const operations = new FieldOperations();
	const geocoded = makeDataset({ Geocoded: true });
	expect(captionsOf(operations.GetOperandOptions(geocoded, 'number')).indexOf('Población total') === -1).toBe(false);
	expect(captionsOf(operations.GetOperandOptions(geocoded, 'text')).indexOf('Población total') === -1).toBe(true);
	expect(captionsOf(operations.GetOperandOptions(makeDataset({ Geocoded: false }), 'number')).indexOf('Población total') === -1).toBe(true);
});

it('sin columnas de un tipo no se agrega el grupo vacío', () => {
	const dataset = makeActive();
	dataset.Columns = [makeColumn(1, 'edad', NUMBER)];
	expect(idsOf(new FieldOperations().GetOperandOptions(dataset, 'text'))).toEqual(['value', 'null']);
});

describe('FieldOperations: validación y codificación');

it('Validate exige un valor numérico en los operandos numéricos con [Valor]', () => {
	const operations = new FieldOperations();
	const add = operations.GetByKey('add');
	expect(operations.Validate(add, [{ Source: 'value', Value: '' }, { Source: 'value', Value: '2' }])).toBe("Indique un valor numérico para 'Número 1'.");
	expect(operations.Validate(add, [{ Source: 'value', Value: '1' }, { Source: 'value', Value: 'abc' }])).toBe("Indique un valor numérico para 'Número 2'.");
	expect(operations.Validate(add, [{ Source: 'value', Value: '-1.5' }, { Source: 'value', Value: '2' }])).toBe('');
});

it('Validate no exige valor cuando se elige una columna o [Nulo], ni en los operandos de texto', () => {
	const operations = new FieldOperations();
	expect(operations.Validate(operations.GetByKey('add'), [{ Source: 1, Value: '' }, { Source: 'null', Value: '' }])).toBe('');
	expect(operations.Validate(operations.GetByKey('concat'), [{ Source: 'value', Value: '' }, { Source: 2, Value: '' }])).toBe('');
	expect(operations.Validate(operations.GetByKey('impute'), [{ Source: 'value', Value: 'texto' }])).toBe('');
});

it('BuildOperands codifica valor, nulo y columna según el tipo de cada operando', () => {
	const operations = new FieldOperations();
	expect(operations.BuildOperands(operations.GetByKey('substring'), [
		{ Source: 2, Value: '' }, { Source: 'value', Value: '3' }, { Source: 'null', Value: '' },
	])).toEqual([{ t: 'C', v: 2 }, { t: 'V', v: 3 }, { t: 'N', v: null }]);
	expect(operations.BuildOperands(operations.GetByKey('concat'), [
		{ Source: 'value', Value: '07' }, { Source: -1, Value: '' },
	])).toEqual([{ t: 'V', v: '07' }, { t: 'C', v: -1 }]);
});
