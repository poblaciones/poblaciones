import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable, makeValueLabel, makeBoundaryProperties, makeBoundaryVersion, makeBoundaryValueLabel, mountLite } from './fixtures.mjs';
import ActiveMetric from '@/map/classes/ActiveMetric';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import MapLegend from '@/map/components/widgets/map/mapLegend.vue';

// Caracterización de la lógica de mapLegend (sin template ni DOM): qué
// indicadores entran en la leyenda, cuándo se muestra el nombre de la
// variable y qué categorías quedan visibles.

function makeVisibleMetric(overrides) {
	setupWindow();
	const properties = makeMetricProperties(overrides);
	const metric = new ActiveMetric(properties);
	metric.index = 0;
	metric.isBoundary = false;
	metric.isBaseMetric = false;
	return metric;
}

function mountLegend(metrics, collapsed, isMobile) {
	return mountLite(MapLegend, { isMobile: isMobile, props: { metrics: metrics, toolbarStates: { collapsed: collapsed, legendMinimized: false } } });
}

describe('mapLegend: qué indicadores entran en la leyenda');

it('incluye un indicador estándar visible', () => {
	const metric = makeVisibleMetric();
	const legend = mountLegend([metric], true);
	expect(legend.visibleMetrics).toEqual([metric]);
});

it('incluye boundaries (ahora con soporte de leyenda propio); excluye capas base y métricas apagadas', () => {
	const metric = makeVisibleMetric();
	const boundary = makeVisibleMetric();
	boundary.isBoundary = true;
	const base = makeVisibleMetric();
	base.isBaseMetric = true;
	const off = makeVisibleMetric();
	off.properties.Visible = false;
	const legend = mountLegend([metric, boundary, base, off], true);
	expect(legend.visibleMetrics).toEqual([metric, boundary]);
});

describe('mapLegend: visibilidad general del panel');

it('solo se muestra con el panel de estadísticas colapsado y con algo para mostrar', () => {
	const metric = makeVisibleMetric();
	expect(mountLegend([metric], true).visible).toBeTruthy();
	expect(mountLegend([metric], false).visible).toBeFalsy();
	expect(mountLegend([], true).visible).toBeFalsy();
});

describe('mapLegend: nombre de la variable');

it('se omite con una única variable de conteo simple sin nombre', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeLevel({ Variables: [makeVariable({ Name: '', IsSimpleCount: true, ValueLabels: [makeValueLabel()] })] })] })],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	const legend = mountLegend([metric], true);
	expect(legend.showVariableName(metric)).toBeFalsy();
});

it('se muestra cuando hay más de una variable o la variable tiene nombre', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeLevel({ Variables: [makeVariable({ Name: 'Población' })] })] })],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	const legend = mountLegend([metric], true);
	expect(legend.showVariableName(metric)).toBeTruthy();
});

describe('mapLegend: categorías (visibles u ocultas por el usuario, pero solo si tienen datos)');

it('lista tanto las categorías visibles como las ocultas por el usuario, si tienen datos', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({
				Variables: [makeVariable({
					ValueLabels: [makeValueLabel({ Name: 'Alta' }), makeValueLabel({ Name: 'Baja', Visible: false })],
				})],
			})],
		})],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	const legend = mountLegend([metric], true);
	const labels = legend.allLabels(metric);
	expect(labels).toHaveLength(2);
	expect(labels[1].Name).toBe('Baja');
});

it('con ShowEmptyCategories en false, recorta las categorías sin datos en el encuadre actual (igual que metricValues.vue)', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({
				Variables: [makeVariable({
					ShowEmptyCategories: false,
					ValueLabels: [
						makeValueLabel({ Name: 'Alto NBI', Values: { Count: '' } }),
						makeValueLabel({ Name: 'Bajo NBI', Values: { Count: '3' } }),
					],
				})],
			})],
		})],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	const legend = mountLegend([metric], true);
	const labels = legend.allLabels(metric);
	expect(labels).toHaveLength(1);
	expect(labels[0].Name).toBe('Bajo NBI');
});

