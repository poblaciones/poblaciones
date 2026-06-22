/**
 * ActiveData — caché de filas de datos del pivot y su carga desde el backend.
 * Vive dentro de un ActivePivot y se invoca como `pivot.Data.load()`,
 * `pivot.Data.itemsFor(versionId, levelId)`, etc.
 *
 * El caché se indexa por (versionId : levelId) en lugar de en `level.Items`
 * porque un mismo objeto `level` puede compartirse entre versiones (el nivel
 * "Departamentos" existe en 2010 y 2022); guardarlo en el level pisaría los
 * datos de una versión con los de la otra.
 */

function ActiveData(pivot) {
	this.pivot = pivot;
	this._byVersionLevel = {};
}

ActiveData.prototype._key = function (versionId, levelId) {
	return versionId + ':' + levelId;
};

ActiveData.prototype.itemsFor = function (versionId, levelId) {
	return this._byVersionLevel[this._key(versionId, levelId)] || null;
};

// Carga los datos de cada (versionId, levelId) único que requieren las columnas
// y que aún no estén cacheados. Devuelve una promesa de todas las cargas.
ActiveData.prototype.load = function () {
	var specs = this.pivot.MetricTuples.metricTuples;
	var store = this._byVersionLevel;
	var seen = {};
	var toRetrieve = [];
	var loc = this;
	for (var i = 0; i < specs.length; i++) {
		var spec = specs[i];
		var usable = !spec.isEmpty && spec.level;
		if (usable) {
			var key = loc._key(spec.versionId, spec.levelId);
			var pending = !seen[key] && !store[key];
			seen[key] = true;
			if (pending) {
				(function (k, lvl, mtc, ver) {
					toRetrieve.push(mtc.Store.GetMetricData(mtc, ver, lvl).then(function (list) {
						store[k] = list;
						return list;
					}));
				})(key, spec.level, spec.metric, spec.version);
			}
		}
	}
	return Promise.all(toRetrieve);
};

ActiveData.prototype.clear = function () {
	this._byVersionLevel = {};
};

// Fuerza la recarga de una versión descartando todas sus claves del caché.
ActiveData.prototype.invalidateVersion = function (versionId) {
	var prefix = versionId + ':';
	var store = this._byVersionLevel;
	Object.keys(store).forEach(function (k) {
		if (k.indexOf(prefix) === 0) delete store[k];
	});
};

export default ActiveData;
