import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable, makeValueLabel, makeBoundaryProperties, makeBoundaryVersion, makeBoundaryValueLabel } from './fixtures.mjs';
import SelectedInfoRouter from '@/map/router/SelectedInfoRouter';
import FrameRouter from '@/map/router/FrameRouter';
import SaveRoute from '@/map/classes/SaveRoute';
import RestoreRoute from '@/map/classes/RestoreRoute';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import VueStub from './_stubs/vue.mjs';

describe('SelectedInfoRouter: compresión de visibilidades (deflate/inflate)');

it('deflateString colapsa corridas largas y respeta las cortas', () => {
	const router = new SelectedInfoRouter();
	expect(router.deflateString('1111111111')).toBe('1e10q');
	expect(router.deflateString('111')).toBe('111');
	expect(router.deflateString('1111100000')).toBe('1e5q0e5q');
	expect(router.deflateString('1010')).toBe('1010');
});

it('inflateString invierte deflateString (ida y vuelta)', () => {
	const router = new SelectedInfoRouter();
	for (const original of ['1111111111', '111', '1111100000', '1010', '0000000001']) {
		expect(router.inflateString(router.deflateString(original))).toBe(original);
	}
});

describe('SelectedInfoRouter: piezas de serialización');

it('Boolean serializa a 1/0 tratando "0" como falso', () => {
	const router = new SelectedInfoRouter();
	expect(router.Boolean(true)).toBe('1');
	expect(router.Boolean(false)).toBe('0');
	expect(router.Boolean('0')).toBe('0');
	expect(router.Boolean(1)).toBe('1');
});

it('ParseRanking interpreta tamaño y dirección con defaults y topes', () => {
	const router = new SelectedInfoRouter();
	expect(router.ParseRanking(null)).toEqual({ Size: 10, Direction: 'D', Show: false });
	expect(router.ParseRanking('A')).toEqual({ Size: 10, Direction: 'A', Show: true });
	expect(router.ParseRanking('25D')).toEqual({ Size: 25, Direction: 'D', Show: true });
	// Fuera del rango 10..50 vuelve al default.
	expect(router.ParseRanking('99A').Size).toBe(10);
});

it('transformArrayListToKeyList arma el diccionario clave→valor', () => {
	const router = new SelectedInfoRouter();
	const list = [[123], ['v', 0], ['a', 2]];
	expect(router.transformArrayListToKeyList(list)).toEqual({ '': 123, v: 0, a: 2 });
});

it('VariablesToRoute emite visibilidad por variable y comprime solo si hay ocultas', () => {
	setupWindow();
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({
				Variables: [
					makeVariable({ Visible: true }),
					makeVariable({
						Visible: true,
						ValueLabels: [makeValueLabel(), makeValueLabel({ Visible: false }), makeValueLabel()],
					}),
				],
			})],
		})],
	});
	const metric = new ActiveSelectedMetric(properties);
	const router = new SelectedInfoRouter();
	// Primera variable: todo visible -> solo el flag "1". Segunda: "1" + "101".
	expect(router.VariablesToRoute(metric)).toBe('1,1101');
});

describe('SelectedInfoRouter: serialización de una métrica completa');

it('con todo en defaults la ruta queda en Id, versión y flags de variables', () => {
	const segMap = setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties({ Metric: { Id: 42, Name: 'X', Signature: 's' } }));
	segMap.Metrics = { metrics: [metric] };
	const router = new SelectedInfoRouter();
	const saveRoute = new SaveRoute();
	// callSubscriber aplica la omisión de defaults sobre los pares
	// [clave, valor, default]. El bloque w (visibilidad de variables) se emite
	// igual con una variable visible: su "default omitible" es la cadena vacía.
	expect(saveRoute.callSubscriber(router)).toBe('42!v0!w1');
});

it('los desvíos del default sí se serializan (nivel, variable, métrica de resumen)', () => {
	const segMap = setupWindow();
	const properties = makeMetricProperties({
		Metric: { Id: 42, Name: 'X', Signature: 's' },
		SummaryMetric: 'I',
		Versions: [makeVersion({
			Levels: [
				makeLevel({ Variables: [makeVariable(), makeVariable()] }),
				makeLevel({ Variables: [makeVariable(), makeVariable()] }),
			],
		})],
	});
	const metric = new ActiveSelectedMetric(properties);
	metric.properties.Versions[0].SelectedLevelIndex = 1;
	metric.properties.Versions[0].SelectedMultiLevelIndex = 1;
	metric.properties.Versions[0].Levels[1].SelectedVariableIndex = 1;
	segMap.Metrics = { metrics: [metric] };
	const route = new SaveRoute().callSubscriber(new SelectedInfoRouter());
	expect(route.includes('42')).toBeTruthy();
	expect(route.includes('!a1')).toBeTruthy();
	expect(route.includes('!i1')).toBeTruthy();
	expect(route.includes('!mI')).toBeTruthy();
	// El multinivel coincide con el nivel: se omite.
	expect(route.includes('!q')).toBeFalsy();
});

