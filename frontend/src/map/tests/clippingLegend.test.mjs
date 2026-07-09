import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import ClippingLegend from '@/map/components/widgets/map/clippingLegend.vue';

// Caracterización de clippingLegend: mismos datos que el bloque superior de
// widgets/summary/clipping.vue (population, households, areaKm2, regiones
// seleccionadas), coordinado con mapLegend por toolbarStates.collapsed y
// toolbarStates.legendMinimized (mismo estado compartido que mapLegend.minimized).

function makeClipping(overrides) {
	return Object.assign({
		Region: {
			SelectedLevelIndex: 0,
			Levels: [{ Id: 1, Revision: '2010' }, { Id: 2, Revision: '2022' }],
			Summary: {
				Population: 27136,
				Households: 10230,
				AreaKm2: 3340,
				Regions: [{ Id: 9, Name: 'Las Flores', TypeName: 'Partido' }],
			},
		},
	}, overrides);
}

function mountClippingLegend(clipping, collapsed, legendMinimized) {
	setupWindow();
	return mountLite(ClippingLegend, { props: { clipping: clipping, toolbarStates: { collapsed: collapsed, legendMinimized: !!legendMinimized } } });
}

describe('clippingLegend: visibilidad, coordinada con mapLegend');

it('se muestra con el panel de estadísticas colapsado, la leyenda expandida y clipping activo', () => {
	const legend = mountClippingLegend(makeClipping(), true, false);
	expect(legend.visible).toBeTruthy();
});

it('no se muestra con el panel de estadísticas visible', () => {
	const legend = mountClippingLegend(makeClipping(), false, false);
	expect(legend.visible).toBeFalsy();
});

it('no se muestra con la leyenda minimizada, aunque el panel de estadísticas esté colapsado', () => {
	const legend = mountClippingLegend(makeClipping(), true, true);
	expect(legend.visible).toBeFalsy();
});

it('no se muestra sin clipping activo (sin Summary)', () => {
	const legend = mountClippingLegend({ Region: { Levels: [], Summary: null } }, true, false);
	expect(legend.visible).toBeFalsy();
});

it('no se muestra en pantallas chicas, aunque el resto de las condiciones se cumplan', () => {
	setupWindow();
	const legend = mountLite(ClippingLegend, {
		isMobile: true,
		props: { clipping: makeClipping(), toolbarStates: { collapsed: true, legendMinimized: false } },
	});
	ClippingLegend.mounted.call(legend);
	expect(legend.visible).toBeFalsy();
});

describe('clippingLegend: regiones seleccionadas (defensivo ante Summary ausente)');

it('expone las regiones del summary', () => {
	const legend = mountClippingLegend(makeClipping(), true, false);
	expect(legend.regions).toHaveLength(1);
	expect(legend.regions[0].Name).toBe('Las Flores');
});

it('sin Summary, regions es un array vacío en vez de lanzar', () => {
	const legend = mountClippingLegend({ Region: { Levels: [], Summary: null } }, true, false);
	expect(legend.regions).toEqual([]);
});

it('sin ninguna región seleccionada (selección libre), regions es vacío', () => {
	const clipping = makeClipping();
	clipping.Region.Summary.Regions = [];
	const legend = mountClippingLegend(clipping, true, false);
	expect(legend.regions).toEqual([]);
});

it('al quitar la última selección, Regions puede seguir trayendo un elemento sin Name: no cuenta como región', () => {
	// Mismo criterio que clipping.vue:hasSummaryName (Regions[0].Name truthy).
	const clipping = makeClipping();
	clipping.Region.Summary.Regions = [{ Id: 0, Name: '' }];
	const legend = mountClippingLegend(clipping, true, false);
	expect(legend.regions).toEqual([]);
});

describe('clippingLegend: texto de tipo (clippingBlockHeader)');

it('regionType toma el TypeName de la primera región, igual que clipping.vue', () => {
	const legend = mountClippingLegend(makeClipping(), true, false);
	expect(legend.regionType).toBe('Partido');
});

