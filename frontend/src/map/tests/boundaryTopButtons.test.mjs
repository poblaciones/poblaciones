import { describe, it, expect } from './_harness.mjs';
import { setupWindow, makeBoundaryProperties, makeBoundaryVersion, makeBoundaryValueLabel, mountLite } from './fixtures.mjs';
import ActiveBoundary from '@/map/classes/ActiveBoundary';
import BoundaryTopButtons from '@/map/components/widgets/summary/boundaryTopButtons.vue';

// Análogo reducido de metricDropdown.vue: mismo mecanismo (mp-dropdown-menu
// con items/keys), pero sin Rankings, Filtro, Mostrar valores ni Zoom al
// indicador (pedido explícito), y con Personalizar en vez de un botón directo.

function makeBoundary(valueLabels) {
	setupWindow();
	const properties = makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: valueLabels || [makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })] })],
	});
	return new ActiveBoundary(properties);
}

function mount(boundary) {
	return mountLite(BoundaryTopButtons, { props: { boundary: boundary } });
}

describe('boundaryTopButtons: opciones del menú (sin rankings/filtro/mostrar valores/zoom)');

it('incluye Personalizar, Fuente, Descargar y Quitar', () => {
	const boundary = makeBoundary();
	const panel = mount(boundary);
	const keys = panel.menuItems.map(i => i.key).filter(Boolean);
	expect(keys.includes('SETTINGS')).toBeTruthy();
	expect(keys.includes('SOURCE')).toBeTruthy();
	expect(keys.includes('DOWNLOAD')).toBeTruthy();
	expect(keys.includes('REMOVE')).toBeTruthy();
});

it('incluye Mostrar/Ocultar descripciones, con la etiqueta según el estado actual', () => {
	const boundary = makeBoundary();
	const panel = mount(boundary);
	expect(boundary.showDescriptions).toBeFalsy();
	expect(panel.menuItems.find(i => i.key === 'DESCRIPTIONS').label).toBe('Mostrar descripciones');
	boundary.showDescriptions = true;
	expect(panel.menuItems.find(i => i.key === 'DESCRIPTIONS').label).toBe('Ocultar descripciones');
});

it('no incluye rankings, filtro, mostrar valores ni zoom', () => {
	const boundary = makeBoundary();
	const panel = mount(boundary);
	const keys = panel.menuItems.map(i => i.key).filter(Boolean);
	expect(keys.includes('RANKINGS')).toBeFalsy();
	expect(keys.includes('SHOWVALUES')).toBeFalsy();
	expect(keys.includes('EXTENTS')).toBeFalsy();
	expect(panel.menuItems.some(i => i.label === 'Filtro')).toBeFalsy();
});

it('el gráfico solo se ofrece si useChart() es true (más de una categoría)', () => {
	const multi = makeBoundary();
	expect(mount(multi).menuItems.some(i => i.key === 'CHART')).toBeTruthy();
	const single = makeBoundary([makeBoundaryValueLabel({ Id: 501 })]);
	expect(mount(single).menuItems.some(i => i.key === 'CHART')).toBeFalsy();
});

it('Quitar no se ofrece si el boundary está bloqueado (IsLocked)', () => {
	const boundary = makeBoundary();
	boundary.IsLocked = true;
	const panel = mount(boundary);
	expect(panel.menuItems.some(i => i.key === 'REMOVE')).toBeFalsy();
});

describe('boundaryTopButtons: acciones del menú');

it('CHART togglea ShowChart y persiste la ruta', () => {
	const segMap = setupWindow();
	let routeUpdated = false;
	const boundary = new ActiveBoundary(makeBoundaryProperties({
		Versions: [makeBoundaryVersion({ ValueLabels: [makeBoundaryValueLabel({ Id: 501 }), makeBoundaryValueLabel({ Id: 502 })] })],
	}));
	segMap.SaveRoute.UpdateRoute = function () { routeUpdated = true; };
	const panel = mount(boundary);
	expect(boundary.ShowChart).toBeTruthy();
	panel.dropdownSelected({ key: 'CHART' });
	expect(boundary.ShowChart == 1).toBeFalsy();
	expect(routeUpdated).toBeTruthy();
});

it('DESCRIPTIONS togglea showDescriptions y refresca el mapa', () => {
	const boundary = makeBoundary();
	let updated = false;
	boundary.UpdateMap = function () { updated = true; };
	const panel = mount(boundary);
	expect(boundary.showDescriptions).toBeFalsy();
	panel.dropdownSelected({ key: 'DESCRIPTIONS' });
	expect(boundary.showDescriptions).toBeTruthy();
	expect(updated).toBeTruthy();
});

it('REMOVE delega en boundary.Remove()', () => {
	const boundary = makeBoundary();
	let removed = false;
	boundary.Remove = function () { removed = true; };
	const panel = mount(boundary);
	panel.dropdownSelected({ key: 'REMOVE' });
	expect(removed).toBeTruthy();
});

it('SETTINGS abre window.Popups.BoundaryCustomize', () => {
	const boundary = makeBoundary();
	let shownWith = null;
	window.Popups = { BoundaryCustomize: { show(b) { shownWith = b; } } };
	const panel = mount(boundary);
	panel.dropdownSelected({ key: 'SETTINGS' });
	expect(shownWith).toBe(boundary);
});
