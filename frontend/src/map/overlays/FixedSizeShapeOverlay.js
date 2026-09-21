import color from '@/common/framework/color';
import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';

export default FixedSizeShapeOverlay;

const METERS_PER_DEGREE_OF_LATITUDE = 111320;
// Metros por píxel en el ecuador con zoom 0 (teselas de 256 px de Leaflet).
const METERS_PER_PIXEL_AT_ZOOM_0 = 156543.03392;
const CIRCLE_SEGMENTS = 36;
// Por debajo de este tamaño en pantalla la figura se reemplaza por un punto
// de este diámetro, para que ningún elemento deje de verse.
const MINIMUM_SIZE_IN_PIXELS = 4;

// Por debajo de este zoom el punto mínimo garantizado se va achicando, hasta
// llegar a SMALLEST_SIZE_IN_PIXELS en SMALL_ZOOM_FLOOR; de ahí para abajo no
// se achica más. Sin esto, en un mapa muy alejado todos los puntos se ven
// del mismo tamaño que a un zoom mucho más cercano.
const SMALL_ZOOM_THRESHOLD = 7;
const SMALL_ZOOM_FLOOR = 3;
const SMALLEST_SIZE_IN_PIXELS = 2;

// El rango de opacidad de esta capa va de 0,3 (baja) a 0,7 (alta); el nivel
// medio es el promedio de ambos extremos.
const OPACITY_LOW = 0.3;
const OPACITY_HIGH = 0.7;

// Marco de tamaño fijo en metros (Marker.Size === 'F'). Marker.FixedSize es
// el lado del cuadrado, el diámetro del círculo o la altura del hexágono,
// que se dibuja con base plana (más ancho que alto).
function FixedSizeShapeOverlay(activeSelectedMetric, delegates) {
	this.activeSelectedMetric = activeSelectedMetric;
	this.delegates = delegates;
	this.fillColors = this.ParseFillColors(activeSelectedMetric.GetStyleColorDictionary());
	var markerSettings = activeSelectedMetric.SelectedMarker();
	this.fixedSize = markerSettings.FixedSize;
	this.sourceCentralMeridian = markerSettings.SourceCentralMeridian;
	this.shapeOffsets = this.CreateShapeOffsets(markerSettings.Frame, markerSettings.FixedSize);
	this.data = null;
	this.showsShapes = null;
	this.opacity = null;
	this.layer = null;
};

FixedSizeShapeOverlay.prototype.CreateLayer = function (data, zoom) {
	this.data = data;
	this.zoom = zoom;
	this.opacity = this.ResolveOpacity(zoom);
	this.showsShapes = this.ShowsShapesAt(zoom);
	if (this.showsShapes) {
		this.layer = this.createShapesLayer();
	} else {
		this.layer = this.createDotsLayer();
	}
	return this.layer;
};

// Devuelve una capa nueva solo si cambió la forma de presentación, la
// opacidad (que se atenúa en zooms altos) o, estando en modo punto, el
// tamaño del punto (que se achica por debajo de SMALL_ZOOM_THRESHOLD); si
// no cambió nada de eso, null.
FixedSizeShapeOverlay.prototype.UpdateZoom = function (zoom) {
	var opacityChanged = this.ResolveOpacity(zoom) !== this.opacity;
	var presentationChanged = this.ShowsShapesAt(zoom) !== this.showsShapes;
	var dotSizeChanged = false;
	if (!presentationChanged && !this.showsShapes) {
		dotSizeChanged = this.ResolveDotDiameter(zoom) !== this.ResolveDotDiameter(this.zoom);
	}
	if (opacityChanged || presentationChanged || dotSizeChanged) {
		return this.CreateLayer(this.data, zoom);
	} else {
		return null;
	}
};

