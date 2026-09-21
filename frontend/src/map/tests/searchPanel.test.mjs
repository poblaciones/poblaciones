import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import SearchPanel from '@/map/components/widgets/sideToolbar/searchPanel.vue';

// Mock de window.SegMap.Recents: expone los 4 datos que consulta el panel
// (GetRecents/GetGroupedRecents), y Remove modifica de verdad la lista
// interna para poder verificar que una eliminación se refleja al refrescar.
function makeRecentsMock(items, groups) {
	const removeCalls = [];
	let currentItems = (items || []).slice();
	return {
		removeCalls,
		GetRecents(limit) {
			if (limit === null || limit === undefined) {
				return currentItems.slice();
			} else {
				return currentItems.slice(0, limit);
			}
		},
		GetGroupedRecents() {
			return groups || [];
		},
		Remove(dedupeKey) {
			removeCalls.push(dedupeKey);
			currentItems = currentItems.filter(function (existing) {
				return existing.DedupeKey !== dedupeKey;
			});
		},
	};
}

function mountSearchPanel(recentsItems, recentsGroups) {
	const segMap = setupWindow();
	segMap.Recents = makeRecentsMock(recentsItems, recentsGroups);
	segMap.AddMetricById = function (id) { segMap.calledAddMetricById = id; };
	segMap.AddBoundaryById = function (id) { segMap.calledAddBoundaryById = id; };
	segMap.Clipping.SetClippingRegion = function (ids, moveCenter, clipForZoomOnly, appendSelection) {
		segMap.calledSetClippingRegion = { ids, moveCenter, clipForZoomOnly, appendSelection };
	};
	segMap.InfoWindow.InfoRequestedInteractive = function (position, parent, fid) {
		segMap.calledInfoRequestedInteractive = { position, parent, fid };
	};
	return { panel: mountLite(SearchPanel), segMap };
}

describe('searchPanel: getResultIcon usa el Type real de los resultados de búsqueda (F/L/C/B/P)');

it('mapea cada Type a un ícono propio', () => {
	const { panel } = mountSearchPanel();
	expect(panel.getResultIcon({ Type: 'F' })).toBe('fas fa-map-marker-alt');
	expect(panel.getResultIcon({ Type: 'L' })).toBe('fas fa-chart-bar');
	expect(panel.getResultIcon({ Type: 'C' })).toBe('fas fa-draw-polygon');
	expect(panel.getResultIcon({ Type: 'B' })).toBe('fas fa-map');
	expect(panel.getResultIcon({ Type: 'P' })).toBe('fas fa-location-arrow');
});

it('un Type desconocido cae a un ícono genérico', () => {
	const { panel } = mountSearchPanel();
	expect(panel.getResultIcon({ Type: 'X' })).toBe('fas fa-circle');
});

describe('searchPanel: visibilidad de la sección de recientes');

it('showRecents es true sin texto tecleado (incluso con espacios)', () => {
	const { panel } = mountSearchPanel();
	panel.searchText = '   ';
	expect(panel.showRecents).toBeTruthy();
});

it('showRecents es false una vez que se tipeó texto', () => {
	const { panel } = mountSearchPanel();
	panel.searchText = 'Rosario';
	expect(panel.showRecents).toBeFalsy();
});

describe('searchPanel: refreshRecents pide los datos a ActiveRecents de forma explícita');

it('puebla recentsList y recentsGroups a partir de Recents.GetRecents/GetGroupedRecents', () => {
	const items = [1, 2, 3, 4, 5].map(n => ({ DedupeKey: 'k' + n, Caption: 'Item ' + n }));
	const groups = [{ Label: 'Hoy', Items: [items[0]] }];
	const { panel } = mountSearchPanel(items, groups);

	expect(panel.recentsList).toHaveLength(0);
	panel.refreshRecents();
	expect(panel.recentsList).toHaveLength(5);
	expect(panel.recentsGroups).toEqual(groups);
});

it('recentsPreview ofrece como máximo 4, y hasMoreRecents indica si hay más', () => {
	const items = [1, 2, 3, 4, 5].map(n => ({ DedupeKey: 'k' + n, Caption: 'Item ' + n }));
	const { panel } = mountSearchPanel(items);
	panel.refreshRecents();
	expect(panel.recentsPreview).toHaveLength(4);
	expect(panel.hasMoreRecents).toBeTruthy();
});

