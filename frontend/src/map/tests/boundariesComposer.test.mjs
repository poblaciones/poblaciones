import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeBoundaryProperties, makeBoundaryVersion, makeBoundaryValueLabel } from './fixtures.mjs';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import BoundariesComposer from '@/map/composers/BoundariesComposer';

// La geometría de boundary llega por servicio de cartografía aparte (a
// diferencia de segments); cada feature trae LabelId identificando de qué
// ValueLabel (ClippingRegion de origen) proviene, para poder colorearlo y
// filtrarlo por visibilidad igual que las categorías de una variable.

function makeBoundary(valueLabelOverrides) {
	setupWindow();
	const properties = makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: [
				makeBoundaryValueLabel(Object.assign({ Id: 501, Name: 'Tandil' }, valueLabelOverrides && valueLabelOverrides[0])),
				makeBoundaryValueLabel(Object.assign({ Id: 502, Name: 'CABA' }, valueLabelOverrides && valueLabelOverrides[1])),
			],
		})],
	});
	const boundary = new ActiveBoundary(properties);
	boundary.index = 0;
	return boundary;
}

function makeComposer(boundary) {
	return new BoundariesComposer({}, boundary);
}

function makeFeature(overrides) {
	return Object.assign({
		id: 901,
		type: 'Feature',
		geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
		properties: { LabelId: 501, Description: null },
	}, overrides);
}

describe('BoundariesComposer: processFeature');

it('arma la clase CSS con el LabelId de la feature', () => {
	const boundary = makeBoundary();
	const composer = makeComposer(boundary);
	const feature = composer.processFeature(33, makeFeature());
	expect(feature.properties.className).toBe('e33_501');
	expect(feature.id).toBe(901);
	expect(feature.geometry).toEqual(makeFeature().geometry);
});

it('sin patternValue de textura (Contorno=1, Pleno=0), no setea patternClass', () => {
	const boundary = makeBoundary();
	const composer = makeComposer(boundary);
	expect(composer.processFeature(1, makeFeature(), 1).properties.patternClass).toBeFalsy();
	expect(composer.processFeature(1, makeFeature(), 0).properties.patternClass).toBeFalsy();
});

it('con patternValue de textura (Diagonal=7, Puntos=11), setea patternClass = "cs"+LabelId', () => {
	// Bug corregido: sin esto, appendStyles arma fill: url(#..._undefined),
	// una referencia inválida al <pattern> real (creado con "cs"+Id en
	// appendPatterns), y el navegador caía al mismo aspecto que Contorno.
	const boundary = makeBoundary();
	const composer = makeComposer(boundary);
	expect(composer.processFeature(1, makeFeature(), 7).properties.patternClass).toBe('cs501');
	expect(composer.processFeature(1, makeFeature(), 11).properties.patternClass).toBe('cs501');
});

it('devuelve null si el ClippingRegion de origen está oculto', () => {
	const boundary = makeBoundary();
	boundary.SelectedVersion().ValueLabels[0].Visible = false;
	const composer = makeComposer(boundary);
	expect(composer.processFeature(1, makeFeature({ properties: { LabelId: 501, Description: null } }))).toBeNull();
});

it('no filtra features de un ClippingRegion visible aunque otro esté oculto', () => {
	const boundary = makeBoundary();
	boundary.SelectedVersion().ValueLabels[0].Visible = false;
	const composer = makeComposer(boundary);
	const feature = composer.processFeature(1, makeFeature({ properties: { LabelId: 502, Description: null } }));
	expect(feature).toBeTruthy();
	expect(feature.properties.className).toBe('e1_502');
});

it('escapa las comillas dobles de la descripción', () => {
	const boundary = makeBoundary();
	const composer = makeComposer(boundary);
	const feature = composer.processFeature(1, makeFeature({ properties: { LabelId: 501, Description: 'Barrio "Centro"' } }));
	expect(feature.properties.description).toBe('Barrio &#x22;Centro&#x22;');
});

it('cachea la visibilidad resuelta por ClippingRegion (labelsVisibility)', () => {
	const boundary = makeBoundary();
	const composer = makeComposer(boundary);
	composer.processFeature(1, makeFeature());
	expect(composer.labelsVisibility.K501).toBeTruthy();
});

describe('BoundariesComposer: renderPolygons');

it('usa el patrón dinámico del boundary (GetPattern), no un valor fijo', () => {
	const boundary = makeBoundary();
	boundary.customPattern = 0;
	const composer = makeComposer(boundary);
	let capturedPattern = null;
	composer.CreateSVGOverlay = function (tileUniqueId, div, parentAttributes, features, z, patternValue) {
		capturedPattern = patternValue;
		return 'svg';
	};
	const result = composer.renderPolygons(null, [makeFeature()], null, 'div', 0, 0, 10, null);
	expect(result).toBe('svg');
	expect(capturedPattern).toBe(0);
});

it('con trama Diagonal, las features que llegan a CreateSVGOverlay ya traen patternClass', () => {
	const boundary = makeBoundary();
	boundary.customPattern = 7;
	const composer = makeComposer(boundary);
	let capturedFeatures = null;
	composer.CreateSVGOverlay = function (tileUniqueId, div, parentAttributes, features) {
		capturedFeatures = features;
		return 'svg';
	};
	composer.renderPolygons(null, [makeFeature()], null, 'div', 0, 0, 10, null);
	expect(capturedFeatures[0].properties.patternClass).toBe('cs501');
});

it('filtra las features ocultas antes de pasarlas al overlay', () => {
	const boundary = makeBoundary();
	boundary.SelectedVersion().ValueLabels[1].Visible = false;
	const composer = makeComposer(boundary);
	let capturedFeatures = null;
	composer.CreateSVGOverlay = function (tileUniqueId, div, parentAttributes, features) {
		capturedFeatures = features;
		return 'svg';
	};
	const visible = makeFeature({ id: 1, properties: { LabelId: 501, Description: null } });
	const hidden = makeFeature({ id: 2, properties: { LabelId: 502, Description: null } });
	composer.renderPolygons(null, [visible, hidden], null, 'div', 0, 0, 10, null);
	expect(capturedFeatures).toHaveLength(1);
	expect(capturedFeatures[0].id).toBe(1);
});

it('no compone nada si la capa está oculta (boundary.visible === false)', () => {
	const boundary = makeBoundary();
	boundary.visible = false;
	const composer = makeComposer(boundary);
	let called = false;
	composer.CreateSVGOverlay = function () { called = true; return 'svg'; };
	composer.renderPolygons(null, [makeFeature()], null, 'div', 0, 0, 10, null);
	expect(called).toBeFalsy();
});

describe('BoundariesComposer: renderLabels');

it('no agrega texto de una feature con ClippingRegion oculto', () => {
	const boundary = makeBoundary();
	boundary.SelectedVersion().ValueLabels[0].Visible = false;
	const composer = makeComposer(boundary);
	let called = false;
	composer.AddFeatureText = function () { called = true; };
	composer.UpdateTextStyle = function () {};
	composer.renderLabels([makeFeature()], 'tile', null, 10);
	expect(called).toBeFalsy();
});

it('sí agrega texto de una feature con ClippingRegion visible', () => {
	const boundary = makeBoundary();
	const composer = makeComposer(boundary);
	let called = false;
	composer.AddFeatureText = function () { called = true; };
	composer.UpdateTextStyle = function () {};
	composer.renderLabels([makeFeature()], 'tile', null, 10);
	expect(called).toBeTruthy();
});
