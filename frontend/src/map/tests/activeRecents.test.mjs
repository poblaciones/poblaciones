import { describe, it, expect } from './_harness.mjs';
import { setupWindow } from './fixtures.mjs';
import ActiveRecents from '@/map/classes/ActiveRecents';

// Mock mínimo de localStorage: alcanza para ejercitar la persistencia de
// ActiveRecents sin depender de un navegador real.
function makeLocalStorage() {
	const store = {};
	return {
		getItem(key) {
			if (Object.prototype.hasOwnProperty.call(store, key)) {
				return store[key];
			} else {
				return null;
			}
		},
		setItem(key, value) {
			store[key] = value;
		},
	};
}

function makeRecents(localStorage) {
	setupWindow({ localStorage: localStorage || makeLocalStorage() });
	return new ActiveRecents();
}

describe('ActiveRecents: alta de recientes por origen');

it('RegisterMetric agrega un ítem tipo metric con el id como parte de la key', () => {
	const recents = makeRecents();
	recents.RegisterMetric(42, 'Población total');
	const items = recents.GetRecents();
	expect(items).toHaveLength(1);
	expect(items[0].Type).toBe(ActiveRecents.Types.Metric);
	expect(items[0].Caption).toBe('Población total');
	expect(items[0].Payload).toEqual({ MetricId: 42 });
});

it('RegisterBoundary agrega un ítem tipo boundary', () => {
	const recents = makeRecents();
	recents.RegisterBoundary(7, 'Rosario');
	const items = recents.GetRecents();
	expect(items[0].Type).toBe(ActiveRecents.Types.Boundary);
	expect(items[0].Payload).toEqual({ BoundaryId: 7 });
});

it('RegisterClippingRegion acepta un id suelto o un array de ids', () => {
	const recents = makeRecents();
	recents.RegisterClippingRegion([3, 5], 'Santa Fe, Córdoba');
	const items = recents.GetRecents();
	expect(items[0].Type).toBe(ActiveRecents.Types.ClippingRegion);
	expect(items[0].Payload).toEqual({ RegionIds: [3, 5] });
	expect(items[0].DedupeKey).toBe('clippingRegion:3,5');
});

it('RegisterLocation con un feature usa MetricId/VariableId/Id como key estable', () => {
	const recents = makeRecents();
	recents.RegisterLocation(
		{ MetricId: 1, VariableId: 2, LevelId: 3, Id: 99 },
		'Escuela N°1', -32.9, -60.6
	);
	const items = recents.GetRecents();
	expect(items[0].Type).toBe(ActiveRecents.Types.Location);
	expect(items[0].DedupeKey).toBe('location:feature:1:2:99');
	expect(items[0].Lat).toBe(-32.9);
	expect(items[0].Lon).toBe(-60.6);
});

it('RegisterLocation sin fid (coordenada suelta) redondea a 4 decimales para no duplicar por precisión', () => {
	const recents = makeRecents();
	recents.RegisterLocation({}, 'Un punto', -32.94444, -60.63333);
	recents.RegisterLocation({}, 'Otro punto muy cercano', -32.944449, -60.633334);
	expect(recents.GetRecents()).toHaveLength(1);
});

describe('ActiveRecents: deduplicación y orden');

it('al registrar de nuevo un ítem existente, queda solo la aparición más reciente al tope', () => {
	const recents = makeRecents();
	recents.RegisterMetric(1, 'Uno');
	recents.RegisterMetric(2, 'Dos');
	recents.RegisterMetric(1, 'Uno de nuevo');
	const items = recents.GetRecents();
	expect(items).toHaveLength(2);
	expect(items[0].Caption).toBe('Uno de nuevo');
	expect(items[1].Caption).toBe('Dos');
});

it('no guarda más de 100 ítems: el más viejo se descarta al superar el límite', () => {
	const recents = makeRecents();
	for (let n = 0; n < 101; n++) {
		recents.RegisterMetric(n, 'Metric ' + n);
	}
	const items = recents.GetRecents();
	expect(items).toHaveLength(100);
	expect(items[0].Payload.MetricId).toBe(100);
	expect(items[99].Payload.MetricId).toBe(1);
});

