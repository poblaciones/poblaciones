import Vue from 'vue';
import Vuex from 'vuex';
import axiosClient from '@/common/js/axiosClient';
import promises from '@/common/framework/promises';

import ActiveSelectedMetric from '@/map/classes/ActiveSelectedMetric';


export default MetricStore;


function MetricStore() {

	this.Metrics = [];
};

MetricStore.prototype.GetMetricInfoById = function (metricId) {
	for (var n = 0; n < this.Metrics.length; n++) {
		if (this.Metrics[n].Metric.Id === metricId) {
			return this.Metrics[n];
		}
	}
	return null;
};


MetricStore.prototype.GetMetricData = function (metric, version, level) {
	version = version || metric.SelectedVersion();
	level = level || metric.SelectedLevel();
	var args = { m: metric.properties.Metric.Id, v: version.Version.Id, l: level.Id };
	return axiosClient.getPromise(window.host + '/services/frontend/processor/GetMetricData', args,
		('traer las Metrices'));
};

MetricStore.prototype.GetMetricOrRetrieve = function (metricId) {
	var ret = this.GetMetricInfoById(metricId);
	if (ret !== null) {
		// Ya está en el store: lo envuelve de nuevo sin volver a agregarlo.
		var activeMetric = this.CreateActiveMetric(ret);
		return new promises.ReadyPromise(activeMetric);
	}
	// Trae todos...
	var args = { l: metricId };
	var loc = this;
	return axiosClient.getPromise(window.host + '/services/metrics/GetSelectedInfos', args,
		('traer las Metrices')).then(function (data) {
			// 'I' = índice/proporción (se muestra como %). El valor '%' anterior no
			// es un Key válido de getValidMetrics y caía en el default '?'.
			data[0].SummaryMetric = 'I';
			var activeMetric = loc.CreateActiveMetric(data[0]);
			loc.Metrics.push(data[0]);
			return activeMetric;
		});
};

MetricStore.prototype.CreateActiveMetric = function (metricInfo) {
	var activeMetric = new ActiveSelectedMetric(metricInfo);
	activeMetric.Store = this;
	return activeMetric;
};

MetricStore.prototype.GetMultipleMetrics = function (metricIds) {
	var loc = this;
	var promises = [];
	for (var i = 0; i < metricIds.length; i++) {
		promises.push(loc.GetMetricOrRetrieve(metricIds[i]));
	}
	return Promise.all(promises);
};
