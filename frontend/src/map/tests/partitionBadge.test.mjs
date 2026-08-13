import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeMetricProperties, makeVersion, makeLevel, mountLite } from './fixtures.mjs';
import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';
import Badge from '@/map/components/controls/mpPartitionBadge.vue';

// El combo de particiones muestra siempre el valor vigente, incluso cuando la
// instancia del componente se reusa entre métricas (summaryPanel usa el índice
// del array como key del v-for) o cuando el nivel seleccionado cambia con el
// zoom y trae otras particiones.

function conParticiones(valores) {
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [makeLevel({
				Partitions: {
					Name: 'Sector',
					Values: valores || [{ Value: 'T', Caption: 'Todos' }, { Value: 'P', Caption: 'Público' }],
				},
			})],
		})],
	});
	return new ActiveSelectedMetric(properties);
}

function mountBadge(metric) {
	return mountLite(Badge, { props: { metric: metric } });
}

describe('mpPartitionBadge: el valor mostrado');

it('sin particiones en el nivel, no ofrece el combo', () => {
	setupWindow();
	const badge = mountBadge(new ActiveSelectedMetric(makeMetricProperties()));
	expect(badge.LevelHasPartitions).toBeFalsy();
	expect(badge.selected).toBe('-');
});

it('con particiones y sin elección previa, rige la primera', () => {
	setupWindow();
	const badge = mountBadge(conParticiones());
	expect(badge.selected).toBe('Todos');
});

it('refleja la elección del usuario', () => {
	const segMap = setupWindow();
	segMap.UpdateMap = function () {};
	const metric = conParticiones();
	const badge = mountBadge(metric);
	badge.changeValue('P');
	expect(metric.properties.SelectedPartition).toBe('P');
	expect(badge.selected).toBe('Público');
});

it('si el valor guardado ya no está entre los posibles, rige el primero', () => {
	setupWindow();
	const metric = conParticiones();
	metric.properties.SelectedPartition = 'ZZ';
	const badge = mountBadge(metric);
	expect(badge.selected).toBe('Todos');
});

it('reusado con otra métrica, muestra la partición de esa métrica y no la anterior', () => {
	setupWindow();
	const sinParticiones = new ActiveSelectedMetric(makeMetricProperties());
	const badge = mountBadge(sinParticiones);
	expect(badge.selected).toBe('-');
	badge.metric = conParticiones();
	expect(badge.LevelHasPartitions).toBeTruthy();
	expect(badge.selected).toBe('Todos');
});

it('al cambiar el nivel seleccionado, sigue las particiones del nuevo nivel', () => {
	setupWindow();
	const properties = makeMetricProperties({
		Versions: [makeVersion({
			Levels: [
				makeLevel({ Partitions: { Name: 'Sector', Values: [{ Value: 'A', Caption: 'Alfa' }] } }),
				makeLevel({ Partitions: { Name: 'Sector', Values: [{ Value: 'B', Caption: 'Beta' }] } }),
			],
		})],
	});
	const metric = new ActiveSelectedMetric(properties);
	const badge = mountBadge(metric);
	expect(badge.selected).toBe('Alfa');
	metric.properties.Versions[0].SelectedLevelIndex = 1;
	expect(badge.selected).toBe('Beta');
});

describe('ActiveMetric: SelectedPartition existe desde la construcción');

it('se inicializa en null si el payload no la trae, para que Vue la observe', () => {
	setupWindow();
	const properties = makeMetricProperties();
	delete properties.SelectedPartition;
	const metric = new ActiveSelectedMetric(properties);
	expect('SelectedPartition' in metric.properties).toBeTruthy();
	expect(metric.properties.SelectedPartition).toBeNull();
});

it('respeta el valor que venga del payload', () => {
	setupWindow();
	const metric = new ActiveSelectedMetric(makeMetricProperties({ SelectedPartition: 'P' }));
	expect(metric.properties.SelectedPartition).toBe('P');
});
