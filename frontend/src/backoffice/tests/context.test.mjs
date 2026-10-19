import { describe, it, expect } from './_harness.mjs';
import { setupBackoffice } from './fixtures.mjs';
import Vue from './_stubs/vue.mjs';
import Context from '@/backoffice/classes/Context';
import app from '@/backoffice/classes/moduleApp';

function makeContext(privileges) {
	const context = new Context();
	context.User = { Privileges: privileges };
	return context;
}

function makeCatalogSpy() {
	return {
		refreshCount: 0,
		loading: false,
		list: [],
		Refresh() {
			this.refreshCount++;
		},
	};
}

function installCatalogSpies(context) {
	const names = ['Factory', 'Sources', 'Geographies', 'Institutions', 'PublicMetrics', 'CartographyMetrics', 'MetricGroups', 'MetricProviders'];
	for (const name of names) {
		context[name] = makeCatalogSpy();
	}
	return names;
}

describe('Context: estado inicial');

it('arranca sin usuario, sin cartografías ni trabajo actual', () => {
	const context = new Context();
	expect(context.User).toBeNull();
	expect(context.Cartographies).toEqual([]);
	expect(context.CartographiesStarted).toBeFalsy();
	expect(context.CurrentWork).toBeNull();
	expect(context.CurrentDataset).toBeNull();
	expect(context.ErrorSignaled).toEqual({ value: 0 });
});

describe('Context: Initialize');

it('crea cada catálogo apuntando a su servicio bajo el host configurado', () => {
	setupBackoffice();
	const context = new Context();
	context.Initialize();
	const base = 'https://api.example.org/services/backoffice/';
	expect(context.Factory.url).toBe(base + 'GetFactories');
	expect(context.Sources.url).toBe(base + 'GetAllSourcesByCurrentUser');
	expect(context.Geographies.url).toBe(base + 'GetAllGeographies');
	expect(context.Institutions.url).toBe(base + 'GetAllInstitutionsByCurrentUser');
	expect(context.PublicMetrics.url).toBe(base + 'GetPublicMetrics');
	expect(context.CartographyMetrics.url).toBe(base + 'GetCartographyMetrics');
	expect(context.MetricGroups.url).toBe(base + 'GetAllMetricGroups');
	expect(context.MetricProviders.url).toBe(base + 'GetAllMetricProviders');
});

it('LoadStaticLists refresca los ocho catálogos', () => {
	const context = new Context();
	const names = installCatalogSpies(context);
	context.LoadStaticLists();
	for (const name of names) {
		expect(context[name].refreshCount).toBe(1);
	}
});

describe('Context: GetTrackingLevelGeography');

it('devuelve la geografía marcada como nivel de seguimiento', () => {
	const context = new Context();
	context.Geographies = { loading: false, list: [{ Id: 1, IsTrackingLevel: false }, { Id: 2, IsTrackingLevel: true }] };
	expect(context.GetTrackingLevelGeography().Id).toBe(2);
});

it('falla si las geografías aún se están cargando', () => {
	const context = new Context();
	context.Geographies = { loading: true, list: [] };
	let thrown = null;
	try {
		context.GetTrackingLevelGeography();
	} catch (e) {
		thrown = e;
	}
	expect(thrown.message).toBe('La tabla de geografías aún no se ha cargado.');
});

it('falla si ninguna geografía es nivel de seguimiento', () => {
	const context = new Context();
	context.Geographies = { loading: false, list: [{ Id: 1, IsTrackingLevel: false }] };
	let thrown = null;
	try {
		context.GetTrackingLevelGeography();
	} catch (e) {
		thrown = e;
	}
	expect(thrown.message).toBe('No hay un tracking level definido.');
});

describe('Context: URLs y ayuda');

it('GetCreateFileUrl arma la URL de importación con el identificador del bucket', () => {
	setupBackoffice();
	expect(new Context().GetCreateFileUrl('abc')).toBe('https://api.example.org/services/backoffice/PostImportChunk?b=abc');
});

it('HelpLinkSection devuelve cadena vacía sin elemento de ayuda', () => {
	const context = new Context();
	expect(context.HelpLinkSection(null)).toBe('');
	expect(context.HelpLinkSection(undefined)).toBe('');
});

it('HelpLinkSection arma el enlace al destino con el título compuesto', () => {
	const context = new Context();
	context.Configuration = { Help: { UploadGuideLink: { Url: 'https://x.org/guia.pdf', Caption: 'Guía' } } };
	const html = context.HelpLinkSection({ Url: 'cargar', Caption: 'Cargar datos' });
	expect(html.includes("href='https://x.org/guia.pdf#nameddest=cargar'")).toBeTruthy();
	expect(html.includes('Guía - Cargar datos</a>')).toBeTruthy();
});

