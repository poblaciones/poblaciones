/**
 * ActiveRoute — serialización del estado de la pivot en la query de la ruta.
 *
 * Cuelga de la pivot como `pivot.Router` y conoce a su pivot, así que sus
 * métodos no la reciben por parámetro: `pivot.Router.sections()`, `.query()`,
 * `.tableUrl(basePath)`. La interpretación de una query externa ocurre antes de
 * tener estado (en el arranque del tablero), por eso es estática:
 * `ActiveRoute.parseQuery(query)`.
 *
 * Esquema en la query: #/view?c=<col>*<col>&r=<raíz>&x=<entrada>*<entrada>&p=<lugar>*<lugar>&s=<lugar>&o=<key>!a|d
 *
 *   Columna (indicador):
 *     <metricId>!v<vIdx>[,<vIdx2>...]!l<levelIdx>!a<variableIdx>!s<summary>[!c<sel>]
 *     <sel>: bloques '<versionIdx>=<labelId>,...,t' separados por '~' ('t' = Total).
 *     Si se omite '!c', el default es solo Total por cada versión activa.
 *
 *   Árbol de filas (ver ActiveRowTree.ToSection):
 *     r=<boundaryId>[!i<fid>,<fid>...]     raíz y, si está restringida, sus elementos
 *     x=<path>[!o][!i<fid>,...]            una entrada por elemento desplegado o tipo
 *                                          de hijo abierto/restringido. El path une
 *                                          con '.' ids de elemento y de delimitación
 *                                          alternados: impar = elemento, par = nivel.
 *
 *   Lugares (los arma el visor al saltar a la tabla; no se vuelven a escribir):
 *     p=<fid>[,<fidAncestro>...]*...       cada lugar se muestra como selección; los
 *                                          ancestros son alternativas si el elemento
 *                                          no está en ninguna delimitación.
 *     s=<fid>[,<fidAncestro>...]           lugar sugerido (vista actual del visor).
 *
 *   Orden:
 *     o=<columnKey>!a (asc) | o=<columnKey>!d (desc)
 */

// ── Composición ──────────────────────────────────────────────────────────────

function composeSelection(selectionByVersion) {
	var blocks = [];
	var versionIds = Object.keys(selectionByVersion);
	for (var i = 0; i < versionIds.length; i++) {
		var sel = selectionByVersion[versionIds[i]];
		var items = [];
		var labels = sel.labels || [];
		for (var j = 0; j < labels.length; j++) items.push(String(labels[j]));
		if (sel.includeTotal !== false) items.push('t');
		blocks.push(versionIds[i] + '=' + items.join(','));
	}
	return blocks.join('~');
}

// Default = todas las versiones con solo Total y ninguna categoría; en ese caso
// se omite el bloque 'c' de la query.
function isDefaultSelection(selectionByVersion) {
	var versionIds = Object.keys(selectionByVersion);
	if (versionIds.length === 0) return true;
	for (var i = 0; i < versionIds.length; i++) {
		var sel = selectionByVersion[versionIds[i]];
		if (sel.labels && sel.labels.length > 0) return false;
		if (sel.includeTotal === false) return false;
	}
	return true;
}

function composeColumn(col) {
	// metric por Id; versión (lista de índices), nivel y variable por índice. Se
	// omiten los defaults (nivel/variable en 0) para acortar, igual que el visor.
	var parts = [String(col.id)];
	if (col.versionIndexes && col.versionIndexes.length) parts.push('v' + col.versionIndexes.join(','));
	if (col.levelIndex != null && col.levelIndex !== 0) parts.push('l' + col.levelIndex);
	if (col.variableIndex != null && col.variableIndex !== 0) parts.push('a' + col.variableIndex);
	if (col.summary && col.summary !== 'N') parts.push('s' + col.summary);
	if (col.selection && !isDefaultSelection(col.selection)) {
		parts.push('c' + composeSelection(col.selection));
	}
	return parts.join('!');
}

function composeRoot(tree) {
	var text = String(tree.root);
	if (tree.checked && tree.checked.length) {
		text += '!i' + tree.checked.join(',');
	}
	return text;
}

function composeEntry(entry) {
	var text = entry.path.join('.');
	var isLevel = entry.path.length % 2 === 0;
	if (isLevel && entry.open) {
		text += '!o';
	}
	if (isLevel && entry.checked && entry.checked.length) {
		text += '!i' + entry.checked.join(',');
	}
	return text;
}

