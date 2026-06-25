/**
 * DistributionPanel.js — un panel de distribución: un indicador en una versión
 * (un año). Es la unidad que se grafica. Agrupa las columnas del dataset que
 * comparten (metricId, versionId) — las categorías y, si está, el total — y
 * resuelve por sí mismo las decisiones de presentación que dependen del caso,
 * para que el componente no tenga que decidirlas con condicionales sueltos:
 *
 *   - si es porcentaje o conteo (define si la línea de total tiene sentido y si
 *     el eje va 0–100);
 *   - si las categorías particionan el total (define si se puede apilar / pedir
 *     composición);
 *   - qué barras de categoría hay (con su color curado) y cuál es el total.
 *
 * No conoce el modo de visualización (barras/líneas) ni el modo de eje
 * (categorías/regiones): solo provee los datos resueltos. El "qué se dibuja" es
 * del componente; el "qué representa cada cosa" es de este objeto.
 *
 * Se construye con las columnas measure de un grupo (mismas metricId+versionId),
 * tal como las entrega el dataset (cada una con su meta, mode, unit, values).
 */

export default DistributionPanel;

function DistributionPanel(columns) {
	this.columns = columns || [];
	this._categoryColumns = null;
	this._totalColumn = null;
	this._split();
}

// Separa las columnas en categorías (las que tienen labelId) y total (isTotal).
// El orden de las categorías respeta el de las columnas (el de la pivot).
DistributionPanel.prototype._split = function () {
	var cats = [];
	var total = null;
	for (var i = 0; i < this.columns.length; i++) {
		var col = this.columns[i];
		if (col.meta && col.meta.isTotal) {
			total = col;
		} else if (col.meta && col.meta.labelId != null) {
			cats.push(col);
		}
	}
	this._categoryColumns = cats;
	this._totalColumn = total;
};

DistributionPanel.prototype.metricId = function () {
	return this.columns.length ? this.columns[0].meta.metricId : null;
};

DistributionPanel.prototype.versionId = function () {
	return this.columns.length ? this.columns[0].meta.versionId : null;
};

DistributionPanel.prototype.indicatorName = function () {
	return this.columns.length ? this.columns[0].meta.metricName : '';
};

DistributionPanel.prototype.variableName = function () {
	return this.columns.length ? this.columns[0].meta.variableName : '';
};

DistributionPanel.prototype.versionName = function () {
	return this.columns.length ? this.columns[0].meta.versionName : '';
};

DistributionPanel.prototype.unit = function () {
	return this.columns.length ? (this.columns[0].unit || '') : '';
};

// Conteo de medida (cada fila/región representa una unidad) vs porcentaje/tasa.
// El modo de medición (mode) y la unidad lo determinan: si la unidad es '%', es
// porcentaje. Conservador: ante la duda, no lo trata como porcentaje.
DistributionPanel.prototype.isPercent = function () {
	var u = this.unit();
	return u.indexOf('%') !== -1;
};

// La línea de total como referencia solo tiene sentido en porcentaje (es el
// valor agregado del indicador). En conteo no se muestra.
DistributionPanel.prototype.showsTotalLine = function () {
	return this.isPercent() && this._totalColumn != null;
};

// Las categorías particionan el total cuando, sumadas, lo reconstruyen: es el
// caso de conteos por subgrupo o de rangos cuya contribución suma el total.
// Habilita apilar / pedir composición. Se ofrece cuando hay total y categorías;
// el dato de si la suma cuadra lo valida quien arme las regiones.
DistributionPanel.prototype.canStack = function () {
	return this._categoryColumns.length > 1 && this._totalColumn != null;
};

DistributionPanel.prototype.categoryColumns = function () {
	return this._categoryColumns;
};

DistributionPanel.prototype.totalColumn = function () {
	return this._totalColumn;
};

// Categorías para la leyenda: nombre + color curado, en orden de la pivot.
DistributionPanel.prototype.legend = function () {
	return this._categoryColumns.map(function (col) {
		return {
			labelId: col.meta.labelId,
			name: col.meta.labelName || col.shortLabel || '',
			color: col.meta.fillColor || null
		};
	});
};

// Clave estable del panel (para keys de Vue y para la persistencia en la ruta).
DistributionPanel.prototype.key = function () {
	return this.metricId() + ':' + this.versionId();
};
