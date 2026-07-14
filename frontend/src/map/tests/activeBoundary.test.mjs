import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeBoundaryProperties, makeBoundaryVersion, makeBoundaryValueLabel } from './fixtures.mjs';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import ActiveBaseBoundary from '@/map/classes/ActiveBaseBoundary';
import VueStub from './_stubs/vue.mjs';

describe('ActiveBoundary: servicio de tiles (nombre real del endpoint en el servidor)');

it('usa GetBoundaryTile / GetBaseBoundaryTile, no GetBoundary / GetBaseBoundary', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(boundary.GetDataService().path).toBe('/services/frontend/boundaries/GetBoundaryTile');
	boundary.isBaseMetric = true;
	expect(boundary.GetDataService().path).toBe('/services/frontend/boundaries/GetBaseBoundaryTile');
});

describe('ActiveBoundary: descripciones (default: no mostrarlas)');

it('showDescriptions arranca en false', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(boundary.showDescriptions).toBeFalsy();
});

describe('ActiveBoundary: color por categoría en el mapa (uno por ValueLabel)');

it('con el patrón default (Contorno), GetStyleColorList usa LineColor', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	const list = boundary.GetStyleColorList();
	expect(list).toHaveLength(2);
	expect(list[0].fillColor).toBe('#3388ff');
	expect(list[1].fillColor).toBe('#ff8833');
});

it('con patrón Pleno, GetStyleColorList usa FillColor en cambio', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	boundary.customPattern = 0;
	const list = boundary.GetStyleColorList();
	expect(list[0].fillColor).toBe('#a8c8ff');
});

it('GetStyleColorDictionary sigue el mismo criterio que GetStyleColorList', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(boundary.GetStyleColorDictionary()[label.Id]).toBe('#3388ff');
	boundary.customPattern = 0;
	expect(boundary.GetStyleColorDictionary()[label.Id]).toBe('#a8c8ff');
});

describe('ActiveBoundary: visibilidad por categoría (filtro del mapa)');

it('ResolveValueLabelVisibility responde según el Visible real del ValueLabel', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(boundary.ResolveValueLabelVisibility(label.Id)).toBeTruthy();
	label.Visible = false;
	expect(boundary.ResolveValueLabelVisibility(label.Id)).toBeFalsy();
});

it('IsFiltering detecta cualquier ValueLabel oculto', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(boundary.IsFiltering()).toBeFalsy();
	boundary.SelectedVersion().ValueLabels[0].Visible = false;
	expect(boundary.IsFiltering()).toBeTruthy();
});

describe('ActiveBoundary: trama (subconjunto de ActiveMetric.getValidPatterns)');

it('getValidPatterns ofrece solo Pleno, Contorno, Diagonal y Puntos', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(boundary.getValidPatterns().map(p => p.Caption)).toEqual(['Pleno', 'Contorno', 'Diagonal', 'Puntos']);
});

it('arranca en Contorno (pattern=1) y GetPattern prioriza customPattern', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(boundary.GetPattern()).toBe(1);
	boundary.customPattern = 0;
	expect(boundary.GetPattern()).toBe(0);
});

describe('ActiveBoundary: métricas rotables (columna única: N, P, K, A)');

it('getValidMetrics ofrece Cantidad, Distribución, Área y Distr. de áreas, con Next/Title encadenados', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	const metrics = boundary.getValidMetrics();
	expect(metrics.map(m => m.Key)).toEqual(['N', 'P', 'K', 'A']);
	expect(metrics[0].Next.Key).toBe('P');
	expect(metrics[3].Next.Key).toBe('N');
});

it('summaryMetric arranca en N (cantidad), primera en orden', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(boundary.summaryMetric).toBe('N');
});

it('valueHeader devuelve el mismo texto que sus equivalentes en Summary.js', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(boundary.valueHeader()).toBe('N');
	boundary.summaryMetric = 'P';
	expect(boundary.valueHeader()).toBe('COL %');
	boundary.summaryMetric = 'K';
	expect(boundary.valueHeader()).toBe('Km<sup>2</sup>');
	boundary.summaryMetric = 'A';
	expect(boundary.valueHeader()).toBe('% Km<sup>2</sup>');
});