FixedSizeShapeOverlay.prototype.ResolveOpacity = function (zoom) {
	this.activeSelectedMetric.UpdateOpacity(zoom);
	var opacityKey = this.activeSelectedMetric.SelectedVariable().Opacity;
	var baseOpacity;
	if (opacityKey === 'H') {
		baseOpacity = OPACITY_HIGH;
	} else if (opacityKey === 'L') {
		baseOpacity = OPACITY_LOW;
	} else {
		baseOpacity = (OPACITY_LOW + OPACITY_HIGH) / 2;
	}
	if (zoom > 17) {
		return baseOpacity * 0.6;
	} else {
		return baseOpacity;
	}
};

FixedSizeShapeOverlay.prototype.ShowsShapesAt = function (zoom) {
	return this.SizeInPixels(zoom) >= MINIMUM_SIZE_IN_PIXELS;
};

// Metros por píxel calculados sin el factor cos(latitud) de la proyección
// Mercator real, es decir con la escala del ecuador para cualquier punto.
// Esto es deliberado: aquí solo importa determinar el zoom por debajo del
// cual la figura deja de verse, no medir con precisión, y evita depender de
// la latitud del encuadre para ese único fin. El error que introduce hace
// que el punto mínimo garantizado se active en un zoom levemente más alto
// que el estrictamente necesario, nunca más bajo, así que el invariante que
// importa (nada deja de verse) se sigue cumpliendo.
FixedSizeShapeOverlay.prototype.SizeInPixels = function (zoom) {
	var metersPerPixel = METERS_PER_PIXEL_AT_ZOOM_0 / Math.pow(2, zoom);
	return this.fixedSize / metersPerPixel;
};

// Diámetro del punto en modo mínimo garantizado. Entre SMALL_ZOOM_FLOOR y
// SMALL_ZOOM_THRESHOLD interpola linealmente; fuera de ese rango queda en
// uno de los dos extremos.
FixedSizeShapeOverlay.prototype.ResolveDotDiameter = function (zoom) {
	if (zoom >= SMALL_ZOOM_THRESHOLD) {
		return MINIMUM_SIZE_IN_PIXELS;
	} else if (zoom <= SMALL_ZOOM_FLOOR) {
		return SMALLEST_SIZE_IN_PIXELS;
	} else {
		var fraction = (zoom - SMALL_ZOOM_FLOOR) / (SMALL_ZOOM_THRESHOLD - SMALL_ZOOM_FLOOR);
		return SMALLEST_SIZE_IN_PIXELS + fraction * (MINIMUM_SIZE_IN_PIXELS - SMALLEST_SIZE_IN_PIXELS);
	}
};

FixedSizeShapeOverlay.prototype.createShapesLayer = function () {
	var loc = this;
	var fillColors = this.applyOpacity(this.fillColors, this.opacity);
	return new PolygonLayer({
		id: 'fixed-shape-layer' + new Date().getTime(),
		data: this.data,
		pickable: true,
		autoHighlight: true,
		filled: true,
		stroked: true,
		getPolygon: function (dataElement) {
			return loc.CreatePolygon(dataElement.Lon, dataElement.Lat);
		},
		getFillColor: function (dataElement) {
			return fillColors[dataElement.LID];
		},
		getLineColor: [255, 255, 255],
		lineWidthUnits: 'pixels',
		getLineWidth: 0.5,
		onHover: this.delegates.mouseover,
		onClick: this.delegates.click,
		onError: function (error) {
			console.log(error.message);
		},
	});
};

FixedSizeShapeOverlay.prototype.createDotsLayer = function () {
	var fillColors = this.applyOpacity(this.fillColors, this.opacity);
	return new ScatterplotLayer({
		id: 'fixed-shape-dots-layer' + new Date().getTime(),
		data: this.data,
		pickable: true,
		autoHighlight: true,
		filled: true,
		stroked: false,
		radiusUnits: 'pixels',
		getRadius: this.ResolveDotDiameter(this.zoom) / 2,
		getPosition: function (dataElement) {
			return [dataElement.Lon, dataElement.Lat];
		},
		getFillColor: function (dataElement) {
			return fillColors[dataElement.LID];
		},
		onHover: this.delegates.mouseover,
		onClick: this.delegates.click,
		onError: function (error) {
			console.log(error.message);
		},
	});
};

