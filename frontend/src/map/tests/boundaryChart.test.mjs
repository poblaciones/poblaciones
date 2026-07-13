import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeBoundaryProperties, makeBoundaryVersion, makeBoundaryValueLabel, mountLite } from './fixtures.mjs';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import BoundaryChart from '@/map/components/widgets/summary/boundaryChart.vue';

// Análogo de metricChart.vue: mismo patrón (una serie por versión, un valor
// por ValueLabel, click en una barra togglea Visible), pero calculado con
// ActiveBoundary.CalculateValue/FormatValue en vez de Summary.js.

function makeBoundary() {
	setupWindow();
	const properties = makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			Name: '2022',
			ValueLabels: [
				makeBoundaryValueLabel({ Id: 501, Name: 'Tandil', LineColor: '#3388ff', Values: { ValueId: 501, Value: 300, Km2: 120 } }),
				makeBoundaryValueLabel({ Id: 502, Name: 'CABA', LineColor: '#ff8833', Values: { ValueId: 502, Value: 150, Km2: 80 } }),
			],
		})],
	});
	return new ActiveBoundary(properties);
}

function mountChart(boundary) {
	return mountLite(BoundaryChart, { props: { boundary: boundary } });
}

describe('boundaryChart: armado de la serie');

it('una serie con el nombre de la versión y un valor por ValueLabel', () => {
	const boundary = makeBoundary();
	const chart = mountChart(boundary);
	expect(chart.chartData.series).toHaveLength(1);
	expect(chart.chartData.series[0].text).toBe('2022');
	expect(chart.chartData.series[0].values).toHaveLength(2);
	expect(chart.chartData.series[0].values[0].label).toBe('Tandil');
	expect(chart.chartData.series[0].values[0].color).toBe('#3388ff');
});

it('el valor y el formato coinciden con boundary.CalculateValue/FormatValue', () => {
	const boundary = makeBoundary();
	boundary.summaryMetric = 'K';
	const chart = mountChart(boundary);
	const label = boundary.SelectedVersion().ValueLabels[0];
	const entry = chart.chartData.series[0].values[0];
	expect(entry.value).toBe(boundary.CalculateValue(label));
	expect(entry.valueFormatted).toBe(boundary.FormatValue(boundary.CalculateValue(label)));
});

it('sin Values todavía (summary no llegó), esa categoría no entra a la serie', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: [
				makeBoundaryValueLabel({ Id: 501, Values: null }),
				makeBoundaryValueLabel({ Id: 502, Values: { ValueId: 502, Value: 10, Km2: 5 } }),
			],
		})],
	}));
	const chart = mountChart(boundary);
	expect(chart.chartData.series[0].values).toHaveLength(1);
});

it('con Values pero Value/Km2 vacíos, tampoco entra (antes se colaba como valor 0 fantasma)', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: [
				makeBoundaryValueLabel({ Id: 501, Values: { ValueId: 501, Value: '', Km2: '' } }),
				makeBoundaryValueLabel({ Id: 502, Values: { ValueId: 502, Value: 10, Km2: 5 } }),
			],
		})],
	}));
	const chart = mountChart(boundary);
	expect(chart.chartData.series[0].values).toHaveLength(1);
	expect(chart.chartData.series[0].values[0].label).toBe(boundary.SelectedVersion().ValueLabels[1].Name);
});

describe('boundaryChart: tipo de gráfico según la métrica activa');

it('con P o A, pasa a stacked normalizado; con N o K, a barras', () => {
	const boundary = makeBoundary();
	const chart = mountChart(boundary);
	expect(chart.chartType).toBe('bar');
	expect(chart.normalized).toBeFalsy();
});

describe('boundaryChart: click en una barra togglea la categoría');

it('handleSelect invierte Visible del ValueLabel y llama boundary.UpdateMap()', () => {
	const boundary = makeBoundary();
	let updated = false;
	boundary.UpdateMap = function () { updated = true; };
	const chart = mountChart(boundary);
	const label = boundary.SelectedVersion().ValueLabels[0];
	chart.handleSelect({ seriesIndex: 0, valueIndex: 0 });
	expect(label.Visible).toBeFalsy();
	expect(updated).toBeTruthy();
});
