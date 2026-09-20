import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
import FixedSizeShapeOverlay from '@/map/overlays/FixedSizeShapeOverlay';
import IconOverlay from '@/map/overlays/IconOverlay';
import MarkerFactory from '@/map/overlays/MarkerFactory';
import { IconLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';

const METERS_PER_DEGREE = 111320;

function makeLocationMetric(marker, valueLabels, opacityKey) {
	const variable = { Id: 7, Opacity: opacityKey, ValueLabels: valueLabels || [{ Id: 1, FillColor: '#ff0000', Symbol: null, Visible: true }] };
	return {
		SelectedMarker() { return marker; },
		UpdateOpacity() {},
		GetStyleColorDictionary() {
			const ret = {};
			for (const label of variable.ValueLabels) {
				ret[label.Id] = label.FillColor;
			}
			return ret;
		},
		Icons() { return {}; },
		HasSelectedVariable() { return true; },
		SelectedVariable() { return variable; },
		ResolveVariableValues() { return variable.ValueLabels; },
		IsFiltering() { return false; },
		SelectedShowInfo() { return true; },
	};
}

function setupDom() {
	const segMap = setupWindow();
	segMap.MapsApi = {};
	segMap.frame.Zoom = 16;
	segMap.frame.Envelope = { Min: { Lat: -37.3, Lon: -59.1 }, Max: { Lat: -37.3, Lon: -59.1 } };
	globalThis.document.createElement = function () { return {}; };
	globalThis.L = { Util: { template(svg, values) { return svg.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match)); } } };
	return segMap;
}

function extentInMeters(polygon, lat) {
	let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
	for (const point of polygon) {
		minX = Math.min(minX, point[0]);
		maxX = Math.max(maxX, point[0]);
		minY = Math.min(minY, point[1]);
		maxY = Math.max(maxY, point[1]);
	}
	const metersPerDegreeLon = METERS_PER_DEGREE * Math.cos(lat * Math.PI / 180);
	return { width: (maxX - minX) * metersPerDegreeLon, height: (maxY - minY) * METERS_PER_DEGREE, maxY: maxY };
}

function makeShapes(frame, size, opacityKey, sourceCentralMeridian) {
	const marker = { Size: 'F', Frame: frame, FixedSize: size, SourceCentralMeridian: sourceCentralMeridian };
	return new FixedSizeShapeOverlay(makeLocationMetric(marker, undefined, opacityKey), { mouseover: null, click: null });
}

describe('FixedSizeShapeOverlay: geometría en metros');

// Sin Marker.SourceCentralMeridian no hay rotación por convergencia de
// meridianos (ver más abajo), así que estos tres miden el tamaño puro de la
// figura sin que la rotación deforme el bounding box.
it('el cuadrado tiene el tamaño fijo como lado', () => {
	setupDom();
	const extent = extentInMeters(makeShapes('B', 500).CreatePolygon(-63, -34.6), -34.6);
	expect(extent.width).toBeCloseTo(500, 3);
	expect(extent.height).toBeCloseTo(500, 3);
});

it('el círculo tiene el tamaño fijo como diámetro', () => {
	setupDom();
	const polygon = makeShapes('C', 1000).CreatePolygon(-63, -24);
	expect(polygon).toHaveLength(36);
	const extent = extentInMeters(polygon, -24);
	expect(extent.width).toBeCloseTo(1000, 3);
	expect(extent.height).toBeCloseTo(1000, 3);
});

it('el hexágono tiene base plana: el tamaño es la altura y el ancho es mayor', () => {
	setupDom();
	const polygon = makeShapes('H', 300).CreatePolygon(-63, -34.6);
	expect(polygon).toHaveLength(6);
	const extent = extentInMeters(polygon, -34.6);
	expect(extent.height).toBeCloseTo(300, 3);
	expect(extent.width).toBeCloseTo(300 * 2 / Math.sqrt(3), 3);
	const topVertices = polygon.filter(point => Math.abs(point[1] - extent.maxY) < 1e-12);
	expect(topVertices).toHaveLength(2);
});

