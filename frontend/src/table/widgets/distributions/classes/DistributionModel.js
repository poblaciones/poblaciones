/**
 * DistributionModel.js — modelo raíz del widget de distribución. Toma el dataset
 * de la pivot y produce la estructura que el widget grafica, agrupando las
 * columnas de medida por indicador y versión (no como tuplas sueltas):
 *
 *   - panels(): un DistributionPanel por (indicador, versión). Es la unidad que
 *     se dibuja.
 *   - indicators(): los paneles agrupados por indicador, con sus versiones (años)
 *     contiguas bajo un mismo encabezado, y la información de si los años
 *     comparten el mismo conjunto de categorías (para una leyenda unificada) o
 *     no (leyenda por gráfico).
 *
 * El dataset se le pasa entero; el modelo solo lee sus columnas de medida. No
 * muta el dataset ni la pivot.
 */

import DistributionPanel from './DistributionPanel.js';

export default DistributionModel;

function DistributionModel(dataset) {
	this.dataset = dataset || null;
	this._panels = null;
	this._indicators = null;
	this._build();
}

DistributionModel.prototype._build = function () {
	var cols = (this.dataset && this.dataset.columns)
		? this.dataset.columns.filter(function (c) { return c.role === 'measure'; })
		: [];

	// Agrupa por (metricId, versionId) conservando el orden de aparición, que es
	// el de la pivot.
	var groups = [];
	var byKey = {};
	for (var i = 0; i < cols.length; i++) {
		var m = cols[i].meta || {};
		var k = m.metricId + ':' + m.versionId;
		var g = byKey[k];
		if (!g) { g = { key: k, metricId: m.metricId, cols: [] }; byKey[k] = g; groups.push(g); }
		g.cols.push(cols[i]);
	}

	this._panels = groups.map(function (g) { return new DistributionPanel(g.cols); });

	// Agrupa los paneles por indicador, preservando el orden.
	var indicators = [];
	var byMetric = {};
	for (var p = 0; p < this._panels.length; p++) {
		var panel = this._panels[p];
		var id = panel.metricId();
		var ind = byMetric[id];
		if (!ind) {
			ind = { metricId: id, name: panel.indicatorName(), variableName: panel.variableName(), panels: [] };
			byMetric[id] = ind;
			indicators.push(ind);
		}
		ind.panels.push(panel);
	}

	// Para cada indicador, determina si todas sus versiones comparten el mismo
	// conjunto de categorías (por nombre): si sí, una leyenda unificada; si no,
	// cada panel lleva la suya.
	for (var n = 0; n < indicators.length; n++) {
		indicators[n].sharedCategories = sharedCategories(indicators[n].panels);
	}

	this._indicators = indicators;
};

function sharedCategories(panels) {
	if (panels.length < 2) return true;
	var ref = panels[0].legend().map(function (c) { return c.name; }).join('|');
	for (var i = 1; i < panels.length; i++) {
		var k = panels[i].legend().map(function (c) { return c.name; }).join('|');
		if (k !== ref) return false;
	}
	return true;
}

DistributionModel.prototype.panels = function () {
	return this._panels;
};

DistributionModel.prototype.indicators = function () {
	return this._indicators;
};

DistributionModel.prototype.isEmpty = function () {
	return this._panels.length === 0;
};