FixedSizeShapeOverlay.prototype.applyOpacity = function (fillColors, opacity) {
	var alpha = Math.round(opacity * 255);
	var ret = {};
	for (var labelId in fillColors) {
		var rgb = fillColors[labelId];
		ret[labelId] = [rgb[0], rgb[1], rgb[2], alpha];
	}
	return ret;
};

FixedSizeShapeOverlay.prototype.ParseFillColors = function (colorMap) {
	var fillColors = {};
	for (var labelId in colorMap) {
		fillColors[labelId] = color.ParseColorParts(colorMap[labelId]);
	}
	return fillColors;
};

// Devuelve los vértices como desplazamientos [este, norte] en metros
// respecto del punto.
FixedSizeShapeOverlay.prototype.CreateShapeOffsets = function (frameType, size) {
	if (frameType === 'B') {
		return this.createSquareOffsets(size);
	} else if (frameType === 'C') {
		return this.createRegularPolygonOffsets(CIRCLE_SEGMENTS, size / 2);
	} else if (frameType === 'H') {
		// Con un vértice en el ángulo 0 los lados superior e inferior quedan
		// horizontales, y la altura (distancia entre ellos) es √3 veces el radio.
		return this.createRegularPolygonOffsets(6, size / Math.sqrt(3));
	} else {
		throw new Error('El marco "' + frameType + '" no admite tamaño fijo en metros.');
	}
};

FixedSizeShapeOverlay.prototype.createSquareOffsets = function (size) {
	var half = size / 2;
	return [[-half, -half], [half, -half], [half, half], [-half, half]];
};

FixedSizeShapeOverlay.prototype.createRegularPolygonOffsets = function (vertexCount, radius) {
	var offsets = [];
	for (var i = 0; i < vertexCount; i++) {
		var angle = 2 * Math.PI * i / vertexCount;
		offsets.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
	}
	return offsets;
};

// Aproximación local plana: válida para figuras de hasta algunos kilómetros.
// Al estar en grados, la proyección Mercator conserva la forma de la figura.
FixedSizeShapeOverlay.prototype.CreatePolygon = function (lon, lat) {
	var metersPerDegreeOfLongitude = METERS_PER_DEGREE_OF_LATITUDE * Math.cos(lat * Math.PI / 180);
	var rotation = this.CalculateGridRotation(lon, lat);
	var polygon = [];
	for (var offset of this.shapeOffsets) {
		var rotatedOffset = this.RotateOffset(offset, rotation);
		polygon.push([lon + rotatedOffset[0] / metersPerDegreeOfLongitude, lat + rotatedOffset[1] / METERS_PER_DEGREE_OF_LATITUDE]);
	}
	return polygon;
};

// Ángulo, en radianes y sentido antihorario, que hay que rotar una figura
// dibujada en ejes este/norte verdaderos para que su orientación coincida
// con la de la grilla de origen en ese punto. Se calcula a partir del
// meridiano central que declara Marker.SourceCentralMeridian (el de la faja
// Gauss-Krüger o el huso UTM en que se generó la grilla, en grados), con la
// aproximación de primer orden de la convergencia de meridianos de una
// Transversa de Mercator, válida a la escala de un partido. Sin ese dato no
// hay corrección posible: la figura se dibuja sin rotar, como hasta ahora.
FixedSizeShapeOverlay.prototype.CalculateGridRotation = function (lon, lat) {
	if (this.sourceCentralMeridian === null || this.sourceCentralMeridian === undefined) {
		return 0;
	}
	var longitudeDeltaFromCentralMeridian = (this.sourceCentralMeridian - lon) * Math.PI / 180;
	return longitudeDeltaFromCentralMeridian * Math.sin(lat * Math.PI / 180);
};

FixedSizeShapeOverlay.prototype.RotateOffset = function (offset, rotation) {
	var east = offset[0];
	var north = offset[1];
	return [
		east * Math.cos(rotation) - north * Math.sin(rotation),
		east * Math.sin(rotation) + north * Math.cos(rotation),
	];
};
