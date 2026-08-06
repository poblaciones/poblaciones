const str = require('@/common/framework/str');
const date = require('@/common/framework/date');

// Funciones puras de soporte para MpGrid: resolución de tipos de columna,
// comparación, búsqueda con ancestros y aplanado jerárquico para el
// renderizado. No dependen de Vue y no mutan los ítems recibidos.
// Los métodos del módulo siguen la convención de arr/str/date (PascalCase);
// las claves de los objetos de columna/acción que declara quien usa la
// grilla van en minúscula, como el resto de las props de un componente.
module.exports = {

	GetColumnDef(columns, property) {
		for (var i = 0; i < columns.length; i++) {
			if (columns[i].property === property) {
				return columns[i];
			}
		}
		return null;
	},

	// El tipo de dato declarado en sortType, o el inferido a partir del
	// primer valor no nulo presente en la lista (recorriendo también los
	// hijos si corresponde). Se usa solo para comparar al ordenar, nunca
	// para decidir cómo se renderiza la columna. Las fechas siempre
	// requieren declaración explícita: como suelen llegar serializadas
	// como texto, no hay forma de distinguirlas de una columna de texto
	// común.
	ResolveSortType(column, items, childrenProperty) {
		if (column.sortType) {
			return column.sortType;
		}
		var value = this.FindFirstValue(items, column.property, childrenProperty);
		if (typeof value === 'boolean') {
			return 'boolean';
		}
		if (typeof value === 'number') {
			return 'number';
		}
		return 'text';
	},

	// Un valor de columna puede ser fijo o una función (item) => valor;
	// esto resuelve cualquiera de las dos formas.
	ResolveValue(value, item) {
		if (typeof value === 'function') {
			return value(item);
		}
		return value;
	},

	// property admite notación de punto ('Group.Caption') para leer una
	// propiedad de una propiedad, sin necesidad de declarar una función
	// value(item) para el caso simple de un solo nivel de anidamiento.
	GetNestedValue(item, property) {
		if (property.indexOf('.') === -1) {
			return item[property];
		}
		var parts = property.split('.');
		var value = item;
		for (var i = 0; i < parts.length && value !== null && value !== undefined; i++) {
			value = value[parts[i]];
		}
		return value;
	},

	FindFirstValue(items, property, childrenProperty) {
		for (var i = 0; i < items.length; i++) {
			var value = this.GetNestedValue(items[i], property);
			if (value !== null && value !== undefined) {
				return value;
			}
			if (childrenProperty) {
				var children = items[i][childrenProperty];
				if (Array.isArray(children) && children.length > 0) {
					var childValue = this.FindFirstValue(children, property, childrenProperty);
					if (childValue !== null && childValue !== undefined) {
						return childValue;
					}
				}
			}
		}
		return null;
	},

	ToDate(value) {
		if (value instanceof Date) {
			return value;
		}
		return date.DeserializeDate(value);
	},

	FormatValue(value, type) {
		if (value === null || value === undefined || value === '') {
			return '';
		}
		if (type === 'boolean') {
			return value ? 'Sí' : 'No';
		}
		if (type === 'date') {
			return date.FormateDateTime(this.ToDate(value));
		}
		return value;
	},

	// Valor de comparación de un ítem para una columna: el que provee
	// sortValue si está definida, o el valor directo de property (admite
	// notación de punto). Distinto del valor mostrado: sortValue existe
	// solo para ordenar.
	GetSortValue(column, item) {
		if (column.sortValue) {
			return column.sortValue(item);
		}
		return this.GetNestedValue(item, column.property);
	},

	CompareByColumn(a, b, column, type) {
		var valueA = this.GetSortValue(column, a);
		var valueB = this.GetSortValue(column, b);
		if (valueA === valueB) {
			return 0;
		}
		if (valueA === null || valueA === undefined) {
			return -1;
		}
		if (valueB === null || valueB === undefined) {
			return 1;
		}
		if (type === 'date') {
			return this.ToDate(valueA).getTime() - this.ToDate(valueB).getTime();
		} else if (type === 'number') {
			return valueA - valueB;
		} else if (type === 'boolean') {
			return valueA === valueB ? 0 : (valueA ? 1 : -1);
		} else {
			valueA = (valueA === null || valueA === undefined ? '' : '' + valueA);
			valueB = (valueB === null || valueB === undefined ? '' : '' + valueB);
			return str.humanCompare(valueA.trim(), valueB.trim());
		}
	},

	// El valor coincide con el término si cada palabra del término es
	// prefijo de alguna palabra del valor, ignorando acentos y mayúsculas.
	// Así 'edu' coincide con 'nivel educativo' pero no con 'medusa', y
	// 'edu niv' coincide con 'nivel educativo' (cada palabra se evalúa por
	// separado, no como bloque).
	MatchesCaption(value, term) {
		if (value === null || value === undefined) {
			return false;
		}
		var valueWords = this.NormalizeForSearch(value).split(' ');
		var termWords = this.NormalizeForSearch(term).split(' ');
		for (var t = 0; t < termWords.length; t++) {
			if (termWords[t] === '') {
				continue;
			}
			if (!this.AnyWordStartsWith(valueWords, termWords[t])) {
				return false;
			}
		}
		return true;
	},
	NormalizeForSearch(text) {
		var normalized = str.removeAccents(str.AnyToLower(text));
		// Cualquier carácter que no sea letra o dígito actúa como
		// separador de palabra, igual que el espacio (no se descarta
		// ninguna letra, solo se separan): '>Rosario' o '-Rosario' quedan
		// como la palabra 'rosario', sin habilitar coincidencias a mitad de
		// una palabra real como 'medusa'.
		return normalized.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
	},
	AnyWordStartsWith(words, prefix) {
		for (var i = 0; i < words.length; i++) {
			if (words[i].indexOf(prefix) === 0) {
				return true;
			}
		}
		return false;
	},

	// Si el ícono es de Font Awesome (viene con el prefijo de estilo, p. ej.
	// 'fas fa-history' o 'fa fa-history') o de Material (cualquier otro
	// caso, p. ej. 'lock'). No hace falta declararlo aparte: se infiere del
	// propio string.
	IsFontAwesome(icon) {
		return typeof icon === 'string' && (icon.indexOf('fas ') === 0 || icon.indexOf('fa ') === 0);
	},

	// Íconos satélite condicionales de una columna type: 'status' (los que
	// acompañan al ícono principal, sin texto, solo tooltip).
	ResolveBadges(icons, item) {
		var result = [];
		for (var i = 0; i < (icons || []).length; i++) {
			var badge = icons[i];
			if (badge.show && !badge.show(item)) {
				continue;
			}
			var icon = this.ResolveValue(badge.icon, item);
			result.push({
				icon: icon,
				isFontAwesome: this.IsFontAwesome(icon),
				tooltip: badge.tooltip ? this.ResolveValue(badge.tooltip, item) : null,
			});
		}
		return result;
	},

	// Íconos en línea de una columna type: 'icons' (cada uno con ícono,
	// texto y tooltip opcionales). Los que llevan texto se separan con
	// coma entre sí; los que no llevan texto (p. ej. un ícono de estado
	// con solo tooltip) van pegados, sin separador.
	ResolveInlineIcons(icons, item) {
		var result = [];
		var sawText = false;
		for (var i = 0; i < (icons || []).length; i++) {
			var badge = icons[i];
			if (badge.show && !badge.show(item)) {
				continue;
			}
			var hasText = badge.text !== undefined && badge.text !== null;
			var text = hasText ? this.ResolveValue(badge.text, item) : null;
			var icon = this.ResolveValue(badge.icon, item);
			result.push({
				icon: icon,
				isFontAwesome: this.IsFontAwesome(icon),
				text: text,
				tooltip: badge.tooltip ? this.ResolveValue(badge.tooltip, item) : null,
				leadingSeparator: hasText && sawText,
			});
			if (hasText) {
				sawText = true;
			}
		}
		return result;
	},

	// Recorre un nivel de ítems: ordena a los hermanos entre sí y, bajo
	// búsqueda, descarta los que ni matchean ni tienen descendientes que
	// matcheen. No aplana: cada nodo conserva su lista de hijos ya filtrados
	// y ordenados (matchingChildren), para poder paginar sobre la raíz antes
	// de aplanar.
	FilterAndSortLevel(items, opts) {
		var sorted = items.slice().sort(opts.comparator);
		var result = [];
		for (var i = 0; i < sorted.length; i++) {
			var item = sorted[i];
			var children = opts.childrenProperty ? item[opts.childrenProperty] : null;
			var hasChildrenData = Array.isArray(children) && children.length > 0;
			var matchingChildren = hasChildrenData ? this.FilterAndSortLevel(children, opts) : [];
			var selfMatch = !opts.search || this.MatchesCaption(this.GetNestedValue(item, opts.captionProperty), opts.search);
			var descendantMatch = matchingChildren.length > 0;
			if (!opts.search || selfMatch || descendantMatch) {
				result.push({
					item: item,
					matchingChildren: matchingChildren,
					selfMatch: selfMatch,
					descendantMatch: descendantMatch,
					hasChildrenData: hasChildrenData,
				});
			}
		}
		return result;
	},

	// Aplana un nivel ya filtrado (ver FilterAndSortLevel) a filas de grilla,
	// indentando según el nivel y respetando expandedIds. Bajo búsqueda, un
	// nodo incluido solo porque algún descendiente matchea se fuerza a
	// mostrarse expandido, para que ese descendiente sea visible; y solo se
	// marca hasChildren si tiene descendientes que efectivamente matchearon
	// (si no, el ícono de expandir no tendría nada para mostrar).
	FlattenLevel(nodes, level, opts) {
		var rows = [];
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			var hasChildrenVisible = opts.search ? node.descendantMatch : node.hasChildrenData;
			var expanded = opts.search
				? (node.descendantMatch || (node.selfMatch && !!opts.expandedIds[node.item.Id]))
				: !!opts.expandedIds[node.item.Id];
			rows.push({ item: node.item, level: level, hasChildren: hasChildrenVisible, expanded: expanded });
			if (hasChildrenVisible && expanded) {
				rows = rows.concat(this.FlattenLevel(node.matchingChildren, level + 1, opts));
			}
		}
		return rows;
	},

	// Ids de ítems con hijos, para expandir la jerarquía completa por
	// defecto (o al pedir "expandir todos").
	CollectExpandableIds(items, childrenProperty) {
		var ret = {};
		this.CollectExpandableIdsInto(items, childrenProperty, ret);
		return ret;
	},
	CollectExpandableIdsInto(items, childrenProperty, ret) {
		for (var i = 0; i < items.length; i++) {
			var children = items[i][childrenProperty];
			if (Array.isArray(children) && children.length > 0) {
				ret[items[i].Id] = true;
				this.CollectExpandableIdsInto(children, childrenProperty, ret);
			}
		}
	},

	// Reconstruye la jerarquía a partir de un listado plano en orden
	// pre-order (padre antes que sus hijos), donde cada ítem trae su
	// profundidad en levelProperty (0 = raíz). Agrega childrenProperty a
	// los ítems que tienen hijos, con sus hijos directos; los ítems no se
	// clonan. Puede llamarse repetidas veces sobre el mismo listado (p.
	// ej. tras recargar datos) sin acumular hijos de corridas anteriores.
	// Devuelve solo los de nivel raíz.
	BuildTreeFromLevels(items, levelProperty, childrenProperty) {
		for (var i = 0; i < items.length; i++) {
			delete items[i][childrenProperty];
		}
		var root = [];
		var stack = [];
		for (var j = 0; j < items.length; j++) {
			var item = items[j];
			var level = item[levelProperty] || 0;
			stack.length = level;
			if (stack.length === 0) {
				root.push(item);
			} else {
				var parent = stack[stack.length - 1];
				if (!parent[childrenProperty]) {
					parent[childrenProperty] = [];
				}
				parent[childrenProperty].push(item);
			}
			stack.push(item);
		}
		return root;
	},
};
