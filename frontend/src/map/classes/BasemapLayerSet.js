export default BasemapLayerSet;

const TYPE_RASTER = 'R';
const TYPE_METRIC = 'M';
const TYPE_BOUNDARY = 'B';
const TYPE_LABELS = 'L';

const DEFAULT_RASTER_OPACITY = 50;

// Capas base del panel «Detalles del mapa» tal como las informa el servidor
// (Configuration.BasemapLayers), pasadas a su forma de ejecución: cada una suma
// el estado Visible y, en indicadores y delimitaciones, `layers` (capas activas,
// que se piden recién al encenderlas por primera vez).
function BasemapLayerSet() {
};

BasemapLayerSet.TYPE_RASTER = TYPE_RASTER;
BasemapLayerSet.TYPE_METRIC = TYPE_METRIC;
BasemapLayerSet.TYPE_BOUNDARY = TYPE_BOUNDARY;
BasemapLayerSet.TYPE_LABELS = TYPE_LABELS;

BasemapLayerSet.Build = function (configLayers) {
	var ret = [];
	if (!configLayers) {
		return ret;
	}
	for (var configLayer of configLayers) {
		var layer = Object.assign({}, configLayer);
		layer.Visible = BasemapLayerSet.IsActiveByDefault(layer);
		layer.layers = null;
		layer.loadPromise = null;
		ret.push(layer);
	}
	return ret;
};

// Etiquetas es la única capa activa si el servidor no informa lo contrario
// (también en cartografías anteriores a la parametrización).
BasemapLayerSet.IsActiveByDefault = function (layer) {
	return layer.Type === TYPE_LABELS;
};

BasemapLayerSet.IsLoadable = function (layer) {
	return layer.Type === TYPE_METRIC || layer.Type === TYPE_BOUNDARY;
};

BasemapLayerSet.GetLoadable = function (layers) {
	var ret = [];
	for (var layer of layers) {
		if (BasemapLayerSet.IsLoadable(layer)) {
			ret.push(layer);
		}
	}
	return ret;
};

BasemapLayerSet.GetByType = function (layers, type) {
	var ret = [];
	for (var layer of layers) {
		if (layer.Type === type) {
			ret.push(layer);
		}
	}
	return ret;
};

BasemapLayerSet.GetById = function (layers, id) {
	for (var layer of layers) {
		if (layer.Id === id) {
			return layer;
		}
	}
	return null;
};

BasemapLayerSet.GetByRouteTag = function (layers, tag) {
	for (var layer of layers) {
		if (layer.RouteTag === tag) {
			return layer;
		}
	}
	return null;
};

// Estado inicial pedido por el servidor para cada capa (lista de {Id, StartActive}).
// Sin lista, o para capas que no figuran en ella, rige el valor por defecto de su tipo.
BasemapLayerSet.GetStartActive = function (layer, startLayers) {
	if (startLayers) {
		for (var start of startLayers) {
			if (start.Id === layer.Id) {
				return start.StartActive;
			}
		}
	}
	return BasemapLayerSet.IsActiveByDefault(layer);
};

BasemapLayerSet.GetRasterOptions = function (layer) {
	var raster = layer.Raster;
	var opacity = DEFAULT_RASTER_OPACITY;
	if (raster.Opacity !== null && raster.Opacity !== undefined) {
		opacity = raster.Opacity;
	}
	var options = { tms: raster.Tms };
	if (raster.MaxNativeZoom !== null && raster.MaxNativeZoom !== undefined) {
		options.maxNativeZoom = raster.MaxNativeZoom;
	}
	if (raster.MaxZoom !== null && raster.MaxZoom !== undefined) {
		options.maxZoom = raster.MaxZoom;
	}
	return { Url: raster.Url, Options: options, Opacity: opacity / 100 };
};
