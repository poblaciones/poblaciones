/**
 * citation.js — cita en estilo APA7 de una publicación (Work) de Poblaciones.
 *
 * Formato objetivo: "<autor> (<año>). <nombre>, Poblaciones. <url>". Se
 * degrada con gracia cuando falta el autor o el año (no deja puntuación
 * huérfana), porque en la práctica Metadata.Authors suele venir vacío.
 *
 * Es un helper puro (sin estado, sin dueño natural) porque lo comparten dos
 * consumidores sin relación de composición entre sí: la exportación de
 * gráficos (ChartExporter, vía DistributionWidget) y la exportación tabular
 * (TabularWriter, base de CsvWriter/XlsxWriter).
 */

// Año: Work.Metadata.Date si está (ya es un año), si no, los primeros 4
// caracteres de Work.Metadata.ReleaseDate ("AAAA-MM-DD..." o "AAAA-MM-DD HH:mm:ss").
function _yearOf(metadata) {
	if (metadata.Date) return String(metadata.Date);
	if (metadata.ReleaseDate) return String(metadata.ReleaseDate).slice(0, 4);
	return '';
}

// Cita de un Work. Devuelve '' si no hay datos suficientes (sin Metadata).
function formatCitation(work) {
	if (!work || !work.Metadata) return '';
	var meta = work.Metadata;
	var author = (meta.Authors || '').trim();
	var year = _yearOf(meta);
	var name = (meta.Name || '').trim();
	var url = work.Url || '';

	var head = author
		? (year ? author + ' (' + year + ').' : author + '.')
		: (year ? '(' + year + ').' : '');
	var parts = [head, name ? (name + ', Poblaciones.') : 'Poblaciones.', url];
	return parts.filter(Boolean).join(' ');
}

// Works distintos (por Id) entre una lista de Selections, en orden de primera
// aparición. Cada Selection expone su censo/edición vía Version() (Selection.js
// real) o, en objetos más livianos de prueba, vía la propiedad .version.
function uniqueWorksFromSelections(selections) {
	var seen = {};
	var out = [];
	(selections || []).forEach(function (sel) {
		var version = (typeof sel.Version === 'function') ? sel.Version() : sel.version;
		var work = version && version.Work;
		if (!work || work.Id == null || seen[work.Id]) return;
		seen[work.Id] = true;
		out.push(work);
	});
	return out;
}

export { formatCitation, uniqueWorksFromSelections };
export default formatCitation;
