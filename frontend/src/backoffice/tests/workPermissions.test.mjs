import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice } from './fixtures.mjs';
import permissions from '@/backoffice/classes/WorkPermissions';

describe('WorkPermissions: CanEdit');

it('un administrador edita siempre, incluso un ítem indexado o de solo lectura', () => {
	setupBackoffice('A');
	expect(permissions.CanEdit({ IsIndexed: true, Privileges: 'V' }, 'I')).toBeTruthy();
});

it('un editor de datos públicos edita todo lo que se muestra en el filtro P', () => {
	setupBackoffice('E');
	expect(permissions.CanEdit({ IsIndexed: true, Privileges: 'V' }, 'P')).toBeTruthy();
});

it('un editor fuera del filtro P queda sujeto a los privilegios del ítem', () => {
	setupBackoffice('E');
	expect(permissions.CanEdit({ IsIndexed: false, Privileges: 'V' }, 'I')).toBeFalsy();
	expect(permissions.CanEdit({ IsIndexed: false, Privileges: 'E' }, 'I')).toBeTruthy();
});

it('un usuario estándar no edita ítems indexados', () => {
	setupBackoffice('P');
	expect(permissions.CanEdit({ IsIndexed: true, Privileges: 'E' }, 'P')).toBeFalsy();
});

it('un usuario estándar edita salvo que tenga permiso de solo lectura sobre el ítem', () => {
	setupBackoffice('P');
	expect(permissions.CanEdit({ IsIndexed: false, Privileges: 'V' }, 'I')).toBeFalsy();
	expect(permissions.CanEdit({ IsIndexed: false, Privileges: 'E' }, 'I')).toBeTruthy();
	expect(permissions.CanEdit({ IsIndexed: false, Privileges: 'A' }, 'I')).toBeTruthy();
});

it('un lector en el filtro P no recibe el acceso especial del editor', () => {
	setupBackoffice('L');
	expect(permissions.CanEdit({ IsIndexed: false, Privileges: 'V' }, 'P')).toBeFalsy();
});

describe('WorkPermissions: CanAdmin');

it('un administrador administra todo', () => {
	setupBackoffice('A');
	expect(permissions.CanAdmin({ Privileges: 'V' })).toBeTruthy();
});

it('el resto administra solo los ítems donde tiene privilegio A', () => {
	setupBackoffice('E');
	expect(permissions.CanAdmin({ Privileges: 'A' })).toBeTruthy();
	expect(permissions.CanAdmin({ Privileges: 'E' })).toBeFalsy();
});

describe('WorkPermissions: publicación y revocación');

it('publicar queda habilitado si nunca estuvo en línea o si tiene cambios', () => {
	expect(permissions.PublishDisabled({ MetadataLastOnline: null, HasChanges: 0 })).toBeFalsy();
	expect(permissions.PublishDisabled({ MetadataLastOnline: '2024-01-01', HasChanges: 2 })).toBeFalsy();
});

it('publicar queda deshabilitado si ya está en línea y no tiene cambios', () => {
	expect(permissions.PublishDisabled({ MetadataLastOnline: '2024-01-01', HasChanges: 0 })).toBeTruthy();
});

it('revocar queda deshabilitado solo si nunca estuvo en línea', () => {
	expect(permissions.RevokeDisabled({ MetadataLastOnline: null })).toBeTruthy();
	expect(permissions.RevokeDisabled({ MetadataLastOnline: '2024-01-01' })).toBeFalsy();
});

describe('WorkPermissions: privilegios del contexto');

it('CanCreatePublic e IsAdmin delegan en el contexto', () => {
	setupBackoffice('E');
	expect(permissions.CanCreatePublic()).toBeTruthy();
	expect(permissions.IsAdmin()).toBeFalsy();
	setupBackoffice('P');
	expect(permissions.CanCreatePublic()).toBeFalsy();
});

it('administra los ejemplos solo un administrador y solo en el estado S', () => {
	setupBackoffice('A');
	expect(permissions.IsExamplesManager('S')).toBeTruthy();
	expect(permissions.IsExamplesManager('I')).toBeFalsy();
	setupBackoffice('E');
	expect(permissions.IsExamplesManager('S')).toBeFalsy();
});

describe('WorkPermissions: acciones según el estado (I activo, A archivado, D papelera, S ejemplo)');

