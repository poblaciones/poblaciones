import { describe, it, expect } from './_harness.mjs';
import Reviews from '@/admins/views/Reviews/Reviews.vue';
import {
	setupGlobals, mountLite, callHook, axios, serve, settle, bodyOf, makeInvoker, makePopup,
} from './fixtures.mjs';

const GET_REVIEWS = 'GET /services/admin/GetReviews';

function setup(privileges) {
	const env = setupGlobals({ privileges: privileges || 'A' });
	const invoker = makeInvoker();
	const editPopup = makePopup();
	const vm = mountLite(Reviews, { refs: { invoker, editPopup } });
	return { env, vm, invoker, editPopup };
}

function review(overrides) {
	return Object.assign({
		Id: 1, Decision: null, UserSubmission: { Firstname: 'Ana', Lastname: 'Paz', Email: 'ana@mail.com' },
		UserSubmissionEmail: 'ana@mail.com',
	}, overrides || {});
}

function pendingEvents(vm) {
	const ret = [];
	for (const event of vm.$emitted) {
		if (event.name === 'pendingUpdated') {
			ret.push(event.args[0]);
		}
	}
	return ret;
}

describe('Reviews.mounted');

it('pide las revisiones con el mensaje de espera, llena la lista y informa las pendientes', async () => {
	const { vm, invoker } = setup();
	serve({ [GET_REVIEWS]: [review({ Id: 1 }), review({ Id: 2, Decision: 'A' }), review({ Id: 3 })] });
	callHook(Reviews, vm, 'mounted');
	expect(invoker.message).toBe('Obteniendo revisiones...');
	await settle();
	expect(vm.list.map(function (r) { return r.Id; })).toEqual([1, 2, 3]);
	expect(pendingEvents(vm)).toEqual([2]);
});

describe('Reviews.isDataAdmin');

it('es verdadero para administradores y editores de datos', () => {
	expect(setup('A').vm.isDataAdmin).toBe(true);
	expect(setup('E').vm.isDataAdmin).toBe(true);
	expect(setup('L').vm.isDataAdmin).toBe(false);
});

describe('Reviews: formatos');

it('formatDate delega en el formateador de fechas (dd/mm/aaaa, o "-" sin fecha)', () => {
	const { vm } = setup();
	expect(vm.formatDate('2024-05-03T12:00:00')).toBe('03/05/2024');
	expect(vm.formatDate(null)).toBe('-');
});

it('formatFullName muestra el email de la solicitud si no hay usuario, o su nombre completo', () => {
	const { vm } = setup();
	expect(vm.formatFullName(review({ UserSubmission: null }))).toBe('ana@mail.com');
	expect(vm.formatFullName(review())).toBe('Ana Paz');
	expect(vm.formatFullName(review({ UserSubmission: { Firstname: '', Lastname: '', Email: 'sin@nombre.com' } }))).toBe('sin@nombre.com');
});

it('formatDecision traduce cada código y muestra "-" si no hay decisión', () => {
	const { vm } = setup();
	expect(vm.formatDecision('A')).toBe('Publicable');
	expect(vm.formatDecision('S')).toBe('Publicable con sugerencias');
	expect(vm.formatDecision('C')).toBe('Cambios solicitados');
	expect(vm.formatDecision('R')).toBe('Rechazada');
	expect(vm.formatDecision(null)).toBe('-');
	expect(vm.formatDecision('')).toBe('-');
});

it('comportamiento actual: un código de decisión desconocido no tiene texto', () => {
	expect(setup().vm.formatDecision('Z')).toBe(undefined);
});

describe('Reviews: navegación a la obra');

it('getWorkUri arma la ruta relativa o absoluta del contenido de la obra', () => {
	const { vm } = setup();
	expect(vm.getWorkUri({ Id: 9 })).toBe('/cartographies/9/content');
	expect(vm.getWorkUri({ Id: 9 }, true)).toBe('/users/#/cartographies/9/content');
});

it('select abre la obra en una pestaña nueva', () => {
	const { env, vm } = setup();
	vm.select({ Id: 9 });
	expect(env.opened).toEqual([{ url: '/users/#/cartographies/9/content', target: '_blank' }]);
});

describe('Reviews.updatePending');

it('informa la cantidad de revisiones sin decisión', () => {
	const { vm } = setup();
	vm.list = [review({ Id: 1 }), review({ Id: 2, Decision: 'R' }), review({ Id: 3, Decision: '' })];
	vm.updatePending();
	expect(pendingEvents(vm)).toEqual([2]);
});

describe('Reviews: edición');

it('openEdition abre el popup con la revisión', () => {
	const { vm, editPopup } = setup();
	const item = review();
	vm.openEdition(item);
	expect(editPopup.shown).toEqual([[item]]);
});

it('popupSaved reemplaza o agrega la revisión y actualiza las pendientes', () => {
	const { vm } = setup();
	vm.list = [review({ Id: 1 }), review({ Id: 2 })];
	vm.popupSaved(review({ Id: 1, Decision: 'A' }));
	expect(vm.list[0].Decision).toBe('A');
	expect(pendingEvents(vm)).toEqual([1]);
	vm.popupSaved(review({ Id: 3 }));
	expect(vm.list).toHaveLength(3);
	expect(pendingEvents(vm)).toEqual([1, 2]);
});

describe('Reviews.deleteDecision');

it('pide confirmación antes de eliminar y no llama al servidor hasta que se acepta', () => {
	const { vm, invoker } = setup();
	vm.deleteDecision(review());
	expect(invoker.message).toBe('Eliminando...');
	expect(invoker.confirmTitle).toBe('Eliminar revisión');
	expect(invoker.confirmQuestion).toBe('La revisión seleccionada será eliminada.');
	expect(invoker.confirmDialog.shown).toBe(1);
	expect(axios.calls).toHaveLength(0);
});

it('al aceptar elimina la revisión en el servidor, la quita de la lista y actualiza las pendientes', async () => {
	const { vm, invoker } = setup();
	serve({ 'POST /services/admin/DeleteReview': {} });
	const a = review({ Id: 1 });
	const b = review({ Id: 2 });
	vm.list = [a, b];
	vm.deleteDecision(a);
	invoker.confirmed();
	await settle();
	expect(bodyOf(axios.calls[0])).toEqual({ r: a });
	expect(vm.list).toEqual([b]);
	expect(pendingEvents(vm)).toEqual([1]);
});

it('si el usuario no acepta no se elimina nada', async () => {
	const { vm } = setup();
	const a = review({ Id: 1 });
	vm.list = [a];
	vm.deleteDecision(a);
	await settle();
	expect(axios.calls).toHaveLength(0);
	expect(vm.list).toEqual([a]);
});
