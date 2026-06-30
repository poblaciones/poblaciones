/*
 * MapUrlBuilder.js — construye la URL del visor de mapa (/map/#/...) a partir del
 * estado de la tabla, para el botón "Abrir mapa" de los encabezados de fila.
 *
 * No reutiliza los routers del visor (viven en otro bundle), pero replica su
 * formato de serialización. La URL se compone de bloques, cada uno en su propio
 * segmento separado por '/':
 *
 *   /@<lat>,<lon>,<zoom>z&<clipping>   ← frame + clipping (mismo segmento; el
 *                                         clipping arranca con '&')
 *   /l=<metric>;<metric>;...           ← indicadores y delimitaciones (SelectedInfo)
 *   /j=r<id>                           ← zoom a un elemento (ZoomFeature)
 *
 * Reglas de serialización (de SaveRoute.appendValue):
 *   - item [id]            → "id"            (solo el id, sin letra)
 *   - item [key, value]    → "key"+"value"
 *   - item [key, val, def] → se OMITE si val === def; si no, "key"+"val"
 *   - items unidos por itemSeparator '!'; grupos por groupSeparator ';'.
 *
 * El builder no muta nada del visor: solo lee el modelo de la tabla y arma texto.
 */

export default MapUrlBuilder;

function MapUrlBuilder(pivot, opts) {
	this.pivot = pivot;
	opts = opts || {};
	// Origen y ruta base. Por defecto se deriva de la ubicación actual cambiando
	// '/table/' por '/map/'; se puede inyectar para pruebas.
	this.origin = opts.origin || (typeof window !== 'undefined' ? window.location.origin : '');
	this.basePath = opts.basePath || this._deriveBasePath();
}

// Ruta base del visor a partir de la de la tabla, cambiando '/table/' por '/map/'.
MapUrlBuilder.prototype._deriveBasePath = function () {
	var path = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '/table/';
	if (path.indexOf('/table/') !== -1) {
		path = path.replace('/table/', '/map/');
	} else if (path.indexOf('/table') !== -1) {
		path = path.replace('/table', '/map');
	}
	return path;
};

// Serializa un item [id] | [key,value] | [key,value,default] como en el visor.
MapUrlBuilder.prototype._appendValue = function (val) {
	if (!Array.isArray(val)) return '' + val;
	if (val.length === 3 && val[1] === val[2]) return '';
	if (val.length === 1) return '' + val[0];
	if (val.length === 2 || val.length === 3) return '' + val[0] + val[1];
	return '';
};

// Une una lista de items con el separador, saltando los que quedan vacíos
// (omitidos por coincidir con su default).
MapUrlBuilder.prototype._joinItems = function (items, sep) {
	var out = '';
	for (var i = 0; i < items.length; i++) {
		var piece = this._appendValue(items[i]);
		if (!piece) continue;
		if (out.length > 0) out += sep;
		out += piece;
	}
	return out;
};

// ── Índices posicionales (lo que el visor serializa) ────────────────────────

// Índice de la versión (censo) dentro de properties.Versions del indicador.
MapUrlBuilder.prototype._versionIndex = function (metric, versionId) {
	var versions = metric.properties.Versions || [];
	for (var i = 0; i < versions.length; i++) {
		if (versions[i].Version && versions[i].Version.Id === versionId) return i;
	}
	return 0;
};

// La selección (censo) más reciente del indicador: el visor admite una sola, así
// que se elige la última de las activas (la de Id de versión más alto suele ser la
// más nueva; si el modelo ya las ordena, se toma la última).
MapUrlBuilder.prototype._latestSelection = function (metric) {
	var sels = metric.Selections || [];
	if (!sels.length) return null;
	var best = sels[0];
	var bestIdx = this._versionIndex(metric, best.versionId());
	for (var i = 1; i < sels.length; i++) {
		var idx = this._versionIndex(metric, sels[i].versionId());
		if (idx > bestIdx) { best = sels[i]; bestIdx = idx; }
	}
	return best;
};

MapUrlBuilder.prototype._levelIndex = function (version, level) {
	var levels = (version && version.Levels) || [];
	for (var i = 0; i < levels.length; i++) {
		if (levels[i] === level || (level && levels[i].Id === level.Id)) return i;
	}
	return 0;
};

MapUrlBuilder.prototype._variableIndex = function (level, variable) {
	var vars = (level && level.Variables) || [];
	for (var i = 0; i < vars.length; i++) {
		if (vars[i] === variable || (variable && vars[i].Id === variable.Id)) return i;
	}
	return 0;
};

// ── Bloque de indicadores (SelectedInfo, signature 'l=') ────────────────────

// Grupo de un indicador: id + versión + nivel + variable + estado de variables.
// Toma la selección más reciente (el visor no admite multi-censo).
MapUrlBuilder.prototype._metricGroup = function (metric) {
	var sel = this._latestSelection(metric);
	if (!sel) return null;
	var versionIdx = this._versionIndex(metric, sel.versionId());
	var level = sel.level;
	var levelIdx = this._levelIndex(sel.version, level);
	var variableIdx = this._variableIndex(level, sel.variable);

	var items = [];
	items.push([metric.properties.Metric.Id]);          // id (sin letra)
	items.push(['v', versionIdx, -1]);                   // índice de versión
	items.push(['a', levelIdx, 0]);                      // índice de nivel
	items.push(['i', variableIdx, 0]);                   // índice de variable
	items.push(['m', metric.properties.SummaryMetric, 'N']);
	return this._joinItems(items, '!');
};

