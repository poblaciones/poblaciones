import axios from 'axios';
import h from '@/map/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import session from '@/common/framework/session';

export default ActiveDownloader;

const KIND_METRIC = 'metric';
const KIND_BOUNDARY = 'boundary';
const MAX_STEPS = 1000;

// Descarga de los datos de un indicador o de una delimitación activos: formatos
// disponibles, parámetros del pedido (nivel, filtros, selección) y la generación
// del archivo por pasos. La usan los diálogos de descarga y el botón Descargar
// de los metadatos de las capas base.
function ActiveDownloader(kind, target) {
	this.kind = kind;
	this.target = target;
	this.regions = ActiveDownloader.GetClippingRegions();
	this.levelIndex = 0;
	this.urbanity = null;
	this.partition = null;
	this.cancelled = false;
	this.cancelRequest = null;
	if (kind === KIND_METRIC) {
		this.levelIndex = this.GetVersion().SelectedLevelIndex;
		this.urbanity = target.properties.SelectedUrbanity;
		this.partition = target.GetSelectedPartition();
	}
};

ActiveDownloader.ForMetric = function (metric) {
	return new ActiveDownloader(KIND_METRIC, metric);
};

ActiveDownloader.ForBoundary = function (boundary) {
	return new ActiveDownloader(KIND_BOUNDARY, boundary);
};

// Zonas del recorte vigente, que acotan por defecto lo que se descarga.
ActiveDownloader.GetClippingRegions = function () {
	var clipping = window.SegMap.Clipping;
	if (clipping.FrameHasClippingCircle() || clipping.FrameHasClippingRegionId()) {
		return [].concat(clipping.clipping.Region.Summary.Regions);
	}
	return [];
};

ActiveDownloader.SendFile = function (url, newTab = false) {
	const a = document.getElementById('downloadAnchor');
	a.href = url;
	if (newTab) {
		window.open(url, '_blank');
	} else {
		window.location.href = url;
	}
};

ActiveDownloader.prototype.IsMetric = function () {
	return this.kind === KIND_METRIC;
};

// Nombre del indicador o de la delimitación que se descarga.
ActiveDownloader.prototype.GetCaption = function () {
	if (this.IsMetric()) {
		return this.target.properties.Metric.Name;
	}
	return this.GetVersion().Metadata.Name;
};

ActiveDownloader.prototype.GetVersion = function () {
	if (this.IsMetric()) {
		return this.target.properties.Versions[this.target.properties.SelectedVersionIndex];
	}
	return this.target.SelectedVersion();
};

ActiveDownloader.prototype.GetLevel = function () {
	return this.GetVersion().Levels[this.levelIndex];
};

ActiveDownloader.prototype.GetPartitions = function () {
	return this.target.SelectedLevel().Partitions;
};

ActiveDownloader.prototype.UsesFilter = function () {
	return this.regions.length > 0;
};

ActiveDownloader.prototype.RemoveRegion = function (regionId) {
	arr.RemoveById(this.regions, regionId);
};

ActiveDownloader.prototype.GetDataFormats = function () {
	var ret = [];
	ret.push({ caption: 'Texto (.csv)', key: 'c' });
	ret.push({ caption: 'Excel (.xlsx)', key: 'x' });
	ret.push({ caption: 'SPSS (.sav)', key: 's' });
	ret.push({ caption: 'Stata (.dta)', key: 't' });
	ret.push({ caption: 'R (.rdata)', key: 'r' });
	if (this.IsMetric() && !this.GetLevel().HasArea) {
		ret.push({ caption: 'Shapefile (.shp)', key: 'h' });
		ret.push({ caption: 'GeoPackage (.gpkg)', key: 'g' });
	}
	return ret;
};

ActiveDownloader.prototype.HasSpatialFormats = function () {
	if (this.IsMetric()) {
		var level = this.GetLevel();
		return level.HasArea || level.Dataset.AreSegments;
	}
	return true;
};

ActiveDownloader.prototype.GetSpatialFormats = function () {
	var ret = [];
	if (this.HasSpatialFormats()) {
		ret.push({ caption: 'Texto con WKT (.csv)', key: 'cw' });
		ret.push({ caption: 'Shapefile (.shp)', key: 'hw' });
		ret.push({ caption: 'GeoPackage (.gpkg)', key: 'gw' });
	}
	return ret;
};

// Cancela la generación en curso: aborta el pedido pendiente y no entrega el
// archivo. Se invoca al cerrar la ventana desde la que se pidió la descarga.
ActiveDownloader.prototype.Cancel = function () {
	this.cancelled = true;
	if (this.cancelRequest !== null) {
		this.cancelRequest();
		this.cancelRequest = null;
	}
};

