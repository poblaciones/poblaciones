import { describe, it, expect } from './_harness.mjs';
import Mercator from '@/map/js/Mercator';

// Convención de getTileBounds a proteger: Min es la esquina NOROESTE (latitud
// mayor, longitud menor) y Max la SURESTE. La latitud queda "invertida"
// respecto de un envelope geográfico usual; alignRectangle existe para
// normalizarla cuando hace falta comparar.

describe('Mercator: proyección y tiles');

it('getTileBounds del tile raíz (0,0,0) cubre el mundo Mercator (Min=NO, Max=SE)', () => {
	const mercator = new Mercator();
	const bounds = mercator.getTileBounds({ x: 0, y: 0, z: 0 });
	expect(bounds.Min.Lon).toBeCloseTo(-180, 4);
	expect(bounds.Max.Lon).toBeCloseTo(180, 4);
	expect(bounds.Min.Lat).toBeCloseTo(85.0511, 3);
	expect(bounds.Max.Lat).toBeCloseTo(-85.0511, 3);
});

it('getTileBounds en z=1: el tile (0,0) es el cuadrante noroeste', () => {
	const mercator = new Mercator();
	const topLeft = mercator.getTileBounds({ x: 0, y: 0, z: 1 });
	expect(topLeft.Min.Lon).toBeCloseTo(-180, 4);
	expect(topLeft.Max.Lon).toBeCloseTo(0, 4);
	expect(topLeft.Max.Lat).toBeCloseTo(0, 4);
	expect(topLeft.Min.Lat).toBeCloseTo(85.0511, 3);
});

it('getTileAtLatLng y getTileBounds son consistentes', () => {
	const mercator = new Mercator();
	const coord = { lat: -37.32, lng: -59.13 };
	const tile = mercator.getTileAtLatLng(coord, 10);
	const bounds = mercator.getTileBounds(tile);
	expect(bounds.Max.Lat <= coord.lat && coord.lat <= bounds.Min.Lat).toBeTruthy();
	expect(bounds.Min.Lon <= coord.lng && coord.lng <= bounds.Max.Lon).toBeTruthy();
});

it('normalizeTile envuelve la coordenada x fuera de rango', () => {
	const mercator = new Mercator();
	const normalized = mercator.normalizeTile({ x: 5, y: 1, z: 2 });
	expect(normalized.x).toBe(1);
	expect(normalized.y).toBe(1);
});

describe('Mercator: intersección de rectángulos');

it('detecta superposición y separación (rectángulos ya alineados)', () => {
	const mercator = new Mercator();
	const a = { Min: { Lat: 0, Lon: 0 }, Max: { Lat: 10, Lon: 10 } };
	const overlapping = { Min: { Lat: 5, Lon: 5 }, Max: { Lat: 15, Lon: 15 } };
	const disjoint = { Min: { Lat: 20, Lon: 20 }, Max: { Lat: 30, Lon: 30 } };
	expect(mercator.rectanglesIntersect(a, overlapping)).toBeTruthy();
	expect(mercator.rectanglesIntersect(a, disjoint)).toBeFalsy();
});

it('rectanglesIntersection alinea las convenciones de tile antes de intersecar', () => {
	const mercator = new Mercator();
	// Un bounds de tile (Min al noroeste) contra un envelope usual.
	const tileBounds = { Min: { Lat: 10, Lon: 0 }, Max: { Lat: 0, Lon: 10 } };
	const envelope = { Min: { Lat: 5, Lon: 5 }, Max: { Lat: 15, Lon: 15 } };
	expect(mercator.rectanglesIntersection(tileBounds, envelope)).toBeTruthy();
});
