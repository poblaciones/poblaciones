import h from '@/map/js/helper';

export default TableLink;

// TableLink — traduce el estado del visor a la configuración con la que se abre
// la tabla: los indicadores (versión, nivel, variable y medida, por índice, como
// en la ruta del visor) y la selección traducida a filas:
//   - regiones de recorte: cada una pasa a ser una selección de filas;
//   - un círculo: el lugar de su centro (el de "Selección en ...");
//   - sin selección y con zoom alto: el lugar del centro de la vista se ofrece
//     como sugerencia, sin imponerla.
// Devuelve las secciones en el formato de ActiveRoute (módulo de la tabla), sin
// importarlo: el código de la tabla se carga recién cuando el usuario la pide.
function TableLink(segmentedMap) {
	this.map = segmentedMap;
}

// A partir de este zoom, el centro de la vista se ofrece como sugerencia.
TableLink.SUGGESTION_MIN_ZOOM = 9;

TableLink.prototype.BuildSections = function (metrics) {
	var sections = { columns: this.columnsFor(metrics), places: [], suggestion: null };
	var frame = this.map.frame;
	var pending = Promise.resolve();
	if (frame.ClippingCircle) {
		pending = this.placeAt(frame.ClippingCircle.Center).then(function (place) {
			if (place) {
				sections.places.push(place);
			}
		});
	} else if (frame.ClippingRegionIds && frame.ClippingRegionIds.length) {
		for (var i = 0; i < frame.ClippingRegionIds.length; i++) {
			sections.places.push([frame.ClippingRegionIds[i]]);
		}
	} else if (frame.Zoom >= TableLink.SUGGESTION_MIN_ZOOM) {
		pending = this.placeAt(this.viewCenter()).then(function (place) {
			sections.suggestion = place;
		});
	}
	return pending.then(function () {
		return sections;
	});
};

// Indicadores del visor que la tabla puede mostrar (sin delimitaciones ni capas
// no estándar).
TableLink.TableMetrics = function (metrics) {
	var out = [];
	for (var i = 0; i < metrics.length; i++) {
		var metric = metrics[i];
		if (metric.properties && metric.properties.Metric && !metric.isBoundary) {
			out.push(metric);
		}
	}
	return out;
};

TableLink.prototype.columnsFor = function (metrics) {
	var tableMetrics = TableLink.TableMetrics(metrics);
	var columns = [];
	for (var i = 0; i < tableMetrics.length; i++) {
		columns.push(this.columnFor(tableMetrics[i]));
	}
	return columns;
};

TableLink.prototype.columnFor = function (metric) {
	var level = metric.SelectedLevel();
	var variableIndex = level.SelectedVariableIndex;
	if (variableIndex < 0) {
		variableIndex = 0;
	}
	return {
		id: metric.properties.Metric.Id,
		versionIndexes: [metric.properties.SelectedVersionIndex],
		levelIndex: metric.SelectedLevelIndex(),
		variableIndex: variableIndex,
		summary: metric.properties.SummaryMetric || null,
		selection: null
	};
};

TableLink.prototype.viewCenter = function () {
	var envelope = this.map.frame.Envelope;
	return { Lat: (envelope.Min.Lat + envelope.Max.Lat) / 2, Lon: (envelope.Min.Lon + envelope.Max.Lon) / 2 };
};

// Lugar que contiene el punto, como lista [id, ancestros...]: la tabla usa el
// primero que encuentre entre sus delimitaciones. null si no hay ninguno.
TableLink.prototype.placeAt = function (coordinate) {
	var url = h.resolveMultiUrl(this.map.Configuration.StaticServer, '/services/frontend/clipping/GetRegionItemByLocation');
	var params = { params: { c: h.trimNumberCoords(coordinate.Lat) + ',' + h.trimNumberCoords(coordinate.Lon) } };
	return this.map.Get(url, params, true).then(function (res) {
		if (!res.data) {
			return null;
		}
		return [res.data.Id].concat(res.data.Ancestors || []);
	});
};

// Ruta del tablero a partir de la del visor: /map/<work>/ → /table/<work>/.
TableLink.prototype.tableBasePath = function () {
	var path = window.location.pathname;
	if (path.indexOf('/map/') !== -1) {
		path = path.replace('/map/', '/table/');
	} else if (path.indexOf('/map') !== -1) {
		path = path.replace('/map', '/table');
	} else {
		path = '/table/';
	}
	return window.location.origin + h.ensureFinalBar(path);
};