it('con ShowEmptyCategories en true, mantiene las categorías sin datos', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({
				Variables: [makeVariable({
					ShowEmptyCategories: true,
					ValueLabels: [makeValueLabel({ Name: 'Alto NBI', Values: { Count: '' } })],
				})],
			})],
		})],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	const legend = mountLegend([metric], true);
	expect(legend.allLabels(metric)).toHaveLength(1);
});

it('con comparación activa, ShowEmptyCategories deja de aplicar (igual que metricValues.vue)', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({
				Variables: [makeVariable({
					ShowEmptyCategories: true,
					ValueLabels: [makeValueLabel({ Name: 'Alto NBI', Values: { Count: '' } })],
				})],
			})],
		})],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	metric.Compare.Active = true;
	const legend = mountLegend([metric], true);
	expect(legend.allLabels(metric)).toHaveLength(0);
});

it('sin Values (summary aún no llegó), no se lista', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({
				Variables: [makeVariable({
					ValueLabels: [makeValueLabel({ Name: 'Alta', Values: null })],
				})],
			})],
		})],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	const legend = mountLegend([metric], true);
	expect(legend.allLabels(metric)).toHaveLength(0);
});

it('en comparación activa, sigue el mismo criterio que el panel de estadísticas (ComparableValueLabels)', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({
				Variables: [makeVariable({
					ValueLabels: [makeValueLabel({ Name: 'Sin comparar' })],
					ComparableValueLabels: [makeValueLabel({ Name: 'Comparable' })],
				})],
			})],
		})],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	metric.Compare.Active = true;
	const legend = mountLegend([metric], true);
	expect(legend.allLabels(metric)[0].Name).toBe('Comparable');
});

it('swatchStyle (metric): usa FillColor, deja el relleno solo si la categoría está visible', () => {
	const legend = mountLegend([], true);
	const metric = makeVisibleMetric();
	const on = makeValueLabel({ FillColor: '#ff0000', Visible: true });
	const off = makeValueLabel({ FillColor: '#00ff00', Visible: false });
	expect(legend.swatchStyle(metric, on)).toBe('background-color: #ff0000; border-color: #ff0000');
	expect(legend.swatchStyle(metric, off)).toBe('background-color: transparent; border-color: #00ff00');
});

it('swatchStyle (boundary): usa LineColor, no FillColor (mismo criterio que boundaryValues.vue)', () => {
	const legend = mountLegend([], true);
	const boundary = makeVisibleMetric();
	boundary.isBoundary = true;
	const on = makeValueLabel({ LineColor: '#3388ff', FillColor: '#a8c8ff', Visible: true });
	expect(legend.swatchStyle(boundary, on)).toBe('background-color: #3388ff; border-color: #3388ff');
});

it('toggleLabel invierte Visible y refresca el mapa, igual que el panel de estadísticas', () => {
	const metric = makeVisibleMetric();
	const label = makeValueLabel({ Visible: true });
	let refreshed = false;
	metric.RefreshMap = function () { refreshed = true; };
	const legend = mountLegend([metric], true);
	legend.toggleLabel(metric, label);
	expect(label.Visible).toBeFalsy();
	expect(refreshed).toBeTruthy();
});

describe('mapLegend: quitar un indicador');

it('removeMetric delega en metric.Remove(), igual que metricDropdown.vue', () => {
	const metric = makeVisibleMetric();
	let removed = false;
	metric.Remove = function () { removed = true; };
	const legend = mountLegend([metric], true);
	legend.removeMetric(metric);
	expect(removed).toBeTruthy();
});

describe('mapLegend: arranque (mounted)');

it('en un dispositivo táctil, marca isTouchDevice', () => {
	setupWindow({ ontouchstart: null });
	const legend = mountLegend([], true);
	MapLegend.mounted.call(legend);
	expect(legend.isTouchDevice).toBeTruthy();
});

