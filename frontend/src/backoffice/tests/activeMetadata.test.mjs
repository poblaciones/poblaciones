import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice, flushPromises, parseBody } from './fixtures.mjs';
import axios from '@/common/tests/_stubs/axios.cjs';
import ActiveMetadata from '@/backoffice/classes/ActiveMetadata';

const BASE = 'https://api.example.org/services/';

function makeRefreshSpy() {
	return { count: 0, Refresh() { this.count++; } };
}

function setup() {
	axios.reset();
	const browser = setupBackoffice();
	browser.window.Context.Institutions = makeRefreshSpy();
	browser.window.Context.Sources = makeRefreshSpy();
	return browser;
}

function makeWork() {
	return { properties: { Id: 5 }, changed: 0, WorkChanged() { this.changed++; } };
}

function makeMetadata(work, lists) {
	const content = Object.assign({ Files: [], Sources: [], Institutions: [] }, lists);
	return new ActiveMetadata(work, { Id: 9, Title: 'Obra' }, content);
}

function makeItems(count) {
	const items = [];
	for (let n = 0; n < count; n++) {
		items.push({ Id: n + 1, Order: n + 1 });
	}
	return items;
}

function ids(list) {
	return list.map(function (item) { return item.Id; });
}

describe('ActiveMetadata: identidad');

it('con trabajo asociado usa su identificador y la ruta backoffice', () => {
	const metadata = makeMetadata(makeWork());
	expect(metadata.WorkId()).toBe(5);
	expect(metadata.Path()).toBe('backoffice');
});

it('sin trabajo asociado no tiene identificador y usa la ruta admin', () => {
	const metadata = makeMetadata(null);
	expect(metadata.WorkId()).toBeNull();
	expect(metadata.Path()).toBe('admin');
});

it('WorkChanged avisa al trabajo y tolera su ausencia', () => {
	const work = makeWork();
	makeMetadata(work).WorkChanged();
	expect(work.changed).toBe(1);
	makeMetadata(null).WorkChanged();
});

describe('ActiveMetadata: UpdateMetadata');

it('envía los atributos al servicio del trabajo y avisa el cambio', async () => {
	setup();
	axios.respond('post', { data: 'ok' });
	const work = makeWork();
	const metadata = makeMetadata(work);
	await metadata.UpdateMetadata();
	const call = axios.calls[0];
	expect(call.url).toBe(BASE + 'backoffice/UpdateMetadata');
	const body = parseBody(call);
	expect(body.w).toBe('5');
	expect(JSON.parse(body.m)).toEqual({ Id: 9, Title: 'Obra' });
	expect(work.changed).toBe(1);
});

it('sin trabajo usa el servicio admin y no envía identificador de trabajo', async () => {
	setup();
	axios.respond('post', { data: 'ok' });
	await makeMetadata(null).UpdateMetadata();
	expect(axios.calls[0].url).toBe(BASE + 'admin/UpdateMetadata');
	expect(parseBody(axios.calls[0]).w).toBe('');
});

describe('ActiveMetadata: adjuntos');

it('un adjunto nuevo se agrega a la lista con el identificador y archivo que devuelve el servidor', async () => {
	setup();
	axios.respond('post', { data: { Id: 70, File: 'a.pdf' } });
	const files = [];
	const metadata = makeMetadata(makeWork(), { Files: files });
	const item = { Id: null, Caption: 'Anexo' };
	await metadata.UpdateFile(item, 'bucket-1');
	expect(files).toHaveLength(1);
	expect(files[0] === item).toBeTruthy();
	expect(item.Id).toBe(70);
	expect(item.File).toBe('a.pdf');
	const body = parseBody(axios.calls[0]);
	expect(body.b).toBe('bucket-1');
	expect(body.m).toBe('9');
	expect(axios.calls[0].url).toBe(BASE + 'backoffice/UpdateMetadataFile');
});

it('un adjunto existente actualiza archivo y título del original sin duplicarlo', async () => {
	setup();
	axios.respond('post', { data: { Id: 3, File: 'nuevo.pdf', Caption: 'Nuevo título' } });
	const original = { Id: 3, File: 'viejo.pdf', Caption: 'Viejo' };
	const files = [original];
	const metadata = makeMetadata(makeWork(), { Files: files });
	await metadata.UpdateFile({ Id: 3, Caption: 'Viejo' }, null);
	expect(files).toHaveLength(1);
	expect(original.File).toBe('nuevo.pdf');
	expect(original.Caption).toBe('Nuevo título');
});

