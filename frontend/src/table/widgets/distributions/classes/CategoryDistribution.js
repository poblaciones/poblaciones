/**
 * CategoryDistribution.js — modo "por categorías" de un panel. Calcula el valor
 * agregado de cada categoría (y del total) sobre todo el universo de regiones,
 * para el gráfico cuyo eje X son los cortes.
 *
 * El agregado respeta el modo de medición de la columna, igual que el resto del
 * análisis:
 *   - conteo (weighting 'self'): el agregado es la suma de los valores;
 *   - porcentaje/tasa (weighting 'denominator'): es la media ponderada
 *     Σ(valor·peso)/Σpeso, de modo que la magnitud no dependa de cuántas
 *     unidades haya sino del peso (población) de cada una.
 *
 * Lee las filas de datos del dataset, cuyos `values`/`weights` están alineados
 * posicionalmente con dataset.columns. Resuelve ese mapeo desde las columnas del
 * panel. No reordena ni muta nada.
 */

export default CategoryDistribution;

function CategoryDistribution(panel, dataset, pivot, excludedGroups) {
	this.panel = panel;
	this.dataset = dataset;
	this.pivot = pivot || null;
	this.excludedGroups = excludedGroups || [];
	this._bars = null;
	this._total = null;
	this._build();
}

// Filas de datos, excluyendo las que pertenecen a un corte de control colapsado
// (su grupo padre está en excludedGroups). El colapso es una ocultación visual de
// la tabla; distribución la respeta, pero los demás widgets no.
CategoryDistribution.prototype._rows = function () {
	var all = (this.dataset && typeof this.dataset.dataRows === 'function') ? this.dataset.dataRows() : [];
	if (!this.excludedGroups.length) return all;
	var ex = this.excludedGroups;
	return all.filter(function (r) { return ex.indexOf(r.parentLabel) === -1; });
};

CategoryDistribution.prototype._indexOf = function (column) {
	var cols = this.dataset.columns;
	for (var i = 0; i < cols.length; i++) {
		if (cols[i].key === column.key) return i;
	}
	return -1;
};

// Agrega una columna sobre todas las filas de datos según su modo de ponderación.
CategoryDistribution.prototype._aggregate = function (column, rows) {
	if (!column) return null;
	var idx = this._indexOf(column);
	if (idx < 0) return null;
	var weighted = column.weighting && column.weighting.kind === 'denominator';
	if (weighted) {
		var num = 0, den = 0;
		for (var i = 0; i < rows.length; i++) {
			var v = rows[i].values[idx];
			var w = rows[i].weights[idx];
			if (v == null || w == null) continue;
			num += v * w;
			den += w;
		}
		return den > 0 ? num / den : null;
	}
	var sum = 0, any = false;
	for (var j = 0; j < rows.length; j++) {
		var val = rows[j].values[idx];
		if (val == null) continue;
		sum += val; any = true;
	}
	return any ? sum : null;
};

CategoryDistribution.prototype._build = function () {
	var rows = this._rows();
	var cats = this.panel.categoryColumns();
	var loc = this;
	if (cats.length === 0 && this.panel.totalColumn()) {
		// Solo total seleccionado. Camino 1: si hay pivot, se resuelven todas las
		// categorías de la variable (con su valor agregado y color), como si
		// estuvieran elegidas. El total agregado pasa a ser la línea de referencia.
		if (this.pivot && typeof this.pivot.ResolveAllCategories === 'function') {
			var resolved = this.pivot.ResolveAllCategories(this.panel.metricId(), this.panel.versionId());
			if (resolved && resolved.length) {
				this._bars = resolved;
				this._total = this._aggregate(this.panel.totalColumn(), rows);
				return;
			}
		}
		// Sin pivot o sin categorías resolubles: el total como barra única neutra.
		var totalCol = this.panel.totalColumn();
		this._bars = [{ labelId: null, name: totalCol.meta.labelName || 'Total', color: '#90a4ae', value: loc._aggregate(totalCol, rows) }];
		this._total = null;
		return;
	}
	this._bars = cats.map(function (col) {
		return {
			labelId: col.meta.labelId,
			name: col.meta.labelName || col.shortLabel || '',
			color: col.meta.fillColor || null,
			value: loc._aggregate(col, rows)
		};
	});
	this._total = this._aggregate(this.panel.totalColumn(), rows);
};

// [{ labelId, name, color, value }] en el orden de la pivot.
CategoryDistribution.prototype.bars = function () {
	return this._bars;
};

// Valor agregado del total (para la línea de referencia), o null.
CategoryDistribution.prototype.totalValue = function () {
	return this._total;
};
