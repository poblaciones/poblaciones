import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import CustomizeBasemapLayers from '@/backoffice/views/Customize/BasemapLayers.vue';

function setup(canEdit) {
	const browser = setupBackoffice('P');
	const work = {
		BasemapLayers: [
			{ Id: 1, Type: 'L', Caption: 'Etiquetas', StartActive: true },
			{ Id: 2, Type: 'R', Caption: 'Relieve', StartActive: false },
		],
		started: [],
		CanEdit() { return canEdit; },
		UpdateBasemapLayerStart(layer) { this.started.push(layer); },
	};
	browser.window.Context.CurrentWork = work;
	const refs = {
		invoker: {
			saved: [],
			doSave(...args) { this.saved.push(args); return Promise.resolve(); },
		},
	};
	const vm = mountLite(CustomizeBasemapLayers, { mocks: { $refs: refs } });
	return { vm: vm, work: work, refs: refs };
}

describe('Customize/BasemapLayers: capas base predeterminadas');

it('toma la cartografía actual como origen de datos', () => {
	const { vm, work } = setup(true);
	expect(vm.Work === work).toBeTruthy();
	expect(vm.Work.BasemapLayers).toHaveLength(2);
});

it('SetActive guarda el estado de la capa mediante la cartografía', () => {
	const { vm, work, refs } = setup(true);
	const layer = work.BasemapLayers[1];
	vm.SetActive(true, layer);
	expect(refs.invoker.saved).toHaveLength(1);
	expect(refs.invoker.saved[0][0] === work).toBeTruthy();
	expect(refs.invoker.saved[0][1] === work.UpdateBasemapLayerStart).toBeTruthy();
	expect(refs.invoker.saved[0][2] === layer).toBeTruthy();
});