it('un adjunto existente que ya no está en la lista no produce error ni cambios', async () => {
	setup();
	axios.respond('post', { data: { Id: 99, File: 'x.pdf', Caption: 'x' } });
	const files = [{ Id: 3, File: 'a.pdf', Caption: 'A' }];
	await makeMetadata(makeWork(), { Files: files }).UpdateFile({ Id: 99 }, null);
	expect(files).toHaveLength(1);
	expect(files[0].File).toBe('a.pdf');
});

it('GetAttachmentById devuelve el adjunto o null', () => {
	const metadata = makeMetadata(null, { Files: [{ Id: 1 }, { Id: 2 }] });
	expect(metadata.GetAttachmentById(2).Id).toBe(2);
	expect(metadata.GetAttachmentById(9)).toBeNull();
});

it('DeleteFile pide la baja y quita el adjunto de la lista', async () => {
	setup();
	axios.respond('get', { data: true });
	const files = makeItems(3);
	const work = makeWork();
	await makeMetadata(work, { Files: files }).DeleteFile(files[1]);
	expect(axios.calls[0].url).toBe(BASE + 'backoffice/DeleteMetadataFile');
	expect(axios.calls[0].config.params).toEqual({ f: 2, w: 5, m: 9 });
	expect(ids(files)).toEqual([1, 3]);
	expect(work.changed).toBe(1);
});

it('MoveFileUp y MoveFileDown reordenan la lista una vez confirmado por el servidor', async () => {
	setup();
	axios.respond('get', { data: true });
	const files = makeItems(3);
	const metadata = makeMetadata(makeWork(), { Files: files });
	await metadata.MoveFileUp(files[2]);
	expect(ids(files)).toEqual([1, 3, 2]);
	expect(axios.calls[0].url).toBe(BASE + 'backoffice/MoveMetadataFileUp');
	await metadata.MoveFileDown(files[0]);
	expect(ids(files)).toEqual([3, 1, 2]);
	expect(axios.calls[1].url).toBe(BASE + 'backoffice/MoveMetadataFileDown');
});

describe('ActiveMetadata: fuentes');

it('ContainsSource busca por identificador', () => {
	const metadata = makeMetadata(null, { Sources: [{ Id: 1 }, { Id: 2 }] });
	expect(metadata.ContainsSource({ Id: 2 })).toBeTruthy();
	expect(metadata.ContainsSource({ Id: 3 })).toBeFalsy();
});

it('AddSource y RemoveSource consultan al servidor y luego modifican la lista', async () => {
	setup();
	axios.respond('get', { data: true });
	const sources = makeItems(2);
	const metadata = makeMetadata(makeWork(), { Sources: sources });
	const added = { Id: 7 };
	await metadata.AddSource(added);
	expect(axios.calls[0].url).toBe(BASE + 'backoffice/AddWorkSource');
	expect(axios.calls[0].config.params).toEqual({ w: 5, m: 9, s: 7 });
	expect(ids(sources)).toEqual([1, 2, 7]);
	await metadata.RemoveSource(added);
	expect(axios.calls[1].url).toBe(BASE + 'backoffice/RemoveSourceFromWork');
	expect(ids(sources)).toEqual([1, 2]);
});

it('MoveSourceUp y MoveSourceDown reordenan la lista', async () => {
	setup();
	axios.respond('get', { data: true });
	const sources = makeItems(3);
	const metadata = makeMetadata(makeWork(), { Sources: sources });
	await metadata.MoveSourceUp(sources[1]);
	expect(ids(sources)).toEqual([2, 1, 3]);
	await metadata.MoveSourceDown(sources[1]);
	expect(ids(sources)).toEqual([2, 3, 1]);
	expect(axios.calls[0].url).toBe(BASE + 'backoffice/MoveSourceUp');
	expect(axios.calls[1].url).toBe(BASE + 'backoffice/MoveSourceDown');
});

it('UpdateSource de una fuente nueva la agrega a la lista y refresca el padrón general', async () => {
	const browser = setup();
	axios.respond('post', { data: { Id: 50, Caption: 'Nueva' } });
	const sources = [];
	await makeMetadata(makeWork(), { Sources: sources }).UpdateSource({ Id: null, Caption: 'Nueva' });
	expect(ids(sources)).toEqual([50]);
	expect(browser.window.Context.Sources.count).toBe(1);
	expect(axios.calls[0].url).toBe(BASE + 'backoffice/UpdateWorkSource');
});

it('UpdateSource de una fuente existente reemplaza la de la lista y completa el id de su institución nueva', async () => {
	const browser = setup();
	axios.respond('post', { data: { Id: 2, Caption: 'Editada', Institution: { Id: 88 } } });
	const sources = [{ Id: 1 }, { Id: 2, Caption: 'Vieja' }];
	const edited = { Id: 2, Caption: 'Editada', Institution: { Id: 0 } };
	await makeMetadata(makeWork(), { Sources: sources }).UpdateSource(edited);
	expect(sources[1].Caption).toBe('Editada');
	expect(edited.Institution.Id).toBe(88);
	expect(browser.window.Context.Sources.count).toBe(1);
});