it('GetVersions emite un índice, o dos si la comparación está activa', () => {
	setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties());
	const router = new SelectedInfoRouter();
	expect('' + router.GetVersions(metric)).toBe('0');
	metric.Compare = { Active: true, SelectedVersionIndex: 1 };
	expect(router.GetVersions(metric)).toBe('1,0');
});

describe('RestoreRoute: parsing genérico por bloques');

it('parsea el bloque de métricas en grupos clave→valor', () => {
	setupWindow();
	const restore = new RestoreRoute();
	const parsed = restore.parseRoute('#/@-34.6,-58.4,12z/l=123!v0!a1;456!i2', new SelectedInfoRouter());
	expect(parsed).toHaveLength(2);
	expect(parsed[0]).toEqual({ '': '123', v: '0', a: '1' });
	expect(parsed[1]).toEqual({ '': '456', i: '2' });
});

it('parsea el bloque de frame como lista posicional', () => {
	setupWindow();
	const restore = new RestoreRoute();
	const parsed = restore.parseRoute('#/@-34.61,-58.42,12z&l=1', new FrameRouter());
	expect(parsed).toEqual(['-34.61', '-58.42', '12z']);
});

it('devuelve null si la ruta no trae el bloque del router', () => {
	setupWindow();
	const restore = new RestoreRoute();
	expect(restore.parseRoute('#/l=123', new FrameRouter())).toBeNull();
});

describe('FrameRouter: interpretación del frame');

it('frameFromRoute arma centro y zoom', () => {
	const frameRouter = new FrameRouter();
	const frame = frameRouter.frameFromRoute(['-34.61', '-58.42', '12z']);
	expect(frame.Center.Lat).toBeCloseTo(-34.61, 4);
	expect(frame.Center.Lon).toBeCloseTo(-58.42, 4);
	expect(frame.Zoom).toBe(12);
	expect(frame.MapTypeLegacy).toBeFalsy();
});

it('sin zoom asume 14; con cuarto argumento interpreta el formato legacy', () => {
	const frameRouter = new FrameRouter();
	expect(frameRouter.frameFromRoute(['-34.61', '-58.42']).Zoom).toBe(14);
	const legacy = frameRouter.frameFromRoute(['-34.61', '-58.42', '12z', 'sn']);
	expect(legacy.MapTypeLegacy).toBeTruthy();
	expect(legacy.MapType).toBe('s');
	expect(legacy.ShowLabels).toBeFalsy();
});

describe('SaveRoute: omisión de defaults');

it('appendValue omite el valor cuando coincide con su default', () => {
	const saveRoute = new SaveRoute();
	expect(saveRoute.appendValue(['a', 1, 0])).toBe('a1');
	expect(saveRoute.appendValue(['a', 0, 0])).toBe('');
	expect(saveRoute.appendValue(['t', 'b'])).toBe('tb');
	expect(saveRoute.appendValue([123])).toBe('123');
});

describe('SelectedInfoRouter: boundary — serialización (color y ancho ya no se persisten)');

function makeBoundary(overrides) {
	setupWindow();
	return new ActiveBoundary(makeBoundaryProperties(overrides));
}

it('con todo en default, omite LabelsCollapsed/customPattern/visibilidad de ValueLabels', () => {
	const segMap = setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({ Id: 42 }));
	segMap.Metrics = { metrics: [boundary] };
	const router = new SelectedInfoRouter();
	const saveRoute = new SaveRoute();
	expect(saveRoute.callSubscriber(router)).toBe('42!tb');
});

it('con showDescriptions activado (desvío del nuevo default: no mostrarlas), sí lo serializa', () => {
	const segMap = setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({ Id: 42 }));
	boundary.showDescriptions = true;
	segMap.Metrics = { metrics: [boundary] };
	const router = new SelectedInfoRouter();
	const saveRoute = new SaveRoute();
	expect(saveRoute.callSubscriber(router)).toBe('42!tb!d1');
});

it('con LabelsCollapsed y customPattern activos, sí los serializa', () => {
	const segMap = setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({ Id: 42 }));
	boundary.SelectedVersion().LabelsCollapsed = true;
	boundary.customPattern = 0;
	segMap.Metrics = { metrics: [boundary] };
	const router = new SelectedInfoRouter();
	const saveRoute = new SaveRoute();
	expect(saveRoute.callSubscriber(router)).toBe('42!tb!c1!p0');
});