// Genera el archivo en el servidor (informando el avance en porcentaje) y
// dispara su descarga al terminar. Rechaza ante cualquier error. Si se cancela
// (Cancel) termina sin entregar el archivo y devuelve false.
ActiveDownloader.prototype.Download = async function (type, onProgress) {
	this.cancelled = false;
	window.SegMap.Session.Content.Download(type);
	var data = await this.Get(this.StartUrl(), null, type);
	var steps = 0;
	while (!this.cancelled && data.done === false) {
		if (steps >= MAX_STEPS) {
			throw new Error('Hard limit reached');
		}
		if (data.slice && data.totalSlices && data.slice < data.totalSlices) {
			onProgress(parseInt(data.slice * 100 / data.totalSlices));
		}
		data = await this.Get(this.StepUrl(), { k: data.key }, type);
		steps++;
	}
	if (this.cancelled) {
		return false;
	}
	onProgress(100);
	ActiveDownloader.SendFile(this.FileUrl(type));
	return true;
};

// Igual que Download, pero ante un error lo informa en un diálogo. Un pedido
// abortado por Cancel no es un error.
ActiveDownloader.prototype.Run = function (type, onProgress) {
	var loc = this;
	return this.Download(type, onProgress).catch(function (error) {
		if (!loc.cancelled) {
			err.errDialog('download', 'crear el archivo', error);
		}
		return false;
	});
};

ActiveDownloader.prototype.Get = async function (baseUrl, params, type) {
	var url = baseUrl;
	if (params === null) {
		url = baseUrl + '?' + this.UrlArgs(type);
	}
	var config = { headers: {} };
	if (window.accessLink) {
		config.headers = { 'Access-Link': window.accessLink };
	}
	if (params !== null) {
		config.params = params;
	}
	var loc = this;
	config.cancelToken = new axios.CancelToken(function (cancel) { loc.cancelRequest = cancel; });
	var res = await axios.get(url, session.AddSession(url, config));
	this.cancelRequest = null;
	session.ReceiveSession(url, res);
	return res.data;
};

ActiveDownloader.prototype.StartUrl = function () {
	if (this.IsMetric()) {
		return window.host + '/services/download/StartDatasetDownload';
	}
	return window.host + '/services/download/StartBoundaryDownload';
};

ActiveDownloader.prototype.StepUrl = function () {
	if (this.IsMetric()) {
		return window.host + '/services/download/StepDatasetDownload';
	}
	return window.host + '/services/download/StepBoundaryDownload';
};

ActiveDownloader.prototype.FileUrl = function (type) {
	if (this.IsMetric()) {
		return window.host + '/services/download/GetDatasetFile?' + this.UrlArgs(type);
	}
	return window.host + '/services/download/GetBoundaryFile?' + this.UrlArgs(type);
};

ActiveDownloader.prototype.GetFilterArgs = function () {
	var clipping = window.SegMap.Clipping;
	var args = { circle: null, regionIds: null };
	if (this.UsesFilter()) {
		if (clipping.FrameHasClippingCircle()) {
			args.circle = h.getCircleParam(clipping.frame.ClippingCircle);
		} else {
			args.regionIds = arr.GetIds(this.regions).join(',');
		}
	}
	return args;
};

ActiveDownloader.prototype.UrlArgs = function (type) {
	var filter = this.GetFilterArgs();
	if (this.IsMetric()) {
		return this.MetricUrlArgs(type, filter);
	}
	return 't=' + type + '&s=b' + h.urlParam('b', this.target.properties.Id) + h.urlParam('v', this.GetVersion().Id)
		+ h.urlParam('c', filter.circle) + h.urlParam('r', filter.regionIds);
};

ActiveDownloader.prototype.MetricUrlArgs = function (type, filter) {
	var level = this.GetLevel();
	var urbanity = null;
	if (level.HasUrbanity) {
		urbanity = this.urbanity;
	}
	var partition = null;
	if (this.GetPartitions()) {
		partition = this.partition;
	}
	var compareDatasetId = '';
	if (this.target.Compare.Active) {
		compareDatasetId = this.target.Compare.SelectedLevel().Dataset.Id;
	}
	return 't=' + type + h.urlParam('d', level.Dataset.Id) + h.urlParam('p', compareDatasetId) + h.urlParam('c', filter.circle)
		+ h.urlParam('r', filter.regionIds) + h.urlParam('u', urbanity) + h.urlParam('g', partition)
		+ h.urlParam('w', this.GetVersion().Work.Id);
};