it('UpdateSource con institución ya existente o ausente no modifica su identificador', async () => {
	setup();
	axios.respond('post', { data: { Id: 2, Institution: { Id: 88 } } });
	const withInstitution = { Id: 2, Institution: { Id: 5 } };
	await makeMetadata(makeWork(), { Sources: [{ Id: 2 }] }).UpdateSource(withInstitution);
	expect(withInstitution.Institution.Id).toBe(5);
	const withoutInstitution = { Id: 2, Institution: null };
	await makeMetadata(makeWork(), { Sources: [{ Id: 2 }] }).UpdateSource(withoutInstitution);
	expect(withoutInstitution.Institution).toBeNull();
});

describe('ActiveMetadata: instituciones');

it('AddInstitution y RemoveInstitution consultan al servidor y luego modifican la lista', async () => {
	setup();
	axios.respond('get', { data: true });
	const institutions = makeItems(2);
	const metadata = makeMetadata(makeWork(), { Institutions: institutions });
	const added = { Id: 7 };
	await metadata.AddInstitution(added);
	expect(axios.calls[0].url).toBe(BASE + 'backoffice/AddWorkInstitution');
	expect(axios.calls[0].config.params).toEqual({ w: 5, m: 9, i: 7 });
	expect(ids(institutions)).toEqual([1, 2, 7]);
	await metadata.RemoveInstitution(added);
	expect(axios.calls[1].url).toBe(BASE + 'backoffice/RemoveInstitutionFromWork');
	expect(ids(institutions)).toEqual([1, 2]);
});

it('MoveInstitutionUp y MoveInstitutionDown reordenan la lista', async () => {
	setup();
	axios.respond('get', { data: true });
	const institutions = makeItems(3);
	const metadata = makeMetadata(makeWork(), { Institutions: institutions });
	await metadata.MoveInstitutionUp(institutions[2]);
	expect(ids(institutions)).toEqual([1, 3, 2]);
	await metadata.MoveInstitutionDown(institutions[0]);
	expect(ids(institutions)).toEqual([3, 1, 2]);
});

it('UpdateMetadataInstitution de una institución nueva la agrega, refresca el padrón y devuelve la guardada', async () => {
	const browser = setup();
	const saved = { Id: 60, Caption: 'Nueva' };
	axios.respond('post', { data: saved });
	const institutions = [];
	const result = await makeMetadata(makeWork(), { Institutions: institutions }).UpdateMetadataInstitution({ Id: 0, Caption: 'Nueva' });
	expect(result).toEqual(saved);
	expect(ids(institutions)).toEqual([60]);
	expect(browser.window.Context.Institutions.count).toBe(1);
});

it('UpdateMetadataInstitution de una existente reemplaza la de la lista y refresca el padrón', async () => {
	const browser = setup();
	axios.respond('post', { data: { Id: 2, Caption: 'Editada' } });
	const institutions = [{ Id: 1 }, { Id: 2, Caption: 'Vieja' }];
	await makeMetadata(makeWork(), { Institutions: institutions }).UpdateMetadataInstitution({ Id: 2, Caption: 'Editada' });
	expect(institutions[1].Caption).toBe('Editada');
	expect(institutions).toHaveLength(2);
	expect(browser.window.Context.Institutions.count).toBe(1);
});

it('UpdateInstitution deja la institución guardada en el contenedor y refresca el padrón', async () => {
	const browser = setup();
	const saved = { Id: 4, Caption: 'Guardada' };
	axios.respond('post', { data: saved });
	const container = { Institution: null };
	const result = await makeMetadata(makeWork()).UpdateInstitution({ Id: 4 }, container, 'imagen');
	expect(container.Institution).toEqual(saved);
	expect(result).toEqual(saved);
	expect(parseBody(axios.calls[0]).iwm).toBe('imagen');
	expect(browser.window.Context.Institutions.count).toBe(1);
});

it('GetInstitutionWatermark pide el logo por su identificador sin marcar cambios', async () => {
	setup();
	axios.respond('get', { data: 'logo' });
	const work = makeWork();
	const data = await makeMetadata(work).GetInstitutionWatermark({ Watermark: { Id: 12 } });
	expect(data).toBe('logo');
	expect(axios.calls[0].config.params).toEqual({ w: 5, m: 9, iwmid: 12 });
	expect(work.changed).toBe(0);
	await flushPromises();
});
