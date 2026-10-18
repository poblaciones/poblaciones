// Normalización del texto de búsqueda con la misma configuración que aplica el
// servidor (window.SegMap.Configuration.Search): palabras vacías que se
// descartan y sustituciones de autocompletado.

export default SearchQuery;

// settings: { Stopwords: string[], Autocomplete: { [texto]: reemplazo } }
function SearchQuery(settings) {
	this.stopwords = new Set(settings.Stopwords.map(w => this.normalize(w)));
	this.autocomplete = settings.Autocomplete;
}

SearchQuery.prototype.Resolve = function (text) {
	let query = this.removeStopwords(String(text).trim());
	const keys = Object.keys(this.autocomplete);
	for (const key of keys) {
		query = query.replace(new RegExp(this.escape(key), 'gi'), this.autocomplete[key]);
	}
	return query.trim();
};

// Si todas las palabras son vacías se conserva el texto original, para no
// quedar sin resultados mientras se teclea una palabra que empieza como una
// de ellas.
SearchQuery.prototype.removeStopwords = function (text) {
	const words = text.split(/\s+/);
	const kept = [];
	for (const word of words) {
		if (!this.stopwords.has(this.normalize(word))) kept.push(word);
	}
	return kept.length ? kept.join(' ') : text;
};

SearchQuery.prototype.normalize = function (text) {
	return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

SearchQuery.prototype.escape = function (text) {
	return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
