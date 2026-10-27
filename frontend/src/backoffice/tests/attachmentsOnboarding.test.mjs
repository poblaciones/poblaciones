import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import Attachments from '@/backoffice/views/Metadata/Attachments.vue';
import Onboarding from '@/backoffice/views/Metadata/Onboarding.vue';
import StepAreaOutput from '@/backoffice/views/Dataset/CalculatedWizard/StepAreaOutput.vue';
import StepDistanceOutput from '@/backoffice/views/Dataset/CalculatedWizard/StepDistanceOutput.vue';

function makeFile(id) {
	return { Id: id, Caption: 'Adjunto ' + id, File: { Id: id * 10, Type: 'PDF', Size: 2048, Pages: 3 } };
}

function setupAttachments(workId) {
	const browser = setupBackoffice('P');
	browser.window.Context.Factory = { GetCopy(type, callback) { callback({ Type: type, Id: null }); } };
	const files = [makeFile(1), makeFile(2), makeFile(3)];
	const metadata = {
		Files: files,
		properties: { Id: 8 },
		WorkId() { return workId; },
		DeleteFile() {},
		MoveFileUp() {},
		MoveFileDown() {},
	};
	const refs = {
		editPopup: { shown: [], show(item) { this.shown.push(item); } },
		invoker: { saved: [], confirmDos: [], doSave(...args) { this.saved.push(args); }, confirmDo(...args) { this.confirmDos.push(args); } },
	};
	const vm = mountLite(Attachments, { propsData: { canEdit: true, Metadata: metadata }, mocks: { $refs: refs } });
	return { vm: vm, metadata: metadata, refs: refs, files: files };
}

describe('Attachments: listado');

it('list son los archivos de los metadatos y formatFile muestra tipo, tamaño y páginas', () => {
	const { vm, metadata } = setupAttachments(3);
	expect(vm.list === metadata.Files).toBeTruthy();
	expect(vm.formatFile('PDF', 2048, 3)).toBe('PDF (2 kb, 3 páginas)');
});

it('isFirst e isLast identifican la posición del adjunto', () => {
	const { vm, files } = setupAttachments(3);
	expect(vm.isFirst(files[0])).toBe(true);
	expect(vm.isFirst(files[1])).toBe(false);
	expect(vm.isLast(files[2])).toBe(true);
	expect(vm.isLast(files[0])).toBe(false);
});

it('getAttachUrl usa el servicio del trabajo o el de administración', () => {
	const { vm, files } = setupAttachments(3);
	expect(vm.getAttachUrl(files[0])).toBe('https://api.example.org/services/backoffice/GetMetadataFile?m=8&f=10');
	const admin = setupAttachments(null);
	expect(admin.vm.getAttachUrl(admin.files[1])).toBe('https://api.example.org/services/admin/GetMetadataFile?m=8&f=20');
});

describe('Attachments: acciones');

it('createNewAttachment toma un adjunto nuevo del catálogo y abre su edición', () => {
	const { vm, refs } = setupAttachments(3);
	vm.createNewAttachment();
	expect(refs.editPopup.shown).toEqual([{ Type: 'MetadataFile', Id: null }]);
});

it('onDelete pide confirmar y elimina el adjunto', () => {
	const { vm, refs, metadata, files } = setupAttachments(3);
	vm.onDelete(files[0]);
	expect(refs.invoker.message).toBe('Eliminando...');
	expect(refs.invoker.confirmDos[0].slice(0, 2)).toEqual(['Eliminar archivo adjunto', 'El adjunto seleccionado será eliminado']);
	expect(refs.invoker.confirmDos[0][3] === metadata.DeleteFile).toBeTruthy();
});

it('up y down graban el movimiento', () => {
	const { vm, refs, metadata, files } = setupAttachments(3);
	vm.up(files[1]);
	vm.down(files[1]);
	expect(refs.invoker.saved[0][1] === metadata.MoveFileUp).toBeTruthy();
	expect(refs.invoker.saved[1][1] === metadata.MoveFileDown).toBeTruthy();
});

function setupOnboarding(stepCount, routePath) {
	const browser = setupBackoffice('P');
	const steps = [];
	for (let n = 0; n < stepCount; n++) {
		steps.push({ Order: n + 1 });
	}
	browser.window.Context.CurrentWork = { properties: { Id: 3 }, Onboarding: { Steps: steps }, UpdateOnboarding() {} };
	const refs = { tabs: { activeTab: null }, invoker: { saved: [], doSave(...args) { this.saved.push(args); } } };
	const vm = mountLite(Onboarding, { mocks: { $refs: refs, $route: { path: routePath || '/cartographies/3/onboarding/step2' } } });
	return { vm: vm, refs: refs, work: browser.window.Context.CurrentWork };
}

describe('Onboarding: pasos');

it('define cinco pasos con su ayuda', () => {
	const { vm } = setupOnboarding(5);
	expect(vm.stepDefinitions.map(function (step) { return step.Id; })).toEqual(['step1', 'step2', 'step3', 'step4', 'step5']);
	expect(vm.stepDefinitions[2].Helper).toBe('Aquí resumir brevemente los resultados alcanzados.');
});

it('checkDefinitions agrega definiciones sin ayuda si el trabajo tiene más pasos que las predefinidas', () => {
	const { vm } = setupOnboarding(7);
	Onboarding.mounted.call(vm);
	expect(vm.stepDefinitions).toHaveLength(7);
	expect(vm.stepDefinitions[6]).toEqual({ Id: 'step7', Label: 'Paso 7', Helper: '' });
});

it('checkDefinitions no cambia nada si los pasos alcanzan', () => {
	const { vm } = setupOnboarding(3);
	Onboarding.mounted.call(vm);
	expect(vm.stepDefinitions).toHaveLength(5);
});