it('sin regiones, regionType es null', () => {
	const clipping = makeClipping();
	clipping.Region.Summary.Regions = [];
	const legend = mountClippingLegend(clipping, true, false);
	expect(legend.regionType).toBeNull();
});

describe('clippingLegend: quitar una región seleccionada');

it('removeRegion, sin círculo activo, llama a ResetClippingRegion con el Id de la región', () => {
	const segMap = setupWindow();
	let calledWith = null;
	segMap.Clipping.FrameHasClippingCircle = function () { return false; };
	segMap.Clipping.ResetClippingRegion = function (id) { calledWith = id; };
	const legend = mountLite(ClippingLegend, { props: { clipping: makeClipping(), toolbarStates: { collapsed: true, legendMinimized: false } } });
	legend.removeRegion({ Id: 9, Name: 'Las Flores' });
	expect(calledWith).toBe(9);
});

it('removeRegion, con círculo activo, llama a ResetClippingCircle en su lugar', () => {
	const segMap = setupWindow();
	let circleCalled = false;
	let regionCalled = false;
	segMap.Clipping.FrameHasClippingCircle = function () { return true; };
	segMap.Clipping.ResetClippingCircle = function () { circleCalled = true; };
	segMap.Clipping.ResetClippingRegion = function () { regionCalled = true; };
	const legend = mountLite(ClippingLegend, { props: { clipping: makeClipping(), toolbarStates: { collapsed: true, legendMinimized: false } } });
	legend.removeRegion({ Id: 9, Name: 'Las Flores' });
	expect(circleCalled).toBeTruthy();
	expect(regionCalled).toBeFalsy();
});

describe('clippingLegend: separador entre regiones');

it('separatorFor devuelve coma solo entre elementos, no después del último', () => {
	const legend = mountClippingLegend(makeClipping({ Region: { Levels: [], Summary: { Regions: [{ Id: 1, Name: 'A' }, { Id: 2, Name: 'B' }] } } }), true, false);
	expect(legend.separatorFor(0)).toBe(', ');
	expect(legend.separatorFor(1)).toBe('');
});

describe('clippingLegend: datos numéricos (mismos que widgets/summary/clipping.vue)');

it('expone población, hogares y área desde el Summary', () => {
	const legend = mountClippingLegend(makeClipping(), true, false);
	expect(legend.population).toBe(27136);
	expect(legend.households).toBe(10230);
	expect(legend.areaKm2).toBe(3340);
});

it('sin Summary, los tres datos caen a 0', () => {
	const legend = mountClippingLegend({ Region: { Levels: [], Summary: null } }, true, false);
	expect(legend.population).toBe(0);
	expect(legend.households).toBe(0);
	expect(legend.areaKm2).toBe(0);
});

describe('clippingLegend: minimized es el mismo estado que toolbarStates.legendMinimized');

it('lee y escribe sobre toolbarStates.legendMinimized (compartido con mapLegend)', () => {
	const toolbarStates = { collapsed: true, legendMinimized: false };
	setupWindow();
	const legend = mountLite(ClippingLegend, { props: { clipping: makeClipping(), toolbarStates: toolbarStates } });
	expect(legend.minimized).toBeFalsy();
	legend.minimized = true;
	expect(toolbarStates.legendMinimized).toBeTruthy();
});

describe('clippingLegend: versión (año de la revisión censal seleccionada)');

it('toma el Revision del nivel seleccionado, mismo dato que el sourceRow de clipping.vue', () => {
	const legend = mountClippingLegend(makeClipping(), true, false);
	expect(legend.clippingVersion).toBe('2010');
});

it('sigue SelectedLevelIndex al cambiar de revisión', () => {
	const clipping = makeClipping();
	clipping.Region.SelectedLevelIndex = 1;
	const legend = mountClippingLegend(clipping, true, false);
	expect(legend.clippingVersion).toBe('2022');
});

it('sin niveles, clippingVersion es null', () => {
	const clipping = makeClipping({ Region: { SelectedLevelIndex: 0, Levels: [], Summary: makeClipping().Region.Summary } });
	const legend = mountClippingLegend(clipping, true, false);
	expect(legend.clippingVersion).toBeNull();
});
