/**
 * BoundaryHierarchy — jerarquía de las delimitaciones del catálogo
 * (GetFabBoundaries).
 *
 * Dos fuentes, con este orden de prevalencia:
 *   1. La agrupación declarada en la delimitación (bou_gropup_by_parent, que
 *      llega como UseParent): sus items vienen agrupados por su padre, y la
 *      delimitación solo tiene sentido debajo de él (Departamentos por
 *      provincia, Barrios por aglomerado). Se ofrece únicamente como hija de la
 *      delimitación cuyos items coinciden con esos padres, por id, código o
 *      nombre (el padre puede ser de otra versión de esa delimitación).
 *   2. Los ancestros de cada item (cli_parent_id): una delimitación sin
 *      agrupación declarada se ofrece además como hija de las delimitaciones
 *      que contienen a sus ancestros (p. ej. Aglomerados dentro de Provincias).
 *
 * Son raíces las delimitaciones sin agrupación declarada, y las que la declaran
 * pero cuyos padres no se encuentran en el catálogo.
 *
 * Vive en el contexto (window.Context.BoundaryHierarchy): es un catálogo que la
 * pivot consulta pero no posee. Los objetos de delimitación y sus listas de items
 * se congelan para que Vue no los observe (son grandes y no cambian).
 */
import { flattenLeaves, listBoundaryNodes } from './boundaryTree.js';

export default BoundaryHierarchy;

function BoundaryHierarchy(nodes, defaultRootId) {
	this.Boundaries = [];
	this.defaultRootId = (defaultRootId != null ? defaultRootId : null);
	this._byId = {};
	this._ownersByFid = {};
	this._ancestorBoundaries = {};
	this._declared = {};
	this._itemsByAncestor = {};
	this._childrenCache = {};
	this._load(nodes || []);
}

BoundaryHierarchy.prototype._load = function (nodes) {
	var typeNodes = listBoundaryNodes(nodes);
	for (var i = 0; i < typeNodes.length; i++) {
		var node = typeNodes[i].node;
		var items = Object.freeze(flattenLeaves(node));
		var boundary = Object.freeze({
			Id: node.Id,
			Name: node.Name,
			VersionId: node.VersionId,
			Group: typeNodes[i].group,
			UseParent: isTrue(node.UseParent),
			Items: items
		});
		this.Boundaries.push(boundary);
		this._byId[boundary.Id] = boundary;
		for (var n = 0; n < items.length; n++) {
			var owners = this._ownersByFid[items[n].FID];
			if (!owners) {
				owners = [];
				this._ownersByFid[items[n].FID] = owners;
			}
			owners.push(boundary);
		}
	}
	for (var b = 0; b < this.Boundaries.length; b++) {
		var current = this.Boundaries[b];
		this._ancestorBoundaries[current.Id] = this._resolveAncestorBoundaries(current);
		if (current.UseParent) {
			var declared = this._resolveDeclaredParent(current);
			if (declared) {
				this._declared[current.Id] = declared;
			}
		}
	}
};

function isTrue(value) {
	return value === true || value === 1 || value === '1';
}

BoundaryHierarchy.prototype._resolveAncestorBoundaries = function (boundary) {
	var ids = {};
	for (var i = 0; i < boundary.Items.length; i++) {
		var ancestors = boundary.Items[i].Ancestors;
		for (var a = 0; a < ancestors.length; a++) {
			var owners = this._ownersByFid[ancestors[a]] || [];
			for (var o = 0; o < owners.length; o++) {
				if (owners[o].Id !== boundary.Id) {
					ids[owners[o].Id] = true;
				}
			}
		}
	}
	return ids;
};

