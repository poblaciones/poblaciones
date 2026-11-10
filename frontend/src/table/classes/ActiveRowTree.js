/**
 * ActiveRowTree — árbol de filas de la pivot (pivot.RowTree).
 *
 * La raíz es un nivel (una delimitación raíz: Provincias, Regiones…). Cada
 * elemento visible puede desplegarse; al hacerlo, cada delimitación hija
 * (Municipios, Departamentos…) aparece como un nivel propio, colapsable, con los
 * elementos que descienden de él. Cada nivel decide qué elementos se ven con
 * casillas: sin ninguna marcada (o todas) se ven todos.
 *
 * Reglas:
 *   - Un elemento que es el único visible de su nivel queda siempre desplegado.
 *   - Si un elemento tiene un solo tipo de hijo, ese nivel queda siempre abierto.
 *   - Un tipo de hijo sin elementos debajo del elemento no se ofrece.
 *   - Al desplegar un elemento, sus tipos de hijo arrancan colapsados, salvo el
 *     último que el usuario abrió para ese tipo de padre (preferencia de sesión).
 *
 * Dependencias inyectadas (para probarlo en aislamiento): hierarchy() devuelve
 * la BoundaryHierarchy del catálogo; regionFor(boundary) el RegionSet con el que
 * la pivot resuelve las relaciones geográficas de esa delimitación.
 */

export default ActiveRowTree;
export { RowLevel };

// ── RowLevel: un nivel del árbol ─────────────────────────────────────────────

function RowLevel(tree, boundary, parentLevel, parentItem) {
	this.tree = tree;
	this.boundary = boundary;
	this.parentLevel = parentLevel;
	this.parentItem = parentItem;
	// null: todos marcados. Objeto { fid: true }: solo esos. Un objeto vacío (el
	// menú con todas las casillas destildadas) también equivale a "todos".
	this.checked = null;
	this.open = false;
	// fid → { open, types: { boundaryId: RowLevel } }
	this.itemStates = {};
}

RowLevel.prototype.IsRoot = function () {
	return this.parentLevel === null;
};

RowLevel.prototype.Items = function () {
	if (this.IsRoot()) {
		return this.boundary.Items;
	}
	return this.tree.Hierarchy().ChildItems(this.boundary.Id, this.parentItem.FID);
};

RowLevel.prototype.FindItem = function (fid) {
	var items = this.Items();
	for (var i = 0; i < items.length; i++) {
		/* eslint-disable-next-line eqeqeq */
		if (items[i].FID == fid) {
			return items[i];
		}
	}
	return null;
};

RowLevel.prototype.IsAll = function () {
	return this.checked === null || Object.keys(this.checked).length === 0;
};

RowLevel.prototype.IsShown = function (fid) {
	return this.IsAll() || this.checked[fid] === true;
};

// Estado de la casilla en el menú del nivel (distingue "ninguna marcada", que en
// la grilla equivale a todos, de "todas marcadas").
RowLevel.prototype.IsBoxChecked = function (fid) {
	return this.checked === null || this.checked[fid] === true;
};

RowLevel.prototype.ShownItems = function () {
	var items = this.Items();
	var shown = [];
	for (var i = 0; i < items.length; i++) {
		if (this.IsShown(items[i].FID)) {
			shown.push(items[i]);
		}
	}
	return shown;
};

RowLevel.prototype.CheckedFids = function () {
	if (this.IsAll()) {
		return null;
	}
	var items = this.Items();
	var fids = [];
	for (var i = 0; i < items.length; i++) {
		if (this.checked[items[i].FID] === true) {
			fids.push(items[i].FID);
		}
	}
	return fids;
};

RowLevel.prototype.SetCheckedFids = function (fids) {
	this.checked = null;
	if (fids && fids.length) {
		var valid = [];
		for (var i = 0; i < fids.length; i++) {
			var item = this.FindItem(fids[i]);
			if (item) {
				valid.push(item);
			}
		}
		if (valid.length) {
			this.SetChecked(this.Items(), false);
			this.SetChecked(valid, true);
		}
	}
};