it('hasMoreRecents es false con 4 recientes o menos', () => {
	const items = [1, 2, 3].map(n => ({ DedupeKey: 'k' + n, Caption: 'Item ' + n }));
	const { panel } = mountSearchPanel(items);
	panel.refreshRecents();
	expect(panel.hasMoreRecents).toBeFalsy();
});

it('el watcher de isOpen refresca los recientes al abrir el panel', () => {
	const items = [{ DedupeKey: 'a', Caption: 'A' }];
	const { panel } = mountSearchPanel(items);
	expect(panel.recentsList).toHaveLength(0);

	SearchPanel.watch.isOpen.call(panel, true, false);
	expect(panel.recentsList).toHaveLength(1);
});

describe('searchPanel: recentsExpandedRows aplana los grupos para un único v-for');

it('antepone una fila de separador a cada grupo con Label, y ninguna a los que no tienen', () => {
	const groups = [
		{ Label: 'Hoy', Items: [{ DedupeKey: 'a', Caption: 'A' }] },
		{ Label: null, Items: [{ DedupeKey: 'b', Caption: 'B' }, { DedupeKey: 'c', Caption: 'C' }] },
	];
	const { panel } = mountSearchPanel([], groups);
	panel.refreshRecents();
	const rows = panel.recentsExpandedRows;
	expect(rows).toHaveLength(4);
	expect(rows[0].IsLabel).toBeTruthy();
	expect(rows[0].Label).toBe('Hoy');
	expect(rows[1].IsLabel).toBeFalsy();
	expect(rows[1].Item.Caption).toBe('A');
	expect(rows[2].IsLabel).toBeFalsy();
	expect(rows[2].Item.Caption).toBe('B');
	expect(rows[3].IsLabel).toBeFalsy();
	expect(rows[3].Item.Caption).toBe('C');
});

describe('searchPanel: selectRecent reabre el ítem según su Type, reusando el camino de negocio de SelectId');

it('metric: llama a SegMap.AddMetricById con el MetricId del payload', () => {
	const { panel, segMap } = mountSearchPanel();
	panel.selectRecent({ Type: 'metric', Payload: { MetricId: 42 } });
	expect(segMap.calledAddMetricById).toBe(42);
});

it('boundary: llama a SegMap.AddBoundaryById con el BoundaryId del payload', () => {
	const { panel, segMap } = mountSearchPanel();
	panel.selectRecent({ Type: 'boundary', Payload: { BoundaryId: 7 } });
	expect(segMap.calledAddBoundaryById).toBe(7);
});

it('clippingRegion: llama a Clipping.SetClippingRegion con los RegionIds, reemplazando la selección', () => {
	const { panel, segMap } = mountSearchPanel();
	panel.selectRecent({ Type: 'clippingRegion', Payload: { RegionIds: [3, 5] } });
	expect(segMap.calledSetClippingRegion.ids).toEqual([3, 5]);
	expect(segMap.calledSetClippingRegion.appendSelection).toBeFalsy();
});

it('location: llama a InfoWindow.InfoRequestedInteractive con la coordenada guardada y el payload como key', () => {
	const { panel, segMap } = mountSearchPanel();
	panel.selectRecent({ Type: 'location', Lat: -32.9, Lon: -60.6, Payload: { MetricId: 1, VariableId: 2, Id: 99 } });
	expect(segMap.calledInfoRequestedInteractive.position).toEqual({ Coordinate: { Lat: -32.9, Lon: -60.6 } });
	expect(segMap.calledInfoRequestedInteractive.fid).toBe(99);
});

it('cierra el panel después de reabrir un reciente', () => {
	const { panel } = mountSearchPanel();
	panel.selectRecent({ Type: 'metric', Payload: { MetricId: 1 } });
	expect(panel.$emitted).toHaveLength(1);
	expect(panel.$emitted[0].event).toBe('close');
});

describe('searchPanel: removeRecent');

it('delega en Recents.Remove con el DedupeKey del ítem, y refresca recentsList', () => {
	const items = [{ DedupeKey: 'metric:1', Caption: 'Uno' }, { DedupeKey: 'metric:2', Caption: 'Dos' }];
	const { panel, segMap } = mountSearchPanel(items);
	panel.refreshRecents();
	expect(panel.recentsList).toHaveLength(2);

	panel.removeRecent({ DedupeKey: 'metric:1' });
	expect(segMap.Recents.removeCalls).toEqual(['metric:1']);
	expect(panel.recentsList).toHaveLength(1);
	expect(panel.recentsList[0].DedupeKey).toBe('metric:2');
});
