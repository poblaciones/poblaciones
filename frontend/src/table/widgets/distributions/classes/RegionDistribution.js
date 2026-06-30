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
	var isGap = !!(this.panel.isGap && this.panel.isGap());
	var isPercent = !!(this.panel.isPercent && this.panel.isPercent());

	// Camino 1: resuelve las categorías por región para componer cada barra. Se usa:
	//  - sin categorías elegidas (para mostrar la composición igual);
	//  - SIEMPRE en brechas (el delta no se compone por suma de columnas: la barra
	//    mide el delta del total y los colores la subdividen por peso);
	//  - en incidencias/porcentajes con categorías elegidas, porque sumar las
	//    incidencias de cada categoría sobre su propio total no tiene sentido (daría
	//    >100%): la barra debe medir la incidencia del CONJUNTO. Para eso se usa el
	//    valor de cada categoría sobre el universo de la región (valueOnUniverse),
	//    que sí es aditivo, y se suman.
	// Componer la barra sumando los valores aditivos sobre el universo aplica a toda
	// incidencia/porcentaje no-brecha, haya o no categorías elegidas: sumar las
	// incidencias de cada categoría sobre su propio total daría >100%. Con o sin
	// selección, la barra mide la incidencia del CONJUNTO (suma de valueOnUniverse).
	var usePercentAgg = isPercent && !isGap;
	if ((totalOnly || isGap || usePercentAgg) && this.pivot && typeof this.pivot.ResolveAllCategoriesByRegion === 'function') {
		var resolved = this.pivot.ResolveAllCategoriesByRegion(this.panel.metricId(), this.panel.versionId());
		if (resolved && resolved.length) {
			// Filtro de categorías elegidas (cuando hay selección explícita). Sin
			// selección (solo total) se conservan todas las categorías resueltas.
			var keep = null;
			if (!totalOnly) {
				keep = {};
				for (var ki = 0; ki < catCols.length; ki++) {
					if (catCols[ki].meta.labelId != null) keep[catCols[ki].meta.labelId] = true;
				}
			}
			var rr = [];
			for (var ri = 0; ri < resolved.length; ri++) {
				var src = resolved[ri];
				var parts = src.parts;
				if (keep) parts = parts.filter(function (p) { return keep[p.labelId]; });
				if (isGap) {
					rr.push({
						label: src.label, fid: src.fid,
						total: (src.delta != null ? src.delta : 0),
						parts: parts, isGroup: false, isGap: true
					});
				} else if (usePercentAgg) {
					// Incidencia del conjunto: suma de los valores sobre el universo
					// (aditivos). Cada segmento usa ese mismo valor sobre el universo,
					// para que la composición sea proporcional al agregado.
					var aggParts = parts.map(function (p) {
						return { labelId: p.labelId, name: p.name, color: p.color, value: (p.valueOnUniverse || 0) };
					});
					var su = 0;
					for (var ui = 0; ui < aggParts.length; ui++) su += aggParts[ui].value;
					rr.push({ label: src.label, fid: src.fid, total: su, parts: aggParts, isGroup: false });
				} else {
					var s = 0;
					for (var pi = 0; pi < parts.length; pi++) s += (parts[pi].value || 0);
					rr.push({ label: src.label, fid: src.fid, total: s, parts: parts, isGroup: false });
				}
			}
			this._rows = this._orderByPivot(rr);
			this._totalCount = this._rows.length;
			this._totalOnly = false;
			this._composed = true;
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

// ¿Las barras se componen de varias categorías (con color) apilables? Apilar solo
// tiene sentido en porcentaje (las categorías reparten un 100). En conteo, tasa o
// área no se ofrece. Una brecha tampoco apila: su delta no compone una suma.
RegionDistribution.prototype.isComposed = function () {
	if (this.panel && this.panel.isGap && this.panel.isGap()) return false;
	if (this.panel && this.panel.isPercent && !this.panel.isPercent()) return false;
	if (this._composed) {
		for (var i = 0; i < this._rows.length; i++) {
			if (this._rows[i].parts && this._rows[i].parts.length > 1) return true;
		}
	}
	return false;
};

// Reordena las filas del Camino 1 (que llegan en el orden original de las
// regiones) para que imiten el orden de la pivot, que refleja el sort activo. Se
// alinea por FID contra dataRows(); las filas sin correspondencia van al final en
// su orden original.
RegionDistribution.prototype._orderByPivot = function (rows) {
	var dataRows = (this.dataset && typeof this.dataset.dataRows === 'function')
		? this.dataset.dataRows() : [];
	if (!dataRows.length) return rows;
	var rank = {};
	var next = 0;
	for (var i = 0; i < dataRows.length; i++) {
		var dr = dataRows[i];
		if (dr.fid != null && rank[dr.fid] === undefined) rank[dr.fid] = next++;
	}
	var withRank = rows.map(function (row, idx) {
		var r = (row.fid != null && rank[row.fid] !== undefined) ? rank[row.fid] : (next + idx);
		return { row: row, r: r };
	});
	withRank.sort(function (a, b) { return a.r - b.r; });
	return withRank.map(function (x) { return x.row; });
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