// Marca o desmarca casillas. Si quedan todas marcadas, vuelve a "todos".
RowLevel.prototype.SetChecked = function (items, value) {
	var all = this.Items();
	if (this.checked === null) {
		this.checked = {};
		for (var a = 0; a < all.length; a++) {
			this.checked[all[a].FID] = true;
		}
	}
	for (var i = 0; i < items.length; i++) {
		if (value) {
			this.checked[items[i].FID] = true;
		} else {
			delete this.checked[items[i].FID];
		}
	}
	if (Object.keys(this.checked).length === all.length) {
		this.checked = null;
	}
};

// La "×" de una fila: la quita de la vista. Si era el último elemento visible, el
// nivel vuelve a mostrar todos.
RowLevel.prototype.RemoveItem = function (item) {
	if (this.IsAll()) {
		this.checked = null;
	}
	if (this.checked !== null && Object.keys(this.checked).length === 1 && this.checked[item.FID] === true) {
		this.checked = null;
	} else {
		this.SetChecked([item], false);
	}
};

RowLevel.prototype.RestrictTo = function (item) {
	this.checked = {};
	this.checked[item.FID] = true;
};

RowLevel.prototype.FocusAdd = function (item) {
	if (this.IsAll()) {
		this.RestrictTo(item);
	} else {
		this.checked[item.FID] = true;
	}
};

// Vuelve a mostrar todos los elementos y repliega los desplegados.
RowLevel.prototype.ShowAll = function () {
	this.checked = null;
	var fids = Object.keys(this.itemStates);
	for (var i = 0; i < fids.length; i++) {
		this.itemStates[fids[i]].open = false;
	}
};

RowLevel.prototype.ItemState = function (item) {
	var state = this.itemStates[item.FID];
	if (!state) {
		state = { open: false, types: {} };
		this.itemStates[item.FID] = state;
	}
	return state;
};

RowLevel.prototype.ChildBoundaries = function () {
	return this.tree.Hierarchy().ChildBoundaries(this.boundary.Id);
};

RowLevel.prototype.HasChildBoundary = function (boundaryId) {
	var children = this.ChildBoundaries();
	for (var i = 0; i < children.length; i++) {
		/* eslint-disable-next-line eqeqeq */
		if (children[i].Id == boundaryId) {
			return true;
		}
	}
	return false;
};

// Delimitaciones hijas que tienen elementos debajo de este item (las vacías no
// se ofrecen).
RowLevel.prototype.ChildBoundariesOf = function (item) {
	var hierarchy = this.tree.Hierarchy();
	var children = this.ChildBoundaries();
	var withItems = [];
	for (var i = 0; i < children.length; i++) {
		if (hierarchy.ChildItems(children[i].Id, item.FID).length > 0) {
			withItems.push(children[i]);
		}
	}
	return withItems;
};

RowLevel.prototype.IsExpandable = function (item) {
	return this.ChildBoundariesOf(item).length > 0;
};

// ¿Hay un único elemento visible? Sin recorrer los elementos: las casillas solo
// guardan elementos de este nivel.
RowLevel.prototype.HasSingleShown = function () {
	if (this.IsAll()) {
		return this.Items().length === 1;
	}
	return Object.keys(this.checked).length === 1;
};

RowLevel.prototype.IsItemForced = function (item) {
	return this.HasSingleShown() && this.IsShown(item.FID) && this.IsExpandable(item);
};

RowLevel.prototype.IsItemOpen = function (item) {
	if (!this.IsExpandable(item)) {
		return false;
	}
	return this.IsItemForced(item) || this.ItemState(item).open;
};

RowLevel.prototype.ToggleItem = function (item) {
	var state = this.ItemState(item);
	state.open = !state.open;
};

