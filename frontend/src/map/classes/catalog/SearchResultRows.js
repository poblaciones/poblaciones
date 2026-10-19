// Filas de resultado del panel de búsqueda para los coincidentes del catálogo.
// Tienen la misma forma que los resultados del servidor (Type, Id, Caption,
// Highlighted, Extra), para activar las mismas acciones al seleccionarlos:
// L = indicador, B = delimitación completa, C = región.

export default SearchResultRows;

function SearchResultRows(tree) {
	this.tree = tree;
}

// Cantidad de filas que muestra una sección al principio, y cuántas suma cada
// "Ver más" (la primera expansión llega a PAGE_SIZE).
SearchResultRows.INITIAL_LIMIT = 5;
SearchResultRows.PAGE_SIZE = 100;

SearchResultRows.NextLimit = function (limit) {
	return limit < SearchResultRows.PAGE_SIZE ? SearchResultRows.PAGE_SIZE : limit + SearchResultRows.PAGE_SIZE;
};

// entries: salida de CatalogSearch.FindItems sobre el catálogo de indicadores.
// `Highlighted` lleva highlighting del título: cuando el match fue por name,
// las palabras del título que coincidieron con el término se envuelven en
// <mark><strong>...</strong></mark>. `Snippet` (solo para matches por keyword)
// anticipa la frase keyword matcheada entre `...`.
SearchResultRows.prototype.Indicators = function (entries) {
	const rows = [];
	for (const entry of entries) {
		const item = entry.item;
		const subtitle = this.tree.ItemSubtitle(item, entry.container);
		rows.push({
			Key: 'L|' + item.Id, Type: 'L', Id: String(item.Id),
			Caption: item.Name,
			Highlighted: this.highlightName(item.Name, entry.nameMatches),
			Extra: subtitle,
			Snippet: entry.keywordMatch ? this.keywordSnippet(entry.keywordMatch, subtitle) : ''
		});
	}
	return rows;
};

// branches / items: salida de CatalogSearch.FindBranches y FindItems sobre el
// catálogo de delimitaciones. De las ramas solo se ofrecen las delimitaciones
// (agregarlas completas al mapa); los agrupadores no son seleccionables.
SearchResultRows.prototype.Regions = function (branches, items) {
	const rows = [];
	for (const entry of branches) {
		if (this.tree.IsDelimitation(entry.branch)) {
			const node = entry.branch;
			rows.push({
				Key: 'B|' + node.Id, Type: 'B', Id: node.Id,
				Caption: node.Name, Highlighted: this.escape(node.Name),
				Extra: this.tree.BranchLabel(node, 'elemento', 'elementos', true)
			});
		}
	}
	for (const entry of items) {
		const item = entry.item;
		const subtitle = this.tree.ItemSubtitle(item, entry.container);
		rows.push({
			Key: 'C|' + item.Id, Type: 'C', Id: String(item.Id),
			Caption: item.Name,
			Highlighted: this.highlightName(item.Name, entry.nameMatches),
			Extra: subtitle || (entry.container.Name || ''),
			Snippet: entry.keywordMatch ? this.keywordSnippet(entry.keywordMatch, subtitle || (entry.container.Name || '')) : ''
		});
	}
	return rows;
};

SearchResultRows.prototype.escape = function (text) {
	return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

// Highlighting del título: para cada palabra del name que matcheó el término,
// envuelve la PALABRA entera en <mark> y el PREFIJO que coincidió con el
// término en <strong> (dentro del <mark>). Así, buscar "ca" sobre "Calidad"
// produce <mark><strong>Ca</strong>lidad</mark>: el <mark> indica "esta palabra
// matcheó" y el <strong> destaca la porción exacta del match.
//
// `nameMatches` es la lista de { normalized, termLen } que devuelve
// CatalogMatcher.NameMatches. Acá se recorre el name palabra por palabra
// (partiendo por separadores no alfanuméricos, conservando los separadores
// para reconstruir el string) y, para cada palabra matcheada, se toman los
// primeros `termLen` chars como prefix (en <strong>) y el resto del token queda
// dentro del <mark> sin strong. Cada parte se escapa por separado para no
// romper el HTML (p. ej. si el prefix contiene un &).
//
// termLen se mide en code units del término normalizado, que coincide con el
// largo del prefijo a resaltar en la palabra original (ver comentario en
// CatalogMatcher.NameMatches sobre por qué la normalización es 1:1 en español).
SearchResultRows.prototype.highlightName = function (name, nameMatches) {
	if (!nameMatches || !nameMatches.length) return this.escape(name);
	// Normaliza igual que CatalogMatcher.Normalize: lower + NFD + strip diacríticos.
	const normalize = function (t) {
		return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	};
	// Map: palabra normalizada -> termLen (largo del término más largo que matcheó).
	const matchMap = {};
	for (let i = 0; i < nameMatches.length; i++) {
		matchMap[nameMatches[i].normalized] = nameMatches[i].termLen;
	}
	// Parte el ORIGINAL (no el escapado) en tokens alfanuméricos y separadores,
	// igual que Words() pero conservando los separadores para reconstruir.
	const parts = String(name).split(/([^a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ]+)/);
	const out = [];
	for (let i = 0; i < parts.length; i++) {
		const token = parts[i];
		if (!token) continue;
		const norm = normalize(token);
		if (/^[a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ]+$/.test(token) && matchMap[norm] != null) {
			const termLen = matchMap[norm];
			const prefix = token.substring(0, termLen);
			const rest = token.substring(termLen);
			out.push('<mark><strong>' + this.escape(prefix) + '</strong>' + this.escape(rest) + '</mark>');
		} else {
			out.push(this.escape(token));
		}
	}
	return out.join('');
};

// Snippet HTML con la keyword matcheada resaltada, para mostrar entre el título
// y el subtítulo cuando el match fue por keyword y no por name. Formato:
//   ..<mark><strong>vil</strong>las</mark> de emergencia.. 2022, 2023
// La palabra matcheada se envuelve en <mark> y, dentro, el PREFIJO que coincidió
// con el término va en <strong> (igual que el highlighting del título): así
// buscar "vil" sobre la keyword "villas" resalta solo "vil". El subtítulo
// (subtitle) se escapa y se concatena al final si está presente. `match.Index`
// es la posición de la palabra dentro de `match.Words` y `match.TermLen` es el
// largo del término que matcheó (ver CatalogMatcher.KeywordMatch). Solo se
// reemplaza esa palabra, sin tocar el resto de la frase. Todo se escapa por
// separado (prefix y resto) para no inyectar HTML desde el backend.
SearchResultRows.prototype.keywordSnippet = function (match, subtitle) {
	if (!match || !match.Phrase) return '';
	const words = match.Words || String(match.Phrase).split(/\s+/);
	const termLen = match.TermLen || 0;
	const out = [];
	for (let i = 0; i < words.length; i++) {
		if (i === match.Index && termLen > 0 && termLen <= words[i].length) {
			const prefix = words[i].substring(0, termLen);
			const rest = words[i].substring(termLen);
			out.push('<mark><strong>' + this.escape(prefix) + '</strong>' + this.escape(rest) + '</mark>');
		} else {
			out.push(this.escape(words[i]));
		}
	}
	const snippet = '..' + out.join(' ') + '..';
	const escapedSubtitle = subtitle ? this.escape(subtitle) : '';
	return escapedSubtitle ? (snippet + ' ' + escapedSubtitle) : snippet;
};
