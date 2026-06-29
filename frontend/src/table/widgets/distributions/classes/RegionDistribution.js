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

	// Camino 1: sin categorías explícitas pero con pivot, se resuelven las
	// categorías por región para componer cada barra con color (en vez de una
	// barra monocroma de total). Es lo que permite ver y apilar la composición
	// aunque el usuario no haya elegido categorías como columnas.
	if (totalOnly && this.pivot && typeof this.pivot.ResolveAllCategoriesByRegion === 'function') {
		var resolved = this.pivot.ResolveAllCategoriesByRegion(this.panel.metricId(), this.panel.versionId());
		if (resolved && resolved.length) {
			var rr = [];
			for (var ri = 0; ri < resolved.length; ri++) {
				var src = resolved[ri];
				var s = 0;
				for (var pi = 0; pi < src.parts.length; pi++) s += (src.parts[pi].value || 0);
				rr.push({ label: src.label, fid: src.fid, total: s, parts: src.parts, isGroup: false });
			}
			this._rows = rr;
			this._totalCount = rr.length;
			this._totalOnly = false;   // tiene composición real, no es monocromo
			this._composed = true;     // marca que las barras ya traen categorías
			return;
		}
	}

	var cols = totalOnly && this.panel.totalColumn() ? [this.panel.totalColumn()] : catCols;
	var catIndices = [];
	for (var c = 0; c < cols.length; c++) catIndices.push(this._indexOf(cols[c]));

	var dataRows = (this.dataset && typeof this.dataset.dataRows === 'function')
		? this.dataset.dataRows()
		: [];

	// El chart refleja las filas visibles de la pivot: regiones (data) y sus
	// agrupadores (group-header, en negrita). Los encabezados de delimitación
	// (region-header) no son barras. Un grupo colapsado oculta sus hijos
	// (excludedGroups), pero el agrupador permanece con su subtotal.
	var ex = this.excludedGroups;
	var rows = [];
	for (var r = 0; r < dataRows.length; r++) {
		var dr = dataRows[r];
		if (dr.type === 'region-header') continue;
		if (dr.type === 'data' && ex.length && ex.indexOf(dr.parentLabel) !== -1) continue;

		var parts = [];
		var sum = 0;
		var hasValue = false;
		for (var k = 0; k < catIndices.length; k++) {
			var idx = catIndices[k];
			var raw = (idx >= 0) ? dr.values[idx] : null;
			if (raw != null) hasValue = true;
			var v = (raw != null) ? raw : 0;
			var color = totalOnly ? '#90a4ae' : (cols[k].meta.fillColor || null);
			parts.push({ labelId: cols[k].meta.labelId, value: v, color: color });
			sum += v;
		}
		// Filas sin ningún dato (todas las columnas en '-') no se grafican.
		if (!hasValue) continue;
		rows.push({
			label: dr.label,
			fid: dr.fid,
			total: sum,
			parts: parts,
			isGroup: dr.type === 'group-header'
		});
	}
	this._rows = rows;
	this._totalCount = rows.length;
	this._totalOnly = totalOnly;
	this._composed = !totalOnly;
};

// ¿Las barras se componen de varias categorías (con color)? Determina si tiene
// sentido ofrecer apilar en este panel de regiones, incluso sin que el usuario
// haya elegido categorías como columnas (Camino 1).
RegionDistribution.prototype.isComposed = function () {
	if (this._composed) {
		// Con composición real: apilar aporta si hay más de una categoría en alguna
		// barra.
		for (var i = 0; i < this._rows.length; i++) {
			if (this._rows[i].parts && this._rows[i].parts.length > 1) return true;
		}
	}
	return false;
};

RegionDistribution.prototype.rows = function () {
	return this._rows;
};

// ¿Hay alguna región con dato para graficar? Si no, el widget muestra un aviso
// "Sin información" en vez de un gráfico vacío.
RegionDistribution.prototype.hasData = function () {
	return this._rows && this._rows.length > 0;
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