function composeEntries(entries) {
	var tokens = [];
	for (var i = 0; i < entries.length; i++) {
		tokens.push(composeEntry(entries[i]));
	}
	return tokens.join('*');
}

function joinSection(list, composer) {
	var out = [];
	for (var i = 0; i < list.length; i++) out.push(composer(list[i]));
	// '*' no requiere codificación en la URL (a diferencia de ';', que el navegador
	// escapa a %3B); con varias columnas o delimitaciones, ahorra ruido visible.
	return out.join('*');
}

// ── Parseo ───────────────────────────────────────────────────────────────────

function toIntOrRaw(value) {
	var n = parseInt(value, 10);
	return (String(n) === value) ? n : value;
}

function parseSelection(raw) {
	var out = {};
	var blocks = raw.split('~').filter(Boolean);
	for (var i = 0; i < blocks.length; i++) {
		var eq = blocks[i].indexOf('=');
		if (eq >= 0) {
			var vId = toIntOrRaw(blocks[i].slice(0, eq));
			var items = blocks[i].slice(eq + 1).split(',').filter(Boolean);
			var labels = [];
			var includeTotal = false;
			for (var j = 0; j < items.length; j++) {
				if (items[j] === 't') includeTotal = true;
				else labels.push(toIntOrRaw(items[j]));
			}
			out[vId] = { labels: labels, includeTotal: includeTotal };
		}
	}
	return out;
}

function parseColumn(token) {
	var parts = token.split('!');
	var col = { id: toIntOrRaw(parts[0]), versionIndexes: [], levelIndex: 0, variableIndex: 0, selection: null };
	for (var i = 1; i < parts.length; i++) {
		var p = parts[i];
		if (p) {
			var tail = p.slice(1);
			if (p[0] === 'v') col.versionIndexes = tail.split(',').filter(Boolean).map(toIntOrRaw);
			else if (p[0] === 'l') col.levelIndex = toIntOrRaw(tail);
			else if (p[0] === 'a') col.variableIndex = toIntOrRaw(tail);
			else if (p[0] === 's') col.summary = tail;
			else if (p[0] === 'c') col.selection = parseSelection(tail);
		}
	}
	return col;
}

function parseIdList(text) {
	var ids = [];
	var parts = String(text).split(',');
	for (var i = 0; i < parts.length; i++) {
		if (parts[i] !== '') {
			ids.push(toIntOrRaw(parts[i]));
		}
	}
	return ids;
}

function parseRoot(token) {
	var parts = String(token).split('!');
	var tree = { root: toIntOrRaw(parts[0]), checked: null, entries: [] };
	for (var i = 1; i < parts.length; i++) {
		if (parts[i][0] === 'i') {
			tree.checked = parseIdList(parts[i].slice(1));
		}
	}
	return tree;
}

function parseEntry(token) {
	var parts = token.split('!');
	var entry = { path: parseIdList(parts[0].split('.').join(',')), open: false, checked: null };
	for (var i = 1; i < parts.length; i++) {
		if (parts[i] === 'o') {
			entry.open = true;
		} else if (parts[i][0] === 'i') {
			entry.checked = parseIdList(parts[i].slice(1));
		}
	}
	return entry;
}

function parseList(raw, parser) {
	var out = [];
	var tokens = String(raw).split('*').filter(Boolean);
	for (var i = 0; i < tokens.length; i++) out.push(parser(tokens[i]));
	return out;
}

// ── ActiveRoute ──────────────────────────────────────────────────────────────

function ActiveRoute(pivot) {
	this.pivot = pivot;
}

ActiveRoute.prototype.sections = function () {
	var pivot = this.pivot;
	var sections = { columns: [], tree: null, places: [], suggestion: null };
	if (!pivot) return sections;

	for (var m = 0; m < pivot.Metrics.length; m++) {
		sections.columns.push(this._columnSection(pivot.Metrics[m]));
	}
	sections.tree = pivot.RowTree.ToSection();
	if (pivot.RowTree.suggestion) {
		sections.suggestion = pivot.RowTree.suggestion.fids;
	}

	if (pivot.MetricTuples.sortKey != null && pivot.MetricTuples.sortDirection !== 0) {
		sections.order = String(pivot.MetricTuples.sortKey) + '!' + (pivot.MetricTuples.sortDirection === 1 ? 'a' : 'd');
	}
	return sections;
};