it('modificar y duplicar requieren poder editar y un estado distinto de D y S', () => {
	setupBackoffice('P');
	const item = { IsIndexed: false, Privileges: 'E' };
	expect(permissions.CanModify(item, 'I', 'I')).toBeTruthy();
	expect(permissions.CanModify(item, 'I', 'A')).toBeTruthy();
	expect(permissions.CanModify(item, 'I', 'D')).toBeFalsy();
	expect(permissions.CanModify(item, 'I', 'S')).toBeFalsy();
	expect(permissions.CanDuplicate(item, 'I', 'I')).toBeTruthy();
	expect(permissions.CanDuplicate(item, 'I', 'D')).toBeFalsy();
	expect(permissions.CanDuplicate(item, 'I', 'S')).toBeFalsy();
});

it('modificar y duplicar se niegan si el usuario no puede editar el ítem', () => {
	setupBackoffice('P');
	const item = { IsIndexed: false, Privileges: 'V' };
	expect(permissions.CanModify(item, 'I', 'I')).toBeFalsy();
	expect(permissions.CanDuplicate(item, 'I', 'I')).toBeFalsy();
});

it('duplicar un ejemplo solo aplica al estado S', () => {
	expect(permissions.CanDuplicateExample('S')).toBeTruthy();
	expect(permissions.CanDuplicateExample('I')).toBeFalsy();
});

it('archivar solo aplica a los activos y desarchivar solo a los archivados', () => {
	expect(permissions.CanArchive('I')).toBeTruthy();
	expect(permissions.CanArchive('A')).toBeFalsy();
	expect(permissions.CanArchive('D')).toBeFalsy();
	expect(permissions.CanArchive('S')).toBeFalsy();
	expect(permissions.CanUnarchive('A')).toBeTruthy();
	expect(permissions.CanUnarchive('I')).toBeFalsy();
});

it('eliminar requiere administrar el ítem y que no esté en la papelera', () => {
	setupBackoffice('E');
	expect(permissions.CanDelete({ Privileges: 'A' }, 'I')).toBeTruthy();
	expect(permissions.CanDelete({ Privileges: 'A' }, 'D')).toBeFalsy();
	expect(permissions.CanDelete({ Privileges: 'E' }, 'I')).toBeFalsy();
});

it('un ejemplo puede eliminarse sin administrarlo, salvo para quien administra ejemplos', () => {
	setupBackoffice('E');
	expect(permissions.CanDelete({ Privileges: 'E' }, 'S')).toBeTruthy();
	setupBackoffice('A');
	expect(permissions.CanDelete({ Privileges: 'A' }, 'S')).toBeFalsy();
});

it('restaurar y purgar requieren administrar el ítem en la papelera', () => {
	setupBackoffice('E');
	expect(permissions.CanRestore({ Privileges: 'A' }, 'D')).toBeTruthy();
	expect(permissions.CanPurge({ Privileges: 'A' }, 'D')).toBeTruthy();
	expect(permissions.CanRestore({ Privileges: 'A' }, 'I')).toBeFalsy();
	expect(permissions.CanPurge({ Privileges: 'E' }, 'D')).toBeFalsy();
});

describe('WorkPermissions: ejemplos y datos públicos');

it('quitar de ejemplos requiere ser administrador de ejemplos', () => {
	setupBackoffice('A');
	expect(permissions.CanDemoteExample('S')).toBeTruthy();
	expect(permissions.CanDemoteExample('I')).toBeFalsy();
	setupBackoffice('E');
	expect(permissions.CanDemoteExample('S')).toBeFalsy();
});

it('promover a ejemplo requiere ser administrador y que el ítem no sea público', () => {
	setupBackoffice('A');
	expect(permissions.CanPromoteExample({ Type: 'R' })).toBeTruthy();
	expect(permissions.CanPromoteExample({ Type: 'P' })).toBeFalsy();
	setupBackoffice('E');
	expect(permissions.CanPromoteExample({ Type: 'R' })).toBeFalsy();
});

it('promover y degradar datos públicos requiere poder crearlos y depende del tipo del ítem', () => {
	setupBackoffice('E');
	expect(permissions.CanPromotePublic({ Type: 'R' })).toBeTruthy();
	expect(permissions.CanPromotePublic({ Type: 'P' })).toBeFalsy();
	expect(permissions.CanDemotePublic({ Type: 'P' })).toBeTruthy();
	expect(permissions.CanDemotePublic({ Type: 'R' })).toBeFalsy();
	setupBackoffice('P');
	expect(permissions.CanPromotePublic({ Type: 'R' })).toBeFalsy();
	expect(permissions.CanDemotePublic({ Type: 'P' })).toBeFalsy();
});
