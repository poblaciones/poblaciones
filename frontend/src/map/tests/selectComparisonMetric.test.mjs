import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable } from './fixtures.mjs';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';

// Al activar la comparación (Compare.Active = true), la lista de variables
// ofrecidas se reduce a las comparables. SelectComparisonMetric evita que,
// con una variable activa que no es comparable, la comparación quede sin
// nada seleccionado.

function armarMetric() {
	setupWindow();
	window.Use.UseCompareSeries = true;
	const nivel = function () {
		return makeLevel({
			Variables: [
				makeVariable({ Name: 'Población de 65 y más', Comparable: false }),
				makeVariable({ Name: 'Población total', Comparable: true }),
				makeVariable({ Name: 'Población económicamente activa', Comparable: true }),
			],
		});
	};
	return new ActiveSelectedMetric(makeMetricProperties({
		Comparable: true,
		Versions: [makeVersion({ Levels: [nivel()] }), makeVersion({ Levels: [nivel()] })],
	}));
}

describe('ActiveSelectedMetric.SelectComparisonMetric');

it('con la variable activa ya comparable, no cambia la selección', () => {
	const metric = armarMetric();
	metric.SelectedLevel().SelectedVariableIndex = 1;
	metric.Compare.Active = true;
	metric.SelectComparisonMetric();
	expect(metric.SelectedLevel().SelectedVariableIndex).toBe(1);
});

it('con la variable activa no comparable, selecciona la primera comparable del nivel', () => {
	const metric = armarMetric();
	metric.SelectedLevel().SelectedVariableIndex = 0;
	metric.Compare.Active = true;
	metric.SelectComparisonMetric();
	expect(metric.SelectedLevel().SelectedVariableIndex).toBe(1);
	expect(metric.SelectedVariable().Comparable).toBeTruthy();
});

it('sin variable seleccionada, selecciona la primera comparable del nivel', () => {
	const metric = armarMetric();
	metric.SelectedLevel().SelectedVariableIndex = -1;
	metric.Compare.Active = true;
	metric.SelectComparisonMetric();
	expect(metric.SelectedLevel().SelectedVariableIndex).toBe(1);
});
