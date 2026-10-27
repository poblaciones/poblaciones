import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import PickMetric from '@/backoffice/views/Metric/PickMetric.vue';
import PickMetricVersion from '@/backoffice/views/Metric/PickMetricVersion.vue';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setupMetric(type) {
	const browser = setupBackoffice('P');
	const context = browser.window.Context;
	context.CurrentWork = { properties: { Type: type } };
	context.PublicMetrics = { GetAll(callback) { callback([{ Id: 1, Caption: 'Población pública' }]); } };
	context.CartographyMetrics = { GetAll(callback) { callback([{ Id: 2, Caption: 'Población' }, { Id: 3, Caption: 'Viviendas' }]); } };
	const focused = [];
	const refs = { inputSearch: { $el: { focus() { focused.push(1); } } } };
	const vm = mountLite(PickMetric, { mocks: { $refs: refs } });
	return { vm: vm, browser: browser, focused: focused };
}

describe('PickMetric: apertura');

it('show en datos públicos lista los indicadores públicos, abre el diálogo y enfoca la búsqueda', async () => {
	const { vm, focused } = setupMetric('P');
	vm.search = 'previo';
	vm.show();
	expect(vm.list.map(function (metric) { return metric.Id; })).toEqual([1]);
	expect(vm.listFiltered === vm.list).toBeTruthy();
	expect(vm.search).toBe('');
	expect(vm.openPopup).toBe(true);
	await waitTimers(130);
	expect(focused).toHaveLength(1);
});

it('show en una cartografía lista los indicadores de cartografías', () => {
	const { vm } = setupMetric('R');
	vm.show();
	expect(vm.list.map(function (metric) { return metric.Id; })).toEqual([2, 3]);
});

it('show con un tipo de obra desconocido falla', () => {
	const { vm } = setupMetric('X');
	let message = null;
	try {
		vm.show();
	} catch (e) {
		message = e.message;
	}
	expect(message).toBe('Tipo de obra no reconocida.');
});

describe('PickMetric: búsqueda y selección');

it('searchOnTable filtra la lista por título', () => {
	const { vm } = setupMetric('R');
	vm.show();
	vm.search = 'viv';
	vm.searchOnTable();
	expect(vm.listFiltered.map(function (metric) { return metric.Id; })).toEqual([3]);
	vm.search = '';
	vm.searchOnTable();
	expect(vm.listFiltered).toHaveLength(2);
});

it('notFound y formatVersions muestran los textos de la tabla', () => {
	const { vm } = setupMetric('R');
	expect(vm.notFound()).toBe('No se encontraron indicadores coincidentes con la búsqueda indicada.');
	expect(vm.formatVersions(null)).toBe('-');
	expect(vm.formatVersions({ Versions: ['2010', '2022'] })).toBe('2010, 2022');
});

it('save sin indicador elegido avisa', () => {
	const { vm, browser } = setupMetric('R');
	vm.save();
	expect(browser.alerts).toEqual(['No ha seleccionado ningún indicador.']);
	expect(vm.$emitted).toHaveLength(0);
});

it('save cierra el diálogo e informa el indicador elegido', () => {
	const { vm } = setupMetric('R');
	const metric = { Id: 2 };
	vm.selected = metric;
	vm.openPopup = true;
	vm.save();
	expect(vm.openPopup).toBe(false);
	expect(vm.$emitted[0][0]).toBe('onSelectedMetric');
	expect(vm.$emitted[0][1] === metric).toBeTruthy();
});

describe('PickMetricVersion: selección');

function setupVersion() {
	const browser = setupBackoffice('P');
	const vm = mountLite(PickMetricVersion, {});
	return { vm: vm, browser: browser };
}

it('la lista es vacía por defecto y show abre el diálogo', () => {
	const { vm } = setupVersion();
	expect(vm.list).toEqual([]);
	vm.show([]);
	expect(vm.openPopup).toBe(true);
});

it('save sin versión elegida avisa', () => {
	const { vm, browser } = setupVersion();
	vm.save();
	expect(browser.alerts).toEqual(['No ha seleccionado ninguna versión de indicador.']);
});

it('save cierra el diálogo e informa la versión elegida, una sola vez', () => {
	const { vm } = setupVersion();
	const version = { Id: 5 };
	vm.selected = version;
	vm.openPopup = true;
	vm.save();
	vm.save();
	expect(vm.openPopup).toBe(false);
	expect(vm.$emitted).toHaveLength(1);
	expect(vm.$emitted[0][0]).toBe('onSelectMetricVersion');
	expect(vm.$emitted[0][1] === version).toBeTruthy();
});
