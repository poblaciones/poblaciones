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
	this._indexByVersionLevel = {};
}

ActiveData.prototype._key = function (versionId, levelId) {
	return versionId + ':' + levelId;
};

ActiveData.prototype.itemsFor = function (versionId, levelId) {
	return this._byVersionLevel[this._key(versionId, levelId)] || null;
};

// Índice de los items de un (versión, nivel) agrupados por VID y, dentro, por
// GeographyItemId. Permite que ResolveCell baje directo a las filas de su
// variable y busque por geografía en O(1), en vez de recorrer todo el array por
// cada celda. Se construye perezosamente y se cachea hasta el próximo clear.
//   índice[VID] = { byGeo: Map(geoId → [items]) }
ActiveData.prototype.indexFor = function (versionId, levelId) {
	var key = this._key(versionId, levelId);
	var cached = this._indexByVersionLevel[key];
	if (cached) return cached;
	var items = this._byVersionLevel[key];
	if (!items) return null;
	var index = {};
	for (var i = 0; i < items.length; i++) {
		var mi = items[i];
		var byVid = index[mi.VID];
		if (!byVid) { byVid = { byGeo: new Map() }; index[mi.VID] = byVid; }
		var bucket = byVid.byGeo.get(mi.GeographyItemId);
		if (!bucket) { bucket = []; byVid.byGeo.set(mi.GeographyItemId, bucket); }
		bucket.push(mi);
	}
	this._indexByVersionLevel[key] = index;
	return index;
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
						delete loc._indexByVersionLevel[k]; // se reconstruye al primer uso
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
	this._indexByVersionLevel = {};
};

// Fuerza la recarga de una versión descartando todas sus claves del caché.
ActiveData.prototype.invalidateVersion = function (versionId) {
	var prefix = versionId + ':';
	var store = this._byVersionLevel;
	var index = this._indexByVersionLevel;
	Object.keys(store).forEach(function (k) {
		if (k.indexOf(prefix) === 0) { delete store[k]; delete index[k]; }
	});
};

export default ActiveData;
