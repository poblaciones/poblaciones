import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import IconPreview from '@/backoffice/components/IconPreview.vue';

function setup(markerOverrides, icons) {
	const browser = setupBackoffice('P');
	browser.window.Context.CurrentWork = { Icons: icons || [] };
	const marker = Object.assign({ Type: 'I', Source: 'F', Symbol: 'fa-star', Text: 'AB', Frame: 'C', Size: 'M', DescriptionVerticalAlignment: 'M' }, markerOverrides);
	const vm = mountLite(IconPreview, { propsData: { marker: marker } });
	return { vm: vm, marker: marker };
}

describe('IconPreview: contenido del marcador');

it('symbolIcon y symbolText usan un valor fijo si el origen es una variable', () => {
	const fixed = setup({ Source: 'F' }).vm;
	expect(fixed.symbolIcon).toBe('fa-star');
	expect(fixed.symbolText).toBe('AB');
	const variable = setup({ Source: 'V' }).vm;
	expect(variable.symbolIcon).toBe('fa-star');
	expect(variable.symbolText).toBe('T');
	const withOwnSymbol = setup({ Source: 'F', Symbol: 'mp-casa' }).vm;
	expect(withOwnSymbol.symbolIcon).toBe('mp-casa');
});

it('resolveIcon muestra un ícono de fuente para los marcadores de imagen', () => {
	const { vm } = setup({ Type: 'I', Symbol: 'fa-star' });
	expect(vm.resolveIcon.startsWith('<span style="font-family:')).toBe(true);
});

it('resolveIcon muestra la imagen de un ícono propio del trabajo', () => {
	const { vm } = setup({ Type: 'I', Symbol: 'usu-casa' }, [{ Caption: 'usu-casa', Image: 'data:image/png;base64,xx' }]);
	expect(vm.resolveIcon.startsWith("<img src='data:image/png;base64,xx'")).toBe(true);
});

it('resolveIcon muestra el texto para los marcadores de texto', () => {
	const { vm } = setup({ Type: 'T', Text: 'AB' });
	expect(vm.resolveIcon).toBe('AB');
	const variable = setup({ Type: 'T', Source: 'V' }).vm;
	expect(variable.resolveIcon).toBe('T');
});

describe('IconPreview: tamaños y posiciones');

it('sizeToNumeric da 1, 2 o 3 según el tamaño, y 3 para los demás', () => {
	expect(setup({ Size: 'S' }).vm.sizeToNumeric).toBe(1);
	expect(setup({ Size: 'M' }).vm.sizeToNumeric).toBe(2);
	expect(setup({ Size: 'L' }).vm.sizeToNumeric).toBe(3);
	expect(setup({ Size: 'F' }).vm.sizeToNumeric).toBe(3);
});

it('getSize da la clase de tamaño y falla con un tamaño desconocido', () => {
	expect(setup({ Size: 'S' }).vm.getSize).toBe('sizeSmall');
	expect(setup({ Size: 'M' }).vm.getSize).toBe('sizeMedium');
	expect(setup({ Size: 'L' }).vm.getSize).toBe('sizeLarge');
	expect(setup({ Size: 'F' }).vm.getSize).toBe('sizeLarge');
	let message = null;
	try {
		setup({ Size: 'X' }).vm.getSize;
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('Tamaño no reconocido');
});

it('iconSize escala el ícono según el tamaño', () => {
	expect(setup({ Size: 'S' }).vm.iconSize).toBe('transform: scale(0.5, 0.5)');
	expect(setup({ Size: 'M' }).vm.iconSize).toBe('transform: scale(0.75, 0.75)');
	expect(setup({ Size: 'L' }).vm.iconSize).toBe('transform: scale(1, 1)');
});

it('fontSize crece un punto por cada nivel de tamaño', () => {
	expect(setup({ Size: 'S' }).vm.fontSize).toBe('; font-size: 12px');
	expect(setup({ Size: 'M' }).vm.fontSize).toBe('; font-size: 13px');
	expect(setup({ Size: 'L' }).vm.fontSize).toBe('; font-size: 14px');
});

it('iconOffset y smallPinOffset corrigen la posición de los marcadores en forma de pin', () => {
	expect(setup({ Frame: 'P' }).vm.iconOffset).toBe('margin-top: -4px;');
	expect(setup({ Frame: 'C' }).vm.iconOffset).toBe('');
	expect(setup({ Frame: 'P', Size: 'S' }).vm.smallPinOffset).toBe('margin-left: -1.5px');
	expect(setup({ Frame: 'P', Size: 'M' }).vm.smallPinOffset).toBe('');
	expect(setup({ Frame: 'C', Size: 'S' }).vm.smallPinOffset).toBe('');
});

describe('IconPreview: etiqueta');

it('labelPosition da la clase según la alineación vertical y falla con una desconocida', () => {
	expect(setup({ DescriptionVerticalAlignment: 'T' }).vm.labelPosition).toBe('labelTop');
	expect(setup({ DescriptionVerticalAlignment: 'B' }).vm.labelPosition).toBe('labelBottom');
	expect(setup({ DescriptionVerticalAlignment: 'M' }).vm.labelPosition).toBe('labelMiddle');
	let message = null;
	try {
		setup({ DescriptionVerticalAlignment: 'X' }).vm.labelPosition;
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('Posición de etiqueta no reconocida');
});

it('labelOffset separa la etiqueta del ícono, menos cuanto mayor es el tamaño', () => {
	expect(setup({ Size: 'S', DescriptionVerticalAlignment: 'T' }).vm.labelOffset).toBe('top: 11px');
	expect(setup({ Size: 'M', DescriptionVerticalAlignment: 'B' }).vm.labelOffset).toBe('bottom: 6px');
	expect(setup({ Size: 'L', DescriptionVerticalAlignment: 'T' }).vm.labelOffset).toBe('top: 1px');
	expect(setup({ Size: 'M', DescriptionVerticalAlignment: 'M' }).vm.labelOffset).toBe('');
});

it('labelOffset falla con una alineación desconocida', () => {
	let message = null;
	try {
		setup({ DescriptionVerticalAlignment: 'X' }).vm.labelOffset;
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('Posición de etiqueta no reconocida');
});
