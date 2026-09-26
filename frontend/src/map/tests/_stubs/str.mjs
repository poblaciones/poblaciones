// Stub de @/common/framework/str con las funciones que usan las clases bajo
// prueba. Implementaciones reales mínimas (la lógica testeada depende de que
// funcionen de verdad).
export default {
	Split(s, sep) { return String(s).split(sep); },
	isNumeric(s) { return s !== '' && s !== null && !isNaN(s); },
	Replace(s, from, to) { return String(s).split(from).join(to); },
	StartsWith(s, prefix) { return String(s).startsWith(prefix); },
	EscapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
	Wrap(s) { return s; },
	// Reemplaza el placeholder {id} de pattern por el último segmento de url.
	// Sin pattern, cae a la url tal cual (equivalente simplificado del
	// fallback real, que la califica contra el dominio público).
	PatternUrl(url, pattern) {
		if (!pattern) {
			return url;
		}
		var parts = String(url).split('/');
		var id = parts[parts.length - 1];
		return String(pattern).split('{id}').join(id);
	},
};
