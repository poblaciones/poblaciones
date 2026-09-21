import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable, makeValueLabel } from './fixtures.mjs';
import ActiveMetric from '@/map/classes/ActiveMetric';

function makeThreeLevelMetric() {
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [
				makeLevel({ Name: 'Provincias', MinZoom: 0, MaxZoom: 7 }),
				makeLevel({ Name: 'Departamentos', MinZoom: 8, MaxZoom: 11 }),
				makeLevel({ Name: 'Radios', MinZoom: 12, MaxZoom: 20 }),
			],
		})],
	});
	return new ActiveMetric(properties);
}

describe('ActiveMetric: nivel según zoom');

it('CalculateProperLevel elige el nivel cuyo rango contiene el zoom', () => {
	const segMap = setupWindow();
	const metric = makeThreeLevelMetric();
	segMap.frame.Zoom = 5;
	expect(metric.CalculateProperLevel()).toBe(0);
	segMap.frame.Zoom = 9;
	expect(metric.CalculateProperLevel()).toBe(1);
	segMap.frame.Zoom = 14;
	expect(metric.CalculateProperLevel()).toBe(2);
});

it('fuera de rango devuelve el primero o el último según el extremo', () => {
	const segMap = setupWindow();
	const metric = makeThreeLevelMetric();
	metric.properties.Versions[0].Levels[0].MinZoom = 3;
	segMap.frame.Zoom = 1;
	expect(metric.CalculateProperLevel()).toBe(0);
	segMap.frame.Zoom = 25;
	expect(metric.CalculateProperLevel()).toBe(2);
});

it('con un solo nivel siempre devuelve 0', () => {
	setupWindow();
	const metric = new ActiveMetric(makeMetricProperties());
	expect(metric.CalculateProperLevel()).toBe(0);
});

it('LastLevelDontMultilevel excluye del multinivel el último nivel no-D', () => {
	const segMap = setupWindow();
	const metric = makeThreeLevelMetric();
	metric.properties.Versions[0].Levels[2].Dataset.Type = 'L';
	segMap.frame.Zoom = 14;
	// El último nivel (tipo 'L') no participa del multinivel: se queda en el anterior.
	expect(metric.CalculateProperLevel()).toBe(1);
});

it('UpdateLevel no cambia el nivel si el multinivel actual está pinneado', () => {
	const segMap = setupWindow();
	const metric = makeThreeLevelMetric();
	metric.properties.Versions[0].Levels[0].Pinned = true;
	segMap.frame.Zoom = 14;
	expect(metric.UpdateLevel()).toBeFalsy();
	expect(metric.SelectedLevelIndex()).toBe(0);
});

it('UpdateLevel cambia nivel e intenta conservar la variable por nombre', () => {
	const segMap = setupWindow();
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [
				makeLevel({ MinZoom: 0, MaxZoom: 7, Variables: [makeVariable({ Name: 'Hogares' }), makeVariable({ Name: 'Población' })] }),
				makeLevel({ MinZoom: 8, MaxZoom: 20, Variables: [makeVariable({ Name: 'Población' }), makeVariable({ Name: 'Hogares' })] }),
			],
		})],
	});
	const metric = new ActiveMetric(properties);
	metric.properties.Versions[0].Levels[0].SelectedVariableIndex = 1; // Población
	segMap.frame.Zoom = 10;
	expect(metric.UpdateLevel()).toBeTruthy();
	expect(metric.SelectedLevelIndex()).toBe(1);
	expect(metric.SelectedVariable().Name).toBe('Población');
});

describe('ActiveMetric: métricas de resumen válidas');

it('con totales y área ofrece N, I, P, K, A, D y T en ese orden', () => {
	setupWindow();
	const metric = new ActiveMetric(makeMetricProperties());
	const keys = metric.getValidMetrics().map(m => m.Key);
	expect(keys).toEqual(['N', 'I', 'P', 'K', 'A', 'D', 'T']);
});

it('sin totales no ofrece incidencia ni total', () => {
	setupWindow();
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeLevel({ Variables: [makeVariable({ HasTotals: false })] })] })],
	});
	const metric = new ActiveMetric(properties);
	const keys = metric.getValidMetrics().map(m => m.Key);
	expect(keys.includes('I')).toBeFalsy();
	expect(keys.includes('T')).toBeFalsy();
});

