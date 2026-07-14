/**
 * percentScale.js — techo de escala para ejes en puntos porcentuales.
 *
 * Fijar el eje siempre en 100% es la pauta general (compara bien entre charts,
 * y no confunde con un techo relativo), pero deja el chart vacío cuando todos
 * los valores reales son chicos (p. ej. 1 a 3%). Este helper agranda el techo
 * en tramos previsibles según el máximo observado, en vez de autoescalar libre
 * (que perdería la referencia de "esto está sobre 100") o de fijar 100 siempre.
 *
 * Es un helper puro (sin estado, sin dueño natural) porque lo comparten
 * componentes de widgets distintos (Distribución y Relaciones) que no tienen
 * una relación de composición entre sí.
 */

// Tramos de techo según el máximo real observado (en puntos porcentuales).
// Por debajo de cada corte, el techo correspondiente dispersa mejor valores
// chicos que forzar siempre 100.
function percentScaleMax(observedMax) {
	if (observedMax == null || !isFinite(observedMax)) return 100;
	if (observedMax < 0.5) return 1;
	if (observedMax <= 1) return 5;
	if (observedMax <= 10) return 25;
	if (observedMax <= 25) return 50;
	return 100;
}

export default percentScaleMax;
export { percentScaleMax };
