import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeBoundaryProperties } from './fixtures.mjs';
import nextLayerUid from '@/map/classes/LayerUid';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';
import ActiveBoundary from '@/map/classes/ActiveBoundary';

// El uid es la key del v-for del panel de estadísticas. Tiene que identificar
// a la capa concreta, no al indicador: si dos componentes distintos comparten
// key, Vue reusa uno contra la capa del otro y muestra datos ajenos.

describe('LayerUid: identidad de instancia de las capas');

it('nunca repite un valor', () => {
	const a = nextLayerUid();
	const b = nextLayerUid();
	expect(a === b).toBeFalsy();
	expect(b > a).toBeTruthy();
});

it('el mismo indicador agregado dos veces recibe uid distintos', () => {
	setupWindow();
	// Mismo Id de indicador, dos capas: es el caso de mirar 2010 en una y
	// 2022 en la otra.
	const unId = { Id: 42, Name: 'Población', Signature: 's' };
	const a = new ActiveSelectedMetric(makeMetricProperties({ Metric: unId }));
	const b = new ActiveSelectedMetric(makeMetricProperties({ Metric: unId }));
	expect(a.properties.Metric.Id).toBe(b.properties.Metric.Id);
	expect(a.uid === b.uid).toBeFalsy();
});

it('una delimitación consume el contador compartido, no uno propio', () => {
	setupWindow();
	// Comparar dos uids sueltos no sirve: con contadores separados igual
	// podrían diferir por estar desfasados. Lo que se verifica es que
	// construir la capa avance el mismo contador que usan los indicadores.
	const antes = nextLayerUid();
	new ActiveBoundary(makeBoundaryProperties());
	const despues = nextLayerUid();
	expect(despues - antes).toBe(2);
});

it('un indicador consume el contador compartido', () => {
	setupWindow();
	const antes = nextLayerUid();
	new ActiveSelectedMetric(makeMetricProperties());
	const despues = nextLayerUid();
	expect(despues - antes).toBe(2);
});

it('un indicador y una delimitación no comparten uid (conviven en la misma lista)', () => {
	setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties());
	const boundary = new ActiveBoundary(makeBoundaryProperties());
	expect(metric.uid === boundary.uid).toBeFalsy();
});

it('el uid de una capa no cambia al reordenarse la lista', () => {
	setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties());
	const original = metric.uid;
	metric.index = 5;
	expect(metric.uid).toBe(original);
});
