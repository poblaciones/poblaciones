// Coincidencia de un término de búsqueda contra el nombre y las palabras clave
// de los ítems del catálogo. Las palabras de cada ítem se normalizan una sola
// vez y se conservan mientras no cambien Name ni Keywords.

export default CatalogMatcher;

const WORD_SEPARATOR = /[^a-z0-9]+/;

function CatalogMatcher() {
	this.index = new WeakMap();
}

// Resultado de MatchItem: el término se resolvió con el nombre solo (o por
// código exacto) / necesitó las palabras clave.
CatalogMatcher.MATCH_NAME = 2;
CatalogMatcher.MATCH_KEYWORDS = 1;

// Comparación insensible a mayúsculas y tildes.
CatalogMatcher.prototype.Normalize = function (text) {
	return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

CatalogMatcher.prototype.Words = function (text) {
	const parts = this.Normalize(text).split(WORD_SEPARATOR);
	const words = [];
	for (let n = 0; n < parts.length; n++) {
		if (parts[n]) words.push(parts[n]);
	}
	return words;
};

// Término listo para comparar: texto recortado (para el código exacto) y sus
// palabras normalizadas.
CatalogMatcher.prototype.Prepare = function (text) {
	const raw = String(text).trim();
	return { Raw: raw, Words: this.Words(raw) };
};

// Coincide si cada palabra del término es el inicio de alguna palabra de
// `name`, como un AND entre las palabras del término: "niv edu" matchea
// "Nivel educativo" en cualquier orden. "tan" matchea "Tandil" pero no
// "Catamarca": no se busca en mitad de palabra.
CatalogMatcher.prototype.MatchesWordStart = function (name, text) {
	return this.startsAll(this.Words(name), this.Words(text));
};

CatalogMatcher.prototype.MatchBranch = function (branch, query) {
	return this.startsAll(this.Words(branch.Name || ''), query.Words);
};

// 0 si no coincide. Las palabras del término pueden caer indistintamente en el
// nombre o en las palabras clave (Keywords, separadas por comas). El código
// (Code) coincide solo si es idéntico al texto escrito, para no traer ruido al
// teclear dígitos.
CatalogMatcher.prototype.MatchItem = function (item, query) {
	const code = item.Code != null ? String(item.Code) : '';
	if (code !== '' && code === query.Raw) return CatalogMatcher.MATCH_NAME;
	const entry = this.entryOf(item);
	if (this.startsAll(entry.nameWords, query.Words)) return CatalogMatcher.MATCH_NAME;
	if (this.startsAll(entry.allWords, query.Words)) return CatalogMatcher.MATCH_KEYWORDS;
	return 0;
};

CatalogMatcher.prototype.startsAll = function (words, termWords) {
	if (!termWords.length) return false;
	for (let t = 0; t < termWords.length; t++) {
		let found = false;
		for (let w = 0; w < words.length && !found; w++) {
			found = words[w].indexOf(termWords[t]) === 0;
		}
		if (!found) return false;
	}
	return true;
};

CatalogMatcher.prototype.entryOf = function (item) {
	const name = item.Name || '';
	const keywords = item.Keywords || '';
	let entry = this.index.get(item);
	if (!entry || entry.name !== name || entry.keywords !== keywords) {
		entry = {
			name: name,
			keywords: keywords,
			nameWords: this.Words(name),
			allWords: this.Words(name + ' ' + keywords)
		};
		this.index.set(item, entry);
	}
	return entry;
};
