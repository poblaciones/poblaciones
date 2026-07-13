import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeBoundaryProperties, makeBoundaryVersion, makeBoundaryValueLabel } from './fixtures.mjs';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import BoundariesComposer from '@/map/composers/BoundariesComposer';

// Regresión: con patrones de textura (Diagonal=7, Puntos=11; patternValue>6),
// CreateSVG leía this.activeSelectedMetric.SelectedVariable().CurrentOpacity
// directo, en vez de this.activeSelectedMetric.CurrentOpacity() (el método
// genérico que ya usa el resto del archivo, línea 250/275/295). ActiveBoundary
// no tiene SelectedVariable(), así que Diagonal/Puntos rompían con boundary
// (Contorno/Pleno no disparan esa rama, por eso no se notaba antes).

function makeSvgElementStub() {
	return { setAttributeNS() {}, style: {} };
}

describe('AbstractSvgComposer.CreateSVG: patrones de textura sin SelectedVariable()');

it('con patternValue=7 (Diagonal), no lanza para un boundary (sin SelectedVariable)', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	boundary.index = 0;
	const composer = new BoundariesComposer({}, boundary);
	globalThis.document = { createElementNS() { return makeSvgElementStub(); } };
	expect(typeof composer.SelectedVariable).toBe('undefined');
	// No debe lanzar TypeError; usa boundary.CurrentOpacity() en su lugar.
	const svg = composer.CreateSVG(256, 256, 10, 7, 1, {});
	expect(svg).toBeTruthy();
});

it('con patternValue=11 (Puntos), tampoco lanza', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	boundary.index = 0;
	const composer = new BoundariesComposer({}, boundary);
	globalThis.document = { createElementNS() { return makeSvgElementStub(); } };
	const svg = composer.CreateSVG(256, 256, 10, 11, 1, {});
	expect(svg).toBeTruthy();
});

it('con patternValue<=6 (Contorno=1, Pleno=0), tampoco lanza (rama previa ya funcionaba)', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	boundary.index = 0;
	const composer = new BoundariesComposer({}, boundary);
	globalThis.document = { createElementNS() { return makeSvgElementStub(); } };
	expect(composer.CreateSVG(256, 256, 10, 1, 1, {})).toBeTruthy();
	expect(composer.CreateSVG(256, 256, 10, 0, 1, {})).toBeTruthy();
});
