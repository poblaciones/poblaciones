import L from 'leaflet';
import { MaplibreGL } from '@maplibre/maplibre-gl-leaflet';

export default BasemapLayers;

// Nombres de ciudades, provincias y demás unidades administrativas: los dibuja el sistema.
// Agregar 'boundary' para ocultar también las líneas de límites.
const HIDDEN_SOURCE_LAYERS = ['place'];

// SetBaseMap quita y vuelve a agregar las capas. El contenedor y el estado de zoom de la capa
// original sobreviven a onRemove, y al reagregarla quedaban con la posición de cuando se la quitó.
var BasemapGL = MaplibreGL.extend({
	onAdd: function (map) {
		this._container = null;
		this._zooming = false;
		MaplibreGL.prototype.onAdd.call(this, map);
	}
});

function BasemapLayers(basemapUrls, basemapAttributions) {
	this.basemapUrls = basemapUrls;
	this.basemapAttributions = basemapAttributions;
};

BasemapLayers.VARIANT_WITH_LABELS = 'labels';
BasemapLayers.VARIANT_WITHOUT_LABELS = 'noLabels';
BasemapLayers.VARIANT_ONLY_LABELS = 'onlyLabels';

// La variante solo se aplica a los mapas vectoriales.
BasemapLayers.prototype.CreateLayer = function (name, vectorVariant) {
	var url = this.basemapUrls[name];
	var attribution = this.basemapAttributions[name];
	// Una URL con {z} es una plantilla de teselas raster; cualquier otra es el estilo JSON de un mapa vectorial.
	var isRasterBasemap = url.indexOf('{z}') >= 0;
	if (isRasterBasemap) {
		return this.createRasterLayer(url, attribution);
	}
	return this.createVectorLayer(url, vectorVariant, attribution);
};

BasemapLayers.prototype.createRasterLayer = function (tileUrlTemplate, attribution) {
	return new L.TileLayer(tileUrlTemplate, { attribution: attribution });
};

BasemapLayers.prototype.createVectorLayer = function (styleUrl, variant, attribution) {
	var loc = this;
	var layer = new BasemapGL({ zIndex: 0, attributionControl: { customAttribution: attribution } });

	// MapLibre destruye su mapa al quitar la capa, por eso el estilo se aplica en cada alta.
	// La variante se resuelve antes de que se creen las capas, para que no haya destello de etiquetas.
	layer.on('add', function () {
		layer.getContainer().style.zIndex = layer.options.zIndex;
		layer.getMaplibreMap().setStyle(styleUrl, {
			diff: false,
			transformStyle: function (previousStyle, fetchedStyle) {
				return loc.buildStyleVariant(fetchedStyle, variant);
			}
		});
	});

	// Misma interfaz que L.TileLayer: CreateBaseLayers la invoca sin distinguir el tipo de capa.
	layer.setZIndex = function (zIndex) {
		layer.options.zIndex = zIndex;
		if (layer.getContainer()) {
			layer.getContainer().style.zIndex = zIndex;
		}
	};

	return layer;
};

BasemapLayers.prototype.buildStyleVariant = function (style, variant) {
	var keptLayers = [];
	for (var layer of style.layers) {
		if (this.isLayerKept(layer, variant)) {
			keptLayers.push(layer);
		}
	}
	return Object.assign({}, style, { layers: keptLayers });
};

BasemapLayers.prototype.isLayerKept = function (layer, variant) {
	if (HIDDEN_SOURCE_LAYERS.includes(layer['source-layer'])) {
		return false;
	}
	if (variant === BasemapLayers.VARIANT_WITH_LABELS) {
		return true;
	}
	if (variant === BasemapLayers.VARIANT_WITHOUT_LABELS) {
		return layer.type !== 'symbol';
	}
	if (variant === BasemapLayers.VARIANT_ONLY_LABELS) {
		return layer.type === 'symbol';
	}
	throw new Error('Variante de mapa base desconocida: ' + variant);
};