describe('FixedSizeShapeOverlay: rotación por convergencia de meridianos (Marker.SourceCentralMeridian)');

function metersBetween(lon1, lat1, lon2, lat2) {
	const metersPerDegreeLon = METERS_PER_DEGREE * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
	const deltaLon = (lon1 - lon2) * metersPerDegreeLon;
	const deltaLat = (lat1 - lat2) * METERS_PER_DEGREE;
	return Math.sqrt(deltaLon * deltaLon + deltaLat * deltaLat);
}

it('sin Marker.SourceCentralMeridian no rota, en ningún punto', () => {
	setupDom();
	const shapes = makeShapes('H', 500);
	expect(shapes.CalculateGridRotation(-59.13, -37.32)).toBe(0);
});

it('en el meridiano central declarado la rotación es nula', () => {
	setupDom();
	const shapes = makeShapes('H', 500, undefined, -63);
	expect(shapes.CalculateGridRotation(-63, -37.32)).toBe(0);
});

it('lejos del meridiano central declarado, la figura rotada coincide con la reproyección real desde EPSG:5346 (a menos de 5 m; sin rotar el error supera los 10 m)', () => {
	setupDom();
	const lon = -59.13;
	const lat = -37.32;
	const radius = 500 / Math.sqrt(3);
	// Referencia: hexágono generado directamente en EPSG:5346 (POSGAR 2007 /
	// Argentina 4, meridiano central -63°) y reproyectado a EPSG:4326 con
	// pyproj; vértice de ángulo 0 respecto del centro.
	const trueVertex = { lon: -59.12675064, lat: -37.31989352 };

	const [rotatedVertex] = makeShapes('H', 500, undefined, -63).CreatePolygon(lon, lat);
	const rotatedError = metersBetween(rotatedVertex[0], rotatedVertex[1], trueVertex.lon, trueVertex.lat);
	expect(rotatedError).toBeCloseTo(0, -1);

	const metersPerDegreeLon = METERS_PER_DEGREE * Math.cos(lat * Math.PI / 180);
	const unrotatedVertex = { lon: lon + radius / metersPerDegreeLon, lat: lat };
	const unrotatedError = metersBetween(unrotatedVertex.lon, unrotatedVertex.lat, trueVertex.lon, trueVertex.lat);
	expect(unrotatedError > 10).toBeTruthy();
});

