/* Stub mínimo de @/map/js/helper para tests: solo lo que ActiveDataset.js usa
   (ResolveNormalizationCaption, para la unidad normalizadora en incidencia, p. ej.
   "/ km²"). Replica el criterio real: NormalizationScale=100 es '%' (sin caption
   extra); otros valores devuelven una leyenda de la escala. */
function ResolveNormalizationCaption(variable, short) {
	if (!variable) return '';
	if (variable.IsGap) return '';
	switch (variable.NormalizationScale) {
		case 100: return '%';
		case 1: return short ? '/1' : 'por habitante';
		case 1000: return '/k';
		case 10000: return '/10k';
		case 100000: return '/100k';
		case 1000000: return '/1M';
	}
	return variable.NormalizationLabel || '';
}

export default { ResolveNormalizationCaption };
export { ResolveNormalizationCaption };
