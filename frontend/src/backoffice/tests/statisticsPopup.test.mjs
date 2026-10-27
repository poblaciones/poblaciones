import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import date from '@/common/framework/date';
import StatisticsPopup from '@/backoffice/views/Statistics/StatisticsPopup.vue';

function makeStats() {
	return {
		region: { Norte: { d0: 1, d1: 2, d2: 3 }, '\tSur': { d0: 4, d1: 5, d2: 6 } },
		work: { Obra: { d0: 7, d1: 8, d2: 9 } },
		metric: {},
		download: { Descarga: { d0: 0, d1: 0, d2: 1 } },
		attachment: {},
		periods: ['2024-05', '2024-04'],
	};
}

function setup(quarters) {
	const browser = setupBackoffice('P');
	const work = {
		StatsQuarters: quarters || [],
		requested: [],
		GetWorkStatistics(key) { this.requested.push(key); return Promise.resolve(); },
	};
	browser.window.Context.CurrentWork = work;
	const refs = {
		invoker: {
			messages: [],
			result: Promise.resolve(makeStats()),
			doMessage(...args) { this.messages.push(args); return this.result; },
		},
	};
	const vm = mountLite(StatisticsPopup, { mocks: { $refs: refs } });
	return { vm: vm, work: work, refs: refs };
}

describe('StatisticsPopup: propiedades calculadas');

it('historyPeriods convierte los trimestres con la etiqueta de su fecha', () => {
	const { vm } = setup(['2024Q1', '2023Q4']);
	expect(vm.historyPeriods).toEqual([
		{ Id: '2024Q1', Caption: date.FormatLabelQuarter('2024Q1') },
		{ Id: '2023Q4', Caption: date.FormatLabelQuarter('2023Q4') },
	]);
});

it('key es el período elegido solo cuando se usa el historial, y la cadena null en otro caso', () => {
	const { vm } = setup();
	expect(vm.key).toBe('null');
	vm.currentPeriod = '2024Q1';
	expect(vm.key).toBe('null');
	vm.useHistory = true;
	expect(vm.key).toBe('2024Q1');
	vm.currentPeriod = null;
	expect(vm.key).toBe('null');
});

describe('StatisticsPopup: listas');

it('processList convierte cada clave en una fila con sus tres valores', () => {
	const { vm } = setup();
	expect(vm.processList({ A: { d0: 1, d1: 2, d2: 3 } })).toEqual([{ Caption: 'A', Values0: 1, Values1: 2, Values2: 3 }]);
	expect(vm.processList({})).toEqual([]);
	expect(vm.processList(undefined)).toEqual([]);
});

it('padTabbed sangra los títulos que empiezan con tabulación', () => {
	const { vm } = setup();
	expect(vm.padTabbed('\tSur')).toBe('padding-left: 20px');
	expect(vm.padTabbed('Norte')).toBe('');
	expect(vm.padTabbed('')).toBe('');
	expect(vm.padTabbed(null)).toBe('');
});

it('LoadData reparte las estadísticas en sus listas y guarda los períodos', () => {
	const { vm } = setup();
	vm.LoadData(makeStats());
	expect(vm.regions.map(function (row) { return row.Caption; })).toEqual(['Norte', '\tSur']);
	expect(vm.general).toHaveLength(1);
	expect(vm.hits).toEqual([]);
	expect(vm.downloads).toHaveLength(1);
	expect(vm.attachments).toEqual([]);
	expect(vm.periods).toEqual(['2024-05', '2024-04']);
});

describe('StatisticsPopup: obtención de datos');

it('GetData pide las estadísticas con un mensaje, las guarda en el caché y las carga', async () => {
	const { vm, refs, work } = setup();
	vm.GetData('2024Q1');
	expect(vm.loading).toBe(true);
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo información');
	expect(refs.invoker.messages[0][1] === work).toBeTruthy();
	expect(refs.invoker.messages[0][2] === work.GetWorkStatistics).toBeTruthy();
	expect(refs.invoker.messages[0][3]).toBe('2024Q1');
	await flushPromises();
	expect(vm.dataCache['2024Q1'].periods).toEqual(['2024-05', '2024-04']);
	expect(vm.regions).toHaveLength(2);
	expect(vm.loading).toBe(false);
});

it('GetData con la clave null le informa al servidor un mes nulo y cachea bajo esa clave', async () => {
	const { vm, refs } = setup();
	vm.GetData('null');
	expect(refs.invoker.messages[0][3]).toBeNull();
	await flushPromises();
	expect(Object.keys(vm.dataCache)).toEqual(['null']);
});

it('si la consulta falla deja de mostrar la carga', async () => {
	const { vm, refs } = setup();
	refs.invoker.result = Promise.reject(new Error('sin conexión'));
	vm.GetData('k');
	await flushPromises();
	expect(vm.loading).toBe(false);
	expect(vm.regions).toEqual([]);
});

it('UpdateData usa el caché si ya tiene la clave y pide al servidor si no', async () => {
	const { vm, refs } = setup();
	vm.dataCache = { null: makeStats() };
	vm.UpdateData();
	expect(refs.invoker.messages).toHaveLength(0);
	expect(vm.regions).toHaveLength(2);
	vm.useHistory = true;
	vm.currentPeriod = '2024Q1';
	vm.UpdateData();
	expect(refs.invoker.messages[0][3]).toBe('2024Q1');
	await flushPromises();
});

it('UpdateData sin historial y sin caché pide los períodos recientes con un mes nulo', async () => {
	const { vm, refs } = setup();
	vm.useHistory = false;
	vm.UpdateData();
	expect(refs.invoker.messages[0][3]).toBeNull();
	await flushPromises();
	expect(Object.keys(vm.dataCache)).toEqual(['null']);
});

it('show reinicia el caché y el historial, elige el trimestre más reciente, abre el diálogo y pide los períodos recientes', async () => {
	const { vm, refs } = setup(['2024Q1', '2023Q4']);
	vm.dataCache = { x: 1 };
	vm.useHistory = true;
	vm.show();
	expect(vm.useHistory).toBe(false);
	expect(vm.currentPeriod).toBe('2024Q1');
	expect(vm.open).toBe(true);
	expect(refs.invoker.messages).toHaveLength(1);
	expect(refs.invoker.messages[0][3]).toBeNull();
	await flushPromises();
	expect(Object.keys(vm.dataCache)).toEqual(['null']);
});

it('show sin trimestres no elige período', () => {
	const { vm } = setup([]);
	vm.show();
	expect(vm.currentPeriod).toBeNull();
});
