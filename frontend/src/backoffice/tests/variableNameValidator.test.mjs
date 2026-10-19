import { describe, it, expect } from './_harness.mjs';
import VariableNameValidator from '@/backoffice/classes/VariableNameValidator';

const validator = new VariableNameValidator();

describe('VariableNameValidator: Validate');

it('acepta un nombre válido y devuelve cadena vacía', () => {
	expect(validator.Validate('edad_2020')).toBe('');
	expect(validator.Validate('a@b#c$d.e')).toBe('');
});

it('rechaza un nombre null o vacío', () => {
	const message = 'Debe indicar un nombre para la variable.';
	expect(validator.Validate('')).toBe(message);
	expect(validator.Validate(null)).toBe(message);
});

it('rechaza paréntesis, espacios y otros caracteres, indicando cuál', () => {
	expect(validator.Validate('a(b')).toBe('El nombre de la variable no puede contener paréntesis.');
	expect(validator.Validate('a)b')).toBe('El nombre de la variable no puede contener paréntesis.');
	expect(validator.Validate('a b')).toBe('El nombre de la variable no puede contener espacios.');
	expect(validator.Validate('año')).toBe("El nombre de la variable no puede contener el caracter 'ñ'");
});

it('la validación de contenido tiene precedencia sobre las reglas de inicio', () => {
	expect(validator.Validate('1 a')).toBe('El nombre de la variable no puede contener espacios.');
});

it('rechaza los inicios prohibidos indicando el carácter', () => {
	expect(validator.Validate('.a')).toBe("El nombre de la variable no puede comenzar con '.'.");
	expect(validator.Validate('_a')).toBe("El nombre de la variable no puede comenzar con '_'.");
	expect(validator.Validate('#a')).toBe("El nombre de la variable no puede comenzar con '#'.");
	expect(validator.Validate('$a')).toBe("El nombre de la variable no puede comenzar con '$'.");
	expect(validator.Validate('9a')).toBe("El nombre de la variable no puede comenzar con '9'.");
});

it('permite empezar con @ y con letras', () => {
	expect(validator.Validate('@a')).toBe('');
	expect(validator.Validate('Zeta')).toBe('');
});

it('rechaza las palabras reservadas sin distinguir mayúsculas, pero no los nombres que las contienen', () => {
	const message = 'El nombre de la variable no puede coincidir con una palabra reservada (ALL, AND, BY, EQ, GE, GT, LE, LT, NE, NOT, OR, TO, WITH).';
	expect(validator.Validate('and')).toBe(message);
	expect(validator.Validate('With')).toBe(message);
	expect(validator.Validate('android')).toBe('');
	expect(validator.Validate('to_do')).toBe('');
});

it('rechaza los finales en punto y en guion bajo', () => {
	expect(validator.Validate('abc.')).toBe("El nombre de la variable no puede finalizar en '.'");
	expect(validator.Validate('abc_')).toBe("El nombre de la variable no puede finalizar con '_'.");
});

it('rechaza más de 64 caracteres', () => {
	const message = 'El nombre de la variable no puede tener más de 64 caracteres. Los caracteres especiales (ej. acentuados, eñes) contabilizan como 2 caracteres.';
	expect(validator.Validate('a'.repeat(64))).toBe('');
	expect(validator.Validate('a'.repeat(65))).toBe(message);
});

describe('VariableNameValidator: CheckLength');

it('cuenta como 2 los caracteres que no son estándar', () => {
	expect(validator.CheckLength('ñ'.repeat(32))).toBe('');
	expect(validator.CheckLength('ñ'.repeat(32) + 'a') === '').toBeFalsy();
});

describe('VariableNameValidator: CheckEnding');

it('un nombre sin finales prohibidos devuelve cadena vacía', () => {
	expect(validator.CheckEnding('abc')).toBe('');
});
