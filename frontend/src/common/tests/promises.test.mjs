import { describe, it, expect } from './_harness.mjs';
import promises from '@/common/framework/promises';

describe('promises: ReadyPromise');

it('se resuelve con null cuando no se le pasan argumentos', async () => {
	const value = await promises.ReadyPromise();
	expect(value).toBeNull();
});

it('se resuelve con el valor recibido', async () => {
	const value = await promises.ReadyPromise({ listo: true });
	expect(value).toEqual({ listo: true });
});

it('no se resuelve de forma sincrónica: espera al menos un ciclo del temporizador', async () => {
	let resolved = false;
	const pending = promises.ReadyPromise().then(function () { resolved = true; });
	expect(resolved).toBeFalsy();
	await pending;
	expect(resolved).toBeTruthy();
});
