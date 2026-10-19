import { describe, it, expect } from './_harness.mjs';
import iconManager from '@/common/js/iconManager';
import fontAwesomeIconsList from '@/common/js/fontAwesomeIconsList';
import mapIconsList from '@/common/js/mapIconsList';

const FA_FAMILY = 'Font Awesome\\ 5 Free';
const EXCLAMATION = fontAwesomeIconsList.icons['fa-exclamation'];

describe('iconManager: formatIcon');

it('un ícono de Font Awesome conocido usa su familia, peso 900 y su código', () => {
	expect(iconManager.formatIcon('fa-exclamation')).toEqual({ family: FA_FAMILY, unicode: EXCLAMATION, weight: '900' });
});

it('un ícono de mapas conocido usa la familia Flaticon con peso normal', () => {
	expect(iconManager.formatIcon('mp-cruiser-voyage')).toEqual({ family: 'Flaticon', unicode: '\uf100', weight: 'normal' });
});

it('un ícono desconocido, un prefijo desconocido o un valor vacío caen al valor por defecto', () => {
	const fallback = { family: 'Arial', unicode: '', weight: '400' };
	expect(iconManager.formatIcon('fa-noexiste')).toEqual(fallback);
	expect(iconManager.formatIcon('mp-noexiste')).toEqual(fallback);
	expect(iconManager.formatIcon('zz-algo')).toEqual(fallback);
	expect(iconManager.formatIcon('')).toEqual(fallback);
	expect(iconManager.formatIcon(null)).toEqual(fallback);
	expect(iconManager.formatIcon(undefined)).toEqual(fallback);
});

describe('iconManager: isCustom y getSymbolImage');

it('isCustom reconoce el prefijo usu-', () => {
	expect(iconManager.isCustom('usu-12')).toBeTruthy();
	expect(iconManager.isCustom('fa-ad')).toBeFalsy();
	expect(iconManager.isCustom('')).toBeFalsy();
	expect(iconManager.isCustom(null)).toBeFalsy();
});

it('getSymbolImage busca en un diccionario por clave o en una lista por Caption', () => {
	expect(iconManager.getSymbolImage({ 'usu-1': '/a.png' }, 'usu-1')).toBe('/a.png');
	expect(iconManager.getSymbolImage([{ Caption: 'usu-2', Image: '/b.png' }], 'usu-2')).toBe('/b.png');
	expect(iconManager.getSymbolImage([{ Caption: 'usu-2', Image: '/b.png' }], 'usu-9')).toBe('');
	expect(iconManager.getSymbolImage(null, 'usu-1')).toBe('');
});

describe('iconManager: showIcon');

it('sin símbolo devuelve vacío', () => {
	expect(iconManager.showIcon('')).toBe('');
	expect(iconManager.showIcon(null)).toBe('');
});

it('un ícono de fuente genera un span con familia, peso, tamaño y margen', () => {
	const html = iconManager.showIcon('fa-exclamation', null, null, 2, 1.5);
	expect(html).toBe('<span style="font-family: \'' + FA_FAMILY + '\';font-weight: 900;font-size: 1.5em;margin-right: 2px;">' + EXCLAMATION + '</span>');
});

it('un ícono de mapas no lleva font-weight "normal" explícito de más: solo lo que corresponde', () => {
	const html = iconManager.showIcon('mp-cruiser-voyage');
	expect(html).toBe('<span style="font-family: \'Flaticon\';font-weight: normal;">\uf100</span>');
});

it('un ícono personalizado genera una imagen con el ancho máximo y el margen', () => {
	const html = iconManager.showIcon('usu-1', { 'usu-1': 'http://img/1.png' }, '3rem', 4);
	expect(html).toBe("<img src='http://img/1.png' style='max-height: 3rem; max-width: 3rem;margin-right: 4px;'/>");
});

it('un ícono personalizado sin ancho indicado usa 2rem', () => {
	const html = iconManager.showIcon('usu-2', [{ Caption: 'usu-2', Image: '/i/2.png' }]);
	expect(html).toBe("<img src='/i/2.png' style='max-height: 2rem; max-width: 2rem;'/>");
});

it('un ícono inexistente muestra el ícono de error, salvo que se pida no mostrarlo', () => {
	const withError = iconManager.showIcon('usu-9', []);
	expect(withError.indexOf(EXCLAMATION) !== -1).toBeTruthy();
	expect(iconManager.showIcon('usu-9', [], null, null, null, true)).toBe('');
});

describe('iconManager: integridad de las listas de íconos');

function checkList(list, prefix) {
	const problems = [];
	const seenCodes = new Set();
	for (const name of Object.keys(list.icons)) {
		const code = list.icons[name];
		if (!name.startsWith(prefix)) {
			problems.push('prefijo: ' + name);
		}
		if ([...code].length !== 1) {
			problems.push('código no es un único carácter: ' + name);
		}
		if (seenCodes.has(code)) {
			problems.push('código repetido: ' + name);
		}
		seenCodes.add(code);
	}
	return problems;
}

it('todos los íconos de Font Awesome tienen prefijo fa-, un único carácter y no repiten código', () => {
	expect(Object.keys(fontAwesomeIconsList.icons).length > 0).toBeTruthy();
	expect(checkList(fontAwesomeIconsList, 'fa-')).toEqual([]);
});

it('todos los íconos de mapas tienen prefijo mp-, un único carácter y no repiten código', () => {
	expect(Object.keys(mapIconsList.icons).length > 0).toBeTruthy();
	expect(checkList(mapIconsList, 'mp-')).toEqual([]);
});

it('el ícono de error que usa showIcon existe en la lista', () => {
	expect(EXCLAMATION).toBeTruthy();
});
