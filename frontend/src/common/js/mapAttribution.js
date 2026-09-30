const Str = require('@/common/framework/str');

module.exports = {
	GetCopyright() {
		var div = "<span class='copyright' style='padding: 0px'>";
		var innerHTML = "<span class='copyrightText'>";
		if (window.Embedded && window.Embedded.Active) {
			innerHTML += "<a class='copyrightText' href='https://poblaciones.org/' target='_blank'>";
		}
		innerHTML += "Poblaciones © 2019-" + (new Date().getFullYear()) + " CONICET / ODSA - UCA</a>. " +
			"<a class='copyrightText exp-hiddable-unset' href='https://poblaciones.org/terminos/' target='_blank'>Términos y Condiciones</a>. ";
		if (window.Embedded && !window.Embedded.Active) {
			innerHTML += "<a class='copyrightText exp-hiddable-unset' title='Comentarios y sugerencias a Poblaciones' href='https://poblaciones.org/contacto/' target='_blank'><i class='far fa-comments contacto'></i> Contacto</a>";
		}
		innerHTML += "</span>";
		return div + innerHTML + "</span>";
	},

	GetBasemapCopyright() {
		var link = "<a class='copyrightText' target='_blank' href='";
		return "<span class='copyright' style='padding: 0px'><span class='copyrightText'>" +
			link + "https://openfreemap.org'>OpenFreeMap</a> " +
			link + "https://www.openmaptiles.org/'>© OpenMapTiles</a> " +
			"Datos de " + link + "https://www.openstreetmap.org/copyright'>OpenStreetMap</a>" +
			"</span></span>";
	}
};
