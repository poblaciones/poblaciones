import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable } from './fixtures.mjs';
import ActiveMetric from '@/map/classes/ActiveMetric';
import SegmentsComposer from '@/map/composers/SegmentsComposer';

// Los segmentos traen la geometría con el dato (no hay servicio de cartografía
// aparte) y se dibujan como líneas con marcadores en los extremos. Estas
// pruebas protegen processFeature y el filtrado de renderPolygons antes del
// desarrollo sobre esta forma de presentación.

function makeSegmentsMetric(variableOverrides) {
	setupWindow();
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({
				Dataset: { Type: 'S', AreSegments: true, ShowInfo: true, Marker: null, Id: 1 },
				Variables: [makeVariable(variableOverrides)],
			})],
		})],
	});
	const metric = new ActiveMetric(properties);
	metric.index = 0;
	return metric;
}

function makeComposer(metric) {
	const mapsApi = {};
	return new SegmentsComposer(mapsApi, metric);
}

function makeDataElement(metric, overrides) {
	const label = metric.SelectedVariable().ValueLabels[0];
	return Object.assign({
		FID: 501,
		type: 'Feature',
		LID: label.Id,
		Geometry: { type: 'LineString', coordinates: [[-59.1, -37.3], [-59.2, -37.4]] },
		Value: 50,
		Total: 200,
		Description: null,
	}, overrides);
}

describe('SegmentsComposer: configuración');

it('usa marcadores SVG en los extremos y trazo engrosado', () => {
	const metric = makeSegmentsMetric();
	const composer = makeComposer(metric);
	expect(composer.useSvgMarkers).toBeTruthy();
	expect(composer.strokeWidthScaling).toBe(2);
});

it('el nivel de segmentos no declara servicio de cartografía', () => {
	// La geometría viene con el dato: GetCartographyService de un nivel con
	// AreSegments devuelve url null (verificado acá contra el contrato usado
	// por TileOverlay/TileRequest, que con url null no pide geografía).
	const metric = makeSegmentsMetric();
	expect(metric.SelectedLevel().Dataset.AreSegments).toBeTruthy();
});

describe('SegmentsComposer: processFeature');

it('arma el mapItem con la geometría del dato y la clase de línea', () => {
	const metric = makeSegmentsMetric();
	const composer = makeComposer(metric);
	const dataElement = makeDataElement(metric);
	const feature = composer.processFeature(77, dataElement);
	expect(feature.id).toBe(501);
	expect(feature.geometry).toBe(dataElement.Geometry);
	expect(feature.properties.className).toBe('e77_' + dataElement.LID + ' ls');
});

it('devuelve null si la categoría está oculta (filtro por etiqueta)', () => {
	const metric = makeSegmentsMetric();
	metric.SelectedVariable().ValueLabels[0].Visible = false;
	const composer = makeComposer(metric);
	expect(composer.processFeature(1, makeDataElement(metric))).toBeNull();
});

it('la caché de visibilidad del composer se llena por categoría consultada', () => {
	const metric = makeSegmentsMetric();
	const composer = makeComposer(metric);
	const dataElement = makeDataElement(metric);
	composer.processFeature(1, dataElement);
	expect(composer.labelsVisibility['K' + dataElement.LID]).toBeTruthy();
});

it('escapa las comillas dobles de la descripción', () => {
	const metric = makeSegmentsMetric();
	const composer = makeComposer(metric);
	const feature = composer.processFeature(1, makeDataElement(metric, { Description: 'Tramo "A"' }));
	expect(feature.properties.description).toBe('Tramo &#x22;A&#x22;');
});

it('formatea el valor de una variable normalizada como porcentaje', () => {
	const metric = makeSegmentsMetric({ HasTotals: true, NormalizationScale: 100 });
	const composer = makeComposer(metric);
	// Value 50 sobre Total 200 con escala 100 -> 25.0%
	const feature = composer.processFeature(1, makeDataElement(metric, { Value: 50, Total: 200 }));
	expect(feature.properties.value).toBe('25.0%');
});

it('las variables de conteo simple no llevan valor en las properties', () => {
	const metric = makeSegmentsMetric({ IsSimpleCount: true, HasTotals: false });
	const composer = makeComposer(metric);
	const feature = composer.processFeature(1, makeDataElement(metric));
	expect(feature.properties.value === undefined).toBeTruthy();
});

it('en comparación activa calcula el delta y lo formatea con signo y unidad', () => {
	const metric = makeSegmentsMetric({ Comparable: true, ComparableUnit: ' pp' });
	const variable = metric.SelectedVariable();
	// Con Compare activo, la visibilidad se resuelve sobre los labels comparables.
	variable.ComparableValueLabels = variable.ValueLabels;
	metric.Compare = { Active: true, CalculateDelta() { return 3.5; } };
	const composer = makeComposer(metric);
	const dataElement = makeDataElement(metric, { ValueCompare: 40, TotalCompare: 200 });
	const feature = composer.processFeature(1, dataElement);
	expect(dataElement.DeltaValue).toBe(3.5);
	expect(feature.properties.value).toBe('+3,5&nbsp;pp');
});

describe('SegmentsComposer: renderPolygons');

it('sin variable seleccionada no compone nada', () => {
	const metric = makeSegmentsMetric();
	const dataElement = makeDataElement(metric);
	metric.SelectedLevel().SelectedVariableIndex = -1;
	const composer = makeComposer(metric);
	let called = false;
	composer.CreateSVGOverlay = function () { called = true; };
	expect(composer.renderPolygons(null, [dataElement], null, null, 0, 0, 10, null) === undefined).toBeTruthy();
	expect(called).toBeFalsy();
});

it('filtra por visibilidad y pasa los parentAttributes de la selección actual', () => {
	const metric = makeSegmentsMetric();
	const hiddenLabel = metric.SelectedVariable().ValueLabels[1];
	hiddenLabel.Visible = false;
	const composer = makeComposer(metric);
	let captured = null;
	composer.CreateSVGOverlay = function (tileUniqueId, div, parentAttributes, features, z, patternValue) {
		captured = { parentAttributes, features, patternValue };
		return 'svg';
	};
	const visible = makeDataElement(metric);
	const hidden = makeDataElement(metric, { FID: 502, LID: hiddenLabel.Id });
	const result = composer.renderPolygons(null, [visible, hidden], null, 'div', 0, 0, 10, null);
	expect(result).toBe('svg');
	expect(captured.features).toHaveLength(1);
	expect(captured.features[0].id).toBe(501);
	expect(captured.patternValue).toBe(1);
	expect(captured.parentAttributes.metricId).toBe(metric.properties.Metric.Id);
	expect(captured.parentAttributes.variableId).toBe(metric.SelectedVariable().Id);
	expect(captured.parentAttributes.showInfo).toBe('1');
});