describe('Context: privilegios');

it('IsAdmin es verdadero solo para el administrador', () => {
	expect(makeContext('A').IsAdmin()).toBeTruthy();
	expect(makeContext('E').IsAdmin()).toBeFalsy();
});

it('CanCreatePublicData y CanEditStaticLists admiten administradores y editores', () => {
	for (const privileges of ['A', 'E']) {
		expect(makeContext(privileges).CanCreatePublicData()).toBeTruthy();
		expect(makeContext(privileges).CanEditStaticLists()).toBeTruthy();
	}
	for (const privileges of ['L', 'P']) {
		expect(makeContext(privileges).CanCreatePublicData()).toBeFalsy();
		expect(makeContext(privileges).CanEditStaticLists()).toBeFalsy();
	}
});

it('CanAccessAdminSite admite administradores, editores y lectores', () => {
	expect(makeContext('A').CanAccessAdminSite()).toBeTruthy();
	expect(makeContext('E').CanAccessAdminSite()).toBeTruthy();
	expect(makeContext('L').CanAccessAdminSite()).toBeTruthy();
	expect(makeContext('P').CanAccessAdminSite()).toBeFalsy();
});

it('CanViewPublicData admite a un usuario estándar solo si tiene datos públicos propios', () => {
	const context = makeContext('P');
	expect(context.CanViewPublicData()).toBeFalsy();
	context.CartographiesStarted = true;
	context.Cartographies = [{ Id: 1, Type: 'P' }];
	expect(context.CanViewPublicData()).toBeTruthy();
	expect(makeContext('L').CanViewPublicData()).toBeTruthy();
});

describe('Context: cartografías');

it('HasPublicData ignora las cartografías si la carga todavía no comenzó', () => {
	const context = new Context();
	context.Cartographies = [{ Id: 1, Type: 'P' }];
	expect(context.HasPublicData()).toBeFalsy();
	context.CartographiesStarted = true;
	expect(context.HasPublicData()).toBeTruthy();
	context.Cartographies = [{ Id: 1, Type: 'R' }];
	expect(context.HasPublicData()).toBeFalsy();
});

it('UpdatePrivacy actualiza la cartografía indicada y deja las demás', () => {
	const context = new Context();
	context.CartographiesStarted = true;
	context.Cartographies = [{ Id: 1, IsPrivate: true }, { Id: 2, IsPrivate: true }];
	context.UpdatePrivacy(2, false);
	expect(context.Cartographies[0].IsPrivate).toBeTruthy();
	expect(context.Cartographies[1].IsPrivate).toBeFalsy();
});

it('UpdatePrivacy no hace nada si la carga de cartografías no comenzó', () => {
	const context = new Context();
	context.Cartographies = [{ Id: 1, IsPrivate: true }];
	context.UpdatePrivacy(1, false);
	expect(context.Cartographies[0].IsPrivate).toBeTruthy();
});

describe('Context: RefreshMetrics');

it('refresca las métricas públicas para un trabajo público y las de cartografía para uno de tipo R', () => {
	const context = new Context();
	installCatalogSpies(context);
	context.CurrentWork = { properties: { Type: 'P' } };
	context.RefreshMetrics();
	expect(context.PublicMetrics.refreshCount).toBe(1);
	expect(context.CartographyMetrics.refreshCount).toBe(0);
	context.CurrentWork = { properties: { Type: 'R' } };
	context.RefreshMetrics();
	expect(context.CartographyMetrics.refreshCount).toBe(1);
});

it('con un tipo de trabajo desconocido avisa y no refresca nada', () => {
	const browser = setupBackoffice();
	const context = new Context();
	installCatalogSpies(context);
	context.CurrentWork = { properties: { Type: 'X' } };
	context.RefreshMetrics();
	expect(browser.alerts).toEqual(['Invalid work type']);
	expect(context.PublicMetrics.refreshCount).toBe(0);
	expect(context.CartographyMetrics.refreshCount).toBe(0);
});

describe('Context: CreateStore');

it('instala Vuex y crea un store con el módulo app y los getters de barra lateral y dispositivo', () => {
	Vue.reset();
	const store = new Context().CreateStore();
	expect(Vue.used).toHaveLength(1);
	expect(store.options.modules.app === app).toBeTruthy();
	const state = { app: { sidebar: { opened: true }, device: 'mobile' } };
	expect(store.options.getters.sidebar(state)).toEqual({ opened: true });
	expect(store.options.getters.device(state)).toBe('mobile');
});
