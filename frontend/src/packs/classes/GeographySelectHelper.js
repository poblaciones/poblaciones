// Ordena una lista de Geography para selects agrupados por RootCaption,
// replicando el mismo criterio que CodesSelection.vue (georreferencia de
// datasets, en backoffice): recorre cada árbol en profundidad (raíz,
// luego sus hijos recursivamente) y hereda el RootCaption del nodo raíz a
// todos sus descendientes, para que la agrupación por RootCaption de
// mp-select también agrupe bien a los niveles internos (que en el listado
// original no necesariamente traen su propio RootCaption poblado).
function ResolveRootCaptions(list) {
	var ret = [];
	// Marca a los que tienen padre y a la vez traen RootCaption propio
	// (raíces "promovidas") para tratarlas en un segundo grupo, al final.
	for (var n = 0; n < list.length; n++) {
		if (list[n].RootCaption !== null && list[n].ParentId !== null) {
			list[n].ParentId = 0;
		}
	}
	for (var n = 0; n < list.length; n++) {
		if (list[n].ParentId === null) {
			classifyChildrenRecursive(ret, list[n], list, list[n]);
		}
	}
	for (var n = 0; n < list.length; n++) {
		if (list[n].ParentId === 0) {
			classifyChildrenRecursive(ret, list[n], list, list[n]);
		}
	}
	return ret;
}

function classifyChildrenRecursive(ret, root, list, promotedParent) {
	ret.push(promotedParent);
	for (var n = 0; n < list.length; n++) {
		if (list[n].ParentId === promotedParent.Id) {
			list[n].RootCaption = root.RootCaption;
			classifyChildrenRecursive(ret, root, list, list[n]);
		}
	}
}

export default {
	ResolveRootCaptions,
};