// Nivel de un tipo de hijo bajo un elemento. Se crea al primer uso; arranca
// abierto solo si es el tipo que el usuario prefirió la última vez.
RowLevel.prototype.Type = function (item, boundary) {
	var state = this.ItemState(item);
	var type = state.types[boundary.Id];
	if (!type) {
		type = new RowLevel(this.tree, boundary, this, item);
		/* eslint-disable-next-line eqeqeq */
		type.open = (this.tree.PreferredChild(this.boundary.Id) == boundary.Id);
		state.types[boundary.Id] = type;
	}
	return type;
};

RowLevel.prototype.Types = function (item) {
	var children = this.ChildBoundariesOf(item);
	var types = [];
	for (var i = 0; i < children.length; i++) {
		types.push(this.Type(item, children[i]));
	}
	return types;
};

RowLevel.prototype.HasSingleSibling = function () {
	return !this.IsRoot() && this.parentLevel.ChildBoundariesOf(this.parentItem).length === 1;
};

RowLevel.prototype.IsCollapsible = function () {
	return !this.IsRoot() && !this.HasSingleSibling();
};

RowLevel.prototype.IsTypeOpen = function () {
	return this.IsRoot() || this.HasSingleSibling() || this.open;
};

RowLevel.prototype.ToggleOpen = function () {
	this.open = !this.open;
	if (this.open) {
		this.tree.SetPreferredChild(this.parentLevel.boundary.Id, this.boundary.Id);
	}
};

// ── ActiveRowTree ────────────────────────────────────────────────────────────

function ActiveRowTree(pivot, options) {
	this.pivot = pivot;
	this.root = null;
	// boundaryId del padre → boundaryId del tipo de hijo abierto por última vez.
	this.preferences = {};
	// Lugar sugerido por el visor (vista actual): { chain, fids }.
	this.suggestion = null;
	this._hierarchy = options.hierarchy;
	this._regionFor = options.regionFor;
}

ActiveRowTree.prototype.Hierarchy = function () {
	return this._hierarchy();
};

ActiveRowTree.prototype.RegionFor = function (level) {
	return this._regionFor(level.boundary);
};

ActiveRowTree.prototype.SetRoot = function (boundaryId) {
	var boundary = this.Hierarchy().Get(boundaryId);
	if (!boundary) {
		return null;
	}
	this.root = new RowLevel(this, boundary, null, null);
	this.root.open = true;
	return this.root;
};

ActiveRowTree.prototype.EnsureRoot = function () {
	if (!this.root) {
		var boundary = this.Hierarchy().DefaultRoot();
		if (boundary) {
			this.SetRoot(boundary.Id);
		}
	}
	return this.root;
};

ActiveRowTree.prototype.Clear = function () {
	this.root = null;
	this.suggestion = null;
};

ActiveRowTree.prototype.PreferredChild = function (parentBoundaryId) {
	return this.preferences[parentBoundaryId] || null;
};

ActiveRowTree.prototype.SetPreferredChild = function (parentBoundaryId, childBoundaryId) {
	this.preferences[parentBoundaryId] = childBoundaryId;
};

// Hace visible una cadena [{ boundary, item }] desde la raíz. En cada nivel que
// mostraba todos, deja solo el elemento de la cadena; en uno ya restringido, lo
// suma. Con openLast, despliega el último elemento.
ActiveRowTree.prototype.RevealChain = function (chain, openLast) {
	if (!chain.length) {
		return;
	}
	var fresh = false;
	/* eslint-disable-next-line eqeqeq */
	if (!this.root || this.root.boundary.Id != chain[0].boundary.Id) {
		this.SetRoot(chain[0].boundary.Id);
		fresh = true;
	}
	var level = this.root;
	for (var i = 0; i < chain.length; i++) {
		var step = chain[i];
		if (fresh) {
			level.RestrictTo(step.item);
		} else {
			level.FocusAdd(step.item);
		}
		var state = level.ItemState(step.item);
		if (i === chain.length - 1) {
			if (openLast && level.IsExpandable(step.item)) {
				state.open = true;
			}
		} else {
			state.open = true;
			var existing = state.types[chain[i + 1].boundary.Id];
			fresh = !existing || (!existing.IsTypeOpen() && existing.IsAll());
			var type = level.Type(step.item, chain[i + 1].boundary);
			type.open = true;
			level = type;
		}
	}
};

