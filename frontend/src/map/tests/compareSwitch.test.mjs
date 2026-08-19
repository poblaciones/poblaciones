import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable, mountLite } from './fixtures.mjs';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';
import Metric from '@/map/components/widgets/summary/metric.vue';

// Al activar la comparación, la lista de variables se reduce a las
// comparables (matchesComparableFilter). Ofrecerla con una variable activa
// que no lo es la haría desaparecer de la lista, dejando el indicador sin
// nada seleccionado.

function armar(comparableActiva) {
	setupWindow();
	window.Use.UseCompareSeries = true;
	const nivel = function () {
		return makeLevel({
			Variables: [
				makeVariable({ Name: 'Población total', Comparable: true }),
				makeVariable({ Name: 'Población de 65 y más', Comparable: false }),
			],
		});
	};
	const metric = new ActiveSelectedMetric(makeMetricProperties({
		Comparable: true,
		Versions: [makeVersion({ Levels: [nivel()] }), makeVersion({ Levels: [nivel()] })],
	}));
	metric.SelectedLevel().SelectedVariableIndex = (comparableActiva ? 0 : 1);
	return metric;
}

function mountPanel(metric) {
	return mountLite(Metric, { props: { metric: metric, metrics: [metric], clipping: {} } });
}

describe('Switch de comparar series');

it('se ofrece con una variable activa comparable', () => {
	const metric = armar(true);
	expect(mountPanel(metric).hasComparableVariables).toBeTruthy();
});

it('no se ofrece si la variable activa no tiene otras series comparables', () => {
	const metric = armar(false);
	expect(metric.SelectedVariable().Comparable).toBeFalsy();
	// El nivel sí tiene alguna comparable: por eso no alcanza con mirar el nivel.
	expect(metric.hasComparableVariables()).toBeTruthy();
	expect(mountPanel(metric).hasComparableVariables).toBeFalsy();
});

it('con la comparación ya activa sigue disponible, para poder apagarla', () => {
	const metric = armar(false);
	metric.Compare.Active = true;
	expect(mountPanel(metric).hasComparableVariables).toBeTruthy();
});

it('no se ofrece si el indicador entero no es comparable', () => {
	const metric = armar(true);
	metric.properties.Comparable = false;
	expect(metric.canCompareSelectedVariable()).toBeFalsy();
});

it('no se ofrece si hay una sola serie', () => {
	const metric = armar(true);
	metric.properties.Versions = [metric.properties.Versions[0]];
	expect(metric.canCompareSelectedVariable()).toBeFalsy();
});
