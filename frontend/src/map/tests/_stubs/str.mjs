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
};