// Reemplaza la selección: la tabla pasa a mostrar solo la cadena elegida.
ActiveRowTree.prototype.ReplaceSelection = function (chain) {
	if (!chain.length) {
		return;
	}
	this.SetRoot(chain[0].boundary.Id);
	this.RevealChain(chain, true);
};

// Suma la cadena a lo que ya se ve (selección aditiva, para comparar).
ActiveRowTree.prototype.AddSelection = function (chain) {
	this.RevealChain(chain, true);
};

ActiveRowTree.prototype.SetSuggestion = function (fids) {
	this.suggestion = null;
	var chain = this.Hierarchy().ChainForCandidates(fids || []);
	if (chain.length) {
		this.suggestion = { chain: chain, fids: fids };
	}
};

ActiveRowTree.prototype.AcceptSuggestion = function () {
	if (this.suggestion) {
		this.ReplaceSelection(this.suggestion.chain);
		this.suggestion = null;
	}
};

ActiveRowTree.prototype.DismissSuggestion = function () {
	this.suggestion = null;
};

// Niveles cuyos datos se muestran: la raíz y los tipos de hijo abiertos de cada
// elemento desplegado. Un tipo colapsado no cuenta: no pide relaciones
// geográficas ni obliga a bajar de nivel (p. ej. a radios) hasta que se abre.
ActiveRowTree.prototype.OpenLevels = function () {
	var out = [];
	if (this.root) {
		this._collectOpen(this.root, out);
	}
	return out;
};

ActiveRowTree.prototype._collectOpen = function (level, out) {
	if (level.IsTypeOpen()) {
		out.push(level);
		var shown = level.ShownItems();
		for (var i = 0; i < shown.length; i++) {
			if (level.IsItemOpen(shown[i])) {
				var types = level.Types(shown[i]);
				for (var t = 0; t < types.length; t++) {
					this._collectOpen(types[t], out);
				}
			}
		}
	}
};

// RegionSets distintos de los niveles abiertos.
ActiveRowTree.prototype.OpenRegions = function () {
	var levels = this.OpenLevels();
	var regions = [];
	for (var i = 0; i < levels.length; i++) {
		var region = this.RegionFor(levels[i]);
		if (regions.indexOf(region) === -1) {
			regions.push(region);
		}
	}
	return regions;
};

// Nivel sobre el que se analiza (resumen, distribución, relaciones): se baja
// desde la raíz mientras haya un único elemento visible, desplegado y con un único
// tipo de hijo abierto. Así, "Provincias › Catamarca › Municipios" se analiza
// sobre los municipios, y "Provincias" sola, sobre las provincias.
ActiveRowTree.prototype.AnalysisLevel = function () {
	var level = this.root;
	var descending = !!level;
	while (descending) {
		descending = false;
		var shown = level.ShownItems();
		if (shown.length === 1 && level.IsItemOpen(shown[0])) {
			var openTypes = [];
			var types = level.Types(shown[0]);
			for (var t = 0; t < types.length; t++) {
				if (types[t].IsTypeOpen()) {
					openTypes.push(types[t]);
				}
			}
			if (openTypes.length === 1) {
				level = openTypes[0];
				descending = true;
			}
		}
	}
	return level;
};

// Elementos del nivel de análisis, con el RegionSet que resuelve sus celdas.
ActiveRowTree.prototype.AnalysisEntries = function () {
	var level = this.AnalysisLevel();
	var entries = [];
	if (level) {
		var region = this.RegionFor(level);
		var shown = level.ShownItems();
		for (var i = 0; i < shown.length; i++) {
			entries.push({ region: region, item: shown[i] });
		}
	}
	return entries;
};

// Elementos elegidos explícitamente (en niveles restringidos), quedándose con el
// más profundo de cada rama: "Catamarca › Belén" aporta Belén, no Catamarca.
ActiveRowTree.prototype.SelectionLeaves = function () {
	var out = [];
	if (this.root) {
		this._collectLeaves(this.root, out);
	}
	return out;
};

