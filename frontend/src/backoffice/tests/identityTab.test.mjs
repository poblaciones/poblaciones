import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import IdentityTab from '@/backoffice/views/Dataset/IdentityTab.vue';
import { makeGridDataset } from './activeGridFixtures.mjs';

function setup(markerOverrides, propertyOverrides) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	const dataset = makeGridDataset();
	dataset.properties.Marker = Object.assign({ Frame: 'C', Size: 'M', Type: 'I', SourceCentralMeridian: null, Symbol: 'x' }, markerOverrides);
	Object.assign(dataset.properties, { TextureId: 3, PublicLabels: false, ShowInfo: true }, propertyOverrides);
	dataset.updates = [];
	dataset.Update = function () { dataset.updates.push('Update'); };
	dataset.UpdateRegen = function () { dataset.updates.push('UpdateRegen'); };
	context.CurrentDataset = dataset;
	context.CurrentWork = { canEdit: true, CanEdit() { return this.canEdit; } };
	context.Configuration = { UseTextures: true };
	const refs = {
		invoker: { saved: [], doSave(...args) { this.saved.push(args); } },
		iconPicker: { shown: 0, show() { this.shown++; } },
		iconPickerDialog: { shown: [], show(symbol) { this.shown.push(symbol); } },
	};
	const vm = mountLite(IdentityTab, { mocks: { $refs: refs } });
	return { vm: vm, dataset: dataset, context: context, refs: refs };
}

describe('IdentityTab: textos según el marco del marcador');

it('polygonPluralName y polygonFixedSizeMetric nombran la forma y la medida fija', () => {
	const expected = { B: ['cuadrados', '(lado)'], C: ['círculos', '(diámetro)'], H: ['hexágonos', '(altura)'] };
	for (const frame of Object.keys(expected)) {
		const { vm } = setup({ Frame: frame });
		expect(vm.polygonPluralName).toBe(expected[frame][0]);
		expect(vm.polygonFixedSizeMetric).toBe(expected[frame][1]);
	}
	const { vm } = setup({ Frame: 'P' });
	expect(vm.polygonPluralName).toBe('');
	expect(vm.polygonFixedSizeMetric).toBe('');
});

describe('IdentityTab: propiedades calculadas');

it('publicLabelsStatus e infoEnabledStatus muestran Activado o Desactivado', () => {
	const { vm, dataset } = setup();
	expect(vm.publicLabelsStatus).toBe('Desactivado');
	expect(vm.infoEnabledStatus).toBe('Activado');
	dataset.properties.PublicLabels = true;
	dataset.properties.ShowInfo = false;
	expect(vm.publicLabelsStatus).toBe('Activado');
	expect(vm.infoEnabledStatus).toBe('Desactivado');
});

it('canEdit depende del permiso del trabajo y useTextures de la configuración', () => {
	const { vm, context } = setup();
	expect(vm.canEdit).toBe(true);
	expect(vm.useTextures).toBe(true);
	context.CurrentWork.canEdit = false;
	expect(vm.canEdit).toBe(false);
	context.CurrentWork = null;
	expect(vm.canEdit).toBe(false);
});

it('columnsForContent ofrece solo las de texto para marcadores de imagen y todas las demás en otro caso', () => {
	const { vm, dataset } = setup({ Type: 'I' });
	expect(vm.columnsForContent.map(function (column) { return column.Id; })).toEqual([3, 4]);
	dataset.properties.Marker.Type = 'T';
	expect(vm.columnsForContent === dataset.Columns).toBeTruthy();
});

it('ofrece las siete fajas de proyección y las tres texturas', () => {
	const { vm } = setup();
	expect(vm.validProjections).toHaveLength(7);
	expect(vm.validProjections[3]).toEqual({ Value: -63, Caption: 'POSGAR 2007 / Gauss-Krüger - Faja 4' });
	expect(vm.validTextures.map(function (texture) { return texture.Id; })).toEqual([0, 3, 4]);
});

describe('IdentityTab: proyección');

it('setProjection refleja si el marcador tiene meridiano central de origen', () => {
	const { vm } = setup({ SourceCentralMeridian: -66 });
	expect(vm.setProjection).toBe(true);
	const without = setup({ SourceCentralMeridian: null });
	expect(without.vm.setProjection).toBe(false);
});

it('activar la proyección propone la faja 4 y desactivarla borra el meridiano, grabando en ambos casos', () => {
	const { vm, dataset, refs } = setup({ SourceCentralMeridian: null });
	vm.setProjection = true;
	expect(dataset.properties.Marker.SourceCentralMeridian).toBe(-63);
	vm.setProjection = false;
	expect(dataset.properties.Marker.SourceCentralMeridian).toBeNull();
	expect(refs.invoker.saved).toHaveLength(2);
});

describe('IdentityTab: grabado');

it('Update graba el dataset, convirtiendo textura 0 en ninguna y los círculos fijos en lugar de punto', () => {
	const { vm, dataset, refs } = setup({ Size: 'F', Frame: 'P' }, { TextureId: 0 });
	vm.Update();
	expect(dataset.properties.TextureId).toBeNull();
	expect(dataset.properties.Marker.Frame).toBe('C');
	expect(refs.invoker.saved[0][0] === dataset).toBeTruthy();
	expect(refs.invoker.saved[0][1] === dataset.Update).toBeTruthy();
});

it('Update conserva el marco si el tamaño no es fijo o el marco no es punto, y una textura válida', () => {
	const sized = setup({ Size: 'M', Frame: 'P' }, { TextureId: 4 });
	sized.vm.Update();
	expect(sized.dataset.properties.Marker.Frame).toBe('P');
	expect(sized.dataset.properties.TextureId).toBe(4);
	const framed = setup({ Size: 'F', Frame: 'B' });
	framed.vm.Update();
	expect(framed.dataset.properties.Marker.Frame).toBe('B');
});

it('UpdateRegen graba regenerando los datos, convirtiendo textura 0 en ninguna', () => {
	const { vm, dataset, refs } = setup({}, { TextureId: 0 });
	vm.UpdateRegen();
	expect(dataset.properties.TextureId).toBeNull();
	expect(refs.invoker.saved[0][1] === dataset.UpdateRegen).toBeTruthy();
});

describe('IdentityTab: ícono');

it('removeIcon quita el símbolo y graba, e iconSelected lo asigna y graba', () => {
	const { vm, dataset, refs } = setup();
	vm.removeIcon();
	expect(dataset.properties.Marker.Symbol).toBeNull();
	vm.iconSelected('estrella');
	expect(dataset.properties.Marker.Symbol).toBe('estrella');
	expect(refs.invoker.saved).toHaveLength(2);
});

it('showPicker y showDialogPicker abren los selectores de ícono', () => {
	const { vm, refs } = setup();
	vm.showPicker();
	vm.showDialogPicker();
	expect(refs.iconPicker.shown).toBe(1);
	expect(refs.iconPickerDialog.shown).toEqual(['x']);
});

it('formatColumn formatea la columna con su variable', () => {
	const { vm, dataset } = setup();
	expect(vm.formatColumn(dataset.Columns[0])).toBe('lat');
});
