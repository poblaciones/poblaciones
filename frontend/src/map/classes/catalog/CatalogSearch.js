// Búsqueda de ítems y ramas sobre un catálogo (CatalogTree). Cada instancia
// guarda el índice de palabras de sus ítems: conviene crearla una vez por
// catálogo y reutilizarla entre búsquedas.

import CatalogMatcher from './CatalogMatcher';

export default CatalogSearch;

function CatalogSearch(tree) {
	this.tree = tree;
	this.matcher = new CatalogMatcher();
}

// Hojas bajo `node` (o de todo el catálogo si es null) que coinciden con el
// texto, como { item, container }. Primero las que coinciden por nombre o
// código y después las que solo coinciden por palabras clave. Un mismo
// indicador puede figurar en varias categorías (p. ej. "más usados"), por lo
// que se deduplica por Id conservando la primera aparición.
//
// Las coincidencias por keyword llevan además `keywordMatch` en el entry: el
// resultado de CatalogMatcher.KeywordMatch, para que SearchResultRows pueda
// armar el snippet con la palabra que anticipa de qué fue el match.
CatalogSearch.prototype.FindItems = function (text, node) {
	const query = this.matcher.Prepare(text);
	if (!query.Raw) return [];
	const byName = [];
	const byKeywords = [];
	const seen = Object.create(null);
	const leaves = this.tree.Leaves(node);
	for (const entry of leaves) {
		const match = this.matcher.MatchItem(entry.item, query);
		const id = entry.item.Id != null ? entry.item.Id : null;
		if (match && !(id != null && seen[id])) {
			if (id != null) seen[id] = true;
			if (match === CatalogMatcher.MATCH_NAME) {
				byName.push({
					item: entry.item,
					container: entry.container,
					nameMatches: this.matcher.NameMatches(entry.item, query),
					queryWords: query.Words
				});
			} else {
				byKeywords.push({
					item: entry.item,
					container: entry.container,
					keywordMatch: this.matcher.KeywordMatch(entry.item, query),
					queryWords: query.Words
				});
			}
		}
	}
	return byName.concat(byKeywords);
};

// Ramas bajo `node` (o de todo el catálogo si es null) cuyo nombre coincide
// con el texto (p. ej. "Departamentos" al buscar "departamento"), como
// { branch, parent, depth }. Los agrupadores de mayor jerarquía (menor
// profundidad) van primero.
//
// Cada entry lleva además `nameMatches` (palabras del Name del branch que
// coincidieron con el término) y `queryWords`, para que el panel pueda
// resaltar el título de la rama igual que el de las hojas.
CatalogSearch.prototype.FindBranches = function (text, node) {
	const query = this.matcher.Prepare(text);
	if (!query.Raw) return [];
	const found = [];
	const branches = this.tree.Branches(node);
	for (const entry of branches) {
		if (this.matcher.MatchBranch(entry.branch, query)) {
			found.push({
				branch: entry.branch,
				parent: entry.parent,
				depth: entry.depth,
				nameMatches: this.matcher.NameMatches(entry.branch, query),
				queryWords: query.Words
			});
		}
	}
	return found.sort((a, b) => a.depth - b.depth);
};
