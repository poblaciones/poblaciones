/**
 * ActiveBoundarySet — colección de delimitaciones (ActiveBoundary) del pivot.
 *
 * El pivot tiene dos colecciones con la misma mecánica pero distinto rol: las
 * regiones de filas (OR, definen qué filas se muestran) y los filtros (AND,
 * restringen el universo). Como comparten buscar por id, agregar/quitar items
 * con fusión y remover una delimitación completa, esta clase encapsula esa
 * mecánica y se instancia dos veces: pivot.Regions y pivot.FilterSet.
 *
 * Las dependencias que tocan el árbol de delimitaciones y el backend
 * (buildBoundary, makeSelection, ready, removeItem) se inyectan desde el pivot,
 * para que el set sea testeable en aislamiento.
 */

function ActiveBoundarySet(pivot, options) {
	options = options || {};
	this.pivot = pivot;
	this.items = [];
	this._prepend = !!options.prepend;
	this._buildBoundary = options.buildBoundary;
	this._makeSelection = options.makeSelection;
	this._ready = options.ready || function (v) { return Promise.resolve(v); };
	this._removeItem = options.removeItem || function (a, item) {
		var i = a.indexOf(item);
		if (i >= 0) a.splice(i, 1);
	};
}

ActiveBoundarySet.prototype._insert = function (boundary) {
	if (this._prepend) this.items.unshift(boundary);
	else this.items.push(boundary);
};

ActiveBoundarySet.prototype.findById = function (boundaryId) {
	for (var i = 0; i < this.items.length; i++) {
		/* eslint-disable-next-line eqeqeq */
		if (this.items[i].__boundaryId == boundaryId) return this.items[i];
	}
	return null;
};

// Si ya estaba, la promociona a completa en vez de duplicarla.
ActiveBoundarySet.prototype.addWholeById = function (boundaryId, caption) {
	var existing = this.findById(boundaryId);
	if (existing) {
		var prevVersion = existing.SelectedVersion();
		var allSelection = this._makeSelection(prevVersion.Selection.Region);
		allSelection.SelectAllItems();
		prevVersion.Selection = allSelection;
		existing.__whole = true;
		return this._ready(existing);
	}
	var built = this._buildBoundary(boundaryId);
	if (!built) return this._ready(null);
	var version = built.activeBoundary.SelectedVersion();
	var regionSelection = this._makeSelection(built.region);
	regionSelection.SelectAllItems();
	version.Selection = regionSelection;
	built.activeBoundary.__boundaryId = boundaryId;
	built.activeBoundary.__whole = true;
	built.activeBoundary.__caption = caption || null;
	this._insert(built.activeBoundary);
	return this._ready(built.activeBoundary);
};

// Si la delimitación ya está, fusiona los items sin duplicar; si no, la crea.
ActiveBoundarySet.prototype.addItemsById = function (boundaryId, itemIds, whole) {
	var existing = this.findById(boundaryId);
	if (existing) {
		var selection = existing.SelectedVersion().Selection;
		for (var n = 0; n < itemIds.length; n++) {
			if (!selection.IsItemSelected(itemIds[n])) selection.ToggleItem(itemIds[n]);
		}
		return this._ready(existing);
	}
	var built = this._buildBoundary(boundaryId);
	if (!built) return this._ready(null);
	var version = built.activeBoundary.SelectedVersion();
	var regionSelection = this._makeSelection(built.region);
	regionSelection.SelectItems(itemIds);
	version.Selection = regionSelection;
	built.activeBoundary.__boundaryId = boundaryId;
	if (whole !== undefined) built.activeBoundary.__whole = !!whole;
	this._insert(built.activeBoundary);
	return this._ready(built.activeBoundary);
};

// Si la delimitación queda sin items, se remueve entera.
ActiveBoundarySet.prototype.removeItemsById = function (boundaryId, itemIds) {
	var existing = this.findById(boundaryId);
	if (!existing) return;
	var selection = existing.SelectedVersion().Selection;
	for (var n = 0; n < itemIds.length; n++) {
		if (selection.IsItemSelected(itemIds[n])) selection.ToggleItem(itemIds[n]);
	}
	if (!selection.Items.length) this._removeItem(this.items, existing);
};

ActiveBoundarySet.prototype.removeById = function (boundaryId) {
	var existing = this.findById(boundaryId);
	if (existing) this._removeItem(this.items, existing);
};

ActiveBoundarySet.prototype.clear = function () {
	this.items = [];
};

export default ActiveBoundarySet;