it('sin touch ni pantalla chica, arranca expandida', () => {
	setupWindow();
	const legend = mountLegend([], true);
	MapLegend.mounted.call(legend);
	expect(legend.isTouchDevice).toBeFalsy();
	expect(legend.minimized).toBeFalsy();
});

it('en pantalla chica ($isMobile), arranca minimizada', () => {
	setupWindow();
	const legend = mountLegend([], true, true);
	MapLegend.mounted.call(legend);
	expect(legend.minimized).toBeTruthy();
});

it('mounted no depende de window.SegMap (aún no existe al montar la app)', () => {
	setupWindow();
	globalThis.window.SegMap = null;
	const legend = mountLegend([], true, false);
	MapLegend.mounted.call(legend);
	expect(legend.isTouchDevice).toBeFalsy();
});

describe('mapLegend: minimized es el mismo estado que toolbarStates.legendMinimized');

it('lee y escribe sobre toolbarStates.legendMinimized (compartido con clippingLegend)', () => {
	const toolbarStates = { collapsed: true, legendMinimized: false };
	const legend = mountLite(MapLegend, { props: { metrics: [], toolbarStates: toolbarStates } });
	expect(legend.minimized).toBeFalsy();
	legend.minimized = true;
	expect(toolbarStates.legendMinimized).toBeTruthy();
});



describe('mapLegend: alto del cuerpo con scroll, según el panel de work');

it('sin #holder en el DOM, descuenta solo la base fija de 280px', () => {
	setupWindow();
	const legend = mountLegend([], true);
	expect(legend.bodyMaxHeight).toBe('calc(100vh - 280px - 0px)');
});

it('actualiza el offset al medir #holder (updateHolderTopOffset) y suma 40px extra con panel de work', () => {
	setupWindow();
	globalThis.document.getElementById = function () {
		return { getBoundingClientRect() { return { top: 64 }; } };
	};
	const legend = mountLegend([], true);
	legend.updateHolderTopOffset();
	expect(legend.holderTopOffset).toBe(64);
	expect(legend.bodyMaxHeight).toBe('calc(100vh - 280px - 104px)');
});

describe('mapLegend: versión del indicador (mismo dato que el sourceRow de metric.vue)');

it('sin comparación, muestra el año de la versión seleccionada', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Version: { Id: 1, Name: '2010' } }), makeVersion({ Version: { Id: 2, Name: '2022' } })],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	metric.properties.SelectedVersionIndex = 1;
	const legend = mountLegend([metric], true);
	expect(legend.versionLabel(metric)).toBe('2022');
});

it('con comparación activa, muestra la versión de comparación primero y la principal después', () => {
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Version: { Id: 1, Name: '2010' } }), makeVersion({ Version: { Id: 2, Name: '2022' } })],
	});
	setupWindow();
	const metric = new ActiveMetric(properties);
	metric.Compare.Active = true;
	metric.Compare.SelectedVersionIndex = 1;
	const legend = mountLegend([metric], true);
	expect(legend.versionLabel(metric)).toBe('2022-2010');
});

describe('mapLegend: soporte de boundaries (delimitaciones), no solo indicadores');

function makeVisibleBoundary(valueLabels) {
	setupWindow();
	const properties = makeBoundaryProperties({
		Name: 'Gobiernos locales',
		Versions: [makeBoundaryVersion({
			Name: '2022',
			ValueLabels: valueLabels || [
				makeBoundaryValueLabel({ Id: 501, Name: 'Comunas', LineColor: '#3388ff', Values: { ValueId: 501, Value: 300, Km2: 120 } }),
				makeBoundaryValueLabel({ Id: 502, Name: 'Municipios', LineColor: '#ff8833', Values: { ValueId: 502, Value: 150, Km2: 80 } }),
			],
		})],
	});
	const boundary = new ActiveBoundary(properties);
	boundary.index = 1;
	return boundary;
}

