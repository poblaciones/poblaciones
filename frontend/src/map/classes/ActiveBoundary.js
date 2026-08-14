import BoundariesComposer from '@/map/composers/BoundariesComposer';

import h from '@/map/js/helper';
import err from '@/common/framework/err';
import arr from '@/common/framework/arr';
import axios from 'axios';
import Vue from 'vue';
import nextLayerUid from './LayerUid';

export default ActiveBoundary;

function ActiveBoundary(data) {
	this.objs = {};
	this.objs.Segment = null;
	// Ver ActiveMetric: identifica a esta capa dentro de la lista de métricas,
	// que comparte con los indicadores.
	this.uid = nextLayerUid();
	this.index = -1;
	this.isBoundary = true;
	this.isBaseMetric = false;
	this.visible = true;
	this.IsLocked = false;
	this.IsUpdatingSummary = false;
	this.opacity = .7;
	this.cancelUpdateSummary = null;
	this.showDescriptions = false;
	this.properties = data;
	this.KillDuplicateds = false;
	this.borderWidth = 2;
	// Trama del polígono (mismas claves que ActiveMetric.getValidPatterns,
	// acotadas al subconjunto que ofrece getValidPatterns acá abajo). '' en
	// customPattern significa "usar pattern".
	this.pattern = 1;
	this.customPattern = '';
	// Única columna de dato mostrada en boundaryValues.vue/boundaryChart.vue
	// (no hay columna fija aparte: la cantidad de zonas es una métrica más,
	// N, la primera en orden). Rota entre 'N' (cantidad), 'P' (% de N), 'K'
	// (Km2) y 'A' (% de Km2).
	this.summaryMetric = 'N';
	// Estado de UI del cliente, igual patrón que ActiveSelectedMetric.ShowChart.
	this.ShowChart = true;
};

ActiveBoundary.prototype.useTiles = function () {
	return true;
};

ActiveBoundary.prototype.ResolveSegment = function () {
	this.objs.Segment = window.SegMap.Metrics.PatternsSegment;
};
ActiveBoundary.prototype.Visible = function () {
	return this.visible;
};

// Mismo patrón que ActiveMetric.GetStyleColorList/GetStyleColorDictionary,
// pero iterando ValueLabels (uno por cada ClippingRegion de origen) en vez de
// los ValueLabels de una variable. AbstractSvgComposer.appendStyles usa el
// mismo campo 'fillColor' tanto para relleno (patrón Pleno) como para trazo
// (el resto de las tramas); acá se elige LineColor o FillColor según cuál de
// los dos corresponde según el patrón activo.
ActiveBoundary.prototype.resolveLabelColor = function (label) {
	return this.GetPattern() === 0 ? label.FillColor : label.LineColor;
};

ActiveBoundary.prototype.GetStyleColorList = function () {
	var ret = [];
	var valueLabels = this.SelectedVersion().ValueLabels;
	for (var i = 0; i < valueLabels.length; i++) {
		var label = valueLabels[i];
		ret.push({ cs: 'cs' + label.Id, className: label.Id, fillColor: this.resolveLabelColor(label) });
	}
	return ret;
};

ActiveBoundary.prototype.GetStyleColorDictionary = function () {
	var ret = {};
	var valueLabels = this.SelectedVersion().ValueLabels;
	for (var i = 0; i < valueLabels.length; i++) {
		ret[valueLabels[i].Id] = this.resolveLabelColor(valueLabels[i]);
	}
	return ret;
};

ActiveBoundary.prototype.CurrentOpacity = function () {
	return this.opacity;
};

ActiveBoundary.prototype.UpdateRanking = function () {
};

ActiveBoundary.prototype.SelectVersion = function (index) {
	if (this.properties.SelectedVersionIndex + '' === index + '') {
		return;
	}
	this.properties.SelectedVersionIndex = index;
	window.SegMap.Session.Content.SelectBoundarySerie(this.SelectedVersion());

	this.UpdateSummary();
	this.UpdateMap();
};

ActiveBoundary.prototype.SelectedVersion = function () {
	if (this.properties === null) {
		throw new Error('No properties has been set.');
	}
	return this.properties.Versions[this.properties.SelectedVersionIndex];
};

// Mismo patrón que ActiveMetric.ResolveValueLabelVisibility, sobre los
// ValueLabels de la versión (sin variable de por medio).
ActiveBoundary.prototype.ResolveValueLabelVisibility = function (labelId) {
	var valueLabels = this.SelectedVersion().ValueLabels;
	for (var i = 0; i < valueLabels.length; i++) {
		if (valueLabels[i].Id === labelId) {
			return valueLabels[i].Visible;
		}
	}
	err.errMessage('ResolveVisibility', 'Label did not match on boundaryVersion ' +
		this.SelectedVersion().Id + ' of ' + this.properties.Name + '.');
	return false;
};