it('FIL requiere AllowRowPercent y más de una categoría', () => {
	setupWindow();
	const properties = makeMetricProperties({ AllowRowPercent: true });
	const metric = new ActiveMetric(properties);
	expect(metric.getValidMetrics().map(m => m.Key).includes('FIL')).toBeTruthy();
	const single = makeMetricProperties({
		AllowRowPercent: true,
		Versions: [makeVersion({ Levels: [makeLevel({ Variables: [makeVariable({ ValueLabels: [makeValueLabel()] })] })] })],
	});
	expect(new ActiveMetric(single).getValidMetrics().map(m => m.Key).includes('FIL')).toBeFalsy();
});

it('los niveles de segmentos no ofrecen métricas de área (K/A/D)', () => {
	setupWindow();
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeLevel({ Dataset: { Type: 'S', AreSegments: true, ShowInfo: true, Marker: null, Id: 1 } })] })],
	});
	const keys = new ActiveMetric(properties).getValidMetrics().map(m => m.Key);
	expect(keys.includes('K')).toBeFalsy();
	expect(keys.includes('A')).toBeFalsy();
	expect(keys.includes('D')).toBeFalsy();
});

describe('ActiveMetric: patrones, estilos y selección');

it('GetPattern prioriza el patrón personalizado sobre el de la variable', () => {
	setupWindow();
	const metric = new ActiveMetric(makeMetricProperties());
	const variable = metric.SelectedVariable();
	variable.Pattern = 0;
	variable.CustomPattern = '';
	expect(metric.GetPattern()).toBe(0);
	variable.CustomPattern = 7;
	expect(metric.GetPattern()).toBe(7);
});

it('ResolveStyle en contorno (patrón 1) pinta el trazo y deja el relleno transparente', () => {
	setupWindow();
	const metric = new ActiveMetric(makeMetricProperties());
	const variable = metric.SelectedVariable();
	variable.CustomPattern = 1;
	variable.CurrentOpacity = 0.7;
	const label = variable.ValueLabels[0];
	const style = metric.ResolveStyle(variable, label.Id);
	expect(style.fillColor).toBe('transparent');
	expect(style.strokeColor).toBe(label.FillColor);
	expect(style.fillOpacity).toBe(0);
});

it('getHiddenValueLabels lista solo las categorías ocultas, separadas por coma', () => {
	setupWindow();
	const metric = new ActiveMetric(makeMetricProperties());
	const variable = metric.SelectedVariable();
	variable.ValueLabels[1].Visible = false;
	expect(metric.getHiddenValueLabels(variable)).toBe('' + variable.ValueLabels[1].Id);
	variable.ValueLabels[0].Visible = false;
	expect(metric.getHiddenValueLabels(variable)).toBe(variable.ValueLabels[0].Id + ',' + variable.ValueLabels[1].Id);
});

it('IsFiltering detecta cualquier categoría oculta', () => {
	setupWindow();
	const metric = new ActiveMetric(makeMetricProperties());
	expect(metric.IsFiltering()).toBeFalsy();
	metric.SelectedVariable().ValueLabels[0].Visible = false;
	expect(metric.IsFiltering()).toBeTruthy();
});

it('SetValueToSelectedVariableSet aplica a las homónimas de todos los niveles', () => {
	setupWindow();
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [
				makeLevel({ Variables: [makeVariable({ Name: 'Población' })] }),
				makeLevel({ Variables: [makeVariable({ Name: 'Población' }), makeVariable({ Name: 'Hogares' })] }),
			],
		})],
	});
	const metric = new ActiveMetric(properties);
	metric.SetShowValuesToSelectedVariableSet(1);
	const levels = metric.properties.Versions[0].Levels;
	expect(levels[0].Variables[0].ShowValues).toBe(1);
	expect(levels[1].Variables[0].ShowValues).toBe(1);
	expect(levels[1].Variables[1].ShowValues).toBe(0);
});

it('GetVersionIndex resuelve por Id de versión', () => {
	setupWindow();
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Version: { Id: 100, Name: '2010' } }), makeVersion({ Version: { Id: 200, Name: '2020' } })],
	});
	const metric = new ActiveMetric(properties);
	expect(metric.GetVersionIndex(200)).toBe(1);
	expect(metric.GetVersionIndex(999)).toBe(-1);
});

it('useTiles: segmentos siempre por tiles; locations no; shapes sí', () => {
	setupWindow();
	const metric = new ActiveMetric(makeMetricProperties());
	metric.SelectedLevel().Dataset.AreSegments = true;
	expect(metric.useTiles()).toBeTruthy();
	metric.SelectedLevel().Dataset.AreSegments = false;
	metric.SelectedLevel().Dataset.Type = 'L';
	expect(metric.useTiles()).toBeFalsy();
	metric.SelectedLevel().Dataset.Type = 'D';
	expect(metric.useTiles()).toBeTruthy();
});

