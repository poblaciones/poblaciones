/**
 * pivotRoute.js — serialización de columnas (indicadores), filas y filtros
 * (delimitaciones) de la tabla en la QUERY de la ruta, y su restitución.
 *
 * El router de la tabla tiene rutas fijas (/view) y un catch-all que redirige,
 * así que el estado NO puede ir en el path (rompe en loop). Va en la query:
 *   #/view?c=<col>;<col>&r=<row>;<row>&f=<flt>;<flt>
 *
 * Cada entrada empieza por un id y lleva atributos separados por '!':
 *   columna (indicador): <metricId>!v<versionId>!l<levelId>!a<variableId>!s<summary>
 *   fila (delimitación):  <boundaryId>!w                 (delimitación completa)
 *                          <boundaryId>!i<itemId>,<itemId>,...  (por items, FID)
 *   filtro (delimitación): <boundaryId>!i<itemId>,<itemId>,...
 */

// ── Composición ───────────────────────────────────────────────────────────────

function composeColumn(col) {
	var parts = [String(col.id)];
	if (col.versionId != null) parts.push('v' + col.versionId);
	if (col.levelId != null) parts.push('l' + col.levelId);
	if (col.variableId != null) parts.push('a' + col.variableId);
	if (col.summary) parts.push('s' + col.summary);
	return parts.join('!');
}

function composeBoundary(entry) {
	var parts = [String(entry.id)];
	if (entry.whole) {
		parts.push('w');
	} else if (entry.items && entry.items.length) {
		parts.push('i' + entry.items.join(','));
	}
	return parts.join('!');
}

// Devuelve un objeto de query { c, r, f } (solo las claves con contenido),
// apto para router.replace({ query }).
export function ComposeQuery(sections) {
	sections = sections || {};
	var query = {};
	if (sections.columns && sections.columns.length) {
		query.c = sections.columns.map(composeColumn).join(';');
	}
	if (sections.rows && sections.rows.length) {
		query.r = sections.rows.map(composeBoundary).join(';');
	}
	if (sections.filters && sections.filters.length) {
		query.f = sections.filters.map(composeBoundary).join(';');
	}
	return query;
}

// URL completa para abrir la tabla desde otra app (p. ej. el mapa) con window.open.
// basePath: origen + path donde está montada la tabla (sin hash).
export function ComposeTableUrl(sections, basePath) {
	var base = basePath || (window.location.origin + window.location.pathname);
	var query = ComposeQuery(sections);
	var parts = [];
	Object.keys(query).forEach(function (k) { parts.push(k + '=' + query[k]); });
	var qs = parts.length ? ('?' + parts.join('&')) : '';
	return base + '#/view' + qs;
}

// ── Parseo ──────────────────────────────────────────────────────────────────

function parseColumn(token) {
	var parts = token.split('!');
	var col = { id: toIntOrRaw(parts[0]) };
	for (var i = 1; i < parts.length; i++) {
		var p = parts[i];
		if (p[0] === 'v') col.versionId = toIntOrRaw(p.slice(1));
		else if (p[0] === 'l') col.levelId = toIntOrRaw(p.slice(1));
		else if (p[0] === 'a') col.variableId = toIntOrRaw(p.slice(1));
		else if (p[0] === 's') col.summary = p.slice(1);
	}
	return col;
}

function parseBoundary(token) {
	var parts = token.split('!');
	var entry = { id: toIntOrRaw(parts[0]), whole: false, items: [] };
	for (var i = 1; i < parts.length; i++) {
		var p = parts[i];
		if (p === 'w') entry.whole = true;
		else if (p[0] === 'i') entry.items = p.slice(1).split(',').filter(Boolean).map(toIntOrRaw);
	}
	return entry;
}

function toIntOrRaw(value) {
	var n = parseInt(value, 10);
	return (String(n) === value) ? n : value;
}

// Interpreta el objeto query de $route (o un objeto plano { c, r, f }).
export function ParseQuery(query) {
	var result = { columns: [], rows: [], filters: [] };
	if (!query) return result;
	if (query.c) result.columns = String(query.c).split(';').filter(Boolean).map(parseColumn);
	if (query.r) result.rows = String(query.r).split(';').filter(Boolean).map(parseBoundary);
	if (query.f) result.filters = String(query.f).split(';').filter(Boolean).map(parseBoundary);
	return result;
}

// ── Estado actual del pivot -> secciones serializables ───────────────────────
export function SectionsFromPivot(pivot) {
	var sections = { columns: [], rows: [], filters: [] };
	if (!pivot) return sections;

	for (var metric of pivot.Metrics) {
		var version = metric.SelectedVersion ? metric.SelectedVersion() : null;
		var level = metric.SelectedLevel ? metric.SelectedLevel() : null;
		var variable = metric.SelectedVariable ? metric.SelectedVariable() : null;
		sections.columns.push({
			id: metric.properties.Metric.Id,
			versionId: version && version.Version ? version.Version.Id : null,
			levelId: level ? level.Id : null,
			variableId: variable ? variable.Id : null,
			summary: metric.properties.SummaryMetric || null
		});
	}

	function boundaryEntry(boundary) {
		if (boundary.__whole) return { id: boundary.__boundaryId, whole: true };
		var selection = boundary.SelectedVersion ? boundary.SelectedVersion().Selection : null;
		var items = selection && selection.Items ? selection.Items.map(function (it) { return it.FID; }) : [];
		return { id: boundary.__boundaryId, whole: false, items: items };
	}

	sections.rows = pivot.Boundaries.map(boundaryEntry);
	sections.filters = pivot.Filters.map(boundaryEntry);
	return sections;
}

export default { ComposeQuery, ComposeTableUrl, ParseQuery, SectionsFromPivot };
