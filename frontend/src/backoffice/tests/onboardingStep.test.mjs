import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite, flushPromises } from './fixtures.mjs';
import OnboardingStep from '@/backoffice/components/OnboardingStep.vue';

function waitTimers(milliseconds) {
	return new Promise(function (resolve) { setTimeout(resolve, milliseconds); });
}

function setup(stepOverrides, canEdit) {
	const browser = setupBackoffice('P');
	const work = {
		allowed: (canEdit !== false),
		CanEdit() { return this.allowed; },
		GetStepImage() {},
		UpdateOnboardingStep() {},
	};
	browser.window.Context.CurrentWork = work;
	const refs = {
		invoker: {
			messages: [],
			saved: [],
			messageResult: Promise.resolve('data:image/png;base64,yy'),
			saveResult: Promise.resolve({ Image: 77 }),
			doMessage(...args) { this.messages.push(args); return this.messageResult; },
			doSave(...args) { this.saved.push(args); return this.saveResult; },
		},
	};
	const step = Object.assign({ Order: 2, Enabled: true, Image: null, ImageAlignment: 'C' }, stepOverrides);
	const vm = mountLite(OnboardingStep, { propsData: { step: step, stepDefinition: {} }, mocks: { $refs: refs } });
	return { vm: vm, work: work, refs: refs, step: step };
}

describe('OnboardingStep: edición');

it('stepEditable exige permiso de edición y que el paso esté habilitado', () => {
	expect(setup({ Enabled: true }, true).vm.stepEditable).toBeTruthy();
	expect(setup({ Enabled: false }, true).vm.stepEditable).toBeFalsy();
	expect(setup({ Enabled: true }, false).vm.stepEditable).toBeFalsy();
});

it('al montar pide la imagen del paso solo si tiene una, después de una pausa', async () => {
	const withImage = setup({ Image: 5 });
	OnboardingStep.mounted.call(withImage.vm);
	expect(withImage.refs.invoker.messages).toHaveLength(0);
	await waitTimers(300);
	expect(withImage.refs.invoker.messages).toHaveLength(1);
	const withoutImage = setup({ Image: null });
	OnboardingStep.mounted.call(withoutImage.vm);
	await waitTimers(300);
	expect(withoutImage.refs.invoker.messages).toHaveLength(0);
});

it('getStepImage obtiene la imagen del orden del paso y la deja como vista previa', async () => {
	const { vm, refs, work } = setup({ Order: 4 });
	vm.getStepImage();
	expect(refs.invoker.messages[0][0]).toBe('Obteniendo imagen');
	expect(refs.invoker.messages[0][1] === work).toBeTruthy();
	expect(refs.invoker.messages[0][2] === work.GetStepImage).toBeTruthy();
	expect(refs.invoker.messages[0][3]).toBe(4);
	await flushPromises();
	expect(vm.previewImage).toBe('data:image/png;base64,yy');
});

describe('OnboardingStep: grabado');

it('Update graba el paso con la imagen a enviar y, al terminar, toma la imagen guardada y la vuelve a pedir', async () => {
	const { vm, refs, work, step } = setup();
	vm.imageToSend = 'nueva';
	vm.Update();
	expect(refs.invoker.saved[0][1] === work.UpdateOnboardingStep).toBeTruthy();
	expect(refs.invoker.saved[0][2] === step).toBeTruthy();
	expect(refs.invoker.saved[0][3]).toBe('nueva');
	await flushPromises();
	expect(step.Image).toBe(77);
	expect(vm.imageToSend).toBeNull();
	expect(refs.invoker.messages).toHaveLength(1);
});

it('clearImage quita la imagen del paso y graba', () => {
	const { vm, refs, step } = setup({ Image: 5 });
	vm.clearImage();
	expect(step.Image).toBeNull();
	expect(refs.invoker.saved).toHaveLength(1);
});

it('los botones de alineación definen la alineación de la imagen y graban', () => {
	const { vm, refs, step } = setup();
	vm.clickLeft();
	expect(step.ImageAlignment).toBe('L');
	vm.clickCentered();
	expect(step.ImageAlignment).toBe('C');
	vm.clickRight();
	expect(step.ImageAlignment).toBe('R');
	expect(refs.invoker.saved).toHaveLength(3);
});
