import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, makeVariable, makeValueLabel } from './fixtures.mjs';
import SelectedInfoRouter from '@/map/router/SelectedInfoRouter';
import FrameRouter from '@/map/router/FrameRouter';
import SaveRoute from '@/map/classes/SaveRoute';
import RestoreRoute from '@/map/classes/RestoreRoute';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';

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
