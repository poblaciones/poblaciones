import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeBoundaryProperties, makeBoundaryVersion, makeBoundaryValueLabel, mountLite } from './fixtures.mjs';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import BoundaryValues from '@/map/components/widgets/summary/boundaryValues.vue';

// Caracterización de boundaryValues.vue: réplica simplificada de
// metricValues.vue, sin Summary.js. Una única columna de dato -rotable entre
// N (cantidad, default), % de N, Km2 y % de Km2-; el cálculo y el formato
// viven en ActiveBoundary (CalculateValue/FormatValue), compartidos con
// boundaryChart.vue, así que acá solo se verifica que el componente delega
// correctamente en esos métodos.

function makeBoundary(valueLabelsOverrides) {
	setupWindow();
	const properties = makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: (valueLabelsOverrides || [
				makeBoundaryValueLabel({ Id: 501, Name: 'Tandil', Values: { ValueId: 501, Value: 300, Km2: 120 } }),
				makeBoundaryValueLabel({ Id: 502, Name: 'CABA', Values: { ValueId: 502, Value: 150, Km2: 80 } }),
			]),
		})],
	});
	return new ActiveBoundary(properties);
}

function mountValues(boundary) {
	return mountLite(BoundaryValues, { props: { boundary: boundary } });
}

describe('boundaryValues: métrica rotable (N -> P -> K -> A -> N)');

it('arranca en N (currentMetric.Key coincide con boundary.summaryMetric)', () => {
	const boundary = makeBoundary();
	const values = mountValues(boundary);
	expect(values.currentMetric.Key).toBe('N');
	expect(boundary.valueHeader()).toBe('N');
});

it('clickMetric rota la métrica del boundary y persiste la ruta', () => {
	const segMap = setupWindow();
	let routeUpdated = false;
	segMap.SaveRoute.UpdateRoute = function () { routeUpdated = true; };
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: [makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })],
		})],
	}));
	const values = mountValues(boundary);
	values.clickMetric(values.currentMetric.Next.Key);
	expect(boundary.summaryMetric).toBe('P');
	expect(routeUpdated).toBeTruthy();
	values.clickMetric(values.currentMetric.Next.Key);
	expect(boundary.summaryMetric).toBe('K');
});

describe('boundaryValues: visibleLabels oculta las categorías sin datos');

it('una categoría con Value/Km2 vacío no entra en visibleLabels', () => {
	const boundary = makeBoundary([
		makeBoundaryValueLabel({ Id: 501, Name: 'Con datos', Values: { ValueId: 501, Value: 300, Km2: 120 } }),
		makeBoundaryValueLabel({ Id: 502, Name: 'Sin datos', Values: { ValueId: 502, Value: '', Km2: '' } }),
	]);
	const values = mountValues(boundary);
	expect(values.visibleLabels).toHaveLength(1);
	expect(values.visibleLabels[0].Name).toBe('Con datos');
});

it('una categoría desmarcada por el usuario (Visible=false) sigue apareciendo si tiene datos', () => {
	const boundary = makeBoundary();
	boundary.SelectedVersion().ValueLabels[0].Visible = false;
	const values = mountValues(boundary);
	expect(values.visibleLabels).toHaveLength(2);
});

describe('boundaryValues: formattedValue delega en boundary.CalculateValue/FormatValue');

it('devuelve el mismo resultado que encadenar CalculateValue y FormatValue a mano', () => {
	const boundary = makeBoundary();
	boundary.summaryMetric = 'A';
	const values = mountValues(boundary);
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(values.formattedValue(label)).toBe(boundary.FormatValue(boundary.CalculateValue(label)));
});

it('sin Values todavía (summary no llegó), formattedValue queda vacío', () => {
	const boundary = makeBoundary([
		makeBoundaryValueLabel({ Id: 501, Values: null }),
	]);
	const values = mountValues(boundary);
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(values.formattedValue(label)).toBe('');
});

describe('boundaryValues: toggle de ValueLabel (idéntico a metricValues.vue)');

it('clickLabel invierte Visible y llama boundary.UpdateMap()', () => {
	const boundary = makeBoundary();
	let updated = false;
	boundary.UpdateMap = function () { updated = true; };
	const values = mountValues(boundary);
	const label = boundary.SelectedVersion().ValueLabels[0];
	values.clickLabel(label);
	expect(label.Visible).toBeFalsy();
	expect(updated).toBeTruthy();
});
