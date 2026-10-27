import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import StartupView from '@/backoffice/views/Customize/Startup.vue';

function setup(startupOverrides) {
	const browser = setupBackoffice('P');
	const work = {
		properties: { Startup: Object.assign({ Type: 'M', Center: null, Zoom: 5, ClippingRegionItemId: null }, startupOverrides) },
		Startup: { RegionCaption: null, RegionExtraInfo: null },
		UpdateStartup() {},
	};
	browser.window.Context.CurrentWork = work;
	const refs = {
		invoker: { saved: [], doSave(...args) { this.saved.push(args); } },
		searchPopup: { shown: 0, show() { this.shown++; } },
		Relocate: { shown: [], newLat: 1.5, newLon: 2.5, newZoom: 9, show(...args) { this.shown.push(args); } },
	};
	const vm = mountLite(StartupView, { mocks: { $refs: refs } });
	return { vm: vm, work: work, refs: refs };
}

describe('Startup: propiedades');

it('Startup son las opciones de inicio del trabajo', () => {
	const { vm, work } = setup();
	expect(vm.Startup === work.properties.Startup).toBeTruthy();
	expect(vm.latitud).toBe('');
});

it('Update graba las opciones de inicio', () => {
	const { vm, refs, work } = setup();
	vm.Update();
	expect(refs.invoker.saved[0][0] === work).toBeTruthy();
	expect(refs.invoker.saved[0][1] === work.UpdateStartup).toBeTruthy();
});

describe('Startup: región');

it('regionSelected guarda la región, pasa el inicio a región y graba', () => {
	const { vm, work, refs } = setup({ Type: 'M' });
	vm.regionSelected({ Id: 12, Caption: 'Tandil', Extra: 'Buenos Aires' });
	expect(work.properties.Startup.ClippingRegionItemId).toBe(12);
	expect(work.Startup.RegionCaption).toBe('Tandil');
	expect(work.Startup.RegionExtraInfo).toBe('Buenos Aires');
	expect(work.properties.Startup.Type).toBe('R');
	expect(refs.invoker.saved).toHaveLength(1);
});

it('regionSelected conserva el tipo si ya era región', () => {
	const { vm, work } = setup({ Type: 'R' });
	vm.regionSelected({ Id: 1, Caption: 'x', Extra: 'y' });
	expect(work.properties.Startup.Type).toBe('R');
});

it('search abre el buscador de regiones', () => {
	const { vm, refs } = setup();
	vm.search();
	expect(refs.searchPopup.shown).toBe(1);
});

describe('Startup: ubicación');

it('relocate parte del centro actual y su zoom', () => {
	const { vm, refs } = setup({ Center: { x: -58.4, y: -34.6 }, Zoom: 7 });
	vm.relocate();
	expect(refs.Relocate.shown).toEqual([[-34.6, -58.4, 7]]);
});

it('relocate sin centro parte de Buenos Aires', () => {
	const { vm, refs } = setup({ Center: null, Zoom: 4 });
	vm.relocate();
	expect(refs.Relocate.shown).toEqual([[-34.603722, -58.381592, 4]]);
});

it('relocated crea el centro si faltaba, toma posición y zoom, pasa el inicio a ubicación y graba', () => {
	const { vm, work, refs } = setup({ Center: null, Type: 'R' });
	vm.relocated();
	expect(work.properties.Startup.Center).toEqual({ srid: null, x: 2.5, y: 1.5 });
	expect(work.properties.Startup.Zoom).toBe(9);
	expect(work.properties.Startup.Type).toBe('L');
	expect(refs.invoker.saved).toHaveLength(1);
});

it('relocated conserva el centro existente y el tipo si ya era ubicación', () => {
	const center = { srid: 4326, x: 0, y: 0 };
	const { vm, work } = setup({ Center: center, Type: 'L' });
	vm.relocated();
	expect(work.properties.Startup.Center === center).toBeTruthy();
	expect(center).toEqual({ srid: 4326, x: 2.5, y: 1.5 });
	expect(work.properties.Startup.Type).toBe('L');
});