// Padre declarado de una delimitación agrupada: la delimitación cuyos items
// coinciden con más agrupadores. Devuelve { parent, childrenByFid, parentByFid }
// o null si ningún agrupador coincide.
BoundaryHierarchy.prototype._resolveDeclaredParent = function (boundary) {
	var families = familiesOf(boundary);
	var best = null;
	for (var c = 0; c < this.Boundaries.length; c++) {
		var candidate = this.Boundaries[c];
		if (candidate.Id !== boundary.Id) {
			var matches = matchFamilies(families, indexByKeys(candidate));
			if (matches.count > 0 && (best === null || matches.count > best.count)) {
				best = { parent: candidate, count: matches.count, itemByFamily: matches.itemByFamily };
			}
		}
	}
	if (best === null) {
		return null;
	}
	var childrenByFid = {};
	var parentByFid = {};
	for (var f = 0; f < families.length; f++) {
		var parentItem = best.itemByFamily[f];
		if (parentItem) {
			var list = childrenByFid[parentItem.FID];
			if (!list) {
				list = [];
				childrenByFid[parentItem.FID] = list;
			}
			for (var k = 0; k < families[f].items.length; k++) {
				list.push(families[f].items[k]);
				parentByFid[families[f].items[k].FID] = parentItem;
			}
		}
	}
	return { parent: best.parent, childrenByFid: childrenByFid, parentByFid: parentByFid };
};

// Agrupadores de una delimitación (el padre de cada item, con su id, código y
// nombre), con los items de cada uno.
function familiesOf(boundary) {
	var families = [];
	var byKey = {};
	for (var i = 0; i < boundary.Items.length; i++) {
		var item = boundary.Items[i];
		if (item.ParentId != null || item.Parent != null) {
			var key = item.ParentId + '|' + item.Parent;
			var family = byKey[key];
			if (!family) {
				family = { id: item.ParentId, code: item.ParentCode, name: item.Parent, items: [] };
				byKey[key] = family;
				families.push(family);
			}
			family.items.push(item);
		}
	}
	return families;
}

function indexByKeys(boundary) {
	var index = { byFid: {}, byCode: {}, byName: {} };
	for (var i = 0; i < boundary.Items.length; i++) {
		var item = boundary.Items[i];
		index.byFid[item.FID] = item;
		if (item.Code != null && item.Code !== '') {
			index.byCode[item.Code] = item;
		}
		index.byName[normalizeText(item.Caption)] = item;
	}
	return index;
}

function matchFamilies(families, index) {
	var itemByFamily = [];
	var count = 0;
	for (var f = 0; f < families.length; f++) {
		var family = families[f];
		var match = null;
		if (family.id != null && index.byFid[family.id]) {
			match = index.byFid[family.id];
		} else if (family.code != null && family.code !== '' && index.byCode[family.code]) {
			match = index.byCode[family.code];
		} else if (family.name != null && index.byName[normalizeText(family.name)]) {
			match = index.byName[normalizeText(family.name)];
		}
		itemByFamily.push(match);
		if (match) {
			count++;
		}
	}
	return { count: count, itemByFamily: itemByFamily };
}

BoundaryHierarchy.prototype.Get = function (boundaryId) {
	return this._byId[boundaryId] || null;
};

BoundaryHierarchy.prototype.IsRoot = function (boundaryId) {
	return !this._declared[boundaryId];
};

BoundaryHierarchy.prototype.RootBoundaries = function () {
	var roots = [];
	for (var i = 0; i < this.Boundaries.length; i++) {
		if (this.IsRoot(this.Boundaries[i].Id)) {
			roots.push(this.Boundaries[i]);
		}
	}
	return roots;
};

// Raíz con la que arranca la tabla: la configurada por defecto si es raíz; si no,
// la primera raíz del catálogo.
BoundaryHierarchy.prototype.DefaultRoot = function () {
	var configured = this.Get(this.defaultRootId);
	if (configured && this.IsRoot(configured.Id)) {
		return configured;
	}
	var roots = this.RootBoundaries();
	if (roots.length) {
		return roots[0];
	}
	return null;
};

// Delimitaciones que se ofrecen debajo de un elemento de boundaryId, en el orden
// del catálogo: las agrupadas que la declaran como padre y las no agrupadas que
// la tienen entre sus ancestros.
BoundaryHierarchy.prototype.ChildBoundaries = function (boundaryId) {
	if (this._childrenCache[boundaryId]) {
		return this._childrenCache[boundaryId];
	}
	var children = [];
	for (var i = 0; i < this.Boundaries.length; i++) {
		var candidate = this.Boundaries[i];
		if (candidate.Id !== boundaryId && this._isChildOf(candidate, boundaryId)) {
			children.push(candidate);
		}
	}
	this._childrenCache[boundaryId] = children;
	return children;
};

