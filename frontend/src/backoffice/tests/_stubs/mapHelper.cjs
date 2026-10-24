// Doble del helper del visor. ScaleGenerator usa ResolveNormalizationCaption, que acá
// devuelve el texto que el test deja en variable.NormalizationCaptionStub. ImportPopup
// usa los dos extractores de nombre de archivo, reducidos a su comportamiento básico.
module.exports = {
	extractFileExtension(name) {
		const dot = name.lastIndexOf('.');
		if (dot === -1) {
			return '';
		}
		return name.substring(dot + 1).toLowerCase();
	},

	extractFilename(name) {
		const dot = name.lastIndexOf('.');
		if (dot === -1) {
			return name;
		}
		return name.substring(0, dot);
	},

	ResolveNormalizationCaption(variable) {
		if (variable.NormalizationCaptionStub) {
			return variable.NormalizationCaptionStub;
		}
		return '';
	},
};
