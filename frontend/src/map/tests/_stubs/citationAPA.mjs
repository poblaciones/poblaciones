// Stub de @/common/js/citationAPA: arma un string simple, suficiente para
// que los tests que no verifican el formato exacto de la cita puedan
// ejercitar el resto del componente sin la implementación real.
export default {
	onlineMapCitation(authors, year, name, url, plainText) {
		var ret = (authors || '') + ' (' + (year || '') + '). ' + (name || '') + '.';
		if (url) {
			ret += ' ' + url;
		}
		return ret;
	},
};
