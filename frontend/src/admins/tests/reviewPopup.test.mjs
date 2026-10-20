import { describe, it, expect } from './_harness.mjs';
import ReviewPopup from '@/admins/views/Reviews/ReviewPopup.vue';
import {
	setupGlobals, mountLite, axios, serve, settle, bodyOf, makeInvoker, makeFocusable,
} from './fixtures.mjs';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const inputName = makeFocusable();
	const vm = mountLite(ReviewPopup, { refs: { invoker, inputName } });
	return { env, vm, invoker, inputName };
}

function review(overrides) {
	return Object.assign({
		Id: 4, Decision: 'A', SubmissionDate: '2024-05-03T12:00:00', ResolutionDate: '2024-06-10T12:00:00',
		UserDecision: { Firstname: 'Luis', Lastname: 'Gómez', Email: 'luis@mail.com' },
	}, overrides || {});
}

describe('ReviewPopup: datos iniciales');

it('ofrece las cuatro decisiones posibles', () => {
	const { vm } = setup();
	expect(vm.Decisions).toEqual([
		{ Id: 'A', Caption: 'Publicable' },
		{ Id: 'S', Caption: 'Publicable con sugerencias' },
		{ Id: 'C', Caption: 'Cambios solicitados' },
		{ Id: 'R', Caption: 'Rechazada' },
	]);
});

it('isDataAdmin depende de los privilegios del usuario', () => {
	expect(setup('E').vm.isDataAdmin).toBe(true);
	expect(setup('L').vm.isDataAdmin).toBe(false);
});

describe('ReviewPopup.show');

it('trabaja sobre una copia de la revisión y formatea quién resolvió y las fechas', () => {
	const { vm } = setup();
	const original = review();
	vm.show(original);
	expect(vm.review).toEqual(original);
	expect(vm.review === original).toBe(false);
	expect(vm.activateEdit).toBe(true);
	expect(vm.userDecision).toBe('Luis Gómez');
	expect(vm.submissionDate).toBe('03/05/2024');
	expect(vm.decisionDate).toBe('10/06/2024');
});

it('sin usuario que haya resuelto ni fecha de resolución deja el nombre vacío y la fecha en "-"', () => {
	const { vm } = setup();
	vm.show(review({ UserDecision: null, ResolutionDate: null }));
	expect(vm.userDecision).toBe('');
	expect(vm.decisionDate).toBe('-');
});

it('enfoca el campo nombre a los 100 ms', () => {
	const { env, vm, inputName } = setup();
	vm.show(review());
	expect(env.timers.pending[0].ms).toBe(100);
	env.timers.flush();
	expect(inputName.focused).toBe(1);
});

describe('ReviewPopup.save');

it('guarda la revisión, cierra la edición y avisa con la respuesta del servidor', async () => {
	const { vm, invoker } = setup();
	serve({ 'POST /services/admin/UpdateReview': { Id: 4, Decision: 'R', ResolutionDate: '2024-07-01T12:00:00' } });
	vm.show(review());
	vm.review.Decision = 'R';
	vm.save();
	expect(invoker.message).toBe('Guardando...');
	await settle();
	expect(bodyOf(axios.calls[0]).r.Decision).toBe('R');
	expect(vm.activateEdit).toBe(false);
	expect(vm.$emitted).toEqual([{ name: 'completed', args: [{ Id: 4, Decision: 'R', ResolutionDate: '2024-07-01T12:00:00' }] }]);
});
