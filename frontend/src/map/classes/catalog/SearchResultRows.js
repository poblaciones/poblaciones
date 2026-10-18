// Filas de resultado del panel de búsqueda para los coincidentes del catálogo.
// Tienen la misma forma que los resultados del servidor (Type, Id, Caption,
// Highlighted, Extra), para activar las mismas acciones al seleccionarlos:
// L = indicador, B = delimitación completa, C = región.

export default SearchResultRows;

function SearchResultRows(tree) {
	this.tree = tree;
}

// Cantidad de filas que muestra una sección al principio, y cuántas suma cada
// "Ver más" (la primera expansión llega a PAGE_SIZE).
SearchResultRows.INITIAL_LIMIT = 5;
SearchResultRows.PAGE_SIZE = 100;

SearchResultRows.NextLimit = function (limit) {
	return limit < SearchResultRows.PAGE_SIZE ? SearchResultRows.PAGE_SIZE : limit + SearchResultRows.PAGE_SIZE;
};

// entries: salida de CatalogSearch.FindItems sobre el catálogo de indicadores.
SearchResultRows.prototype.Indicators = function (entries) {
	const rows = [];
	for (const entry of entries) {
		const item = entry.item;
		rows.push({
			Key: 'L|' + item.Id, Type: 'L', Id: String(item.Id),
			Caption: item.Name, Highlighted: this.escape(item.Name),
			Extra: this.tree.ItemSubtitle(item, entry.container)
		});
	}
	return rows;
};

// branches / items: salida de CatalogSearch.FindBranches y FindItems sobre el
// catálogo de delimitaciones. De las ramas solo se ofrecen las delimitaciones
// (agregarlas completas al mapa); los agrupadores no son seleccionables.
SearchResultRows.prototype.Regions = function (branches, items) {
	const rows = [];
	for (const entry of branches) {
		if (this.tree.IsDelimitation(entry.branch)) {
			const node = entry.branch;
			rows.push({
				Key: 'B|' + node.Id, Type: 'B', Id: node.Id,
				Caption: node.Name, Highlighted: this.escape(node.Name),
				Extra: this.tree.BranchLabel(node, 'elemento', 'elementos', true)
			});
		}
	}
	for (const entry of items) {
		const item = entry.item;
		const subtitle = this.tree.ItemSubtitle(item, entry.container);
		rows.push({
			Key: 'C|' + item.Id, Type: 'C', Id: String(item.Id),
			Caption: item.Name, Highlighted: this.escape(item.Name),
			Extra: subtitle || (entry.container.Name || '')
		});
	}
	return rows;
};

SearchResultRows.prototype.escape = function (text) {
	return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
