import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeBoundaryProperties, makeBoundaryVersion, makeBoundaryValueLabel, mountLite } from './fixtures.mjs';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import Boundary from '@/map/components/widgets/summary/boundary.vue';

// boundary.vue: el título simple (IsSimpleCount) pasó de simular un
// "singleLabel" ficticio ({FillColor: boundary.color, Visible: boundary.visible})
// a usar el único ValueLabel real. Con más de un ValueLabel, el título deja
// de ser clickeable y pasa a togglear el colapso de la tabla (boundaryValues.vue).

function makeBoundary(valueLabels) {
	setupWindow();
	const properties = makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: valueLabels })],
	});
	return new ActiveBoundary(properties);
}

function mountBoundary(boundary) {
	return mountLite(Boundary, { props: { boundary: boundary, clipping: {} } });
}

describe('boundary: singleLabel es el ValueLabel real (caso IsSimpleCount)');

it('singleLabel expone el único ValueLabel de la versión, no un objeto simulado', () => {
	const boundary = makeBoundary([makeBoundaryValueLabel({ Id: 501, Name: 'Barrios', LineColor: '#3388ff' })]);
	const panel = mountBoundary(boundary);
	expect(panel.singleLabel.Id).toBe(501);
	expect(panel.singleLabel.LineColor).toBe('#3388ff');
});

it('clickLabel sobre singleLabel togglea su Visible real y refresca el mapa', () => {
	const boundary = makeBoundary([makeBoundaryValueLabel({ Id: 501 })]);
	let updated = false;
	boundary.UpdateMap = function () { updated = true; };
	const panel = mountBoundary(boundary);
	panel.clickLabel(panel.singleLabel);
	expect(boundary.SelectedVersion().ValueLabels[0].Visible).toBeFalsy();
	expect(updated).toBeTruthy();
});

describe('boundary: colapso de la tabla de categorías (caso abierto)');

it('toggleCollapse invierte LabelsCollapsed y persiste la ruta', () => {
	const boundary = makeBoundary([makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })]);
	const segMap = setupWindow();
	let routeUpdated = false;
	segMap.SaveRoute.UpdateRoute = function () { routeUpdated = true; };
	const panel = mountBoundary(boundary);
	expect(boundary.SelectedVersion().LabelsCollapsed).toBeFalsy();
	panel.toggleCollapse();
	expect(boundary.SelectedVersion().LabelsCollapsed).toBeTruthy();
	expect(routeUpdated).toBeTruthy();
});

describe('boundary: total del título (boundaryCount) sigue fijo, no se recalcula por visibilidad');

it('boundaryCount es el Count general de la versión, sin filtrar por Visible', () => {
	const boundary = makeBoundary([makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })]);
	boundary.SelectedVersion().Count = 450;
	boundary.SelectedVersion().ValueLabels[0].Visible = false;
	const panel = mountBoundary(boundary);
	expect(panel.boundaryCount).toBe(450);
});

describe('boundary: línea "Cantidad de regiones" (bolita maestra, caso con más de una categoría)');

it('toggleVisible reconecta boundary.ChangeVisibility (control de TODA la capa, no de una categoría)', () => {
	const boundary = makeBoundary([makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })]);
	let updated = false;
	boundary.UpdateMap = function () { updated = true; };
	const panel = mountBoundary(boundary);
	expect(boundary.visible).toBeTruthy();
	panel.toggleVisible();
	expect(boundary.visible).toBeFalsy();
	expect(updated).toBeTruthy();
});

it('dropClass refleja boundary.visible con las mismas clases CSS que metricVariables.vue', () => {
	const boundary = makeBoundary([makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })]);
	const panel = mountBoundary(boundary);
	expect(panel.dropClass()).toBe('dropMetric');
	boundary.visible = false;
	expect(panel.dropClass()).toBe('dropMetricMuted');
});

describe('boundary: disponibilidad del gráfico');

it('useCharts sigue la bandera global window.Use.UseCharts', () => {
	const boundary = makeBoundary([makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })]);
	window.Use.UseCharts = true;
	const panel = mountBoundary(boundary);
	expect(panel.useCharts).toBeTruthy();
	window.Use.UseCharts = false;
	expect(panel.useCharts).toBeFalsy();
});