it('el pin no admite tamaño fijo', () => {
	setupDom();
	let message = null;
	try {
		makeShapes('P', 100);
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('El marco "P" no admite tamaño fijo en metros.');
});

it('la capa de figuras es seleccionable y usa los mismos delegados que los íconos', () => {
	setupDom();
	const delegates = { mouseover() {}, click() {} };
	const shapes = new FixedSizeShapeOverlay(makeLocationMetric({ Size: 'F', Frame: 'H', FixedSize: 100 }), delegates);
	const layer = shapes.CreateLayer([{ LID: 1, Lat: -34, Lon: -58 }], 16, -34);
	expect(layer instanceof PolygonLayer).toBeTruthy();
	expect(layer.props.pickable).toBe(true);
	expect(layer.props.onClick).toBe(delegates.click);
	expect(layer.props.onHover).toBe(delegates.mouseover);
});

it('alta es 0,7 (0,42 desde zoom 18)', () => {
	setupDom();
	const shapes = makeShapes('B', 500, 'H');
	expect(shapes.CreateLayer([], 16, -37).props.getFillColor({ LID: 1 })).toEqual([255, 0, 0, 179]);
	expect(shapes.CreateLayer([], 18, -37).props.getFillColor({ LID: 1 })).toEqual([255, 0, 0, 107]);
});

it('media es el promedio entre baja y alta (0,5)', () => {
	setupDom();
	expect(makeShapes('B', 500, 'M').CreateLayer([], 16, -37).props.getFillColor({ LID: 1 })).toEqual([255, 0, 0, 128]);
});

it('sin nivel elegido se comporta como media', () => {
	setupDom();
	expect(makeShapes('B', 500).CreateLayer([], 16, -37).props.getFillColor({ LID: 1 })).toEqual([255, 0, 0, 128]);
});

it('baja es 0,3', () => {
	setupDom();
	expect(makeShapes('B', 500, 'L').CreateLayer([], 16, -37).props.getFillColor({ LID: 1 })).toEqual([255, 0, 0, 77]);
});

describe('FixedSizeShapeOverlay: tamaño mínimo en pantalla');

it('calcula el tamaño en píxeles según zoom y latitud', () => {
	setupDom();
	const shapes = makeShapes('H', 500);
	// En Tandil, con zoom 9 un píxel cubre unos 243 m.
	expect(shapes.SizeInPixels(9, -37.3)).toBeCloseTo(2.06, 2);
	expect(shapes.SizeInPixels(10, -37.3)).toBeCloseTo(4.11, 2);
});

it('por debajo de 4 píxeles reemplaza las figuras por puntos seleccionables', () => {
	setupDom();
	const delegates = { mouseover() {}, click() {} };
	const shapes = new FixedSizeShapeOverlay(makeLocationMetric({ Size: 'F', Frame: 'H', FixedSize: 500 }), delegates);
	const layer = shapes.CreateLayer([], 9, -37.3);
	expect(layer instanceof ScatterplotLayer).toBeTruthy();
	expect(layer.props.radiusUnits).toBe('pixels');
	expect(layer.props.getRadius).toBe(2);
	expect(layer.props.pickable).toBe(true);
	expect(layer.props.onClick).toBe(delegates.click);
});

it('UpdateZoom devuelve una capa nueva solo al cambiar la presentación o la opacidad', () => {
	setupDom();
	const shapes = makeShapes('H', 500);
	shapes.CreateLayer([], 12, -37.3);
	expect(shapes.UpdateZoom(11, -37.3)).toBeNull();
	expect(shapes.UpdateZoom(9, -37.3) instanceof ScatterplotLayer).toBeTruthy();
	expect(shapes.UpdateZoom(8, -37.3)).toBeNull();
	expect(shapes.UpdateZoom(13, -37.3) instanceof PolygonLayer).toBeTruthy();
	expect(shapes.UpdateZoom(18, -37.3) instanceof PolygonLayer).toBeTruthy();
});

describe('IconOverlay: capas según el tamaño del marcador');

function layerKinds(marker, valueLabels) {
	setupDom();
	const layers = new IconOverlay(makeLocationMetric(marker, valueLabels)).CreateLayers([]);
	return layers.map(layer => (layer instanceof PolygonLayer ? 'polygon' : 'icon')).join(',');
}

it('con tamaño S/M/L arma solo la capa de íconos con marco', () => {
	expect(layerKinds({ Size: 'M', Frame: 'C', Type: 'I', Source: 'F', Symbol: 'fa-home' })).toBe('icon');
});

it('con tamaño fijo y sin contenido omite la capa de íconos', () => {
	expect(layerKinds({ Size: 'F', Frame: 'B', FixedSize: 100, Type: 'N', Source: 'F' })).toBe('polygon');
	expect(layerKinds({ Size: 'F', Frame: 'B', FixedSize: 100, Type: 'I', Source: 'F', Symbol: '' })).toBe('polygon');
	expect(layerKinds({ Size: 'F', Frame: 'B', FixedSize: 100, Type: 'I', Source: 'F', Symbol: null })).toBe('polygon');
	expect(layerKinds({ Size: 'F', Frame: 'B', FixedSize: 100, Type: 'T', Source: 'F', Text: '' })).toBe('polygon');
});

it('con tamaño fijo y contenido fijo agrega la capa de íconos sobre las figuras', () => {
	expect(layerKinds({ Size: 'F', Frame: 'H', FixedSize: 100, Type: 'I', Source: 'F', Symbol: 'fa-home' })).toBe('polygon,icon');
	expect(layerKinds({ Size: 'F', Frame: 'H', FixedSize: 100, Type: 'T', Source: 'F', Text: 'A' })).toBe('polygon,icon');
});

it('con tamaño fijo y contenido variable agrega siempre la capa de íconos', () => {
	expect(layerKinds({ Size: 'F', Frame: 'C', FixedSize: 100, Type: 'T', Source: 'V' })).toBe('polygon,icon');
});

it('con tamaño fijo, un símbolo de categoría requiere la capa de íconos aunque el marcador no tenga contenido', () => {
	const labels = [{ Id: 1, FillColor: '#ff0000', Symbol: null }, { Id: 2, FillColor: '#00ff00', Symbol: 'fa-star' }];
	expect(layerKinds({ Size: 'F', Frame: 'C', FixedSize: 100, Type: 'N', Source: 'F' }, labels)).toBe('polygon,icon');
});

it('los íconos sobre las figuras no son seleccionables y se escalan en metros', () => {
	setupDom();
	const marker = { Size: 'F', Frame: 'C', FixedSize: 250, Type: 'T', Source: 'V' };
	const layers = new IconOverlay(makeLocationMetric(marker)).CreateLayers([]);
	const iconLayer = layers[1];
	expect(iconLayer instanceof IconLayer).toBeTruthy();
	expect(iconLayer.props.pickable).toBe(false);
	expect(iconLayer.props.sizeUnits).toBe('meters');
	expect(iconLayer.props.sizeScale).toBe(250);
});

it('cuando las figuras pasan a puntos omite los íconos, y los repone al volver', () => {
	setupDom();
	const marker = { Size: 'F', Frame: 'H', FixedSize: 500, Type: 'T', Source: 'V' };
	const overlay = new IconOverlay(makeLocationMetric(marker));
	expect(overlay.CreateLayers([])).toHaveLength(2);
	const reduced = overlay.UpdateZoom(9, -37.3);
	expect(reduced).toHaveLength(1);
	expect(reduced[0] instanceof ScatterplotLayer).toBeTruthy();
	const restored = overlay.UpdateZoom(14, -37.3);
	expect(restored).toHaveLength(2);
	expect(restored[1] instanceof IconLayer).toBeTruthy();
});

it('sin tamaño fijo UpdateZoom no reemplaza capas', () => {
	setupDom();
	const overlay = new IconOverlay(makeLocationMetric({ Size: 'M', Frame: 'C', Type: 'N', Source: 'F' }));
	overlay.CreateLayers([]);
	expect(overlay.UpdateZoom(5, -37.3)).toBeNull();
});

describe('MarkerFactory (deck.gl): marcos');

function createMarker(marker) {
	setupDom();
	const metric = makeLocationMetric(marker);
	metric.ResolveStyle = function () { return { fillColor: '#ff0000' }; };
	metric.ResolveValueLabelSymbol = function () { return null; };
	const factory = new MarkerFactory({}, metric, metric.SelectedVariable(), {});
	return factory.CreateMarker({ LID: 1, Symbol: 'X' }, marker);
}

it('con tamaño fijo el ícono no dibuja marco y se centra sobre el punto', () => {
	const icon = createMarker({ Size: 'F', Frame: 'B', FixedSize: 100, Type: 'T', Source: 'V' });
	expect(icon.svg.indexOf('<path')).toBe(-1);
	expect(icon.svg.indexOf('<circle')).toBe(-1);
	expect(icon.svg.indexOf('>X</text>') !== -1).toBeTruthy();
	expect(icon.iconAnchor).toEqual([36, 36]);
	expect(icon.iconSize).toEqual([72, 72]);
});

it('el marco hexagonal usa el path de hexágono con base plana', () => {
	const icon = createMarker({ Size: 'M', Frame: 'H', Type: 'T', Source: 'V' });
	expect(icon.svg.indexOf('d="M 0,12 6,1.608 18,1.608 24,12 18,22.392 6,22.392 z"') !== -1).toBeTruthy();
	expect(icon.iconAnchor).toEqual([36, 72]);
});
