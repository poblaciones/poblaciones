/**
 * boundaryTree.js — resuelve delimitaciones a partir del árbol de GetFabBoundaries
 * ya cargado en window.Context.Boundaries, evitando la llamada GetRegion.
 *
 * Estructura del árbol (GetFabBoundaries):
 *   [ { Id: null, Name: "Límites políticos", Items: [
 *        { Id: 1, Name: "Provincias", VersionId: 26, Items: [ {Id, Name, Population}, ... ] },
 *        { Id: 2, Name: "Municipios", VersionId: 20, Items: { "Buenos Aires": [ {Id, Name, Parent, Population}, ... ], ... } }
 *     ] } ]
 *
 * El FID de cada hoja es su Id (confirmado). Un nodo "tipo" (delimitación
 * seleccionable) es el que tiene VersionId y cuyos Items son hojas (planas o
 * agrupadas por Parent), no sub-categorías navegables.
 */

// Busca recursivamente el nodo "tipo" cuyo Id coincide (comparación laxa).
export function findBoundaryNode(boundaryId, nodes) {
	nodes = nodes || (window.Context ? window.Context.Boundaries : []);
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		/* eslint-disable-next-line eqeqeq */
		if (node.VersionId != null && node.Id == boundaryId) {
			return node;
		}
		// Sub-categorías navegables: Items es un array cuyos elementos tienen Items.
		if (Array.isArray(node.Items) && node.Items.length && node.Items[0] && node.Items[0].Items !== undefined) {
			var found = findBoundaryNode(boundaryId, node.Items);
			if (found) return found;
		}
	}
	return null;
}

// Aplana las hojas de un nodo "tipo" a items de RegionSet: { FID, Id, Caption, Parent }.
export function flattenLeaves(node) {
	var out = [];
	var items = node.Items;
	if (Array.isArray(items)) {
		for (var i = 0; i < items.length; i++) {
			out.push(toLeaf(items[i], null));
		}
	} else if (items && typeof items === 'object') {
		var parents = Object.keys(items);
		for (var p = 0; p < parents.length; p++) {
			var arrp = items[parents[p]];
			for (var j = 0; j < arrp.length; j++) {
				out.push(toLeaf(arrp[j], parents[p]));
			}
		}
	}
	return out;
}

function toLeaf(item, groupParent) {
	return {
		FID: item.Id,
		Id: item.Id,
		Caption: item.Name,
		Parent: (item.Parent != null ? item.Parent : groupParent),
		Population: item.Population
	};
}

// Devuelve { node, versionId, name, items } para un boundaryId, o null si no existe.
export function resolveBoundary(boundaryId) {
	var node = findBoundaryNode(boundaryId);
	if (!node) return null;
	return {
		node: node,
		versionId: node.VersionId,
		name: node.Name,
		items: flattenLeaves(node)
	};
}

export default { findBoundaryNode, flattenLeaves, resolveBoundary };
