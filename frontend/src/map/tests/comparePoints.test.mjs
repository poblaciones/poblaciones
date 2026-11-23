import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable, mountLite } from './fixtures.mjs';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';
import MetricVariables from '@/map/components/widgets/summary/metricVariables.vue';

// Indicador con dos series, cada una con un nivel agregado y un nivel de ubicaciones.
function makeAggregateLevel(shortName) {
	return makeLevel({
		Name: 'Departamentos',
		ShortName: shortName,
		Variables: [makeVariable({ Name: 'N', Comparable: true })],
	});
}

function makeLocationsLevel(comparable) {
	return makeLevel({
		Name: 'Ubicaciones',
		ShortName: 'Ubicaciones',
		MinZoom: 12,
		Dataset: { Type: 'L', AreSegments: false, ShowInfo: true, Marker: null, Id: 1 },
		Variables: [makeVariable({ Name: '', IsSimpleCount: true, Comparable: comparable })],
	});
}

function makeComparableMetric(locationsAreComparable) {
	setupWindow();
	window.Use.UseCompareSeries = true;
	const versions = [];
	for (let n = 0; n < 2; n++) {
		versions.push(makeVersion({
			Levels: [makeAggregateLevel('Departamentos'), makeLocationsLevel(locationsAreComparable)],
		}));
	}
	const metric = new ActiveSelectedMetric(makeMetricProperties({
		Comparable: true,
		SelectedVersionIndex: 1,
		Versions: versions,
	}));
	metric.Compare.SelectedVersionIndex = 0;
	return metric;
}

function selectBottomLevel(metric) {
	metric.SetLevel(metric.BottomLevel());
}

describe('Comparación: emparejamiento de niveles');

it('los niveles estándar se emparejan por nombre', () => {
	const metric = makeComparableMetric(true);
	const level = makeAggregateLevel('Departamentos');
	expect(metric.Compare.LevelsMatch(level, makeAggregateLevel('Departamentos'))).toBeTruthy();
	expect(metric.Compare.LevelsMatch(level, makeAggregateLevel('Provincias'))).toBeFalsy();
});

it('las ubicaciones se emparejan por tipo, aunque cambie su nombre', () => {
	const metric = makeComparableMetric(true);
	const level = makeLocationsLevel(true);
	const other = makeLocationsLevel(true);
	other.ShortName = 'Escuelas';
	expect(metric.Compare.LevelsMatch(level, other)).toBeTruthy();
	expect(metric.Compare.LevelsMatch(level, makeAggregateLevel('Ubicaciones'))).toBeFalsy();
});

it('el nivel de comparación de las ubicaciones es el de ubicaciones de la otra serie', () => {
	const metric = makeComparableMetric(true);
	selectBottomLevel(metric);
	expect(metric.Compare.SelectedLevel()).toBe(metric.properties.Versions[0].Levels[1]);
});

describe('Comparación: ubicaciones aparte');

it('con variables comparables, el nivel de ubicaciones se puede comparar', () => {
	const metric = makeComparableMetric(true);
	selectBottomLevel(metric);
	expect(metric.SelectedLevelCanBeCompared()).toBeTruthy();
});

it('sin variables comparables, el nivel de ubicaciones no se puede comparar', () => {
	const metric = makeComparableMetric(false);
	selectBottomLevel(metric);
	expect(metric.SelectedLevelCanBeCompared()).toBeFalsy();
});

it('el nivel agregado sigue pudiéndose comparar', () => {
	const metric = makeComparableMetric(false);
	expect(metric.SelectedLevelCanBeCompared()).toBeTruthy();
});

it('con la comparación activa, el bloque de ubicaciones oculta las variables no comparables', () => {
	const metric = makeComparableMetric(true);
	const level = metric.BottomLevel();
	level.Variables.push(makeVariable({ Name: 'Otra', Comparable: false }));
	metric.Compare.Active = true;
	const block = mountLite(MetricVariables, { props: { metric: metric, fixedLevel: level } });
	expect(block.showsVariable(level.Variables[0])).toBeTruthy();
	expect(block.showsVariable(level.Variables[1])).toBeFalsy();
});

it('sin variables comparables en las ubicaciones, el bloque las ofrece todas', () => {
	const metric = makeComparableMetric(false);
	metric.Compare.Active = true;
	const level = metric.BottomLevel();
	const block = mountLite(MetricVariables, { props: { metric: metric, fixedLevel: level } });
	expect(block.showsVariable(level.Variables[0])).toBeTruthy();
});

it('la leyenda de variables ocultas solo corresponde al bloque del nivel elegido', () => {
	const metric = makeComparableMetric(true);
	selectBottomLevel(metric);
	const locations = mountLite(MetricVariables, { props: { metric: metric, fixedLevel: metric.BottomLevel() } });
	const aggregates = mountLite(MetricVariables, { props: { metric: metric } });
	expect(locations.ownsSelectedLevel).toBeTruthy();
	expect(aggregates.ownsSelectedLevel).toBeFalsy();
});

describe('Comparación: datos de las capas de puntos');

it('sin comparar, los datos se piden a GetMetricData sin nivel de comparación', () => {
	const metric = makeComparableMetric(true);
	selectBottomLevel(metric);
	const url = metric.GetMetricDataService();
	expect(url.path).toBe('/services/frontend/metrics/GetMetricData');
	expect(url.params.p === undefined).toBeTruthy();
});

it('comparando, los datos se piden a GetMetricDataCompare con el nivel de la otra serie', () => {
	const metric = makeComparableMetric(true);
	selectBottomLevel(metric);
	metric.Compare.Active = true;
	const url = metric.GetMetricDataService();
	expect(url.path).toBe('/services/frontend/metrics/GetMetricDataCompare');
	expect(url.params.p).toBe(metric.properties.Versions[0].Levels[1].Id);
});

it('comparando un nivel que no se puede comparar, se piden los datos simples', () => {
	const metric = makeComparableMetric(false);
	selectBottomLevel(metric);
	metric.Compare.Active = true;
	expect(metric.GetMetricDataService().path).toBe('/services/frontend/metrics/GetMetricData');
});

it('el pedido comparado no reutiliza la caché del pedido simple', () => {
	const metric = makeComparableMetric(true);
	selectBottomLevel(metric);
	const simple = JSON.stringify(metric.GetMetricDataService().params);
	metric.Compare.Active = true;
	expect(JSON.stringify(metric.GetMetricDataService().params) === simple).toBeFalsy();
});

it('comparando, el filtrado por categorías mira las de variación y no las de la variable', () => {
	const metric = makeComparableMetric(true);
	selectBottomLevel(metric);
	const variable = metric.SelectedVariable();
	variable.ValueLabels[0].Visible = false;
	expect(metric.IsFiltering()).toBeTruthy();
	metric.Compare.Active = true;
	expect(metric.IsFiltering()).toBeFalsy();
});
