import { describe, it, expect } from './_harness.mjs';
import ClippingRegionGeographyPopup from '@/packs/views/ClippingRegions/ClippingRegionGeographyPopup.vue';
import ClippingRegionBoundaryVersionsPopup from '@/packs/views/ClippingRegions/ClippingRegionBoundaryVersionsPopup.vue';
import BoundaryVersionSelectionPopup from '@/packs/views/ClippingRegions/BoundaryVersionSelectionPopup.vue';
import GeographySelectionPopup from '@/packs/components/popups/GeographySelectionPopup.vue';
import ItemsListPopup from '@/packs/components/popups/ItemsListPopup.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, bodyOf,
	makeInvoker, makeStepper, preload,
} from './fixtures.mjs';
import { describeEscapeHandling } from './_popupContracts.mjs';

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

// ---------------------------------------------------------------------

function setupVersionsPopup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const selectionPopup = mountLite(BoundaryVersionSelectionPopup);
	const vm = mountLite(ClippingRegionBoundaryVersionsPopup, { refs: { invoker, selectionPopup } });
	return { env, vm, invoker, selectionPopup };
}

describe('ClippingRegionBoundaryVersionsPopup: partes independientes del servidor');

it('solo el administrador general edita', () => {
	expect(setupVersionsPopup('A').vm.canEdit).toBe(true);
	expect(setupVersionsPopup('E').vm.canEdit).toBe(false);
});

it('dialogTitle nombra la región o es genérico sin región', () => {
	const { vm } = setupVersionsPopup();
	expect(vm.dialogTitle).toBe('Delimitaciones');
	vm.clippingRegion = { Caption: 'Provincias' };
	expect(vm.dialogTitle).toBe('Delimitaciones de Provincias');
});

it('openSelection abre el selector con las delimitaciones y los ids de versión ya asociados', () => {
	const { vm, selectionPopup } = setupVersionsPopup();
	vm.allBoundaries = [{ Id: 1, Level: 0, Caption: 'Radios' }, { Id: 11, Level: 1, Caption: 'v1' }];
	vm.associated = [{ BoundaryVersion: { Id: 11 } }];
	vm.openSelection();
	expect(selectionPopup.associatedIds).toEqual([11]);
	expect(selectionPopup.checkedIds).toEqual({ 11: true });
	expect(selectionPopup.groups.map(function (g) { return g.caption; })).toEqual(['Radios']);
});

it('onVersionsSelected sin ids no hace nada', () => {
	const { vm, invoker } = setupVersionsPopup();
	vm.clippingRegion = { Id: 5 };
	vm.onVersionsSelected([]);
	expect(invoker.showDialog).toBe(false);
	expect(axios.calls).toHaveLength(0);
});

it('confirmRemoveAssociation pide confirmación antes de quitar la delimitación', () => {
	const { vm, invoker } = setupVersionsPopup();
	vm.confirmRemoveAssociation({ BoundaryVersion: { Id: 11 } });
	expect(invoker.confirmTitle).toBe('Quitar delimitación');
	expect(invoker.confirmQuestion).toBe('La región dejará de estar asociada a esa versión.');
	expect(axios.calls).toHaveLength(0);
});

it('defecto conocido: este popup no se usa en ninguna vista y depende de métodos de Db que no existen', () => {
	const { env } = setupVersionsPopup();
	expect(typeof env.db.GetClippingRegionBoundaryVersions).toBe('undefined');
	expect(typeof env.db.AddClippingRegionToBoundaryVersions).toBe('undefined');
	expect(typeof env.db.RemoveClippingRegionFromBoundaryVersion).toBe('undefined');
});

// ---------------------------------------------------------------------

function setupSelection() {
	setupGlobals({ privileges: 'A' });
	return mountLite(BoundaryVersionSelectionPopup);
}

function level(id, levelValue, caption) {
	return { Id: id, Level: levelValue, Caption: caption || 'Ítem ' + id };
}

describe('BoundaryVersionSelectionPopup.buildGroups');

it('agrupa las versiones (nivel 1) bajo su delimitación (nivel 0) en el orden recibido', () => {
	const vm = setupSelection();
	const groups = vm.buildGroups([
		level(1, 0, 'Radios'), level(11, 1), level(12, 1), level(2, 0, 'Fracciones'), level(21, 1),
	]);
	expect(groups.map(function (g) { return g.caption; })).toEqual(['Radios', 'Fracciones']);
	expect(idsOf(groups[0].items)).toEqual([11, 12]);
	expect(idsOf(groups[1].items)).toEqual([21]);
});

it('omite las delimitaciones sin versiones y los ítems de nivel 1 sin delimitación previa', () => {
	const vm = setupSelection();
	const groups = vm.buildGroups([level(5, 1), level(1, 0, 'Vacía'), level(2, 0, 'Con versión'), level(21, 1)]);
	expect(groups.map(function (g) { return g.caption; })).toEqual(['Con versión']);
});

it('ignora los ítems de otros niveles', () => {
	const vm = setupSelection();
	const groups = vm.buildGroups([level(1, 0, 'A'), level(11, 1), level(111, 2)]);
	expect(idsOf(groups[0].items)).toEqual([11]);
});

describe('BoundaryVersionSelectionPopup: selección');

it('show arma los grupos, recuerda las versiones asociadas y las deja tildadas', () => {
	const vm = setupSelection();
	vm.show([level(1, 0, 'Radios'), level(11, 1), level(12, 1)], [11]);
	expect(vm.groups).toHaveLength(1);
	expect(vm.associatedIds).toEqual([11]);
	expect(vm.checkedIds).toEqual({ 11: true });
	expect(vm.activateEdit).toBe(true);
});

it('las asociadas no cuentan como selección nueva; al tildar otra sí', () => {
	const vm = setupSelection();
	vm.show([level(1, 0, 'Radios'), level(11, 1), level(12, 1)], [11]);
	expect(vm.isAlreadyAssociated(11)).toBe(true);
	expect(vm.isAlreadyAssociated(12)).toBe(false);
	expect(vm.hasNewSelection).toBe(false);
	vm.checkedIds = { 11: true, 12: true };
	expect(vm.getNewlyCheckedIds()).toEqual([12]);
	expect(vm.hasNewSelection).toBe(true);
});

it('accept cierra el popup y avisa con los ids recién elegidos', () => {
	const vm = setupSelection();
	vm.show([level(1, 0, 'Radios'), level(11, 1), level(12, 1), level(13, 1)], [11]);
	vm.checkedIds = { 11: true, 12: true, 13: false };
	vm.accept();
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'selected', args: [[12]] }]);
});

describeEscapeHandling(BoundaryVersionSelectionPopup, 'BoundaryVersionSelectionPopup', 'activateEdit');
