const Str = require('@/common/framework/str');

module.exports = {
	GetCopyright(isMobile) {
		var div = "<span class='copyright' style='padding: 0px'>";
		var innerHTML = "<span class='copyrightText'>";
		if (window.Embedded && window.Embedded.Active) {
			innerHTML += "<a class='copyrightText' href='https://poblaciones.org/' target='_blank'>";
		}
		innerHTML += " ©";
		if (!isMobile) {
			innerHTML += " 2019-" + (new Date().getFullYear());
		}
		innerHTML += " CONICET / ODSA-UCA</a>";
		if (!isMobile) {
			". <a class='copyrightText exp-hiddable-unset' href='https://poblaciones.org/terminos/' target='_blank'>Términos y Condiciones</a>";
		}
		if (window.Embedded && !window.Embedded.Active && !isMobile) {
			innerHTML += "<a class='copyrightText exp-hiddable-unset' title='Comentarios y sugerencias a Poblaciones' href='https://poblaciones.org/contacto/' target='_blank'><i class='far fa-comments contacto'></i> Contacto</a>";
		}
		innerHTML += "</span>";
		return div + innerHTML + "</span>";
	},

};
