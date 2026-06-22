/**
 * widgetKinds.js — catálogo de los tipos de exploración que la pivot puede
 * disparar hacia el dashboard. Cada uno define su etiqueta, el ícono (Font
 * Awesome, ya disponible en la app) y un tamaño inicial sugerido en la grilla.
 *
 * Los kinds son las cuatro familias de exploración acordadas:
 *   summary      → estadísticos descriptivos
 *   distribution → histograma / densidad / box / violín
 *   relations    → correlación 1xN / NxN, regresión, scatter
 *   clusters     → agrupamientos (k-means, jerárquico, segmentación)
 *
 * El kind 'table' es la propia pivot (fuente), incluida acá para que el
 * dashboard pueda tratar todos los widgets de forma uniforme.
 */

export var WIDGET_KINDS = {
	table: {
		key: 'table',
		label: 'Tabla',
		icon: 'fas fa-table',
		w: 12, h: 18,
		analysis: false
	},
	summary: {
		key: 'summary',
		label: 'Resumen',
		icon: 'fas fa-list-ul',
		w: 5, h: 8,
		panelW: 5,
		analysis: true
	},
	distribution: {
		key: 'distribution',
		label: 'Distribución',
		icon: 'fas fa-chart-bar',
		w: 4, h: 8,
		panelW: 4,
		analysis: true
	},
	relations: {
		key: 'relations',
		label: 'Relaciones',
		icon: 'fas fa-calculator',
		w: 5, h: 9,
		panelW: 5,
		analysis: true
	},
	clusters: {
		key: 'clusters',
		label: 'Agrupamientos',
		icon: 'fas fa-object-group',
		w: 5, h: 9,
		panelW: 5,
		analysis: true
	}
};

// Lista de los kinds de análisis (los que la pivot ofrece crear), en orden.
export var ANALYSIS_KINDS = ['summary', 'distribution', 'relations', 'clusters']
	.map(function (k) { return WIDGET_KINDS[k]; });

export function kindInfo(kind) {
	return WIDGET_KINDS[kind] || null;
}

export default { WIDGET_KINDS: WIDGET_KINDS, ANALYSIS_KINDS: ANALYSIS_KINDS, kindInfo: kindInfo };