BoundaryHierarchy.prototype._isChildOf = function (candidate, boundaryId) {
	var declared = this._declared[candidate.Id];
	if (declared) {
		/* eslint-disable-next-line eqeqeq */
		return declared.parent.Id == boundaryId;
	}
	if (candidate.UseParent) {
		return false;
	}
	return this._ancestorBoundaries[candidate.Id][boundaryId] === true;
};

// Items de una delimitación que cuelgan del item parentFid.
BoundaryHierarchy.prototype.ChildItems = function (boundaryId, parentFid) {
	var declared = this._declared[boundaryId];
	if (declared) {
		return declared.childrenByFid[parentFid] || [];
	}
	var index = this._itemsByAncestor[boundaryId];
	if (!index) {
		index = this._indexByAncestor(this.Get(boundaryId));
		this._itemsByAncestor[boundaryId] = index;
	}
	return index[parentFid] || [];
};

BoundaryHierarchy.prototype._indexByAncestor = function (boundary) {
	var index = {};
	for (var i = 0; i < boundary.Items.length; i++) {
		var item = boundary.Items[i];
		for (var a = 0; a < item.Ancestors.length; a++) {
			var list = index[item.Ancestors[a]];
			if (!list) {
				list = [];
				index[item.Ancestors[a]] = list;
			}
			list.push(item);
		}
	}
	return index;
};

BoundaryHierarchy.prototype.ItemOf = function (boundaryId, fid) {
	var boundary = this.Get(boundaryId);
	if (!boundary) {
		return null;
	}
	for (var i = 0; i < boundary.Items.length; i++) {
		/* eslint-disable-next-line eqeqeq */
		if (boundary.Items[i].FID == fid) {
			return boundary.Items[i];
		}
	}
	return null;
};

// Primera delimitación del catálogo que contiene el item, con preferencia por las
// raíces (un mismo item puede estar en más de una delimitación).
BoundaryHierarchy.prototype.Locate = function (fid) {
	var owners = this._ownersByFid[fid] || [];
	if (!owners.length) {
		return null;
	}
	var chosen = owners[0];
	for (var i = 0; i < owners.length; i++) {
		if (this.IsRoot(owners[i].Id)) {
			chosen = owners[i];
			break;
		}
	}
	return { boundary: chosen, item: this.ItemOf(chosen.Id, fid) };
};

// Cadena desde una raíz hasta el item: [{ boundary, item }, ...]. Una delimitación
// agrupada sube por su padre declarado; una raíz es la cadena misma.
BoundaryHierarchy.prototype.ChainFor = function (boundaryId, fid) {
	var boundary = this.Get(boundaryId);
	var item = this.ItemOf(boundaryId, fid);
	if (!boundary || !item) {
		return [];
	}
	var self = { boundary: boundary, item: item };
	var declared = this._declared[boundary.Id];
	if (declared && declared.parentByFid[item.FID]) {
		var upper = this.ChainFor(declared.parent.Id, declared.parentByFid[item.FID].FID);
		upper.push(self);
		return upper;
	}
	return [self];
};

// Cadena para el primer id de la lista que esté en el catálogo. Sirve para un
// lugar que llega con sus ancestros (p. ej. desde el visor): si el item no forma
// parte de ninguna delimitación, se usa el ancestro más cercano que sí.
BoundaryHierarchy.prototype.ChainForCandidates = function (fids) {
	for (var i = 0; i < fids.length; i++) {
		var located = this.Locate(fids[i]);
		if (located) {
			return this.ChainFor(located.boundary.Id, located.item.FID);
		}
	}
	return [];
};

// Delimitaciones alcanzables desde una raíz (ella y todas las que se ofrecen por
// debajo, en cualquier nivel).
BoundaryHierarchy.prototype.Descendants = function (rootBoundaryId) {
	var root = this.Get(rootBoundaryId);
	var out = [];
	if (!root) {
		return out;
	}
	var seen = {};
	var pending = [root];
	while (pending.length) {
		var current = pending.shift();
		if (!seen[current.Id]) {
			seen[current.Id] = true;
			out.push(current);
			var children = this.ChildBoundaries(current.Id);
			for (var c = 0; c < children.length; c++) {
				pending.push(children[c]);
			}
		}
	}
	return out;
};

export function normalizeText(text) {
	return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
