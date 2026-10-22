import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, mountLite } from './fixtures.mjs';
import WorkItemActions from '@/backoffice/views/Work/WorkItemActions.vue';

function mountActions(privileges, propsData) {
	setupBackoffice(privileges);
	return mountLite(WorkItemActions, { propsData: propsData });
}

const EDITABLE = { IsIndexed: false, Privileges: 'E', Type: 'R' };
const ADMINISTERED = { IsIndexed: false, Privileges: 'A', Type: 'R' };

describe('WorkItemActions: propiedades');

it('actions y filter son null por defecto', () => {
	const vm = mountActions('P', { item: EDITABLE });
	expect(vm.actions).toBeNull();
	expect(vm.filter).toBeNull();
});

describe('WorkItemActions: acciones habilitadas por estado');

it('un trabajo activo (I) se puede modificar, duplicar y archivar si el usuario puede editarlo', () => {
	const vm = mountActions('P', { item: EDITABLE, actions: 'I', filter: 'R' });
	expect(vm.canModify).toBeTruthy();
	expect(vm.canDuplicate).toBeTruthy();
	expect(vm.canArchive).toBeTruthy();
	expect(vm.canUnarchive).toBeFalsy();
	expect(vm.canDuplicateExample).toBeFalsy();
	expect(vm.canDemoteExample).toBeFalsy();
});

it('un trabajo archivado (A) se puede desarchivar pero no archivar', () => {
	const vm = mountActions('P', { item: EDITABLE, actions: 'A', filter: 'R' });
	expect(vm.canUnarchive).toBeTruthy();
	expect(vm.canArchive).toBeFalsy();
});

it('un ejemplo (S) se puede duplicar como ejemplo y no modificar ni duplicar como propio', () => {
	const vm = mountActions('P', { item: EDITABLE, actions: 'S', filter: 'R' });
	expect(vm.canDuplicateExample).toBeTruthy();
	expect(vm.canModify).toBeFalsy();
	expect(vm.canDuplicate).toBeFalsy();
});

it('quitar un ejemplo requiere ser administrador de ejemplos', () => {
	expect(mountActions('A', { item: EDITABLE, actions: 'S', filter: 'R' }).canDemoteExample).toBeTruthy();
	expect(mountActions('E', { item: EDITABLE, actions: 'S', filter: 'R' }).canDemoteExample).toBeFalsy();
});

it('en la papelera (D) se puede restaurar y purgar solo si se administra el trabajo', () => {
	const administrator = mountActions('P', { item: ADMINISTERED, actions: 'D', filter: 'R' });
	expect(administrator.canRestore).toBeTruthy();
	expect(administrator.canPurge).toBeTruthy();
	const editor = mountActions('P', { item: EDITABLE, actions: 'D', filter: 'R' });
	expect(editor.canRestore).toBeFalsy();
	expect(editor.canPurge).toBeFalsy();
});

it('eliminar requiere administrar el trabajo y que no esté en la papelera', () => {
	expect(mountActions('P', { item: ADMINISTERED, actions: 'I', filter: 'R' }).canDelete).toBeTruthy();
	expect(mountActions('P', { item: EDITABLE, actions: 'I', filter: 'R' }).canDelete).toBeFalsy();
	expect(mountActions('P', { item: ADMINISTERED, actions: 'D', filter: 'R' }).canDelete).toBeFalsy();
});

describe('WorkItemActions: eventos');

it('cada handler emite action con su código y el ítem', () => {
	const vm = mountActions('P', { item: EDITABLE, actions: 'I', filter: 'R' });
	vm.onDuplicate();
	vm.onModify();
	vm.onDelete();
	vm.onDemoteExample();
	vm.onRestore();
	vm.onArchive();
	vm.onUnarchive();
	vm.onPurge();
	const codes = vm.$emitted.map(function (event) { return event[1]; });
	expect(codes).toEqual(['DUPLICATE', 'EDIT', 'DELETE', 'DEMOTEEXAMPLE', 'RESTORE', 'ARCHIVE', 'UNARCHIVE', 'PURGE']);
	for (const event of vm.$emitted) {
		expect(event[0]).toBe('action');
		expect(event[2] === EDITABLE).toBeTruthy();
	}
});