it('un boundary visible entra a la leyenda igual que un indicador', () => {
	const boundary = makeVisibleBoundary();
	const legend = mountLegend([boundary], true);
	expect(legend.visibleMetrics).toEqual([boundary]);
});

it('displayName usa properties.Name (boundary), no properties.Metric.Name', () => {
	const boundary = makeVisibleBoundary();
	const legend = mountLegend([boundary], true);
	expect(legend.displayName(boundary)).toBe('Gobiernos locales');
});

it('versionLabel toma Version.Name directo (sin variable ni Compare)', () => {
	const boundary = makeVisibleBoundary();
	const legend = mountLegend([boundary], true);
	expect(legend.versionLabel(boundary)).toBe('2022');
});

it('showVariableName es siempre false para boundary (no hay variable, no hay subtítulo)', () => {
	const boundary = makeVisibleBoundary();
	const legend = mountLegend([boundary], true);
	expect(legend.showVariableName(boundary)).toBeFalsy();
});

it('allLabels usa ActiveBoundary.HasData: solo las categorías con datos', () => {
	const boundary = makeVisibleBoundary([
		makeBoundaryValueLabel({ Id: 501, Name: 'Con datos', Values: { ValueId: 501, Value: 300, Km2: 120 } }),
		makeBoundaryValueLabel({ Id: 502, Name: 'Sin datos', Values: { ValueId: 502, Value: '', Km2: '' } }),
	]);
	const legend = mountLegend([boundary], true);
	const labels = legend.allLabels(boundary);
	expect(labels).toHaveLength(1);
	expect(labels[0].Name).toBe('Con datos');
});

it('isDot es siempre false para boundary (polígonos, nunca círculos)', () => {
	const boundary = makeVisibleBoundary();
	const legend = mountLegend([boundary], true);
	expect(legend.isDot(boundary)).toBeFalsy();
});

it('swatchStyle usa LineColor (no FillColor), mismo criterio que boundaryValues.vue', () => {
	const boundary = makeVisibleBoundary();
	const legend = mountLegend([boundary], true);
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(legend.swatchStyle(boundary, label)).toBe('background-color: #3388ff; border-color: #3388ff');
});

it('toggleLabel llama boundary.UpdateMap() (no RefreshMap, que boundary no tiene)', () => {
	const boundary = makeVisibleBoundary();
	let updated = false;
	boundary.UpdateMap = function () { updated = true; };
	const legend = mountLegend([boundary], true);
	const label = boundary.SelectedVersion().ValueLabels[0];
	legend.toggleLabel(boundary, label);
	expect(label.Visible).toBeFalsy();
	expect(updated).toBeTruthy();
});

it('removeMetric funciona igual: boundary.Remove()', () => {
	const boundary = makeVisibleBoundary();
	let removed = false;
	boundary.Remove = function () { removed = true; };
	const legend = mountLegend([boundary], true);
	legend.removeMetric(boundary);
	expect(removed).toBeTruthy();
});

describe('mapLegend: ícono minimizado, siempre visible con el panel de estadísticas colapsado');

it('no depende de visibleMetrics: sin indicadores ni boundaries, sigue habiendo algo para mostrar (población general en clippingLegend.vue)', () => {
	// El ícono es el control maestro que expande tanto mapLegend.vue como
	// clippingLegend.vue (toolbarStates.legendMinimized compartido). Antes
	// dependía de visibleMetrics.length > 0 (solo indicadores/boundaries),
	// lo que lo dejaba oculto cuando no había ninguno agregado, aun cuando
	// clippingLegend.vue sí tenía algo para mostrar (el resumen de
	// población, siempre presente si hay un work con datos).
	const legend = mountLegend([], true);
	expect(legend.visibleMetrics).toHaveLength(0);
	expect(legend.toolbarStates.collapsed).toBeTruthy();
});
