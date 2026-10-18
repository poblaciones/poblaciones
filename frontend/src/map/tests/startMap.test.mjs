import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
import StartMap from '@/map/classes/StartMap';

function setPath(pathname) {
	setupWindow({ location: { pathname: pathname, hash: '' } });
}

describe('StartMap.ParseBoundarySegment');

it('reconoce un segmento "b<n>" como id de delimitación', () => {
	expect(StartMap.ParseBoundarySegment('b45')).toBe(45);
});

it('no reconoce un segmento numérico, uno con letras después del número, "b" solo, ni vacío', () => {
	expect(StartMap.ParseBoundarySegment('45')).toBeNull();
	expect(StartMap.ParseBoundarySegment('b45x')).toBeNull();
	expect(StartMap.ParseBoundarySegment('b')).toBeNull();
	expect(StartMap.ParseBoundarySegment('')).toBeNull();
});

describe('StartMap.ResolveWorkIdFromUrl: distingue work de delimitación en la ruta');

it('con /map/83401, resuelve un workId (comportamiento preexistente)', () => {
	setPath('/map/83401');
	const args = StartMap.ResolveWorkIdFromUrl();
	expect(args.workId).toBe(83401);
	expect(args.boundaryId).toBeNull();
});

it('con /map/b45, resuelve un boundaryId', () => {
	setPath('/map/b45');
	const args = StartMap.ResolveWorkIdFromUrl();
	expect(args.boundaryId).toBe(45);
	expect(args.workId).toBeNull();
});

it('con /map, no resuelve ni work ni delimitación', () => {
	setPath('/map');
	const args = StartMap.ResolveWorkIdFromUrl();
	expect(args.workId).toBeNull();
	expect(args.boundaryId).toBeNull();
});

it('con una barra final, ignora la barra antes de mirar el segmento', () => {
	setPath('/map/b45/');
	const args = StartMap.ResolveWorkIdFromUrl();
	expect(args.boundaryId).toBe(45);
});

it('con un link de acceso de 18 caracteres tras el id, lo separa igual para una delimitación', () => {
	setPath('/map/b45/' + 'x'.repeat(18));
	const args = StartMap.ResolveWorkIdFromUrl();
	expect(args.boundaryId).toBe(45);
	expect(args.link).toBe('x'.repeat(18));
});
