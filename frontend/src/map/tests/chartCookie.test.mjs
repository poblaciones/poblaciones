import { describe, it, expect } from './_harness.mjs';
import Cookies from 'js-cookie';
import ChartCookie from '@/map/classes/ChartCookie';

// La preferencia de mostrar/ocultar el gráfico del resumen persiste en la
// cookie chartState (1/0). Sin cookie, el gráfico arranca visible.

describe('ChartCookie: preferencia del gráfico del resumen');

it('sin cookie, el gráfico arranca activado', () => {
	Cookies.remove('chartState');
	expect(new ChartCookie().Get()).toBe(true);
});

it('Set persiste 1/0 según el booleano y Get lo relee', () => {
	const cookie = new ChartCookie();
	cookie.Set(true);
	expect(Cookies.get('chartState')).toBe(1);
	expect(cookie.Get()).toBe(true);
	cookie.Set(false);
	expect(Cookies.get('chartState')).toBe(0);
	expect(cookie.Get()).toBe(false);
});