ActiveBoundary.prototype.IsFiltering = function () {
	var valueLabels = this.SelectedVersion().ValueLabels;
	for (var i = 0; i < valueLabels.length; i++) {
		if (!valueLabels[i].Visible) {
			return true;
		}
	}
	return false;
};

// Subconjunto de ActiveMetric.getValidPatterns: solo las tramas que tienen
// sentido para un polígono de delimitación sin variable detrás.
ActiveBoundary.prototype.getValidPatterns = function () {
	var ret = [];
	ret.push({ Key: 0, Caption: 'Pleno' });
	ret.push({ Key: 1, Caption: 'Contorno' });
	ret.push({ Key: 7, Caption: 'Diagonal' });
	ret.push({ Key: 11, Caption: 'Puntos' });
	return ret;
};

// Mismo criterio que ActiveMetric.GetPattern: customPattern manda si está
// definido, si no se usa pattern.
ActiveBoundary.prototype.GetPattern = function () {
	if (this.customPattern !== '') {
		return this.customPattern;
	}
	return this.pattern;
};

// Análogo reducido de ActiveMetric.getValidMetrics: las cuatro métricas que
// tienen sentido para boundaryValues.vue/boundaryChart.vue, en una única
// columna rotable (N primero, es el default). Mismos Key/Caption/headers/
// formato que sus equivalentes en metrics (Summary.js).
ActiveBoundary.prototype.getValidMetrics = function () {
	var ret = [];
	ret.push({ Key: 'N', Caption: 'Cantidad' });
	ret.push({ Key: 'P', Caption: 'Distribución', GroupEnd: true });
	ret.push({ Key: 'K', Caption: 'Área' });
	ret.push({ Key: 'A', Caption: 'Distr. de áreas' });
	for (var n = 0; n < ret.length; n++) {
		var next = n + 1;
		if (next === ret.length) {
			next = 0;
		}
		ret[n].Next = ret[next];
		ret[n].Title = 'Métrica: ' + ret[n].Caption + ' (click para cambiar por ' + ret[next].Caption + ')';
	}
	return ret;
};

ActiveBoundary.prototype.getValueHeaderOf = function (key) {
	switch (key) {
		case 'N':
			return 'N';
		case 'P':
			return 'COL %';
		case 'K':
			return 'Km<sup>2</sup>';
		case 'A':
			return '% Km<sup>2</sup>';
		default:
			return '';
	}
};

ActiveBoundary.prototype.getValueHeaderText = function (key) {
	return this.getValueHeaderOf(key).replace(/<[^>]+>/g, '');
};
ActiveBoundary.prototype.valueHeader = function () {
	return this.getValueHeaderOf(this.summaryMetric);
};

ActiveBoundary.prototype.sumValueLabels = function (pick) {
	var ret = 0;
	this.SelectedVersion().ValueLabels.forEach(function (label) {
		if (label.Values) {
			ret += pick(label);
		}
	});
	return ret;
};

// Mismo patrón que metricValues.vue/mapLegend.vue (label.Values.Count === ''):
// una categoría sin datos en el encuadre actual no se muestra ni en la tabla
// ni en el gráfico. No alcanza con chequear que Values exista: el servidor
// puede mandarlo con Value/Km2 en '' cuando esa categoría no tiene zonas acá.
ActiveBoundary.prototype.HasData = function (label) {
	return !!(label.Values && label.Values.Value !== '' && label.Values.Km2 !== '');
};

// Sin Summary.js (fórmulas propias, ver sección de boundaries en las
// pautas del módulo): cálculo crudo, sin normalización/IsGap/Compare, que
// para boundary no aplican. Usado tanto por boundaryValues.vue (tabla) como
// por boundaryChart.vue (gráfico), para no duplicar la fórmula en ambos.
ActiveBoundary.prototype.CalculateValue = function (label) {
	if (!label.Values) {
		return '';
	}
	switch (this.summaryMetric) {
		case 'N':
			return Number(label.Values.Value);
		case 'P': {
			var totalValue = this.sumValueLabels(function (l) { return Number(l.Values.Value); });
			return totalValue > 0 ? (Number(label.Values.Value) / totalValue) * 100 : 0;
		}
		case 'K':
			return Number(label.Values.Km2);
		case 'A': {
			var totalKm2 = this.sumValueLabels(function (l) { return Number(l.Values.Km2); });
			return totalKm2 > 0 ? (Number(label.Values.Km2) / totalKm2) * 100 : 0;
		}
		default:
			return '';
	}
};

ActiveBoundary.prototype.FormatValue = function (value) {
	if (value === '') {
		return '';
	}
	switch (this.summaryMetric) {
		case 'N':
			return h.formatNum(value);
		case 'P':
		case 'A':
			return h.formatPercentNumber(value);
		case 'K':
			return h.formatKm(value);
		default:
			return '';
	}
};

