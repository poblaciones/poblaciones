/**
 * ActiveMetricTuples — las tuplas de métrica del pivot: cada una es la
 * combinación (indicador × versión × variable × categoría|total) que define una
 * medición a pedir. Son el equivalente "no visual" de las columnas: el dataset
 * las proyecta luego a columnas reales.
 *
 * Vive dentro de un ActivePivot y se invoca como `pivot.MetricTuples.rebuild()`,
 * `pivot.MetricTuples.GetById(metricId)`, etc. Mantiene también los encabezados
 * visibles derivados y el estado de orden.
 *
 * Orden: una sola tupla ordena a la vez. La clave puede ser la de una tupla o la
 * sentinel de orden por label (ActivePivot.LABEL_SORT_KEY).
 */

export var LABEL_SORT_KEY = '__label__';

function ActiveMetricTuples(pivot) {
	this.pivot = pivot;
	this.metricTuples = [];
	this.headers = [];
	this.sortKey = null;
	this.sortDirection = 0; // -1 desc, 1 asc, 0 sin orden
}

ActiveMetricTuples.prototype.rebuild = function () {
	this.metricTuples.length = 0;
	var metrics = this.pivot.Metrics;
	for (var i = 0; i < metrics.length; i++) {
		var metric = metrics[i];
		if (typeof metric.GetTuples === 'function') {
			var tuples = metric.GetTuples();
			for (var s = 0; s < tuples.length; s++) this.metricTuples.push(tuples[s]);
		}
	}
	return this.metricTuples;
};

// Acepta tanto una columnKey como un metricId (algunos consumidores identifican
// la tupla por el id del indicador).
ActiveMetricTuples.prototype.resolveKey = function (input) {
	if (input == null || input === LABEL_SORT_KEY) return input;
	if (typeof input === 'string' && input.indexOf('|c:') !== -1) return input;
	for (var i = 0; i < this.metricTuples.length; i++) {
		/* eslint-disable-next-line eqeqeq */
		if (this.metricTuples[i].metricId == input) return this.metricTuples[i].key;
	}
	return input;
};

ActiveMetricTuples.prototype.byKey = function (key) {
	for (var i = 0; i < this.metricTuples.length; i++) {
		if (this.metricTuples[i].key === key) return this.metricTuples[i];
	}
	return null;
};

ActiveMetricTuples.prototype.GetById = function (metricId) {
	for (var i = 0; i < this.metricTuples.length; i++) {
		/* eslint-disable-next-line eqeqeq */
		if (this.metricTuples[i].metricId == metricId) return this.metricTuples[i];
	}
	return null;
};

ActiveMetricTuples.prototype.allById = function (metricId) {
	return this.metricTuples.filter(function (t) {
		/* eslint-disable-next-line eqeqeq */
		return t.metricId == metricId;
	});
};

// Cicla: sin orden → descendente → ascendente → sin orden.
ActiveMetricTuples.prototype.toggleSort = function (columnKey) {
	columnKey = this.resolveKey(columnKey);
	if (this.sortKey !== columnKey) {
		this.sortKey = columnKey;
		this.sortDirection = -1;
	} else if (this.sortDirection === -1) {
		this.sortDirection = 1;
	} else if (this.sortDirection === 1) {
		this.sortKey = null;
		this.sortDirection = 0;
	} else {
		this.sortDirection = -1;
	}
};

ActiveMetricTuples.prototype.sortStateOf = function (columnKey) {
	columnKey = this.resolveKey(columnKey);
	if (this.sortKey !== columnKey || this.sortDirection === 0) return null;
	return this.sortDirection === -1 ? 'desc' : 'asc';
};

ActiveMetricTuples.prototype.clearSort = function () {
	this.sortKey = null;
	this.sortDirection = 0;
};

ActiveMetricTuples.prototype.isSortedBy = function (columnKey) {
	columnKey = this.resolveKey(columnKey);
	return this.sortKey === columnKey && this.sortDirection !== 0;
};

// +1 por la columna de labels.
ActiveMetricTuples.prototype.totalColumns = function () {
	return this.headers.length + 1;
};

export default ActiveMetricTuples;
