import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import BasemapMetadata from '@/map/components/popups/basemapMetadata';
import BasemapButton from '@/map/components/controls/mpBasemapButton';

describe('basemapMetadata: popup de metadatos de una capa base');

function mountMetadata() {
	const segMap = setupWindow({});
	segMap.Configuration.ShortUrlPattern = null;
	segMap.Clipping.FrameHasClippingCircle = function () { return false; };
	segMap.Clipping.FrameHasClippingRegionId = function () { return false; };
	segMap.EnsureBasemapLayerLoaded = function () { return Promise.resolve([]); };
	window.mainHost = 'http://main';
	window.accessLink = null;
	const popup = mountLite(BasemapMetadata, {});
	popup.$refs = { dialog: { show() { popup.shown = true; }, hide() { popup.hidden = true; } } };
	return popup;
}

it('show guarda la capa y expone su metadata y título', () => {
	const popup = mountMetadata();
	popup.show({ Type: 'L', Caption: 'Etiquetas', Metadata: { Id: 10, Name: 'Etiquetas' } });
	expect(popup.shown).toBeTruthy();
	expect(popup.title).toBe('Fuente de Etiquetas');
	expect(popup.metadata.Id).toBe(10);
});

it('el PDF de etiquetas y rasters no lleva cartografía ni delimitación', () => {
	const popup = mountMetadata();
	popup.show({ Type: 'R', Caption: 'Relieve', Metadata: { Id: 10, WorkId: null, BoundaryId: null } });
	const url = popup.resolveMetadataUrl();
	expect(url).toBe('http://main/services/metadata/GetMetadataPdf?m=10');
});

it('el PDF de un indicador agrega la cartografía dueña (w) y el de una delimitación, la delimitación (b)', () => {
	const popup = mountMetadata();
	popup.show({ Type: 'M', Caption: 'Rutas', Metadata: { Id: 7, WorkId: 33, BoundaryId: null } });
	expect(popup.resolveMetadataUrl().indexOf('&w=33') !== -1).toBeTruthy();
	expect(popup.resolveMetadataUrl().indexOf('&b=') === -1).toBeTruthy();
	popup.show({ Type: 'B', Caption: 'Provincias', Metadata: { Id: 8, WorkId: null, BoundaryId: 1 } });
	expect(popup.resolveMetadataUrl().indexOf('&b=1') !== -1).toBeTruthy();
});

it('solo indicadores y delimitaciones ofrecen descargas', () => {
	const popup = mountMetadata();
	popup.show({ Type: 'L', Caption: 'Etiquetas', Metadata: { Id: 1 } });
	expect(popup.canDownload).toBeFalsy();
	popup.show({ Type: 'R', Caption: 'Relieve', Metadata: { Id: 1 } });
	expect(popup.canDownload).toBeFalsy();
	popup.show({ Type: 'M', Caption: 'Rutas', Metadata: { Id: 1 } });
	expect(popup.canDownload).toBeTruthy();
	popup.show({ Type: 'B', Caption: 'Provincias', Metadata: { Id: 1 } });
	expect(popup.canDownload).toBeTruthy();
});

it('el título es «Fuente de» seguido del nombre de la capa', () => {
	const popup = mountMetadata();
	popup.show({ Type: 'L', Caption: 'Etiquetas', Metadata: { Id: 1 } });
	expect(popup.title).toBe('Fuente de Etiquetas');
});

it('filled ignora textos vacíos o con solo espacios (metadatos mínimos)', () => {
	const popup = mountMetadata();
	expect(popup.filled(' ')).toBeFalsy();
	expect(popup.filled(null)).toBeFalsy();
	expect(popup.filled('Autor')).toBeTruthy();
});

it('las capas de etiquetas y rasters no piden la capa activa ni preparan descarga', () => {
	const popup = mountMetadata();
	let requested = 0;
	window.SegMap.EnsureBasemapLayerLoaded = function () { requested++; return Promise.resolve([]); };
	popup.show({ Type: 'R', Caption: 'Relieve', Metadata: { Id: 1 } });
	expect(requested).toBe(0);
	expect(popup.downloaders).toEqual([]);
	expect(popup.loadingDownload).toBe(false);
});

function stubActive(name) {
	return {
		properties: {
			Id: 4,
			Metric: { Name: 'Indicador ' + (name || 'uno') },
			Versions: [{ Id: 9, Work: { Id: 33 }, SelectedLevelIndex: 0, Levels: [{ HasArea: true, HasUrbanity: false, Dataset: { Id: 70 } }] }],
			SelectedVersionIndex: 0,
			SelectedUrbanity: 'N'
		},
		Compare: { Active: false },
		SelectedLevel() { return { Partitions: null }; },
		GetSelectedPartition() { return null; },
		SelectedVersion() { return { Id: 9, Metadata: { Name: 'Provincias' } }; }
	};
}

it('para un indicador prepara un descargador sobre la primera capa activa sin cerrar el popup', async () => {
	const popup = mountMetadata();
	const active = stubActive();
	window.SegMap.EnsureBasemapLayerLoaded = function () { return Promise.resolve([active]); };
	popup.show({ Type: 'M', Caption: 'Rutas', Metadata: { Id: 7 } });
	expect(popup.loadingDownload).toBe(true);
	await Promise.resolve();
	await Promise.resolve();
	expect(popup.loadingDownload).toBe(false);
	expect(popup.downloaders).toHaveLength(1);
	expect(popup.downloaders[0].downloader.IsMetric()).toBe(true);
	expect(popup.downloaders[0].downloader.target).toBe(active);
	expect(popup.hidden).toBeFalsy();
});