// Mismo criterio que ActiveSelectedMetric.useChart: solo tiene sentido con
// más de una categoría (coincide con IsSimpleCount === false).
ActiveBoundary.prototype.useChart = function () {
	return this.SelectedVersion().ValueLabels.length > 1;
};

ActiveBoundary.prototype.UpdateSummary = function () {
	var boundary = this;
	var loc = this;
	var CancelToken = axios.CancelToken;
	if (this.cancelUpdateSummary !== null) {
		this.cancelUpdateSummary('cancelled');
	}
	this.IsUpdatingSummary = true;

	var rev = window.SegMap.Signatures.Boundary;
	var suffix = window.SegMap.Signatures.Suffix;
	var versionId = boundary.SelectedVersion().Id;
	window.SegMap.Get(window.host + '/services/frontend/boundaries/GetBoundarySummary', {
		params: h.getBoundarySummaryParams(boundary, window.SegMap.frame, rev, suffix),
		cancelToken: new CancelToken(function executor(c) { loc.cancelUpdateSummary = c; }),
	}).then(function (res) {
		loc.cancelUpdateSummary = null;
		if (res.message === 'cancelled') {
			return;
		}
		// No hay BoundaryVersionId/Count a nivel raíz: siempre hay al menos un
		// Item, y cada uno trae su propio BoundaryVersionId para descartar una
		// respuesta de otra versión (carrera de requests). Si ninguno matchea
		// (incluido el caso Items vacío, que no debería darse en un caso
		// legítimo), se descarta la respuesta completa.
		var valueLabels = boundary.SelectedVersion().ValueLabels;
		var totalCount = 0;
		var matched = false;
		res.data.Items.forEach(function (item) {
			if (item.BoundaryVersionId != versionId) {
				return;
			}
			matched = true;
			totalCount += Number(item.Value);
			var label = h.getValueLabel(valueLabels, item.ValueId);
			if (label !== null) {
				// Vue.set, no asignación directa: el payload de GetSelectedBoundary
				// no trae hoy un campo 'Values' (plural) preexistente en cada
				// ValueLabel (sí trae 'Value', singular, sin uso). Sin Vue.set, esto
				// agrega una propiedad nueva a un objeto ya reactivo, y Vue 2 no
				// detecta esa mutación: los datos quedan en memoria pero la vista
				// nunca se entera (sin error, sin re-render).
				Vue.set(label, 'Values', item);
			}
		});
		if (!matched) {
			return;
		}
		loc.IsUpdatingSummary = false;
		boundary.SelectedVersion().Count = totalCount;
	}).catch(function (error) {
		err.errDialog('GetBoundarySummary', 'obtener las estadísticas de resumen de delimitación', error);
	});
};

ActiveBoundary.prototype.UpdateMap = function () {
	if (window.SegMap && this.objs.Segment !== null) {
		window.SegMap.Metrics.UpdateMetric(this);
		window.SegMap.SaveRoute.UpdateRoute();
	}
};

ActiveBoundary.prototype.ChangeVisibility = function () {
	this.visible = !this.visible;
	this.UpdateMap();
};

ActiveBoundary.prototype.CheckTileIsOutOfClipping = function() {
	return false;
};

ActiveBoundary.prototype.GetDataService = function (seed) {
	// h.selectMultiUrl(window.SegMap.Configuration.StaticServer, seed)
	var service = (this.isBaseMetric ? 'GetBaseBoundaryTile' : 'GetBoundaryTile');
	return { server: window.host, path: '/services/frontend/boundaries/' + service, useStaticQueue: false };
};

ActiveBoundary.prototype.GetDataServiceParams = function (coord) {
	var rev = window.SegMap.Signatures.Boundary;
	var preffix = window.SegMap.Signatures.Preffix;
	return h.getBoundaryParams(this, window.SegMap.frame, coord.x, coord.y, rev, preffix);
};

ActiveBoundary.prototype.Show = function () {
	this.visible = true;
	window.SegMap.Metrics.UpdateMetric(this);
};

ActiveBoundary.prototype.Hide = function () {
	this.visible = false;
	window.SegMap.Metrics.Remove(this, true);
};

ActiveBoundary.prototype.UpdateLevel = function () {
	return false;
};

ActiveBoundary.prototype.Remove = function () {
	window.SegMap.Session.Content.RemoveBoundary(this.properties.Id);
	window.SegMap.Metrics.Remove(this);
};

ActiveBoundary.prototype.UpdateOpacity = function (zoom) {
	return;
};

ActiveBoundary.prototype.showText = function () {
	return true;
};

ActiveBoundary.prototype.CreateComposer = function() {
	return new BoundariesComposer(window.SegMap.MapsApi, this);
};

ActiveBoundary.prototype.GetCartographyService = function () {
	return { url: null, revision: null };
};
