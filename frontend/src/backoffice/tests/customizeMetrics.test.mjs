import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import CustomizeMetrics from '@/backoffice/views/Customize/Metrics.vue';

function setup(activeMetrics, extraMetrics) {
	const browser = setupBackoffice('P');
	const work = {
		properties: { Startup: { ActiveMetrics: activeMetrics } },
		ExtraMetrics: extraMetrics || [],
		list: [{ Id: 1 }, { Id: 2 }, { Id: 13 }],
		GetMetricsList() { return Promise.resolve(this.list); },
		UpdateStartup() {},
		UpdateExtraMetricStart() {},
		AppendExtraMetric() {},
		RemoveExtraMetric() {},
	};
	browser.window.Context.CurrentWork = work;
	const refs = {
		invoker: {
			saved: [],
			messages: [],
			confirms: [],
			doSave(...args) { this.saved.push(args); return Promise.resolve(); },
			doMessage(...args) { this.messages.push(args); return Promise.resolve(); },
			confirm(title, message, callback) { this.confirms.push({ title: title, message: message, callback: callback }); },
		},
		searchPopup: { shown: 0, show() { this.shown++; } },
		addMetricPopup: { shown: 0, show() { this.shown++; } },
	};
	const vm = mountLite(CustomizeMetrics, { mocks: { $refs: refs } });
	return { vm: vm, work: work, refs: refs };
}

describe('Customize/Metrics: estado inicial');

it('la sección es null por defecto, muestra ambas listas, y Startup viene del trabajo', () => {
	const { vm, work } = setup('1,3');
	expect(vm.section).toBeNull();
	expect(vm.metricList).toEqual([]);
	expect(vm.Startup === work.properties.Startup).toBeTruthy();
});

it('al montar marca cuáles indicadores están activos al inicio', async () => {
	const { vm } = setup('1,13');
	CustomizeMetrics.mounted.call(vm);
	await flushPromises();
	expect(vm.metricList.map(function (metric) { return metric.StartActive; })).toEqual([true, false, true]);
});

describe('Customize/Metrics: indicadores activos');

it('IsActive compara el identificador completo, sin confundir 1 con 13', () => {
	const { vm } = setup('13');
	expect(vm.IsActive(13)).toBe(true);
	expect(vm.IsActive(1)).toBe(false);
});

it('IsActive sin indicadores activos devuelve falso', () => {
	expect(setup(null).vm.IsActive(1)).toBe(false);
	expect(setup('').vm.IsActive(1)).toBe(false);
});

it('SetActive junta los identificadores de los activos separados por coma y graba el inicio', () => {
	const { vm, work, refs } = setup('');
	vm.metricList = [{ Id: 1, StartActive: true }, { Id: 2, StartActive: false }, { Id: 13, StartActive: true }];
	vm.SetActive(true, vm.metricList[0]);
	expect(work.properties.Startup.ActiveMetrics).toBe('1,13');
	expect(refs.invoker.saved[0][0] === work).toBeTruthy();
	expect(refs.invoker.saved[0][1] === work.UpdateStartup).toBeTruthy();
});

it('SetActive sin ninguno activo deja el valor vacío', () => {
	const { vm, work } = setup('1');
	vm.metricList = [{ Id: 1, StartActive: false }];
	vm.SetActive(false, vm.metricList[0]);
	expect(work.properties.Startup.ActiveMetrics).toBe('');
});

describe('Customize/Metrics: indicadores adicionales');

it('handleToggle graba el inicio activo del indicador adicional', () => {
	const { vm, work, refs } = setup('');
	const metric = { Id: 5 };
	vm.handleToggle(true, metric);
	expect(refs.invoker.saved[0][1] === work.UpdateExtraMetricStart).toBeTruthy();
	expect(refs.invoker.saved[0][2] === metric).toBeTruthy();
});

it('metricSelected agrega un indicador adicional nuevo, inactivo al inicio', async () => {
	const { vm, work, refs } = setup('', [{ Id: 1 }]);
	const metric = { Id: 5 };
	vm.metricSelected(metric);
	expect(refs.invoker.saved[0][1] === work.AppendExtraMetric).toBeTruthy();
	await flushPromises();
	expect(metric.StartActive).toBe(false);
	expect(work.ExtraMetrics.map(function (item) { return item.Id; })).toEqual([1, 5]);
});

it('metricSelected ignora un indicador que ya está entre los adicionales', () => {
	const { vm, refs } = setup('', [{ Id: 5 }]);
	vm.metricSelected({ Id: 5 });
	expect(refs.invoker.saved).toHaveLength(0);
});

it('removeMetric pide confirmar y, al aceptar, lo elimina del servidor y de la lista', async () => {
	const metric = { Id: 5 };
	const { vm, work, refs } = setup('', [{ Id: 1 }, metric]);
	vm.removeMetric(metric);
	expect(refs.invoker.confirms[0].title).toBe('Eliminar indicador');
	expect(refs.invoker.messages).toHaveLength(0);
	refs.invoker.confirms[0].callback();
	expect(refs.invoker.messages[0][0]).toBe('Eliminando');
	expect(refs.invoker.messages[0][2] === work.RemoveExtraMetric).toBeTruthy();
	await flushPromises();
	expect(work.ExtraMetrics.map(function (item) { return item.Id; })).toEqual([1]);
});

it('search y addMetric abren sus diálogos', () => {
	const { vm, refs } = setup('');
	vm.search();
	vm.addMetric();
	expect(refs.searchPopup.shown).toBe(1);
	expect(refs.addMetricPopup.shown).toBe(1);
});