describe('ActiveRecents: GetRecents y Remove');

it('GetRecents(limit) devuelve como máximo esa cantidad, con el más reciente primero', () => {
	const recents = makeRecents();
	recents.RegisterMetric(1, 'Uno');
	recents.RegisterMetric(2, 'Dos');
	recents.RegisterMetric(3, 'Tres');
	const preview = recents.GetRecents(2);
	expect(preview).toHaveLength(2);
	expect(preview[0].Caption).toBe('Tres');
	expect(preview[1].Caption).toBe('Dos');
});

it('Remove elimina el ítem por DedupeKey y persiste el cambio', () => {
	const recents = makeRecents();
	recents.RegisterMetric(1, 'Uno');
	recents.RegisterMetric(2, 'Dos');
	recents.Remove('metric:1');
	expect(recents.GetRecents()).toHaveLength(1);
	expect(recents.GetRecents()[0].Payload.MetricId).toBe(2);
});

describe('ActiveRecents: agrupación por fecha (GetGroupedRecents)');

it('separa Hoy, Última semana y Último mes, sin mostrar un grupo vacío', () => {
	const recents = makeRecents();
	recents.RegisterMetric(1, 'De hoy');
	recents.RegisterMetric(2, 'De la última semana');
	recents.RegisterMetric(3, 'Del último mes');
	const ONE_DAY_MS = 24 * 60 * 60 * 1000;
	// Reubica manualmente el When de cada ítem para simular distintas fechas
	// (register() ya probó que se setea con Date.now(); acá se controla el
	// tiempo transcurrido, que es lo que agrupa GetGroupedRecents).
	const byCaption = {};
	for (const item of recents.GetRecents()) {
		byCaption[item.Caption] = item;
	}
	byCaption['De la última semana'].When -= 3 * ONE_DAY_MS;
	byCaption['Del último mes'].When -= 15 * ONE_DAY_MS;

	const groups = recents.GetGroupedRecents();
	expect(groups).toHaveLength(3);
	expect(groups[0].Label).toBe('Hoy');
	expect(groups[0].Items[0].Caption).toBe('De hoy');
	expect(groups[1].Label).toBe('Última semana');
	expect(groups[1].Items[0].Caption).toBe('De la última semana');
	expect(groups[2].Label).toBe('Último mes');
	expect(groups[2].Items[0].Caption).toBe('Del último mes');
});

it('los recientes de más de 30 días quedan en un grupo final sin encabezado (Label null)', () => {
	const recents = makeRecents();
	recents.RegisterMetric(1, 'Viejo');
	const ONE_DAY_MS = 24 * 60 * 60 * 1000;
	recents.GetRecents()[0].When -= 45 * ONE_DAY_MS;

	const groups = recents.GetGroupedRecents();
	expect(groups).toHaveLength(1);
	expect(groups[0].Label).toBeNull();
	expect(groups[0].Items[0].Caption).toBe('Viejo');
});

it('un grupo sin elementos no aparece en el resultado', () => {
	const recents = makeRecents();
	recents.RegisterMetric(1, 'Solo de hoy');
	const groups = recents.GetGroupedRecents();
	expect(groups).toHaveLength(1);
	expect(groups[0].Label).toBe('Hoy');
});

describe('ActiveRecents: persistencia en localStorage');

it('una nueva instancia recupera lo guardado por la anterior', () => {
	const storage = makeLocalStorage();
	const first = makeRecents(storage);
	first.RegisterMetric(1, 'Persistido');

	const second = makeRecents(storage);
	expect(second.GetRecents()).toHaveLength(1);
	expect(second.GetRecents()[0].Caption).toBe('Persistido');
});

it('sin localStorage disponible, arranca vacío y no rompe al registrar', () => {
	setupWindow({ localStorage: undefined });
	const recents = new ActiveRecents();
	recents.RegisterMetric(1, 'Efímero');
	expect(recents.GetRecents()).toHaveLength(1);
});