describe('ActiveBoundary: HasData (una categoría sin datos no se muestra, ni en tabla ni en gráfico)');

it('sin Values, no tiene datos', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: [makeBoundaryValueLabel({ Values: null })] })],
	}));
	expect(boundary.HasData(boundary.SelectedVersion().ValueLabels[0])).toBeFalsy();
});

it('con Values pero Value/Km2 vacíos (mismo patrón que label.Values.Count === "" en metrics), no tiene datos', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: [makeBoundaryValueLabel({ Values: { ValueId: 501, Value: '', Km2: '' } })],
		})],
	}));
	expect(boundary.HasData(boundary.SelectedVersion().ValueLabels[0])).toBeFalsy();
});

it('con Value y Km2 numéricos, sí tiene datos (aunque sean 0)', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: [makeBoundaryValueLabel({ Values: { ValueId: 501, Value: 0, Km2: 0 } })],
		})],
	}));
	expect(boundary.HasData(boundary.SelectedVersion().ValueLabels[0])).toBeTruthy();
});



function makeBoundaryWithData() {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: [
				makeBoundaryValueLabel({ Id: 501, Values: { ValueId: 501, Value: 300, Km2: 120 } }),
				makeBoundaryValueLabel({ Id: 502, Values: { ValueId: 502, Value: 150, Km2: 80 } }),
			],
		})],
	}));
	return boundary;
}

it('N devuelve la cantidad cruda, formateada con formatNum', () => {
	const boundary = makeBoundaryWithData();
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(boundary.CalculateValue(label)).toBe(300);
	expect(boundary.FormatValue(boundary.CalculateValue(label))).toBe('300');
});

it('P calcula el porcentaje de cantidad sobre el total (300+150=450)', () => {
	const boundary = makeBoundaryWithData();
	boundary.summaryMetric = 'P';
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(boundary.CalculateValue(label)).toBeCloseTo((300 / 450) * 100, 4);
});

it('K devuelve el área cruda en km2', () => {
	const boundary = makeBoundaryWithData();
	boundary.summaryMetric = 'K';
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(boundary.CalculateValue(label)).toBe(120);
});

it('A calcula el porcentaje de área sobre el total (120+80=200)', () => {
	const boundary = makeBoundaryWithData();
	boundary.summaryMetric = 'A';
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(boundary.CalculateValue(label)).toBe(60);
});

it('sin Values todavía (summary no llegó), CalculateValue/FormatValue quedan vacíos', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: [makeBoundaryValueLabel({ Id: 501, Values: null })] })],
	}));
	const label = boundary.SelectedVersion().ValueLabels[0];
	expect(boundary.CalculateValue(label)).toBe('');
	expect(boundary.FormatValue(boundary.CalculateValue(label))).toBe('');
});

describe('ActiveBoundary: useChart (mismo criterio que ActiveSelectedMetric.useChart)');

it('con más de una categoría, useChart es true', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(boundary.useChart()).toBeTruthy();
});

it('con una sola categoría, useChart es false', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: [makeBoundaryValueLabel()] })],
	}));
	expect(boundary.useChart()).toBeFalsy();
});

it('ShowChart arranca en true, igual que ActiveSelectedMetric', () => {
	setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(boundary.ShowChart).toBeTruthy();
});

describe('ActiveBoundary: UpdateSummary (sin BoundaryVersionId/Count a nivel raíz: se rige por Items)');

it('usa Vue.set para asignar Values (el payload real no trae esa propiedad preexistente, solo "Value" singular sin uso)', async () => {
	const segMap = setupWindow();
	const properties = makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: [makeBoundaryValueLabel({ Id: 501 })] })],
	});
	const boundary = new ActiveBoundary(properties);
	const versionId = boundary.SelectedVersion().Id;
	const label = boundary.SelectedVersion().ValueLabels[0];
	const item = { ValueId: 501, BoundaryVersionId: versionId, Value: 300, Km2: 120 };
	segMap.Get = function () {
		return Promise.resolve({ data: { Items: [item] } });
	};
	const callsBefore = VueStub.calls.length;
	boundary.UpdateSummary();
	await Promise.resolve();
	expect(VueStub.calls.length).toBe(callsBefore + 1);
	expect(VueStub.calls[VueStub.calls.length - 1].obj).toBe(label);
	expect(VueStub.calls[VueStub.calls.length - 1].key).toBe('Values');
	expect(label.Values).toBe(item);
});

