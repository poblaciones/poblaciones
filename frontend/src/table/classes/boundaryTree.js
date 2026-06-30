/**
 * boundaryTree.js — resuelve delimitaciones a partir del árbol de GetFabBoundaries
 * ya cargado en window.Context.Boundaries, evitando la llamada GetRegion.
 *
 * Estructura del árbol (GetFabBoundaries):
 *   [ { Id: null, Name: "Límites políticos", Items: [
 *        { Id: 1, Name: "Provincias", VersionId: 26, Items: [ {Id, Name, Population, Code}, ... ] },
 *        { Id: 2, Name: "Departamentos", VersionId: 25, Items: [
 *            { Id: <grupoId>, Name: "Buenos Aires", Code: "02", Items: [ {Id, Name, Population, Code}, ... ] },
 *            ...
 *        ] }
 *     ] } ]
 *
 * Las hojas de un nodo "tipo" pueden venir:
 *   - planas: Items es un array de hojas (sin Items propio).
 *   - agrupadas (formato actual): Items es un array de agrupadores, cada uno con
 *     { Id, Name, Code, Items: [hojas] }. El agrupador tiene Id y Code propios,
 *     que se propagan a sus hojas para poder referenciarlo y exportar su código.
 *   - agrupadas (formato anterior): Items es un diccionario { "<nombre grupo>":
 *     [hojas] }; el grupo es solo texto, sin Id ni Code.
 *
 * El FID de cada hoja es su Id (confirmado). Un nodo "tipo" (delimitación
 * seleccionable) es el que tiene VersionId.
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
		// Sub-categorías navegables: nodos SIN VersionId cuyos Items son a su vez
		// nodos navegables. Se distinguen de los agrupadores de hojas (que cuelgan
		// de un nodo tipo, el cual sí tiene VersionId) porque acá el nodo padre no
		// tiene VersionId.
		if (node.VersionId == null && Array.isArray(node.Items) && node.Items.length &&
				node.Items[0] && node.Items[0].Items !== undefined) {
			var found = findBoundaryNode(boundaryId, node.Items);
			if (found) return found;
		}
	}
	return null;
}

// ¿El array de Items son agrupadores (formato actual)? Un agrupador tiene Items
// propios (sus hojas). Una hoja, no.
function isGroupedList(items) {
	return Array.isArray(items) && items.length && items[0] && items[0].Items !== undefined;
}

// Aplana las hojas de un nodo "tipo" a items de RegionSet:
// { FID, Id, Caption, Parent, ParentId, ParentCode, Population, Code }.
export function flattenLeaves(node) {
	var out = [];
	var items = node.Items;
	if (isGroupedList(items)) {
		// Formato actual: lista de agrupadores con Id/Name/Code/Items.
		for (var g = 0; g < items.length; g++) {
			var group = items[g];
			var leaves = Array.isArray(group.Items) ? group.Items : [];
			for (var k = 0; k < leaves.length; k++) {
				out.push(toLeaf(leaves[k], group.Name, group.Id, group.Code));
			}
		}
	} else if (Array.isArray(items)) {
		// Hojas planas (sin agrupador).
		for (var i = 0; i < items.length; i++) {
			out.push(toLeaf(items[i], null, null, null));
		}
	} else if (items && typeof items === 'object') {
		// Formato anterior: diccionario { nombreGrupo: [hojas] }, sin Id ni Code.
		var parents = Object.keys(items);
		for (var p = 0; p < parents.length; p++) {
			var arrp = items[parents[p]];
			for (var j = 0; j < arrp.length; j++) {
				out.push(toLeaf(arrp[j], parents[p], null, null));
			}
		}
	}
	return out;
}

function toLeaf(item, groupParent, groupId, groupCode) {
	return {
		FID: item.Id,
		Id: item.Id,
		Caption: item.Name,
		Parent: (item.Parent != null ? item.Parent : groupParent),
		ParentId: (item.ParentId != null ? item.ParentId : (groupId != null ? groupId : null)),
		ParentCode: (groupCode != null ? groupCode : null),
		Population: item.Population,
		Code: (item.Code != null ? item.Code : null)
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
