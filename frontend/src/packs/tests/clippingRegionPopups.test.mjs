import { describe, it, expect } from './_harness.mjs';
import ClippingRegionGeographyPopup from '@/packs/views/ClippingRegions/ClippingRegionGeographyPopup.vue';
import GeographySelectionPopup from '@/packs/components/popups/GeographySelectionPopup.vue';
import ItemsListPopup from '@/packs/components/popups/ItemsListPopup.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, bodyOf,
	makeInvoker, makeStepper, preload,
} from './fixtures.mjs';

function idsOf(list) {
	const ret = [];
	for (const item of list) {
		ret.push(item.Id);
	}
	return ret;
}

function setupGeographyPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const stepper = makeStepper();
	const selectionPopup = mountLite(GeographySelectionPopup);
	const itemsPopup = mountLite(ItemsListPopup);
	const vm = mountLite(ClippingRegionGeographyPopup, { refs: { invoker, stepper, selectionPopup, itemsPopup } });
	return { env, vm, invoker, stepper, selectionPopup, itemsPopup };
}

function assoc(id, geographyId, caption, revision) {
	return { Id: id, Geography: { Id: geographyId, Caption: caption || 'Geo ' + geographyId, Revision: revision || null } };
}

describe('ClippingRegionGeographyPopup: created y título');

it('solo el administrador general edita', () => {
	expect(setupGeographyPopup('A').vm.canEdit).toBe(true);
	expect(setupGeographyPopup('E').vm.canEdit).toBe(false);
});

it('al crearse carga el listado completo de geografías', () => {
	const { env, vm } = setupGeographyPopup();
	const geographies = [{ Id: 1 }, { Id: 2 }];
	preload(env.context.Geographies, geographies);
	callHook(ClippingRegionGeographyPopup, vm, 'created');
	expect(vm.allGeographies).toBe(geographies);
});

it('dialogTitle nombra la región con su versión, o es genérico sin región', () => {
	const { vm } = setupGeographyPopup();
	expect(vm.dialogTitle).toBe('Geografías asociadas');
	vm.clippingRegion = { Caption: 'Provincias', Version: '2022' };
	expect(vm.dialogTitle).toBe('Geografías asociadas a Provincias, 2022');
	vm.clippingRegion = { Caption: 'Provincias', Version: null };
	expect(vm.dialogTitle).toBe('Geografías asociadas a Provincias');
});

describe('ClippingRegionGeographyPopup: carga');

it('show vacía las asociadas anteriores, se abre y pide las de la región', async () => {
	const { vm, invoker } = setupGeographyPopup();
	serve({ 'GET /services/packs/GetClippingRegionGeographies': [assoc(1, 10)] });
	vm.associated = [assoc(9, 99)];
	vm.show({ Id: 5, Caption: 'Provincias' });
	expect(vm.associated).toEqual([]);
	expect(vm.activateEdit).toBe(true);
	expect(invoker.message).toBe('Obteniendo geografías asociadas...');
	await settle();
	expect(axios.calls[0].config.params).toEqual({ r: 5 });
	expect(idsOf(vm.associated)).toEqual([1]);
});

it('calculationCompleted vuelve a pedir las asociadas', async () => {
	const { vm } = setupGeographyPopup();
	serve({ 'GET /services/packs/GetClippingRegionGeographies': [assoc(2, 10)] });
	vm.clippingRegion = { Id: 5 };
	vm.calculationCompleted();
	await settle();
	expect(idsOf(vm.associated)).toEqual([2]);
});

describe('ClippingRegionGeographyPopup: selección y cálculo');

it('formatGeography devuelve vacío sin geografía y agrega la revisión entre paréntesis', () => {
	const { vm } = setupGeographyPopup();
	expect(vm.formatGeography(null)).toBe('');
	expect(vm.formatGeography({ Caption: 'Provincias' })).toBe('Provincias');
	expect(vm.formatGeography({ Caption: 'Provincias', Revision: '2022' })).toBe('Provincias (2022)');
});

it('openSelection abre el selector con todas las geografías y los ids ya asociados', () => {
	const { vm, selectionPopup } = setupGeographyPopup();
	vm.allGeographies = [{ Id: 10, ParentId: null, Caption: 'A', RootCaption: null }, { Id: 20, ParentId: null, Caption: 'B', RootCaption: null }];
	vm.associated = [assoc(1, 10)];
	vm.openSelection();
	expect(selectionPopup.associatedIds).toEqual([10]);
	expect(selectionPopup.checkedIds).toEqual({ 10: true });
	expect(idsOf(selectionPopup.allGeographies)).toEqual([10, 20]);
});

it('onGeographiesSelected sin ids no inicia ningún proceso', () => {
	const { vm, stepper } = setupGeographyPopup();
	vm.clippingRegion = { Id: 5 };
	vm.onGeographiesSelected([]);
	expect(stepper.startUrl).toBe('');
	expect(axios.calls).toHaveLength(0);
});

it('onGeographiesSelected inicia el cálculo de intersecciones con la región y las geografías elegidas', async () => {
	const { vm, stepper } = setupGeographyPopup();
	serve({ 'GET /services/packs/StartCalculateClippingRegionGeography': { done: true } });
	vm.clippingRegion = { Id: 5 };
	vm.onGeographiesSelected([10, 20]);
	expect(stepper.startUrl).toBe('http://server.test/services/packs/StartCalculateClippingRegionGeography');
	expect(stepper.stepUrl).toBe('http://server.test/services/packs/StepCalculateClippingRegionGeography');
	expect(stepper.args).toEqual({ r: 5, g: '10,20' });
	await settle();
	expect(axios.calls[0].config.params).toEqual({ r: 5, g: '10,20' });
});

it('openItems abre el listado de intersecciones y pide los ítems por lotes', async () => {
	const { vm, itemsPopup } = setupGeographyPopup();
	serve({ 'GET /services/packs/GetClippingRegionGeographyIntersectionItems': { Items: [], Total: 0 } });
	vm.openItems(assoc(6, 10, 'Provincias', '2022'));
	expect(itemsPopup.title).toBe('Ítems de Provincias (2022)');
	expect(itemsPopup.columns.map(function (c) { return c.property; })).toEqual(['Caption', 'Code', 'IntersectionPercent', 'Id']);
	await settle();
	expect(axios.calls[0].config.params).toEqual({ c: 6, o: 0, l: 500 });
});

describe('ClippingRegionGeographyPopup: quitar asociación');

it('confirmRemoveAssociation pide confirmación y no elimina hasta que se acepta', () => {
	const { vm, invoker } = setupGeographyPopup();
	vm.confirmRemoveAssociation(assoc(1, 10));
	expect(invoker.confirmTitle).toBe('Quitar geografía');
	expect(invoker.confirmQuestion).toBe('La asociación y las intersecciones ya calculadas para esta geografía serán eliminadas.');
	expect(axios.calls).toHaveLength(0);
});

it('al aceptar elimina la asociación en el servidor y la quita de la lista', async () => {
	const { vm, invoker } = setupGeographyPopup();
	serve({ 'POST /services/packs/DeleteClippingRegionGeography': {} });
	const a = assoc(1, 10);
	const b = assoc(2, 20);
	vm.associated = [a, b];
	vm.confirmRemoveAssociation(a);
	invoker.confirmed();
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ i: '1' });
	expect(vm.associated).toEqual([b]);
});
