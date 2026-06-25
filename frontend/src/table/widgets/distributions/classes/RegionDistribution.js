/**
 * RegionDistribution.js — modo "por regiones" de un panel. Dado un
 * DistributionPanel y el dataset, produce una barra por región (fila de datos),
 * compuesta por la contribución de cada categoría:
 *
 *   - Por defecto (sin apilar), cada barra mide el valor total de la región y se
 *     pinta según cuánto aporta cada categoría. Las contribuciones suman el
 *     total real, así que la longitud es comparable entre regiones y a la vez se
 *     ve la composición.
 *   - Apilado al 100%, cada barra se normaliza a la misma longitud para comparar
 *     la composición (el perfil) entre regiones, perdiendo la magnitud.
 *
 * Respeta el orden de las filas del dataset (el de la pivot): no reordena. Si hay
 * más regiones que el máximo, recorta y reporta cuántas quedaron fuera, para que
 * el componente avise del corte.
 *
 * El valor de cada categoría por región sale de las filas del dataset, cuyos
 * `values` están alineados posicionalmente con dataset.columns. Esta clase
 * resuelve ese mapeo a partir de las columnas del panel.
 */

export default RegionDistribution;

function RegionDistribution(panel, dataset, options) {
	options = options || {};
	this.panel = panel;
	this.dataset = dataset;
	this.maxRegions = options.maxRegions || 25;
	this.pivot = options.pivot || null;
	this.excludedGroups = options.excludedGroups || [];
	this._rows = null;
	this._totalCount = 0;
	this._build();
}

// Índice de una columna dentro del array global de columnas del dataset, que es
// el orden en el que se alinean los `values` de cada fila. Se busca por la key
// estable de la columna, no por identidad de instancia.
RegionDistribution.prototype._indexOf = function (column) {
	var cols = this.dataset.columns;
	for (var i = 0; i < cols.length; i++) {
		if (cols[i].key === column.key) return i;
	}
	return -1;
};

RegionDistribution.prototype._build = function () {
	var catCols = this.panel.categoryColumns();
	var totalOnly = catCols.length === 0;

	// Camino 1 en regiones: solo total seleccionado y hay pivot → se resuelven las
	// categorías por región (cada barra se compone por categoría con su color).
	if (totalOnly && this.pivot && typeof this.pivot.ResolveAllCategoriesByRegion === 'function') {
		var resolved = this.pivot.ResolveAllCategoriesByRegion(this.panel.metricId(), this.panel.versionId());
		if (resolved && resolved.length) {
			this._totalCount = resolved.length;
			var lim = Math.min(resolved.length, this.maxRegions);
			var rr = [];
			for (var ri = 0; ri < lim; ri++) {
				var src = resolved[ri];
				var s = 0;
				for (var pi = 0; pi < src.parts.length; pi++) s += (src.parts[pi].value || 0);
				rr.push({ label: src.label, fid: src.fid, total: s, parts: src.parts });
			}
			this._rows = rr;
			this._totalOnly = false;
			return;
		}
	}

	var cols = totalOnly && this.panel.totalColumn() ? [this.panel.totalColumn()] : catCols;
	var catIndices = [];
	for (var c = 0; c < cols.length; c++) catIndices.push(this._indexOf(cols[c]));

	var dataRows = (this.dataset && typeof this.dataset.dataRows === 'function')
		? this.dataset.dataRows()
		: [];
	if (this.excludedGroups.length) {
		var ex = this.excludedGroups;
		dataRows = dataRows.filter(function (r) { return ex.indexOf(r.parentLabel) === -1; });
	}
	this._totalCount = dataRows.length;

	var rows = [];
	var limit = Math.min(dataRows.length, this.maxRegions);
	for (var r = 0; r < limit; r++) {
		var dr = dataRows[r];
		var parts = [];
		var sum = 0;
		for (var k = 0; k < catIndices.length; k++) {
			var idx = catIndices[k];
			var v = (idx >= 0 && dr.values[idx] != null) ? dr.values[idx] : 0;
			var color = totalOnly ? '#90a4ae' : (cols[k].meta.fillColor || null);
			parts.push({ labelId: cols[k].meta.labelId, value: v, color: color });
			sum += v;
		}
		rows.push({ label: dr.label, fid: dr.fid, total: sum, parts: parts });
	}
	this._rows = rows;
	this._totalOnly = totalOnly;
};

RegionDistribution.prototype.rows = function () {
	return this._rows;
};

// Máximo de los totales de las regiones mostradas, para escalar el eje cuando no
// se apila.
RegionDistribution.prototype.maxTotal = function () {
	var m = 0;
	for (var i = 0; i < this._rows.length; i++) {
		if (this._rows[i].total > m) m = this._rows[i].total;
	}
	return m;
};

// Cantidad de regiones recortadas (0 si se muestran todas).
RegionDistribution.prototype.hiddenCount = function () {
	return Math.max(0, this._totalCount - this._rows.length);
};

RegionDistribution.prototype.totalCount = function () {
	return this._totalCount;
};
