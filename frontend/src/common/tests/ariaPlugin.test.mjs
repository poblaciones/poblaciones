import { describe, it, expect } from './_harness.mjs';
import ariaPlugin from '@/common/framework/ariaPlugin';

describe('ariaPlugin: $ariaPressed');

function installOnFakeVue() {
	const FakeVue = { prototype: {} };
	ariaPlugin.install(FakeVue);
	return FakeVue.prototype.$ariaPressed;
}

it('install registra $ariaPressed en el prototipo de Vue', () => {
	expect(typeof installOnFakeVue()).toBe('function');
});

it('devuelve el texto "true" o "false" y no un booleano, para que Vue no quite el atributo', () => {
	const ariaPressed = installOnFakeVue();
	expect(ariaPressed(true)).toBe('true');
	expect(ariaPressed(false)).toBe('false');
});

it('un valor falsy cualquiera da "false" y uno truthy da "true"', () => {
	const ariaPressed = installOnFakeVue();
	expect(ariaPressed(undefined)).toBe('false');
	expect(ariaPressed(0)).toBe('false');
	expect(ariaPressed('x')).toBe('true');
});
