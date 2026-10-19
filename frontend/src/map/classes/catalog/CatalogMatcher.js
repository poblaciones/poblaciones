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

// Cuando el match fue por keywords (MatchItem devolvió MATCH_KEYWORDS),
// localiza la frase de Keywords en la que cayó el match para poder mostrarla
// como anticipo del match. Devuelve { Phrase, Index, Words } o null si no hay
// coincidencia por keyword:
//   · Phrase: la keyword completa tal como figura en el item (p. ej.
//     "villas de emergencia"), recortada de espacios.
//   · Words: la misma frase partida en palabras limpias (alfanuméricas,
//     conservando mayúsculas y acentos), alineadas con la normalización que
//     usa MatchItem para comparar.
//   · Index: posición (0-based) de la palabra matcheada dentro de Words, para
//     poder resaltarla en el snippet.
//
// La búsqueda respeta la misma heurística que MatchItem: cada palabra del
// término debe ser prefijo de alguna palabra de la frase (matches por inicio,
// no por subcadena), y se recorre keyword por keyword (comas) para no mezclar
// frases. Con un término de varias palabras ("vil emerg"), se devuelve la
// primera keyword donde alguna palabra del término matcheó.
CatalogMatcher.prototype.KeywordMatch = function (item, query) {
	if (!query || !query.Words || !query.Words.length) return null;
	const keywords = item.Keywords || '';
	if (!keywords) return null;
	const phrases = keywords.split(',').map(s => s.trim()).filter(function (s) { return s.length; });
	for (const phrase of phrases) {
		// Mismo separador que Words() pero conservando mayúsculas y
		// acentos: así el snippet muestra la frase tal como la envió el
		// backend, y a la vez las palabras normalizadas coinciden con
		// las que MatchItem usó para decidir el match.
		const rawWords = String(phrase).split(/[^a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ]+/).filter(function (w) { return w.length; });
		const normWords = rawWords.map(w => this.Normalize(w));
		for (const termWord of query.Words) {
			for (let i = 0; i < normWords.length; i++) {
				if (normWords[i].indexOf(termWord) === 0) {
					return { Phrase: phrase, Index: i, Words: rawWords };
				}
			}
		}
	}
	return null;
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