// Quita de la selección una región elegida (la "×" de su casilla en Filtrar). Si
// era la última de su nivel, el nivel vuelve a mostrar todos.
ActiveRowTree.prototype.RemoveSelectedItem = function (fid) {
	var leaves = this.SelectionLeaves();
	for (var i = 0; i < leaves.length; i++) {
		/* eslint-disable-next-line eqeqeq */
		if (leaves[i].item.FID == fid) {
			leaves[i].level.RemoveItem(leaves[i].item);
		}
	}
};

ActiveRowTree.prototype._collectLeaves = function (level, out) {
	var shown = level.ShownItems();
	for (var i = 0; i < shown.length; i++) {
		var deeper = [];
		if (level.IsItemOpen(shown[i])) {
			var types = level.Types(shown[i]);
			for (var t = 0; t < types.length; t++) {
				if (types[t].IsTypeOpen()) {
					this._collectLeaves(types[t], deeper);
				}
			}
		}
		if (deeper.length) {
			for (var d = 0; d < deeper.length; d++) {
				out.push(deeper[d]);
			}
		} else if (!level.IsAll()) {
			out.push({ level: level, item: shown[i] });
		}
	}
};

// ── Serialización ────────────────────────────────────────────────────────────
//
// { root, checked, entries: [{ path, open, checked }] }. El path alterna ids de
// elemento y de delimitación desde la raíz: [fid] es un elemento desplegado de
// la raíz; [fid, boundaryId] el nivel de ese tipo bajo él; [fid, boundaryId, fid]
// un elemento desplegado dentro de ese nivel, y así.

ActiveRowTree.prototype.ToSection = function () {
	if (!this.root) {
		return null;
	}
	var entries = [];
	this._collectEntries(this.root, [], entries);
	return { root: this.root.boundary.Id, checked: this.root.CheckedFids(), entries: entries };
};

ActiveRowTree.prototype._collectEntries = function (level, prefix, out) {
	var shown = level.ShownItems();
	for (var i = 0; i < shown.length; i++) {
		var item = shown[i];
		var state = level.itemStates[item.FID];
		if (state) {
			var itemPath = prefix.concat([item.FID]);
			if (state.open) {
				out.push({ path: itemPath, open: true, checked: null });
			}
			if (level.IsItemOpen(item)) {
				var boundaryIds = Object.keys(state.types);
				for (var t = 0; t < boundaryIds.length; t++) {
					var type = state.types[boundaryIds[t]];
					var typePath = itemPath.concat([type.boundary.Id]);
					if (type.open || !type.IsAll()) {
						out.push({ path: typePath, open: type.open, checked: type.CheckedFids() });
					}
					if (type.IsTypeOpen()) {
						this._collectEntries(type, typePath, out);
					}
				}
			}
		}
	}
};

ActiveRowTree.prototype.Restore = function (section) {
	if (!section || section.root == null) {
		return;
	}
	var root = this.SetRoot(section.root);
	if (!root) {
		return;
	}
	root.SetCheckedFids(section.checked);
	var entries = (section.entries || []).slice();
	entries.sort(function (a, b) { return a.path.length - b.path.length; });
	for (var i = 0; i < entries.length; i++) {
		this._restoreEntry(entries[i]);
	}
};

ActiveRowTree.prototype._restoreEntry = function (entry) {
	var level = this.root;
	var position = 0;
	var valid = true;
	while (valid && position < entry.path.length) {
		var item = level.FindItem(entry.path[position]);
		if (!item) {
			valid = false;
		} else if (position === entry.path.length - 1) {
			level.ItemState(item).open = true;
			position++;
		} else {
			var boundary = this.Hierarchy().Get(entry.path[position + 1]);
			if (!boundary || !level.HasChildBoundary(boundary.Id)) {
				valid = false;
			} else {
				var type = level.Type(item, boundary);
				if (position + 2 === entry.path.length) {
					type.open = !!entry.open;
					type.SetCheckedFids(entry.checked);
				}
				level = type;
				position += 2;
			}
		}
	}
};