it('con ShowChart apagado y summaryMetric distinto del default, los serializa (h y m)', () => {
	const segMap = setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({ Id: 42 }));
	boundary.ShowChart = false;
	boundary.summaryMetric = 'K';
	segMap.Metrics = { metrics: [boundary] };
	const router = new SelectedInfoRouter();
	const saveRoute = new SaveRoute();
	expect(saveRoute.callSubscriber(router)).toBe('42!tb!h0!mK');
});

it('parseBoundary interpreta ShowChart y SummaryMetric', () => {
	const router = new SelectedInfoRouter();
	const parsed = router.parseBoundary({ '': '77', h: '0', m: 'K' });
	expect(parsed.ShowChart).toBeFalsy();
	expect(parsed.SummaryMetric).toBe('K');
});

it('RestoreBoundaryState aplica ShowChart y SummaryMetric sin marcar mapChanged (no dibujan el mapa)', () => {
	const segMap = setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: [makeBoundaryValueLabel({ Id: 501 })] })],
	}));
	const router = new SelectedInfoRouter();
	const state = {
		VersionInfo: '0', Visible: true, ShowDescriptions: false,
		CustomPattern: '', LabelsCollapsed: false, ValueLabelStates: '',
		ShowChart: false, SummaryMetric: 'K',
	};
	const changed = router.RestoreBoundaryState(boundary, state);
	expect(boundary.ShowChart).toBeFalsy();
	expect(boundary.summaryMetric).toBe('K');
	expect(changed).toBeFalsy();
});

it('serializa el índice de versión real (properties.SelectedVersionIndex, no un campo de la Version)', () => {
	const segMap = setupWindow();
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Id: 42,
		SelectedVersionIndex: 1,
		Versions: [makeBoundaryVersion(), makeBoundaryVersion()],
	}));
	segMap.Metrics = { metrics: [boundary] };
	const router = new SelectedInfoRouter();
	const saveRoute = new SaveRoute();
	expect(saveRoute.callSubscriber(router)).toBe('42!tb!a1');
});

it('BoundaryValueLabelsToRoute comprime la visibilidad, mismo mecanismo que VariablesToRoute', () => {
	const boundary = makeBoundary();
	boundary.SelectedVersion().ValueLabels[1].Visible = false;
	const router = new SelectedInfoRouter();
	expect(router.BoundaryValueLabelsToRoute(boundary)).toBe(router.deflateString('10'));
});

it('con todas las categorías visibles, BoundaryValueLabelsToRoute devuelve vacío', () => {
	const boundary = makeBoundary();
	const router = new SelectedInfoRouter();
	expect(router.BoundaryValueLabelsToRoute(boundary)).toBe('');
});

describe('SelectedInfoRouter: boundary — parseo y restauración');

it('parseBoundary interpreta LabelsCollapsed, CustomPattern y ValueLabelStates', () => {
	const router = new SelectedInfoRouter();
	const parsed = router.parseBoundary({ '': '77', c: '1', p: '0', w: router.deflateString('10') });
	expect(parsed.LabelsCollapsed).toBeTruthy();
	expect(parsed.CustomPattern).toBe(0);
	expect(parsed.ValueLabelStates).toBe('10');
});

it('parseBoundary ya no expone Color ni BorderWidth', () => {
	const router = new SelectedInfoRouter();
	const parsed = router.parseBoundary({ '': '77' });
	expect('Color' in parsed).toBeFalsy();
	expect('BorderWidth' in parsed).toBeFalsy();
});

it('RestoreBoundaryState aplica la visibilidad de cada ValueLabel según ValueLabelStates', () => {
	const boundary = makeBoundary();
	const router = new SelectedInfoRouter();
	const state = {
		VersionInfo: '0', Visible: true, ShowDescriptions: true,
		CustomPattern: 0, LabelsCollapsed: true, ValueLabelStates: '10',
	};
	const changed = router.RestoreBoundaryState(boundary, state);
	expect(changed).toBeTruthy();
	expect(boundary.SelectedVersion().LabelsCollapsed).toBeTruthy();
	expect(boundary.customPattern).toBe(0);
	expect(boundary.SelectedVersion().ValueLabels[0].Visible).toBeTruthy();
	expect(boundary.SelectedVersion().ValueLabels[1].Visible).toBeFalsy();
});

it('RestoreBoundaryState usa Vue.set para LabelsCollapsed (no viene preexistente en el payload)', () => {
	const boundary = makeBoundary();
	const router = new SelectedInfoRouter();
	const state = {
		VersionInfo: '0', Visible: true, ShowDescriptions: true,
		CustomPattern: '', LabelsCollapsed: true, ValueLabelStates: '',
	};
	const callsBefore = VueStub.calls.length;
	router.RestoreBoundaryState(boundary, state);
	expect(VueStub.calls.length).toBe(callsBefore + 1);
	expect(VueStub.calls[VueStub.calls.length - 1].key).toBe('LabelsCollapsed');
});
