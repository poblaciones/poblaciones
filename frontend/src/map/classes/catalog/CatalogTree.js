// Estructura del catálogo de indicadores o de delimitaciones tal como la
// entregan GetFabIndicators / GetFabBoundaries: categorías cuyos Items son
// sub-ramas, hojas planas, hojas agrupadas o un diccionario agrupador→hojas.

export default CatalogTree;

function CatalogTree(categories) {
	this.categories = categories;
}

// Clasifica el contenido de un nodo en ramas (navegables) o secciones de hojas.
CatalogTree.prototype.ContentOf = function (node) {
	const items = node.Items;
	// Un nodo con VersionId es un tipo de delimitación seleccionable: sus Items
	// son sus hojas, ya sea planas o agrupadas (formato actual: cada agrupador
	// trae { Id, Name, Code, Items }). En ese caso NO son ramas navegables, sino
	// las secciones (grupos) de la delimitación.
	if (node.VersionId != null) {
		if (Array.isArray(items) && items.length && items[0] && items[0].Items !== undefined) {
			// Agrupadores: una sección por agrupador, con su nombre como cabecera.
			const sections = items.map(g => ({
				Key: (g.Id != null ? String(g.Id) : g.Name), Name: g.Name, Parent: g.Name,
				GroupId: (g.Id != null ? g.Id : null), Code: (g.Code != null ? g.Code : null),
				Items: Array.isArray(g.Items) ? g.Items : [],
			}));
			return { branches: [], sections };
		}
		if (Array.isArray(items)) {
			return { branches: [], sections: [{ Key: '_all', Name: '', Parent: null, Items: items }] };
		}
	}
	if (Array.isArray(items)) {
		if (items.length && items[0] && items[0].Items !== undefined) {
			return { branches: items, sections: [] }; // sub-categorías navegables
		}
		return { branches: [], sections: [{ Key: '_all', Name: '', Parent: null, Items: items }] };
	}
	if (items && typeof items === 'object') {
		// Formato anterior: diccionario { nombreGrupo: [hojas] }.
		const sections = Object.keys(items).map(parent => ({
			Key: parent, Name: parent, Parent: parent, Items: items[parent],
		}));
		return { branches: [], sections };
	}
	return { branches: [], sections: [] };
};

// Una delimitación es una rama cuyos hijos son elementos (hojas), no más
// sub-ramas. Distingue boundaries reales (Provincias, Municipios) de los
// agrupadores de tipo (Límites políticos) y de las hojas sueltas.
CatalogTree.prototype.IsDelimitation = function (node) {
	const content = this.ContentOf(node);
	return content.branches.length === 0 && content.sections.some(function (s) {
		return s.Items && s.Items.length;
	});
};

// Todas las hojas bajo `node` (o de todo el catálogo si es null), cada una con
// su contenedor directo (el "tipo") para subtítulo e ícono.
CatalogTree.prototype.Leaves = function (node) {
	const out = [];
	this.collectLeaves(node ? [node] : this.categories, out);
	return out;
};

// Todas las ramas navegables bajo `node` (o de todo el catálogo si es null),
// con su padre y profundidad, para poder entrar en ellas desde la búsqueda.
CatalogTree.prototype.Branches = function (node) {
	const out = [];
	this.collectBranches(node ? [node] : this.categories, null, out, 0);
	return out;
};

// Cantidad de hijos directos: sub-categorías si es una rama, hojas si es un
// nivel de hojas (planas o agrupadas por separador). No desciende a través de
// las ramas. Las ramas cuentan con el sustantivo genérico ("2 delimitaciones");
// los niveles de hojas, con el nombre del propio nodo si nounFromNodeName
// ("24 provincias") o con el genérico si no.
CatalogTree.prototype.BranchLabel = function (node, noun, nounPlural, nounFromNodeName) {
	const content = this.ContentOf(node);
	if (content.branches.length) {
		const n = content.branches.length;
		return n + ' ' + (n === 1 ? noun : nounPlural);
	}
	const n = content.sections.reduce((a, s) => a + s.Items.length, 0);
	if (nounFromNodeName && node.Name) {
		return n + ' ' + node.Name.toLowerCase();
	}
	return n + ' ' + (n === 1 ? noun : nounPlural);
};

// Subtítulo: Subtitle si lo provee el backend; años (indicadores) o
// "Parent > Tipo" (regiones; Tipo = nombre del contenedor directo).
CatalogTree.prototype.ItemSubtitle = function (item, container) {
	if (item.Subtitle != null) return item.Subtitle;
	if (item.Versions && item.Versions.length) return item.Versions.map(v => v.Name).join(', ');
	if (item.Parent) return item.Parent + (container && container.Name ? ' > ' + container.Name : '');
	return '';
};

CatalogTree.prototype.collectLeaves = function (nodes, out) {
	for (const node of nodes) {
		const content = this.ContentOf(node);
		if (content.branches.length) {
			this.collectLeaves(content.branches, out);
		} else {
			for (const section of content.sections) {
				for (const item of section.Items) out.push({ item, container: node });
			}
		}
	}
};

CatalogTree.prototype.collectBranches = function (nodes, parent, out, depth) {
	for (const node of nodes) {
		const content = this.ContentOf(node);
		const hasBranches = content.branches.length > 0;
		const hasLeaves = content.sections.some(s => s.Items && s.Items.length);
		// Un nodo es navegable si contiene algo: sub-ramas u hojas. Incluye tanto
		// los agrupadores mayores (p. ej. "Límites políticos", que agrupa
		// delimitaciones) como los contenedores de hojas (p. ej. "Departamentos").
		if (hasBranches || hasLeaves) {
			out.push({ branch: node, parent: parent, depth: depth });
		}
		if (hasBranches) {
			this.collectBranches(content.branches, node, out, depth + 1);
		}
	}
};
