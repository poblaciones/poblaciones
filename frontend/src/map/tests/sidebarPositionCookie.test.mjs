import { describe, it, expect } from './_harness.mjs';
import SidebarPositionCookie from '@/map/classes/SidebarPositionCookie';

describe('SidebarPositionCookie');

it('sin cookie (o un valor no reconocido), Get cae al default "middle"', () => {
	const cookie = new SidebarPositionCookie();
	cookie.Set(undefined);
	expect(cookie.Get()).toBe('middle');
	cookie.Set('left'); // no es una de las tres posiciones válidas
	expect(cookie.Get()).toBe('middle');
});

it('Set/Get sostienen "top" y "bottom"', () => {
	const cookie = new SidebarPositionCookie();
	cookie.Set('top');
	expect(cookie.Get()).toBe('top');
	cookie.Set('bottom');
	expect(cookie.Get()).toBe('bottom');
});