// Grupo de una delimitación (boundary) como capa del mapa.
MapUrlBuilder.prototype._boundaryGroup = function (boundaryId, versionIndex) {
	var items = [];
	items.push([boundaryId]);          // id
	items.push(['t', 'b']);            // tipo boundary
	items.push(['a', (versionIndex == null ? 0 : versionIndex), 0]);
	return this._joinItems(items, '!');
};

// Bloque completo de indicadores. Recibe grupos extra (p. ej. un boundary a
// agregar) que se anexan a los metrics activos.
MapUrlBuilder.prototype._selectedInfoBlock = function (extraGroups) {
	var groups = [];
	var metrics = (this.pivot && this.pivot.Metrics) || [];
	for (var i = 0; i < metrics.length; i++) {
		var g = this._metricGroup(metrics[i]);
		if (g) groups.push(g);
	}
	if (extraGroups) {
		for (var e = 0; e < extraGroups.length; e++) {
			if (extraGroups[e]) groups.push(extraGroups[e]);
		}
	}
	if (!groups.length) return '';
	return 'l=' + groups.join(';');
};

// ── Bloque de clipping (signature '&') ──────────────────────────────────────

// Recorte por una o varias regiones (ids). Opcionalmente un nivel de clipping.
MapUrlBuilder.prototype._clippingBlock = function (regionIds, levelRevision) {
	if ((!regionIds || !regionIds.length) && !levelRevision) return '';
	var items = [];
	items.push(['l', levelRevision || '', '']);
	if (regionIds && regionIds.length) items.push(['r', regionIds.join(',')]);
	var body = this._joinItems(items, '!');
	return body ? '&' + body : '';
};

// ── Bloque de zoom a un elemento (signature 'j=') ───────────────────────────

MapUrlBuilder.prototype._zoomBlock = function (regionId) {
	if (regionId == null) return '';
	return 'j=r' + regionId;
};

// ── Filtros de la tabla → regiones de recorte ───────────────────────────────

// Ids de los elementos de filtro activos (FilterSet), para usarlos como recorte.
MapUrlBuilder.prototype._filterRegionIds = function () {
	var ids = [];
	var fs = this.pivot && this.pivot.FilterSet;
	if (!fs || !fs.items) return ids;
	for (var b = 0; b < fs.items.length; b++) {
		var version = fs.items[b].SelectedVersion ? fs.items[b].SelectedVersion() : null;
		var region = version && version.Selection ? version.Selection : null;
		var items = region && region.Items ? region.Items : [];
		for (var i = 0; i < items.length; i++) {
			if (items[i].FID != null) ids.push(items[i].FID);
		}
	}
	return ids;
};

MapUrlBuilder.prototype._hasFilters = function () {
	return this._filterRegionIds().length > 0;
};

// ── API pública ─────────────────────────────────────────────────────────────

// Construye la URL para abrir el mapa según el encabezado de fila clickeado.
// target describe qué se clickeó:
//   { kind: 'boundaryType', boundaryId, versionIndex }   ← fila de un tipo (Provincias)
//   { kind: 'item', regionId }                            ← un elemento concreto
//   { kind: 'group', regionId }                           ← un corte de control (= item)
MapUrlBuilder.prototype.build = function (target) {
	target = target || {};
	var segments = [];

	var filterIds = this._filterRegionIds();
	var hasFilters = filterIds.length > 0;

	var extraBoundaryGroups = null;
	var clippingIds = null;
	var zoomId = null;

	if (target.kind === 'boundaryType' && target.boundaryId != null) {
		// Clic en un tipo de delimitación: se agrega como capa de boundary.
		extraBoundaryGroups = [this._boundaryGroup(target.boundaryId, target.versionIndex)];
		if (hasFilters) clippingIds = filterIds;
	} else if (target.kind === 'item' || target.kind === 'group') {
		// Clic en un elemento o corte de control: con filtros, zoom; sin filtros,
		// recorte en ese elemento.
		if (hasFilters) {
			clippingIds = filterIds;
			zoomId = target.regionId;
		} else {
			clippingIds = (target.regionId != null) ? [target.regionId] : null;
		}
	} else {
		// Sin target específico: solo el estado actual (filtros como recorte).
		if (hasFilters) clippingIds = filterIds;
	}

	// Bloque frame+clipping. El frame (centro/zoom) lo resuelve el visor solo si no
	// se especifica, así que se emite únicamente el clipping cuando corresponde.
	var clipping = this._clippingBlock(clippingIds, null);
	if (clipping) segments.push(clipping);

	var info = this._selectedInfoBlock(extraBoundaryGroups);
	if (info) segments.push(info);

	var zoom = this._zoomBlock(zoomId);
	if (zoom) segments.push(zoom);

	var hash = '#';
	for (var s = 0; s < segments.length; s++) hash += '/' + segments[s];
	return this.origin + this.basePath + hash;
};