it('ignora la respuesta si ningún Item matchea la versión mostrada (carrera de requests)', async () => {
	const segMap = setupWindow();
	const properties = makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: [makeBoundaryValueLabel({ Id: 501 })] })],
	});
	const boundary = new ActiveBoundary(properties);
	segMap.Get = function () {
		return Promise.resolve({
			data: { Items: [{ ValueId: 501, BoundaryVersionId: 99999, Value: 1, Km2: 1 }] },
		});
	};
	boundary.UpdateSummary();
	await Promise.resolve();
	expect(boundary.SelectedVersion().Count).toBeNull();
	expect(boundary.SelectedVersion().ValueLabels[0].Values).toBeNull();
});

it('con Items vacío (no debería darse en un caso legítimo), tampoco aplica nada', async () => {
	const segMap = setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: [makeBoundaryValueLabel({ Id: 501 })] })],
	}));
	segMap.Get = function () {
		return Promise.resolve({ data: { Items: [] } });
	};
	boundary.UpdateSummary();
	await Promise.resolve();
	expect(boundary.SelectedVersion().Count).toBeNull();
});

it('vuelca cada Item sobre su ValueLabel y calcula Count sumando Value (asíncrono)', async () => {
	const segMap = setupWindow();
	const properties = makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: [makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })],
		})],
	});
	const boundary = new ActiveBoundary(properties);
	const versionId = boundary.SelectedVersion().Id;
	segMap.Get = function () {
		return Promise.resolve({
			data: {
				Items: [
					{ ValueId: 501, BoundaryVersionId: versionId, Value: 300, Km2: 120.5 },
					{ ValueId: 502, BoundaryVersionId: versionId, Value: 150, Km2: 45.2 },
				],
			},
		});
	};
	boundary.UpdateSummary();
	await Promise.resolve();
	expect(boundary.SelectedVersion().Count).toBe(450);
	expect(boundary.SelectedVersion().ValueLabels[0].Values.Value).toBe(300);
	expect(boundary.SelectedVersion().ValueLabels[1].Values.Km2).toBe(45.2);
});

it('si solo algunos Items matchean la versión, calcula Count solo con esos', async () => {
	const segMap = setupWindow();
	const properties = makeBoundaryProperties({
		Versions: [makeBoundaryVersion({
			ValueLabels: [makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })],
		})],
	});
	const boundary = new ActiveBoundary(properties);
	const versionId = boundary.SelectedVersion().Id;
	segMap.Get = function () {
		return Promise.resolve({
			data: {
				Items: [
					{ ValueId: 501, BoundaryVersionId: versionId, Value: 300, Km2: 120.5 },
					{ ValueId: 502, BoundaryVersionId: 99999, Value: 150, Km2: 45.2 },
				],
			},
		});
	};
	boundary.UpdateSummary();
	await Promise.resolve();
	expect(boundary.SelectedVersion().Count).toBe(300);
	expect(boundary.SelectedVersion().ValueLabels[1].Values).toBeNull();
});

describe('ActiveBaseBoundary: hereda todo de ActiveBoundary, sin parametrizar color');

it('arma GetStyleColorList igual que ActiveBoundary, con los colores que recibe', () => {
	setupWindow();
	const boundary = new ActiveBaseBoundary(makeBoundaryProperties());
	expect(boundary.isBaseMetric).toBeTruthy();
	expect(boundary.GetStyleColorList()).toHaveLength(2);
	expect(boundary.SelectedVersion().ValueLabels[0].LineColor).toBe('#3388ff');
});
