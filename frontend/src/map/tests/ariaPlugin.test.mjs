import { describe, it, expect } from './_harness.mjs';
import AriaPlugin from '@/common/framework/ariaPlugin';

// Vue quita los atributos con valor false; aria-pressed="false" debe llegar al DOM.

function instalar() {
	const Vue = { prototype: {} };
	AriaPlugin.install(Vue);
	return Vue.prototype.$ariaPressed;
}

describe('ariaPlugin: $ariaPressed');

it('devuelve la cadena "true" para un estado presionado', () => {
	expect(instalar()(true)).toBe('true');
});

it('devuelve la cadena "false" (no el booleano) para un estado sin presionar', () => {
	expect(instalar()(false)).toBe('false');
});

it('trata valores no booleanos por su veracidad', () => {
	expect(instalar()(0)).toBe('false');
	expect(instalar()('x')).toBe('true');
});
