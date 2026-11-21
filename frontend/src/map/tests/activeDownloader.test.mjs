import { describe, it, expect } from './_harness.mjs';
import { setupWindow, mountLite } from './fixtures.mjs';
import axios from 'axios';
import err from '@/common/framework/err';
import ActiveDownloader from '@/map/classes/ActiveDownloader';
import DownloadButton from '@/map/components/controls/downloadButton';
import DownloadMenu from '@/map/components/controls/downloadMenu';

function setupSegMap(clippingOverrides) {
	const segMap = setupWindow({});
	segMap.Clipping.FrameHasClippingCircle = function () { return false; };
	segMap.Clipping.FrameHasClippingRegionId = function () { return false; };
	Object.assign(segMap.Clipping, clippingOverrides || {});
	return segMap;
}

function metricTarget(levelOverrides, targetOverrides) {
	const level = Object.assign({ HasArea: true, HasUrbanity: false, Dataset: { Id: 70, AreSegments: false } }, levelOverrides || {});
	return Object.assign({
		properties: {
			Id: 4,
			Versions: [{ Id: 9, Work: { Id: 33 }, SelectedLevelIndex: 0, Levels: [level] }],
			SelectedVersionIndex: 0,
			SelectedUrbanity: 'U'
		},
		Compare: { Active: false },
		SelectedLevel() { return { Partitions: null }; },
		GetSelectedPartition() { return 5; }
	}, targetOverrides || {});
}

function boundaryTarget() {
	return {
		properties: { Id: 12 },
		SelectedVersion() { return { Id: 3 }; }
	};
}

function keysOf(formats) {
	return formats.map(function (f) { return f.key; });
}

describe('ActiveDownloader: formatos');

it('un indicador con polígonos ofrece los formatos de datos y los de datos con geometría', () => {
	setupSegMap();
	const downloader = ActiveDownloader.ForMetric(metricTarget({ HasArea: true }));
	expect(keysOf(downloader.GetDataFormats())).toEqual(['c', 'x', 's', 't', 'r']);
	expect(keysOf(downloader.GetSpatialFormats())).toEqual(['cw', 'hw', 'gw']);
});

it('un indicador de puntos suma shapefile y geopackage a los datos, y también ofrece los de geometría si son segmentos', () => {
	setupSegMap();
	const points = ActiveDownloader.ForMetric(metricTarget({ HasArea: false }));
	expect(keysOf(points.GetDataFormats())).toEqual(['c', 'x', 's', 't', 'r', 'h', 'g']);
	expect(points.HasSpatialFormats()).toBeFalsy();
	expect(points.GetSpatialFormats()).toEqual([]);
	const segments = ActiveDownloader.ForMetric(metricTarget({ HasArea: false, Dataset: { Id: 70, AreSegments: true } }));
	expect(segments.HasSpatialFormats()).toBeTruthy();
});

it('una delimitación ofrece datos y geometría, sin shapefile en los datos', () => {
	setupSegMap();
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	expect(keysOf(downloader.GetDataFormats())).toEqual(['c', 'x', 's', 't', 'r']);
	expect(keysOf(downloader.GetSpatialFormats())).toEqual(['cw', 'hw', 'gw']);
});

describe('ActiveDownloader: pedido');

it('arma los parámetros de un indicador con dataset, cartografía, urbanidad y partición', () => {
	setupSegMap();
	const downloader = ActiveDownloader.ForMetric(metricTarget({ HasUrbanity: true }, {
		SelectedLevel() { return { Partitions: [1, 2] }; }
	}));
	expect(downloader.urbanity).toBe('U');
	expect(downloader.partition).toBe(5);
	expect(downloader.UrlArgs('c')).toBe('t=c&d=70&u=U&g=5&w=33');
});

it('omite urbanidad y partición cuando el nivel no las usa', () => {
	setupSegMap();
	const downloader = ActiveDownloader.ForMetric(metricTarget());
	expect(downloader.UrlArgs('x')).toBe('t=x&d=70&w=33');
});

it('con comparación activa agrega el dataset comparado', () => {
	setupSegMap();
	const target = metricTarget({}, {
		Compare: { Active: true, SelectedLevel() { return { Dataset: { Id: 81 } }; } }
	});
	expect(ActiveDownloader.ForMetric(target).UrlArgs('c')).toBe('t=c&d=70&p=81&w=33');
});

it('arma los parámetros de una delimitación', () => {
	setupSegMap();
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	expect(downloader.UrlArgs('cw')).toBe('t=cw&s=b&b=12&v=3');
});

it('el recorte por zonas acota la descarga y se puede quitar una zona', () => {
	setupSegMap({
		FrameHasClippingRegionId() { return true; },
		clipping: { Region: { Summary: { Regions: [{ Id: 1 }, { Id: 2 }] } } }
	});
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	expect(downloader.UsesFilter()).toBe(true);
	expect(downloader.UrlArgs('c')).toBe('t=c&s=b&b=12&v=3&r=1,2');
	downloader.RemoveRegion(1);
	expect(downloader.UrlArgs('c')).toBe('t=c&s=b&b=12&v=3&r=2');
	downloader.RemoveRegion(2);
	expect(downloader.UsesFilter()).toBe(false);
	expect(downloader.UrlArgs('c')).toBe('t=c&s=b&b=12&v=3');
});