// Serializa la columna desde las Selections del indicador. Cada Selection es un
// censo con su nivel y variable; el formato de URL conserva versionIds + un
// level/variable de referencia (la primera Selection) + la selección por censo.
ActiveRoute.prototype._columnSection = function (metric) {
	var props = metric.properties;
	var selections = metric.Selections || [];
	var allVersions = props.Versions || [];

	// Índice de un censo dentro de properties.Versions (su posición, como el visor).
	function versionIndexOf(version) { return allVersions.indexOf(version); }

	// Versiones seleccionadas por ÍNDICE (posición), y la selección de categorías
	// indexada por ese mismo índice. Todo posicional, igual que el visor; el metric
	// es lo único por Id. Como los datos publicados no cambian, los índices son
	// estables y la ruta queda más corta.
	var versionIndexes = [];
	var selection = {};
	for (var i = 0; i < selections.length; i++) {
		var sel = selections[i];
		var vIdx = versionIndexOf(sel.version);
		if (vIdx < 0) continue;
		versionIndexes.push(vIdx);
		selection[vIdx] = {
			labels: (sel.labels || []).slice(),
			includeTotal: sel.includeTotal !== false
		};
	}

	var first = selections[0] || null;
	var levelIndex = null, variableIndex = null;
	if (first) {
		var li = first.version.Levels.indexOf(first.level);
		levelIndex = (li >= 0) ? li : null;
		var ai = first.level.Variables.indexOf(first.variable);
		variableIndex = (ai >= 0) ? ai : null;
	}
	return {
		id: props.Metric.Id,
		versionIndexes: versionIndexes,
		levelIndex: levelIndex,
		variableIndex: variableIndex,
		summary: props.SummaryMetric || null,
		selection: selection
	};
};

ActiveRoute.prototype.query = function () {
	return ActiveRoute.composeQuery(this.sections());
};

ActiveRoute.prototype.tableUrl = function (basePath) {
	return ActiveRoute.tableUrl(this.sections(), basePath);
};

// Delega en la pivot, que es la dueña de su mutación.
ActiveRoute.prototype.restore = function (sections) {
	return this.pivot.RestoreFromSections(sections);
};

// ── Transformaciones puras query <-> sections ────────────────────────────────

ActiveRoute.composeQuery = function (sections) {
	sections = sections || {};
	var query = {};
	if (sections.columns && sections.columns.length) query.c = joinSection(sections.columns, composeColumn);
	if (sections.tree) {
		query.r = composeRoot(sections.tree);
		if (sections.tree.entries && sections.tree.entries.length) query.x = composeEntries(sections.tree.entries);
	}
	if (sections.places && sections.places.length) {
		var places = [];
		for (var p = 0; p < sections.places.length; p++) places.push(sections.places[p].join(','));
		query.p = places.join('*');
	}
	if (sections.suggestion && sections.suggestion.length) query.s = sections.suggestion.join(',');
	if (sections.order) query.o = sections.order;
	return query;
};

// Variante sin instancia, para consumidores que arman las secciones por su
// cuenta (p. ej. el mapa, que abre la tabla con window.open).
ActiveRoute.tableUrl = function (sections, basePath) {
	var base = basePath || (window.location.origin + window.location.pathname);
	var query = ActiveRoute.composeQuery(sections);
	var parts = [];
	var keys = Object.keys(query);
	for (var i = 0; i < keys.length; i++) {
		parts.push(keys[i] + '=' + encodeURIComponent(query[keys[i]]));
	}
	var qs = parts.length ? ('?' + parts.join('&')) : '';
	return base + '#/view' + qs;
};

ActiveRoute.parseQuery = function (query) {
	var result = { columns: [], tree: null, places: [], suggestion: null };
	if (!query) return result;
	if (query.c) result.columns = parseList(query.c, parseColumn);
	if (query.r) {
		result.tree = parseRoot(query.r);
		if (query.x) result.tree.entries = parseList(query.x, parseEntry);
	}
	if (query.p) result.places = parseList(query.p, parseIdList);
	if (query.s) result.suggestion = parseIdList(query.s);
	if (query.o) {
		// La columnKey puede contener '!', así que se separa por el último.
		var raw = String(query.o);
		var idx = raw.lastIndexOf('!');
		if (idx > 0) {
			result.order = { key: raw.slice(0, idx), dir: (raw.slice(idx + 1) === 'a' ? 1 : -1) };
		}
	}
	return result;
};

// ¿La ruta trae estado de la pivot (indicadores, filas o lugares)?
ActiveRoute.hasContent = function (sections) {
	return !!((sections.columns && sections.columns.length) || sections.tree ||
		(sections.places && sections.places.length) || (sections.suggestion && sections.suggestion.length));
};

export default ActiveRoute;