it('para una delimitación prepara un descargador de delimitación', async () => {
	const popup = mountMetadata();
	const active = stubActive();
	window.SegMap.EnsureBasemapLayerLoaded = function () { return Promise.resolve([active]); };
	popup.show({ Type: 'B', Caption: 'Provincias', Metadata: { Id: 8 } });
	await Promise.resolve();
	await Promise.resolve();
	expect(popup.downloaders).toHaveLength(1);
	expect(popup.downloaders[0].downloader.IsMetric()).toBe(false);
	expect(popup.downloaders[0].downloader.target).toBe(active);
});

it('si se abre otra capa antes de que llegue la respuesta, se descarta el descargador viejo', async () => {
	const popup = mountMetadata();
	window.SegMap.EnsureBasemapLayerLoaded = function () { return Promise.resolve([stubActive()]); };
	popup.show({ Type: 'M', Caption: 'Rutas', Metadata: { Id: 7 } });
	popup.show({ Type: 'L', Caption: 'Etiquetas', Metadata: { Id: 1 } });
	await Promise.resolve();
	await Promise.resolve();
	expect(popup.downloaders).toEqual([]);
});

it('una capa con varios indicadores prepara un descargador por cada uno, con su nombre', async () => {
	const popup = mountMetadata();
	const first = stubActive('A');
	const second = stubActive('B');
	window.SegMap.EnsureBasemapLayerLoaded = function () { return Promise.resolve([first, second]); };
	popup.show({ Type: 'M', Caption: 'Rutas', Metadata: { Id: 7 } });
	await Promise.resolve();
	await Promise.resolve();
	expect(popup.downloaders.map(function (item) { return item.caption; })).toEqual(['Indicador A', 'Indicador B']);
	expect(popup.downloaders[1].downloader.target).toBe(second);
});

it('cerrar el popup cancela las descargas en preparación', async () => {
	const popup = mountMetadata();
	window.SegMap.EnsureBasemapLayerLoaded = function () { return Promise.resolve([stubActive('A'), stubActive('B')]); };
	popup.show({ Type: 'M', Caption: 'Rutas', Metadata: { Id: 7 } });
	await Promise.resolve();
	await Promise.resolve();
	popup.cancelDownloads();
	expect(popup.downloaders.map(function (item) { return item.downloader.cancelled; })).toEqual([true, true]);
});

it('abrir otra capa cancela las descargas de la anterior', async () => {
	const popup = mountMetadata();
	window.SegMap.EnsureBasemapLayerLoaded = function () { return Promise.resolve([stubActive('A')]); };
	popup.show({ Type: 'M', Caption: 'Rutas', Metadata: { Id: 7 } });
	await Promise.resolve();
	await Promise.resolve();
	const previous = popup.downloaders[0].downloader;
	popup.show({ Type: 'L', Caption: 'Etiquetas', Metadata: { Id: 1 } });
	expect(previous.cancelled).toBe(true);
});

describe('mpBasemapButton: panel de capas base');

function mountButton(layers, showLabels) {
	setupWindow({});
	return mountLite(BasemapButton, {
		props: { toolbarStates: { showLabels: showLabels, basemapLayers: layers }, readonly: false, sidebarPosition: 'top' }
	});
}

it('el ícono de fuente usa el vínculo del visor y el texto «Fuente de» la capa', () => {
	const button = mountButton([], true);
	expect(button.sourceTitle({ Caption: 'Rutas' })).toBe('Fuente de Rutas');
});

it('showMetadata abre el popup de metadatos de la capa', () => {
	const button = mountButton([], true);
	const shown = [];
	window.Popups = { BasemapMetadata: { show(layer) { shown.push(layer); } } };
	const layer = { Id: 2, Caption: 'Rutas' };
	button.showMetadata(layer);
	expect(shown).toEqual([layer]);
});

it('isVisible toma etiquetas del estado general del mapa y el resto de su propia visibilidad', () => {
	const labels = { Id: 1, Type: 'L', Visible: true };
	const metric = { Id: 2, Type: 'M', Visible: true };
	const button = mountButton([labels, metric], false);
	expect(button.isVisible(labels)).toBeFalsy();
	expect(button.isVisible(metric)).toBeTruthy();
});

it('iconOf usa un ícono genérico si la capa no tiene uno', () => {
	const button = mountButton([], true);
	expect(button.iconOf({ Icon: 'fas fa-road' })).toBe('fas fa-road');
	expect(button.iconOf({ Icon: null })).toBe('fas fa-layer-group');
});

it('toggleLayer despacha según el tipo y emite layerToggled', () => {
	const calls = [];
	const segMap = setupWindow({});
	segMap.ToggleShowLabels = function () { calls.push('labels'); };
	segMap.ToggleBasemapRaster = function (l) { calls.push('raster' + l.Id); };
	segMap.ToggleBasemapMetric = function (l) { calls.push('metric' + l.Id); };
	const button = mountLite(BasemapButton, {
		props: { toolbarStates: { showLabels: true, basemapLayers: [] }, readonly: false, sidebarPosition: 'top' }
	});
	button.toggleLayer({ Id: 1, Type: 'L', Visible: true });
	button.toggleLayer({ Id: 2, Type: 'R', Visible: false });
	button.toggleLayer({ Id: 3, Type: 'M', Visible: false });
	button.toggleLayer({ Id: 4, Type: 'B', Visible: false });
	expect(calls).toEqual(['labels', 'raster2', 'metric3', 'metric4']);
	expect(button.$emitted).toHaveLength(4);
});