it('makePath arma la ruta del paso dentro de la cartografía, o vacío sin trabajo', () => {
	const { vm } = setupOnboarding(5);
	expect(vm.makePath('step2')).toBe('/cartographies/3/onboarding/step2');
	expect(vm.makePath('')).toBe('/cartographies/3/onboarding');
	const browser = setupBackoffice('P');
	browser.window.Context.CurrentWork = null;
	expect(mountLite(Onboarding, {}).makePath('step1')).toBe('');
});

it('isPath activa la solapa del paso que corresponde a la ruta y compara la ruta', () => {
	const { vm, refs } = setupOnboarding(5, '/cartographies/3/onboarding/step4');
	expect(vm.isPath('/cartographies/3/onboarding/step4')).toBe(true);
	expect(vm.isPath('/cartographies/3/onboarding/step1')).toBe(false);
	expect(refs.tabs.activeTab).toBe('step4');
});

it('Update graba la bienvenida', () => {
	const { vm, refs, work } = setupOnboarding(5);
	vm.Update();
	expect(refs.invoker.saved[0][1] === work.UpdateOnboarding).toBeTruthy();
});

function setupStep(Component, newMetric) {
	const browser = setupBackoffice('P');
	return { vm: mountLite(Component, { propsData: { newMetric: newMetric } }), browser: browser };
}

describe('Asistente de calculados: salida de conteo por área');

it('una distancia de inclusión inválida o excesiva se rechaza', () => {
	const area = { IsInclusionPoint: true, InclusionDistance: 0, HasMaxValue: true };
	const { vm, browser } = setupStep(StepAreaOutput, { OutputArea: area, SelectedVariable: { IsSimpleCount: false } });
	expect(vm.validate()).toBe(false);
	area.InclusionDistance = 'abc';
	expect(vm.validate()).toBe(false);
	area.InclusionDistance = 501;
	expect(vm.validate()).toBe(false);
	expect(browser.alerts).toEqual([
		'Debe ingresar la distancia máxima en kilómetros.', 'Debe ingresar la distancia máxima en kilómetros.', 'La distancia no puede ser mayor a 500 km.',
	]);
});

it('una distancia válida se convierte en número', () => {
	const area = { IsInclusionPoint: true, InclusionDistance: '12', HasMaxValue: true };
	const { vm } = setupStep(StepAreaOutput, { OutputArea: area, SelectedVariable: { IsSimpleCount: false } });
	expect(vm.validate()).toBe(true);
	expect(area.InclusionDistance).toBe(12);
});

it('una variable que no es conteo simple exige guardar algún valor', () => {
	const area = { IsInclusionPoint: false, HasMaxValue: false, HasMinValue: false, HasCount: false, HasSumValue: false };
	const { vm, browser } = setupStep(StepAreaOutput, { OutputArea: area, SelectedVariable: { IsSimpleCount: false } });
	expect(vm.validate()).toBe(false);
	expect(browser.alerts).toEqual(['Debe elegir algún valor para guardar.']);
	area.HasCount = true;
	expect(vm.validate()).toBe(true);
});

it('un conteo simple no exige elegir valores', () => {
	const area = { IsInclusionPoint: false, HasMaxValue: false, HasMinValue: false, HasCount: false, HasSumValue: false };
	const { vm } = setupStep(StepAreaOutput, { OutputArea: area, SelectedVariable: { IsSimpleCount: true } });
	expect(vm.validate()).toBe(true);
});

it('una distancia negativa pasa a cero al editarla', () => {
	const area = { InclusionDistance: -3 };
	const { vm } = setupStep(StepAreaOutput, { OutputArea: area });
	StepAreaOutput.watch['newMetric.OutputArea.InclusionDistance'].call(vm);
	expect(area.InclusionDistance).toBe(0);
	area.InclusionDistance = 5;
	StepAreaOutput.watch['newMetric.OutputArea.InclusionDistance'].call(vm);
	expect(area.InclusionDistance).toBe(5);
	area.InclusionDistance = null;
	StepAreaOutput.watch['newMetric.OutputArea.InclusionDistance'].call(vm);
	expect(area.InclusionDistance).toBeNull();
});

describe('Asistente de calculados: salida de rastreo');

it('hasDescription refleja si el nivel elegido tiene descripciones', () => {
	const { vm } = setupStep(StepDistanceOutput, { Output: {}, SelectedLevel: null });
	expect(vm.hasDescription).toBe(false);
	vm.newMetric.SelectedLevel = { HasDescriptions: true };
	expect(vm.hasDescription).toBe(true);
});

it('sin distancia máxima la validación pasa, y con ella la rechaza si es inválida o excesiva', () => {
	const output = { HasMaxDistance: false, MaxDistance: 0 };
	const { vm, browser } = setupStep(StepDistanceOutput, { Output: output });
	expect(vm.validate()).toBe(true);
	output.HasMaxDistance = true;
	expect(vm.validate()).toBe(false);
	output.MaxDistance = 600;
	expect(vm.validate()).toBe(false);
	expect(browser.alerts).toEqual(['Debe ingresar la distancia máxima en kilómetros.', 'La distancia no puede ser mayor a 500 km.']);
	output.MaxDistance = '25';
	expect(vm.validate()).toBe(true);
	expect(output.MaxDistance).toBe(25);
});

it('una distancia máxima negativa pasa a cero al editarla', () => {
	const output = { MaxDistance: -1 };
	const { vm } = setupStep(StepDistanceOutput, { Output: output });
	StepDistanceOutput.watch['newMetric.Output.MaxDistance'].call(vm);
	expect(output.MaxDistance).toBe(0);
});