it('sin recorte no hay zonas ni filtro', () => {
	setupSegMap();
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	expect(downloader.regions).toEqual([]);
	expect(downloader.UsesFilter()).toBe(false);
});

it('las URL de inicio, paso y archivo dependen del tipo', () => {
	setupSegMap();
	const metric = ActiveDownloader.ForMetric(metricTarget());
	expect(metric.StartUrl()).toBe('http://host/services/download/StartDatasetDownload');
	expect(metric.StepUrl()).toBe('http://host/services/download/StepDatasetDownload');
	expect(metric.FileUrl('c')).toBe('http://host/services/download/GetDatasetFile?t=c&d=70&w=33');
	const boundary = ActiveDownloader.ForBoundary(boundaryTarget());
	expect(boundary.StartUrl()).toBe('http://host/services/download/StartBoundaryDownload');
	expect(boundary.StepUrl()).toBe('http://host/services/download/StepBoundaryDownload');
});

describe('ActiveDownloader: generación del archivo');

function stubDownloadEnvironment(responses) {
	const segMap = setupSegMap();
	const anchor = { href: null };
	globalThis.document = { getElementById(id) { if (id === 'downloadAnchor') { return anchor; } return null; } };
	window.location = { href: null };
	window.accessLink = null;
	const calls = [];
	axios.get = function (url, config) {
		calls.push({ url: url, params: config.params });
		return Promise.resolve({ data: responses.shift() });
	};
	return { segMap, anchor, calls };
}

it('Download inicia, avanza por pasos informando el porcentaje y al final envía el archivo', async () => {
	const env = stubDownloadEnvironment([
		{ done: false, key: 'k1', slice: 1, totalSlices: 4 },
		{ done: false, key: 'k2', slice: 3, totalSlices: 4 },
		{ done: true }
	]);
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	const progress = [];
	await downloader.Download('x', function (p) { progress.push(p); });
	expect(env.calls.map(function (c) { return c.url; })).toEqual([
		'http://host/services/download/StartBoundaryDownload?t=x&s=b&b=12&v=3',
		'http://host/services/download/StepBoundaryDownload',
		'http://host/services/download/StepBoundaryDownload'
	]);
	expect(env.calls[1].params).toEqual({ k: 'k1' });
	expect(env.calls[2].params).toEqual({ k: 'k2' });
	expect(progress).toEqual([25, 75, 100]);
	expect(env.anchor.href).toBe('http://host/services/download/GetBoundaryFile?t=x&s=b&b=12&v=3');
	expect(window.location.href).toBe('http://host/services/download/GetBoundaryFile?t=x&s=b&b=12&v=3');
	expect(window.SegMap.Session.Content.calls[0].method).toBe('Download');
	expect(window.SegMap.Session.Content.calls[0].args).toEqual(['x']);
});

it('Download rechaza si el servidor nunca termina', async () => {
	const responses = [];
	for (let i = 0; i < 1100; i++) {
		responses.push({ done: false, key: 'k' });
	}
	stubDownloadEnvironment(responses);
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	let failure = null;
	try {
		await downloader.Download('c', function () {});
	} catch (error) {
		failure = error;
	}
	expect(failure).toBeTruthy();
	expect(failure.message).toBe('Hard limit reached');
});

it('Run informa el error en un diálogo en lugar de propagarlo', async () => {
	setupSegMap();
	window.accessLink = null;
	axios.get = function () { return Promise.reject(new Error('sin red')); };
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	const before = err.calls.length;
	await downloader.Run('c', function () {});
	expect(err.calls).toHaveLength(before + 1);
	expect(err.calls[before].code).toBe('download');
});

it('envía el enlace de acceso cuando existe', async () => {
	const env = stubDownloadEnvironment([{ done: true }]);
	window.accessLink = 'abc';
	let headers = null;
	axios.get = function (url, config) { headers = config.headers; return Promise.resolve({ data: { done: true } }); };
	await ActiveDownloader.ForBoundary(boundaryTarget()).Download('c', function () {});
	expect(headers).toEqual({ 'Access-Link': 'abc' });
	expect(env.calls).toHaveLength(0);
});

describe('ActiveDownloader: cancelación');

it('cancelar entre pasos detiene la generación y no entrega el archivo', async () => {
	const env = stubDownloadEnvironment([
		{ done: false, key: 'k1' },
		{ done: false, key: 'k2' },
		{ done: true }
	]);
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	const originalGet = axios.get;
	axios.get = function (url, config) {
		const result = originalGet(url, config);
		if (env.calls.length === 2) {
			downloader.Cancel();
		}
		return result;
	};
	const finished = await downloader.Download('x', function () {});
	expect(finished).toBe(false);
	expect(env.calls).toHaveLength(2);
	expect(env.anchor.href).toBeNull();
	expect(window.location.href).toBeNull();
});