describe('ActiveMetric: caché de datos de capas de puntos (GetMetricData/GetLevelData)');

// Las capas de puntos (deck.gl) traen todos los datos del nivel de una y
// filtran/refrescan client-side (visibilidad de categorías, variable
// seleccionada, zoom). Un refresh que no cambia nivel, versión, partición,
// urbanidad ni recorte no debería volver a golpear al servidor.

it('un segundo pedido con los mismos parámetros reutiliza la respuesta cacheada', async () => {
	const segMap = setupWindow();
	const calls = [];
	segMap.Get = function (url, options) {
		calls.push(options.params);
		return Promise.resolve({ data: { Data: [{ VID: 1, LID: 1 }] } });
	};
	const metric = new ActiveMetric(makeMetricProperties());
	await metric.GetMetricData();
	await metric.GetMetricData();
	expect(calls).toHaveLength(1);
});

it('cambiar la variable seleccionada dentro del mismo nivel no repite el pedido: filtra lo cacheado', async () => {
	const segMap = setupWindow();
	const calls = [];
	segMap.Get = function (url, options) {
		calls.push(options.params);
		return Promise.resolve({ data: { Data: [{ VID: 10, LID: 1 }, { VID: 20, LID: 2 }] } });
	};
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeLevel({ Variables: [makeVariable({ Id: 10 }), makeVariable({ Id: 20 })] })] })],
	});
	const metric = new ActiveMetric(properties);
	const first = await metric.GetMetricData();
	expect(first).toEqual([{ VID: 10, LID: 1 }]);
	metric.SelectedLevel().SelectedVariableIndex = 1;
	const second = await metric.GetMetricData();
	expect(second).toEqual([{ VID: 20, LID: 2 }]);
	expect(calls).toHaveLength(1);
});

it('cambiar el nivel seleccionado sí repite el pedido', async () => {
	const segMap = setupWindow();
	const calls = [];
	segMap.Get = function (url, options) {
		calls.push(options.params);
		return Promise.resolve({ data: { Data: [] } });
	};
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeLevel(), makeLevel()] })],
	});
	const metric = new ActiveMetric(properties);
	await metric.GetMetricData();
	metric.SelectedVersion().SelectedLevelIndex = 1;
	await metric.GetMetricData();
	expect(calls).toHaveLength(2);
});

it('cambiar la partición seleccionada sí repite el pedido', async () => {
	const segMap = setupWindow();
	const calls = [];
	segMap.Get = function (url, options) {
		calls.push(options.params);
		return Promise.resolve({ data: { Data: [] } });
	};
	const properties = makeMetricProperties({
		Versions: [makeVersion({ Levels: [makeLevel({ Partitions: { Values: [{ Value: 'A' }, { Value: 'B' }] } })] })],
		SelectedPartition: 'A',
	});
	const metric = new ActiveMetric(properties);
	await metric.GetMetricData();
	metric.properties.SelectedPartition = 'B';
	await metric.GetMetricData();
	expect(calls).toHaveLength(2);
});

it('mover el mapa (pan/zoom) no repite el pedido: el envelope no forma parte de la consulta', async () => {
	const segMap = setupWindow();
	const calls = [];
	segMap.Get = function (url, options) {
		calls.push(options.params);
		return Promise.resolve({ data: { Data: [] } });
	};
	const metric = new ActiveMetric(makeMetricProperties());
	await metric.GetMetricData();
	segMap.frame.Zoom = 15;
	segMap.frame.Envelope = { Min: { Lat: 1, Lon: 1 }, Max: { Lat: 2, Lon: 2 } };
	await metric.GetMetricData();
	expect(calls).toHaveLength(1);
});

it('un pedido fallido no queda cacheado: el siguiente intento reintenta', async () => {
	const segMap = setupWindow();
	let callCount = 0;
	segMap.Get = function () {
		callCount++;
		if (callCount === 1) {
			return Promise.reject(new Error('falló'));
		}
		return Promise.resolve({ data: { Data: [] } });
	};
	const metric = new ActiveMetric(makeMetricProperties());
	let caught = false;
	try {
		await metric.GetMetricData();
	} catch (e) {
		caught = true;
	}
	expect(caught).toBeTruthy();
	await metric.GetMetricData();
	expect(callCount).toBe(2);
});
