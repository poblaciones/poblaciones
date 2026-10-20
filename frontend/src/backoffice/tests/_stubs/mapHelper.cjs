// Doble del helper del visor: ScaleGenerator solo usa ResolveNormalizationCaption,
// que acá devuelve el texto que el test deja en variable.NormalizationCaptionStub.
module.exports = {
	ResolveNormalizationCaption(variable) {
		if (variable.NormalizationCaptionStub) {
			return variable.NormalizationCaptionStub;
		}
		return '';
	},
};