it('cancelar aborta el pedido que está pendiente', () => {
	stubDownloadEnvironment([]);
	let aborted = 0;
	axios.CancelToken = function (executor) { executor(function () { aborted++; }); };
	axios.get = function () { return new Promise(function () {}); };
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	downloader.Download('x', function () {});
	downloader.Cancel();
	expect(aborted).toBe(1);
	expect(downloader.cancelled).toBe(true);
});

it('un pedido abortado por la cancelación no se informa como error', async () => {
	setupSegMap();
	window.accessLink = null;
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	axios.get = function () {
		downloader.Cancel();
		return Promise.reject(new Error('cancelado'));
	};
	const before = err.calls.length;
	const result = await downloader.Run('c', function () {});
	expect(result).toBe(false);
	expect(err.calls).toHaveLength(before);
});

it('una descarga nueva después de cancelar vuelve a funcionar', async () => {
	const env = stubDownloadEnvironment([{ done: true }]);
	const downloader = ActiveDownloader.ForBoundary(boundaryTarget());
	downloader.Cancel();
	const finished = await downloader.Download('c', function () {});
	expect(finished).toBe(true);
	expect(env.anchor.href).toBe('http://host/services/download/GetBoundaryFile?t=c&s=b&b=12&v=3');
});

describe('ActiveDownloader: nombre');

it('el nombre es el del indicador o el de la delimitación', () => {
	setupSegMap();
	const target = metricTarget();
	target.properties.Metric = { Name: 'Rutas' };
	expect(ActiveDownloader.ForMetric(target).GetCaption()).toBe('Rutas');
	const boundary = boundaryTarget();
	boundary.SelectedVersion = function () { return { Id: 3, Metadata: { Name: 'Provincias' } }; };
	expect(ActiveDownloader.ForBoundary(boundary).GetCaption()).toBe('Provincias');
});

describe('downloadMenu');

function mountMenu(formats) {
	setupWindow({});
	return mountLite(DownloadMenu, { props: { caption: 'Dataset', formats: formats } });
}

it('el menú se abre, se cierra y alterna', () => {
	const menu = mountMenu([]);
	menu.menuStyle = {};
	menu.$refs = { trigger: { getBoundingClientRect() { return { right: 500, top: 100, bottom: 130 }; } }, menu: { offsetHeight: 100 } };
	menu.open();
	expect(menu.isOpen).toBe(true);
	menu.close();
	expect(menu.isOpen).toBe(false);
	menu.toggle();
	expect(menu.isOpen).toBe(true);
	menu.toggle();
	expect(menu.isOpen).toBe(false);
});

it('se alinea a la derecha del botón y se abre hacia abajo si hay lugar', () => {
	const menu = mountMenu([]);
	menu.$refs = { trigger: { getBoundingClientRect() { return { right: 500, top: 100, bottom: 130 }; } }, menu: { offsetHeight: 100 } };
	const style = menu.placeMenu();
	expect(style.right).toBe('700px');
	expect(style.top).toBe('134px');
	expect(style.bottom).toBe(undefined);
});

it('se abre hacia arriba, flotando sobre el borde del botón, si abajo no hay lugar', () => {
	const menu = mountMenu([]);
	menu.$refs = { trigger: { getBoundingClientRect() { return { right: 500, top: 760, bottom: 790 }; } }, menu: { offsetHeight: 100 } };
	const style = menu.placeMenu();
	expect(style.top).toBe(undefined);
	expect(style.bottom).toBe('44px');
});

it('elegir un formato cierra el menú y lo informa', () => {
	const menu = mountMenu([{ key: 'c', caption: 'Texto' }]);
	menu.isOpen = true;
	menu.select({ key: 'c', caption: 'Texto' });
	expect(menu.isOpen).toBe(false);
	expect(menu.$emitted[0].event).toBe('select');
	expect(menu.$emitted[0].args[0].key).toBe('c');
});

describe('downloadButton');

function mountButton(downloader) {
	setupWindow({});
	return mountLite(DownloadButton, { props: { downloader: downloader } });
}

it('separa los formatos de datos (Dataset) de los de geometría (Geometrías)', () => {
	setupSegMap();
	const button = mountButton(ActiveDownloader.ForBoundary(boundaryTarget()));
	expect(keysOf(button.dataFormats)).toEqual(['c', 'x', 's', 't', 'r']);
	expect(keysOf(button.spatialFormats)).toEqual(['cw', 'hw', 'gw']);
});

it('elegir un formato informa el avance y vuelve a habilitar los botones al terminar', async () => {
	setupSegMap();
	const asked = [];
	const downloader = {
		GetDataFormats() { return []; },
		GetSpatialFormats() { return []; },
		Run(type, onProgress) {
			asked.push(type);
			onProgress(40);
			return Promise.resolve();
		}
	};
	const button = mountButton(downloader);
	const promise = button.start({ key: 'x', caption: 'Excel' });
	expect(button.working).toBe(true);
	expect(button.progressText).toBe('(40%)');
	await promise;
	expect(button.working).toBe(false);
	expect(asked).toEqual(['x']);
});
