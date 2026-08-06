<template>
	<div class="mp-grid" :class="{ 'mp-grid-compact': compact }">
		<mp-search v-model="search" @search="onSearchChanged" v-if="items && items.length > 0" class="mp-grid-search" :class="(captionColumn.widthPixels <= 320 ? 'offsetSearch' : '')" />
		<div class="mp-grid-multiselect-overlay" v-if="multiSelectEnabled || hasChildren">
			<transition name="bulk-actions-fade">
				<span v-if="isMultiSelectActive && selectedItems.length > 0" class="bulk-actions-group">
					<span class="selection-count">
						{{ selectedItems.length }} seleccionada{{ selectedItems.length !== 1 ? 's' : '' }}
					</span>
					<md-button
						class="md-icon-button md-dense"
						v-for="(action, ai) in multiSelectActions"
						:key="ai"
						:title="action.caption"
						@click="runAction(action, selectedItems)">
						<md-icon>{{ action.icon }}</md-icon>
						<md-tooltip md-direction="bottom">{{ action.caption }}</md-tooltip>
					</md-button>
				</span>
			</transition>
			<md-button
				v-if="multiSelect === 'optional'"
				class="md-icon-button"
				:class="{ 'md-primary': isMultiSelectActive }"
				:title="isMultiSelectActive ? 'Cancelar selección múltiple (ESC)' : 'Selección múltiple'"
				@click="toggleMultiSelect">
				<md-icon>playlist_add_check</md-icon>
			</md-button>
			<md-button
				v-if="hasChildren"
				class="md-icon-button"
				:title="allExpanded ? 'Colapsar todos' : 'Expandir todos'"
				@click="toggleExpandAll">
				<md-icon>{{ allExpanded ? 'unfold_less' : 'unfold_more' }}</md-icon>
			</md-button>
		</div>

		<div class="mp-grid-table-wrap">
			<md-table
				:key="tableKey"
				v-model="rows"
				:md-sort.sync="sortProperty"
				:md-sort-order.sync="sortOrder"
				:md-sort-fn="identitySort"
				:style="[{ maxWidth: maxWidth }, headerWidthVars]"
				:class="{ 'mp-grid-has-actions': resolvedActions.length > 0, 'mp-grid-empty-table': rows.length === 0 }"
				md-card
				@md-selected="onMdSelected">

			<md-table-row
				slot="md-table-row"
				slot-scope="{ item: row }"
				md-auto-select
				v-bind="isMultiSelectActive ? { 'md-selectable': 'multiple' } : {}">

				<md-table-cell
					:md-label="captionColumn.caption"
					:md-sort-by="captionColumn.sortable ? captionColumn.property : null"
					:style="columnStyle(captionColumn)"
					:class="'align-' + captionColumn.align"
					@click.native="onCellClick(row.item)">
					<span class="mp-grid-indent" :class="row.hasChildren ? 'mp-grid-indent-parent' : 'mp-grid-indent-leaf'" :style="{ paddingLeft: (row.level * 32) + 'px' }">
						<md-button v-if="row.hasChildren" class="md-icon-button md-dense mp-grid-expand-btn" @click.stop="toggleRow(row)">
							<md-icon>{{ row.expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right' }}</md-icon>
						</md-button>
						<a v-if="columnHref(captionColumn, row.item)" :href="columnHref(captionColumn, row.item)" class="normalTextLink" @click.stop>{{ formattedValue(captionColumn, row.item) }}</a>
						<span v-else-if="captionColumn.html" v-html="formattedValue(captionColumn, row.item)"></span>
						<template v-else>{{ formattedValue(captionColumn, row.item) }}</template>
					</span>
					<md-tooltip v-if="columnTooltip(captionColumn, row.item)" md-direction="bottom">{{ columnTooltip(captionColumn, row.item) }}</md-tooltip>
				</md-table-cell>

				<md-table-cell
					v-for="col in middleColumnsResolved"
					:key="col.property"
					:md-label="col.caption"
					:md-sort-by="col.sortable ? col.property : null"
					:style="columnStyle(col)"
					:class="'align-' + col.align"
					@click.native="onCellClick(row.item)">

					<template v-if="col.type === 'status'">
						<i v-if="isFontAwesome(statusIcon(col, row.item))" class="mp-grid-fa-icon mp-grid-status-icon" :class="statusIcon(col, row.item)" :style="statusColor(col, row.item) ? ('color: ' + statusColor(col, row.item)) : ''">
							<md-tooltip v-if="statusTooltip(col, row.item)" md-direction="bottom">{{ statusTooltip(col, row.item) }}</md-tooltip>
						</i>
						<md-icon v-else :style="statusColor(col, row.item) ? ('color: ' + statusColor(col, row.item)) : ''">
							{{ statusIcon(col, row.item) }}
							<md-tooltip v-if="statusTooltip(col, row.item)" md-direction="bottom">{{ statusTooltip(col, row.item) }}</md-tooltip>
						</md-icon>
						<div class="mp-grid-status-badges" v-if="statusBadges(col, row.item).length">
							<template v-for="(badge, bi) in statusBadges(col, row.item)">
								<i v-if="badge.isFontAwesome" :key="bi" class="mp-grid-fa-icon mp-grid-status-badge" :class="badge.icon">
									<md-tooltip v-if="badge.tooltip" md-direction="bottom">{{ badge.tooltip }}</md-tooltip>
								</i>
								<md-icon v-else :key="bi" class="mp-grid-status-badge">
									{{ badge.icon }}
									<md-tooltip v-if="badge.tooltip" md-direction="bottom">{{ badge.tooltip }}</md-tooltip>
								</md-icon>
							</template>
						</div>
					</template>

					<template v-else-if="col.type === 'icons'">
						<span v-for="(badge, bi) in inlineIcons(col, row.item)" :key="bi" class="mp-grid-icon-badge">
							<template v-if="badge.leadingSeparator">, </template>
							<i v-if="badge.isFontAwesome" class="mp-grid-fa-icon" :class="badge.icon"></i>
							<md-icon v-else class="mp-grid-badge-icon">{{ badge.icon }}</md-icon>
							<template v-if="badge.text !== null"> {{ badge.text }}</template>
							<md-tooltip v-if="badge.tooltip" md-direction="bottom">{{ badge.tooltip }}</md-tooltip>
						</span>
					</template>

					<template v-else-if="col.type === 'switch'">
						<md-switch
							class="md-primary"
							v-model="row.item[col.property]"
							:disabled="switchDisabled(col, row.item)"
							@change="onSwitchChange(col, row.item)"
							@click.native.stop />
					</template>

					<template v-else>
						<a v-if="columnHref(col, row.item)" :href="columnHref(col, row.item)" class="normalTextLink" @click.stop>{{ formattedValue(col, row.item) }}</a>
						<span v-else-if="col.html" v-html="formattedValue(col, row.item)"></span>
						<template v-else>{{ formattedValue(col, row.item) }}</template>
						<md-tooltip v-if="columnTooltip(col, row.item)" md-direction="bottom">{{ columnTooltip(col, row.item) }}</md-tooltip>
					</template>

				</md-table-cell>

				<md-table-cell v-if="resolvedActions.length > 0" md-label="Acciones" class="align-left mp-grid-actions-cell" :style="{ width: actionsColumnWidth }">
					<md-button
						v-for="(action, ai) in rowActions(row.item)"
						:key="ai"
						class="md-icon-button"
						:title="actionCaption(action, row.item)"
						@click="runAction(action, row.item)">
						<div v-if="actionBadge(action, row.item)" class="mp-grid-action-badge">{{ actionBadge(action, row.item) }}</div>
						<md-icon :style="actionIconStyle(action, row.item)">{{ actionIcon(action, row.item) }}</md-icon>
						<md-tooltip md-direction="bottom">{{ actionCaption(action, row.item) }}</md-tooltip>
					</md-button>
				</md-table-cell>

			</md-table-row>
			</md-table>

			<div class="mp-grid-empty" v-if="rows.length === 0">
				<span class="mp-grid-empty-text">{{ search ? 'No hay elementos que coincidan con la búsqueda.' : emptyMessage }}</span>
			</div>
		</div>

		<div class="mp-grid-pagination-bar" v-if="showPaginationBar">
			<div class="mp-grid-pagination-spacer"></div>

			<div class="mp-grid-pagination-center">
				<md-button class="md-dense mp-grid-nav-btn mp-grid-nav-prev"
									 :class="{ 'mp-grid-nav-hidden': totalPages <= 1 }"
									 :disabled="currentPage === 0"
									 @click="goToPage(currentPage - 1)">
					<span style="padding-right: 6px;
												font-size: 14px;
												font-family: monospace;
										">&lt;</span>
					Anterior
				</md-button>
				<span class="mp-grid-pagination-range">{{ pageRangeLabel }}</span>
				<md-button class="md-dense mp-grid-nav-btn mp-grid-nav-next"
									 :class="{ 'mp-grid-nav-hidden': totalPages <= 1 }"
									 :disabled="currentPage >= totalPages - 1"
									 @click="goToPage(currentPage + 1)">
					Siguiente
										<span style="padding-left: 6px;
												font-size: 14px;
												font-family: monospace;
										">&gt;</span>
				</md-button>
			</div>

			<div class="mp-grid-pagesize">
				<span class="mp-grid-pagesize-label">Mostrar:</span>
				<select
					class="mp-grid-pagesize-select"
					:value="currentPageSize === null ? '' : currentPageSize"
					@change="onPageSizeChange">
					<option v-for="opt in resolvedPageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
					<option value="">Todo</option>
				</select>
			</div>
		</div>

		<invoker ref="invoker" />
	</div>
</template>

<script>

import MpGridHelper from '@/backoffice/components/MpGrid.helper';
import str from '@/common/framework/str';

export default {
	name: 'MpGrid',
	components: {},
	methods: {
		identitySort(value) {
			return value;
		},
		columnStyle(col) {
			return col.width ? { width: col.width } : {};
		},
		formattedValue(col, item) {
			if (col.value) {
				return MpGridHelper.ResolveValue(col.value, item);
			}
			return MpGridHelper.FormatValue(MpGridHelper.GetNestedValue(item, col.property), col.sortType);
		},
		// Tooltip de una columna de texto/switch/icons (no confundir con el
		// tooltip del ícono principal de 'status', que usa statusTooltip).
		columnTooltip(col, item) {
			return col.tooltip ? MpGridHelper.ResolveValue(col.tooltip, item) : null;
		},

		// Un href resuelto es null si la columna no lo define o si la grilla
		// está en selección múltiple (evita navegar mientras se selecciona).
		columnHref(col, item) {
			if (!col.href || this.isMultiSelectActive) {
				return null;
			}
			return MpGridHelper.ResolveValue(col.href, item);
		},
		switchDisabled(col, item) {
			return col.disabled ? MpGridHelper.ResolveValue(col.disabled, item) : false;
		},
		onSwitchChange(col, item) {
			if (col.onChange) {
				col.onChange(item, item[col.property]);
			}
		},
		statusIcon(col, item) {
			return MpGridHelper.ResolveValue(col.icon, item);
		},
		isFontAwesome(icon) {
			return MpGridHelper.IsFontAwesome(icon);
		},
		statusColor(col, item) {
			return col.color ? MpGridHelper.ResolveValue(col.color, item) : null;
		},
		statusTooltip(col, item) {
			return col.tooltip ? MpGridHelper.ResolveValue(col.tooltip, item) : null;
		},
		statusBadges(col, item) {
			return MpGridHelper.ResolveBadges(col.icons, item);
		},
		inlineIcons(col, item) {
			return MpGridHelper.ResolveInlineIcons(col.icons, item);
		},

		comparator(a, b) {
			var column = this.activeSortColumn;
			var result = MpGridHelper.CompareByColumn(a, b, column, column.sortType);
			return this.sortOrder === 'desc' ? -result : result;
		},

		// Recalcula this.rows: busca (con visibilidad de ancestros), ordena
		// dentro de cada nivel de la jerarquía, pagina sobre la raíz y recién
		// entonces aplana. Se invoca explícitamente ante cualquier cambio que
		// afecte el resultado (no es un computed) para no depender de cuándo
		// md-table decide reevaluar md-sort-fn.
		refreshRows() {
			var childrenProperty = this.hasChildren ? 'Items' : null;
			var opts = {
				comparator: this.comparator,
				search: this.search ? str.AnyToLower(this.search) : '',
				captionProperty: this.captionProperty,
				childrenProperty: childrenProperty,
				expandedIds: this.expandedIds,
			};
			var topNodes = MpGridHelper.FilterAndSortLevel(this.items, opts);
			this.rootCount = topNodes.length;
			var pageNodes = topNodes;
			if (this.currentPageSize) {
				var start = this.currentPage * this.currentPageSize;
				pageNodes = topNodes.slice(start, start + this.currentPageSize);
			}
			this.rows = MpGridHelper.FlattenLevel(pageNodes, 0, opts);
		},
		onSearchChanged() {
			this.currentPage = 0;
			this.refreshRows();
		},
		onMdSelected(selectedRows) {
			this.selectedItems = selectedRows.map(function (row) { return row.item; });
		},
		toggleRow(row) {
			if (this.expandedIds[row.item.Id]) {
				this.$delete(this.expandedIds, row.item.Id);
			} else {
				this.$set(this.expandedIds, row.item.Id, true);
			}
			this.refreshRows();
		},
		toggleExpandAll() {
			if (this.allExpanded) {
				this.expandedIds = this.CollapseAllKeepingSingleRoot();
			} else {
				this.expandedIds = MpGridHelper.CollectExpandableIds(this.items, 'Items');
			}
			this.refreshRows();
		},
		// Si la raíz tiene un único elemento con hijos, colapsar 'todo'
		// dejándolo también colapsado deja la lista con una sola fila
		// visible, algo inútil para el usuario: en ese caso se mantiene
		// expandida esa única raíz, y se colapsan sus hijos en cambio.
		CollapseAllKeepingSingleRoot() {
			if (this.items.length === 1) {
				var onlyRoot = this.items[0];
				if (Array.isArray(onlyRoot.Items) && onlyRoot.Items.length > 0) {
					var ret = {};
					ret[onlyRoot.Id] = true;
					return ret;
				}
			}
			return {};
		},
		toggleMultiSelect() {
			this.multiSelectToggled = !this.multiSelectToggled;
			this.tableKey++;
			if (!this.multiSelectToggled) {
				this.selectedItems = [];
			}
		},
		goToPage(page) {
			this.currentPage = page;
			this.refreshRows();
		},
		changePageSize(size) {
			this.currentPageSize = size;
			this.currentPage = 0;
			this.refreshRows();
		},
		// El <option value=""> de "Todo" llega como string vacío.
		onPageSizeChange(event) {
			var value = event.target.value;
			this.changePageSize(value === '' ? null : Number(value));
		},
		rowActions(item) {
			var result = [];
			for (var i = 0; i < this.resolvedActions.length; i++) {
				var action = this.resolvedActions[i];
				if (!action.isEnabled || action.isEnabled(item)) {
					result.push(action);
				}
			}
			return result;
		},
		runAction(action, itemOrItems) {
			action.onClick(this, itemOrItems);
		},
		// icon/caption/iconStyle/badge de una acción pueden ser un valor fijo
		// o una función (item); en el toolbar de selección múltiple, en
		// cambio, se usan tal cual (no hay un único ítem para resolverlos).
		actionIcon(action, item) {
			return MpGridHelper.ResolveValue(action.icon, item);
		},
		actionCaption(action, item) {
			return MpGridHelper.ResolveValue(action.caption, item);
		},
		actionIconStyle(action, item) {
			return action.iconStyle ? MpGridHelper.ResolveValue(action.iconStyle, item) : '';
		},
		actionBadge(action, item) {
			return action.badge ? MpGridHelper.ResolveValue(action.badge, item) : null;
		},

		// En selección múltiple el clic lo gestiona Vue Material (marca/
		// desmarca la fila); fuera de eso, si hay rowClick, navega.
		onCellClick(item) {
			if (!this.isMultiSelectActive && this.rowClick) {
				this.rowClick(this, item);
			}
		},
		handleKeyDown(e) {
			if (e.key === 'Escape' && this.multiSelect === 'optional' && this.multiSelectToggled) {
				this.clearSelection();
			}
		},

		// Método público: las acciones lo reciben a través del primer
		// parámetro de onClick, para poder cerrar la selección múltiple
		// tras completarse (por ejemplo, luego de confirmar un borrado en
		// lote, si la confirmación fue aceptada).
		clearSelection() {
			this.selectedItems = [];
			this.multiSelectToggled = false;
			this.tableKey++;
		},

		// Confirmación de canDelete: no es opcional ni personalizable en el
		// mecanismo (siempre se confirma antes de borrar); lo único que se
		// puede personalizar es el texto, vía deleteConfirmMessage.
		confirmDelete(itemOrItems) {
			var loc = this;
			var items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
			var title = items.length === 1
				? ('Eliminar ' + this.entityName)
				: ('Eliminar ' + items.length + ' ' + str.Plural(this.entityName, items.length));
			var message = this.deleteConfirmMessage ? this.deleteConfirmMessage(itemOrItems) : this.defaultDeleteMessage(items);
			this.$refs.invoker.confirm(title, message, function () {
				if (Array.isArray(itemOrItems)) {
					loc.clearSelection();
				}
				loc.$emit('itemDelete', itemOrItems);
			});
		},
		defaultDeleteMessage(items) {
			if (items.length === 1) {
				var caption = items[0][this.captionProperty];
				return 'Esta acción no puede deshacerse' + (caption ? (': se eliminará \'' + caption + '\'.') : '.');
			}
			return 'Esta acción no puede deshacerse: se eliminarán los ' + items.length + ' '
				+ str.Plural(this.entityName, items.length) + ' seleccionados.';
		},
		// Ancho fijo de una columna intermedia: el declarado por size, o uno
		// ajustado a su contenido esperado (largo del título y, en columnas
		// de íconos, la cantidad que puede llegar a mostrar), para que las
		// de contenido simple —conteos, códigos, booleanos— queden angostas.
		sizeToWidth(size, caption, iconCount) {
			var widths = { 1: '80px', 2: '130px', 3: '180px', 4: '240px', 5: '320px', 6: '400px', 7: '500px' };
			if (size && widths[size]) {
				return widths[size];
			}
			var byCaption = caption ? Math.max(90, Math.min(220, caption.length * 9 + 50)) : 150;
			var byIcons = iconCount ? iconCount * 34 + 60 : 0;
			return Math.max(byCaption, byIcons) + 'px';
		},
	},
	computed: {
		multiSelectEnabled() {
			return this.multiSelect === 'yes' || this.multiSelect === 'optional';
		},
		isMultiSelectActive() {
			return this.multiSelect === 'yes' || this.multiSelectToggled;
		},

		// Si no se indica la prop caption, se toma como columna descriptiva
		// la primera declarada en columns.
		captionProperty() {
			if (this.caption) {
				return this.caption;
			}
			return this.columns.length > 0 ? this.columns[0].property : null;
		},
		captionColumn() {
			var def = MpGridHelper.GetColumnDef(this.columns, this.captionProperty);
			var size = def && def.size;
			var width;
			if (def && def.width) {
				width = def.width + 'px';
			} else if (size) {
				width = this.sizeToWidth(size, null, 0);
			} else {
				width = this.captionWidth;
			}
			var widthPixels = 0;
			if (width) {
				widthPixels = widthPixels = parseInt(width, 10);
			}
			return {
				property: this.captionProperty,
				caption: (def && def.caption) || this.captionProperty,
				align: (def && def.align) || 'left',
				sortable: !def || def.sortable !== false,
				sortValue: (def && def.sortValue) || null,
				width: width,
				widthPixels: widthPixels,
				sortType: 'text',
				type: 'text',
				href: (def && def.href) || null,
				html: (def && def.html) || false,
				tooltip: (def && def.tooltip) || null,
				value: (def && def.value) || null,
			};
		},
		// Resuelve cada columna declarada (salvo la descriptiva) con sus
		// defaults: alineación, ordenamiento, ancho y tipo de dato para
		// comparar. El tipo de RENDERIZADO (type: 'text'/'icons'/'status')
		// y su configuración (icon/color/tooltip/icons/href) se pasan tal
		// cual los declaró quien usa la grilla.
		middleColumnsResolved() {
			var childrenProperty = this.hasChildren ? 'Items' : null;
			var result = [];
			for (var i = 0; i < this.columns.length; i++) {
				var col = this.columns[i];
				if (col.property === this.captionProperty) {
					continue;
				}
				var resolvedCaption = col.caption || col.property;
				var declaredIcons = col.icons || [];
				// En 'status', al ícono principal (icon) se le suman los
				// satélite de icons; en 'icons' están todos en icons.
				var iconCount = 0;
				if (col.type === 'status') {
					iconCount = declaredIcons.length + 1;
				} else if (col.type === 'icons') {
					iconCount = declaredIcons.length;
				}
				result.push({
					property: col.property,
					caption: resolvedCaption,
					align: col.align || 'center',
					sortable: col.sortable !== false,
					sortValue: col.sortValue || null,
					width: col.width ? (col.width + 'px') : this.sizeToWidth(col.size, resolvedCaption, iconCount),
					sortType: MpGridHelper.ResolveSortType(col, this.items, childrenProperty),
					type: col.type || 'text',
					value: col.value || null,
					html: col.html || false,
					href: col.href || null,
					icon: col.icon || null,
					color: col.color || null,
					tooltip: col.tooltip || null,
					disabled: col.disabled || null,
					onChange: col.onChange || null,
					icons: declaredIcons,
				});
			}
			return result;
		},
		allColumns() {
			return [this.captionColumn].concat(this.middleColumnsResolved);
		},
		// Los anchos de columna, expuestos como variables CSS, para poder
		// aplicarlos también al <th> del encabezado: Vue Material lo genera
		// aparte y no hereda el :style que va a las celdas del cuerpo, así
		// que sin esto el header no respeta el ancho (se nota sobre todo sin
		// filas, cuando no hay celdas de cuerpo que lo fijen). El offset
		// contempla la columna de checkboxes de la selección múltiple.
		headerWidthVars() {
			var vars = {};
			var offset = this.isMultiSelectActive ? 1 : 0;
			for (var i = 0; i < this.allColumns.length; i++) {
				if (this.allColumns[i].width) {
					vars['--mp-col-' + (i + 1 + offset) + '-width'] = this.allColumns[i].width;
				}
			}
			if (this.resolvedActions.length > 0) {
				vars['--mp-col-' + (this.allColumns.length + 1 + offset) + '-width'] = this.actionsColumnWidth;
			}
			return vars;
		},
		activeSortColumn() {
			for (var i = 0; i < this.allColumns.length; i++) {
				if (this.allColumns[i].property === this.sortProperty) {
					return this.allColumns[i];
				}
			}
			return this.captionColumn;
		},

		// Acciones personalizadas más, al final, las que arma la propia
		// grilla si canEdit/canDelete están activos.
		resolvedActions() {
			var result = this.actions.slice();
			if (this.canEdit) {
				result.push({
					icon: 'edit',
					caption: 'Editar',
					multiSelect: false,
					isEnabled: this.isItemEditEnabled || null,
					onClick: function (grid, item) { grid.$emit('itemEdit', item); },
				});
			}
			if (this.canDelete) {
				result.push({
					icon: 'delete',
					caption: 'Eliminar',
					multiSelect: true,
					isEnabled: this.isItemDeleteEnabled || null,
					onClick: function (grid, itemOrItems) { grid.confirmDelete(itemOrItems); },
				});
			}
			return result;
		},
		multiSelectActions() {
			var result = [];
			for (var i = 0; i < this.resolvedActions.length; i++) {
				if (this.resolvedActions[i].multiSelect) {
					result.push(this.resolvedActions[i]);
				}
			}
			return result;
		},
		allExpanded() {
			var ids = MpGridHelper.CollectExpandableIds(this.items, 'Items');
			var keys = Object.keys(ids);
			if (keys.length === 0) {
				return false;
			}
			for (var i = 0; i < keys.length; i++) {
				if (!this.expandedIds[keys[i]]) {
					return false;
				}
			}
			return true;
		},
		totalPages() {
			if (!this.currentPageSize) {
				return 1;
			}
			return Math.max(1, Math.ceil(this.rootCount / this.currentPageSize));
		},
		// La barra se oculta si el padre configuró la grilla para no paginar
		// (pageSize null), o si ni siquiera el menor tamaño ofrecido llega a
		// partir la lista (no aportaría nada). Si en cambio lo que pasó es
		// que el usuario eligió "Todo" (currentPageSize null pero pageSize
		// sí definido), la barra se mantiene, para poder volver a paginar.
		showPaginationBar() {
			if (!this.pageSize) {
				return false;
			}
			if (!this.currentPageSize) {
				return true;
			}
			var smallest = this.resolvedPageSizeOptions.length > 0 ? this.resolvedPageSizeOptions[0] : this.currentPageSize;
			return this.rootCount > smallest;
		},
		// Rango de ítems raíz visible en la página actual: "1 a 10 de 151".
		// Con "Todo" elegido (currentPageSize null) se muestran todos.
		pageRangeLabel() {
			if (this.rootCount === 0) {
				return '0 de 0';
			}
			if (!this.currentPageSize) {
				return '1 a ' + this.rootCount + ' de ' + this.rootCount;
			}
			var from = this.currentPage * this.currentPageSize + 1;
			var to = Math.min(this.rootCount, from + this.currentPageSize - 1);
			return from + ' a ' + to + ' de ' + this.rootCount;
		},
		// Opciones de tamaño de página, incluyendo el pageSize inicial aunque
		// no figure en pageSizeOptions, ordenadas y sin repetir.
		resolvedPageSizeOptions() {
			var set = {};
			var result = [];
			var all = this.pageSizeOptions.slice();
			if (this.pageSize) {
				all.push(this.pageSize);
			}
			all.sort(function (a, b) { return a - b; });
			for (var i = 0; i < all.length; i++) {
				if (!set[all[i]]) {
					set[all[i]] = true;
					result.push(all[i]);
				}
			}
			return result;
		},
		// Ancho de la columna de acciones, según la cantidad máxima de íconos
		// que puede mostrar (resolvedActions; rowActions filtra por fila
		// según isEnabled, pero el ancho de la columna es uno solo). La
		// tabla está en table-layout: fixed, así que no puede crecer con su
		// contenido; se dimensiona por el máximo. 40px es el ancho de un
		// md-icon-button, más el padding del container.
		actionsColumnWidth() {
			return Math.max(1, this.resolvedActions.length) * 40 + 20 + 'px';
		},
	},
	mounted() {
		document.addEventListener('keydown', this.handleKeyDown);
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.handleKeyDown);
	},
	created() {
		if (this.settingsKey) {
			this.sortProperty = window.Db.GetUserSetting(this.settingsKey + 'Sort', this.sortProperty);
			this.sortOrder = window.Db.GetUserSetting(this.settingsKey + 'SortOrder', this.sortOrder);
		}
		this.expandedIds = this.hasChildren ? MpGridHelper.CollectExpandableIds(this.items, 'Items') : {};
		this.refreshRows();
	},
	data() {
		return {
			search: '',
			sortProperty: this.defaultSortBy || this.caption || (this.columns.length > 0 ? this.columns[0].property : null),
			sortOrder: this.defaultSortOrder,
			currentPage: 0,
			currentPageSize: this.pageSize,
			expandedIds: {},
			multiSelectToggled: false,
			selectedItems: [],
			tableKey: 0,
			rows: [],
			rootCount: 0,
		};
	},
	props: {
		items: { type: Array, required: true },
		// Nombre de la propiedad de cada ítem que actúa como columna
		// descriptiva: se muestra primero y es la que filtra el buscador.
		// Si se omite, se toma la de la primera columna declarada.
		caption: { type: String, default: null },
		// Definición de columnas (más allá de la descriptiva, que puede o no
		// estar incluida acá: si está, la grilla la saltea al recorrer las
		// demás; y si no declara su propio caption, se usa su property).
		// Común a todas: { property, caption, size, align, sortable,
		// sortType, sortValue, href, tooltip }. href/tooltip valen para
		// cualquier type (incluida la columna descriptiva). property admite
		// notación de punto ('Group.Caption') para leer una propiedad de
		// una propiedad. size (1 a 4) fija el ancho; sin size, una columna
		// intermedia se ajusta a su contenido esperado (largo del título y
		// cantidad de íconos), y la descriptiva toma captionWidth. align
		// alinea el CONTENIDO ('left'/'center'/'right'; default: izquierda
		// en la descriptiva, centro en las demás); el título de columna no
		// lo usa: va siempre centrado salvo el de la primera. Según type,
		// además:
		// - 'text' (default): value(item) opcional para mostrar algo
		//   distinto del valor crudo de property (p. ej. un valor
		//   formateado, o compuesto a partir de varias propiedades); html:
		//   true para insertarlo como HTML en vez de texto plano.
		// - 'switch': un md-switch atado a property (que debe ser boolean).
		//   onChange(item, value) al cambiarlo, para guardar el cambio;
		//   disabled(item) opcional.
		// - 'icons': fila de íconos en línea, cada uno declarado en icons:
		//   [{ icon, text, tooltip, show }]. icon/text/tooltip/show pueden
		//   ser valores fijos o funciones (item). icon es Material Design
		//   ('lock', 'edit', ...) salvo que empiece con 'fas ' o 'fa ', en
		//   cuyo caso se toma como clase de Font Awesome tal cual (p. ej.
		//   'fas fa-history').
		// - 'status': un ícono principal (icon, color, tooltip) más una
		//   lista opcional de íconos satélite condicionales en icons (misma
		//   forma que en 'icons', sin text).
		// Es una lista de objetos (no de strings) para poder sumar
		// propiedades a futuro sin romper la interfaz.
		columns: { type: Array, default: () => [] },
		// { icon, caption, onClick(grid, itemOrItems), multiSelect,
		// isEnabled(item), iconStyle, badge }. icon/caption/iconStyle/badge
		// pueden ser fijos o funciones (item) cuando la acción se muestra
		// por fila; en el toolbar de selección múltiple se usan tal cual,
		// sin resolver contra un ítem. badge es un rótulo corto superpuesto
		// en la esquina del botón (p. ej. un id numérico). Si el array
		// resultante queda vacío, la columna de acciones no se muestra.
		actions: { type: Array, default: () => [] },
		canEdit: { type: Boolean, default: false },
		// Agrega, al final de las acciones, un ícono de eliminar fijo (no
		// configurable) que siempre pide confirmación antes de emitir
		// itemDelete; el mecanismo de confirmación no se puede desactivar,
		// solo personalizar su texto vía deleteConfirmMessage.
		canDelete: { type: Boolean, default: false },
		isItemEditEnabled: { type: Function, default: null },
		isItemDeleteEnabled: { type: Function, default: null },
		// Nombre singular de lo que lista la grilla (p. ej. 'cartografía'),
		// usado en el título y el mensaje default de confirmación de borrado.
		entityName: { type: String, default: 'elemento' },
		// (itemOrItems) => string; mensaje de confirmación de borrado. Si no
		// se define, se arma uno genérico a partir de entityName.
		deleteConfirmMessage: { type: Function, default: null },
		// Texto a mostrar cuando no hay elementos. Si la lista está vacía
		// por la búsqueda, se usa un mensaje propio que lo aclara.
		emptyMessage: { type: String, default: '' },
		// Ancho de la columna descriptiva, cuando no declara un size propio.
		captionWidth: { type: String, default: '400px' },
		// Cantidad de filas por página (también el tamaño inicial del
		// selector "Mostrar:"). Por defecto la grilla pagina de a 10; con
		// null se desactiva la paginación.
		pageSize: { type: Number, default: 10 },
		// Opciones de tamaño de página que ofrece el selector, cuando la
		// grilla pagina (pageSize definido). El valor inicial de pageSize se
		// incluye aunque no esté en la lista.
		pageSizeOptions: { type: Array, default: () => [10, 50, 100] },
		// Tope opcional al ancho de la tabla. No hace falta para evitar que
		// se estire (la tabla mide la suma de sus columnas); si se define
		// por debajo de esa suma, las columnas se comprimen.
		maxWidth: { type: String, default: null },
		hasChildren: { type: Boolean, default: false },
		multiSelect: {
			type: String,
			default: 'no',
			validator: function (value) { return ['yes', 'no', 'optional'].includes(value); },
		},
		defaultSortBy: { type: String, default: null },
		defaultSortOrder: { type: String, default: 'asc' },
		// Se invoca como onClick(grid, item) al hacer clic en una fila fuera
		// de sus botones de acción (y fuera de selección múltiple).
		rowClick: { type: Function, default: null },
		// Si se define, persiste la columna y el sentido de orden elegidos
		// entre sesiones (window.Db.GetUserSetting), bajo esta clave.
		settingsKey: { type: String, default: null },
		// Filas más bajas (menos padding vertical en celdas y acciones):
		// para listados densos donde no hace falta tanto aire entre filas.
		compact: { type: Boolean, default: false },
	},
	watch: {
		items(newItems, oldItems) {
			if (!oldItems || oldItems.length === 0) {
				// Primera carga real de datos: arranca con todo expandido.
				this.expandedIds = this.hasChildren ? MpGridHelper.CollectExpandableIds(this.items, 'Items') : {};
			}
			// En cargas posteriores (recargar tras guardar, mover, etc.) se
			// preserva expandedIds tal cual estaba: perder qué tenía
			// abierto o cerrado el usuario solo porque los datos se
			// refrescaron sería molesto, sobre todo con jerarquías largas.
			this.currentPage = 0;
			this.refreshRows();
		},
		sortProperty(value) {
			if (this.settingsKey) {
				window.Db.SetUserSetting(this.settingsKey + 'Sort', value);
			}
			this.currentPage = 0;
			this.refreshRows();
		},
		sortOrder(value) {
			if (this.settingsKey) {
				window.Db.SetUserSetting(this.settingsKey + 'SortOrder', value);
			}
			this.currentPage = 0;
			this.refreshRows();
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.mp-grid {
	position: relative;
	min-height: 220px;
	// Se ajusta al ancho de la tabla, en vez de ocupar todo el contenedor:
	// así el borde derecho de la tabla es el borde de la grilla, y tanto el
	// bloque de selección múltiple (que se ubica a la derecha) como el
	// paginador (centrado) quedan respecto de la tabla y no de la página.
	display: inline-block;
	max-width: 100%;
}

// La <table> mide la suma de sus columnas, pero el card que la envuelve
// seguiría ocupando todo el ancho disponible, dejando su borde derecho
// lejos del fin de la tabla.
::v-deep .md-table {
	width: fit-content;
	max-width: 100%;
}

// Con table-layout automático (el default), el width de cada celda es solo
// una sugerencia que el navegador puede ignorar. Con fixed se respeta el
// declarado, pero solo si la tabla no está forzada a un ancho mayor que la
// suma de sus columnas: con width 100%, fixed trata los anchos como
// PROPORCIONES y los escala para llenar el espacio. Por eso la tabla debe
// medir la suma de sus columnas (width auto), y hace falta !important para
// ganarle al width 100% que le pone Vue Material.
::v-deep table {
	table-layout: fixed;
	width: auto !important;
}

::v-deep td,
::v-deep th {
	word-wrap: break-word;
	overflow-wrap: break-word;
}

// md-table-cell no pone el contenido directo en el <td>: lo envuelve en un
// div interno que es flex container, y ahí text-align no alinea nada. La
// alineación del contenido se resuelve sobre ese container.
::v-deep .md-table-cell.align-left .md-table-cell-container {
	justify-content: flex-start;
}
::v-deep .md-table-cell.align-center .md-table-cell-container {
	justify-content: center;
}
::v-deep .md-table-cell.align-right .md-table-cell-container {
	justify-content: flex-end;
}

// Vue Material le da distinto padding horizontal a la celda y al
// encabezado, con lo que un contenido y su título no quedan alineados
// entre sí. Se igualan. El padding-right necesita !important para que Vue
// Material no lo pise y desfase los contenidos.
::v-deep .md-table-cell-container,
::v-deep .md-table-head-container,
::v-deep .md-table-head-label {
	padding-right: 12px !important;
}
::v-deep .md-table-head-container,
::v-deep .md-table-head-label {
	padding-left: 12px;
}
// El head-label trae padding-left: 24px; el contenido de la primera
// columna de datos (que no se indenta) debe partir del mismo lugar para no
// quedar más a la izquierda que su encabezado.
::v-deep .md-table-cell:first-child .md-table-cell-container {
	padding-left: 24px;
}
::v-deep .md-table-cell:not(:first-child) .md-table-cell-container {
	padding-left: 12px;
}
// Con selección múltiple, la celda de datos que sigue a la de checkboxes.
::v-deep .md-table-cell-selection + .md-table-cell .md-table-cell-container {
	padding-left: 12px;
}

// El título de columna va centrado, salvo el de la primera columna de
// datos (que va a la izquierda). Con selección múltiple, la primera
// columna real es la de checkboxes (.md-table-cell-selection): en ese caso
// la primera de datos es la segunda th, así que se contempla aparte para
// que "Título" no se centre.
::v-deep th:not(:first-child) .md-table-head-container,
::v-deep th:not(:first-child) .md-table-head-label {
	text-align: center;
	justify-content: center;
}
::v-deep th:first-child .md-table-head-container,
::v-deep th:first-child .md-table-head-label,
::v-deep th.md-table-cell-selection + th .md-table-head-container,
::v-deep th.md-table-cell-selection + th .md-table-head-label {
	text-align: left;
	justify-content: flex-start;
}
// El encabezado de la columna de acciones (siempre la última) va a la
// izquierda. Se ataca por posición porque la clase del md-table-cell no
// llega al th del header, que Vue Material genera por separado; y solo
// cuando hay columna de acciones (mp-grid-has-actions), para no alinear a
// la izquierda la última columna de datos cuando no la hay.
::v-deep .mp-grid-has-actions th:last-child .md-table-head-container,
::v-deep .mp-grid-has-actions th:last-child .md-table-head-label {
	text-align: left;
	justify-content: flex-start;
}

// La flecha que indica el orden actual se ubica absoluta a la derecha del
// label; su contenedor necesita overflow visible para no recortarla.
::v-deep .md-table-head-label {
	overflow: unset;
}
::v-deep .md-table-sortable-icon {
	position: absolute;
	right: -11px !important;
}

// Los botones de acción no se parten en varias líneas ni se recortan.
::v-deep .mp-grid-actions-cell .md-table-cell-container {
	white-space: nowrap;
	flex-wrap: nowrap;
}

.mp-grid-search {
	position: absolute;
	top: 6px;
	z-index: 10;
	max-width: 220px;
	// MpSearch ya viene posicionado con left: 100px; en vez de pisarlo, se
	// complementa con este desplazamiento para llegar a 200px.
	transform: translateX(90px);
	background-color: unset !important;
}

// La columna de checkboxes de selección múltiple trae 66px, demasiado; y
// su encabezado necesita el mismo padding que las celdas de checkbox para
// alinearse con ellas.
::v-deep .md-table-cell-selection {
	width: 50px;
	min-width: 50px;
	max-width: 50px;
}
::v-deep .md-table-head.md-table-cell-selection .md-table-head-container {
	padding-left: 10px;
	padding-right: 0px;
}

.mp-grid-multiselect-overlay {
	position: absolute;
	right: 0;
	top: 16px;
	z-index: 10;
	display: flex;
	align-items: center;
	gap: 2px;
}

.bulk-actions-group {
	display: flex;
	align-items: center;
	gap: 2px;
}

.selection-count {
	font-size: 12px;
	color: #888;
	margin-right: 4px;
	white-space: nowrap;
}

.bulk-actions-fade-enter-active,
.bulk-actions-fade-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}
.bulk-actions-fade-enter,
.bulk-actions-fade-leave-to {
	opacity: 0;
	transform: translateX(8px);
}

.mp-grid-indent {
	display: inline-flex;
	align-items: center;
}

// El botón redondo de expandir agrega su propio ancho a la izquierda del
// texto; sin él, el texto queda pegado al padding-left calculado por
// nivel. Estos ajustes compensan esa diferencia para que filas con y sin
// hijos, de un mismo nivel, queden alineadas entre sí.
.mp-grid-indent-parent {
	margin-left: -14px;
}

.mp-grid-indent-leaf {
	margin-left: -1px;
}

.mp-grid-expand-btn {
	margin-right: 2px;
}

// Filas más bajas: menos aire vertical en cada celda. md-table-cell trae
// su propio padding vertical (se anula acá) y el padding real queda en
// md-table-cell-container (más chico, no en cero, para no pegar el texto
// entre filas); la celda de acciones queda sin padding vertical propio.
.mp-grid-compact ::v-deep .md-table-cell {
	padding-top: 0px;
	padding-bottom: 0px;
}

.mp-grid-compact ::v-deep .md-table-cell-container {
	padding-top: 2px;
	padding-bottom: 2px;
}

.mp-grid-compact ::v-deep .mp-grid-actions-cell .md-table-cell-container {
	padding-top: 0px;
	padding-bottom: 0px;
}

.mp-grid-status-badges {
	position: absolute;
	right: calc(28%);
	bottom: 16px;
	display: flex;
}

.mp-grid-status-badge {
	background-color: transparent;
	font-size: 15px !important;
	color: #868686;
	margin-left: -5px;
	margin-top: -6px;
}

.mp-grid-action-badge {
	position: absolute;
	top: 6px;
	right: 0px;
	font-size: 11px;
	color: #ffffff;
	z-index: 1;
	left: -2px;
	text-shadow: 0 0 4px #9E9E9E;
}

.mp-grid-icon-badge {
	white-space: nowrap;
}

.mp-grid-fa-icon {
	font-size: 15px;
	margin: 3px 2px 0px 2px;
}

.mp-grid-badge-icon {
	font-size: 10px;
	margin: 3px 2px 0px 2px;
}

.align-left {
	text-align: left;
}
.align-center {
	text-align: center;
}
.align-right {
	text-align: right;
}

.mp-grid-table-wrap {
	position: relative;
}

// El mensaje de vacío se superpone centrado sobre el área de contenido de
// la tabla (que conserva su altura mínima), debajo del encabezado, en lugar
// de quedar como un bloque separado más abajo.
.mp-grid-empty {
	position: absolute;
	left: 0;
	right: 0;
	top: 48px;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #888;
	pointer-events: none;
}

.mp-grid-empty-text {
	padding: 4px 12px;
}

// El <th> del encabezado toma el ancho de su columna desde la variable CSS
// correspondiente (ver headerWidthVars): Vue Material no le pasa el :style
// que va a las celdas del cuerpo, así que sin esto el header no respeta el
// ancho, sobre todo cuando no hay filas.
::v-deep thead th:nth-child(1) { width: var(--mp-col-1-width); }
::v-deep thead th:nth-child(2) { width: var(--mp-col-2-width); }
::v-deep thead th:nth-child(3) { width: var(--mp-col-3-width); }
::v-deep thead th:nth-child(4) { width: var(--mp-col-4-width); }
::v-deep thead th:nth-child(5) { width: var(--mp-col-5-width); }
::v-deep thead th:nth-child(6) { width: var(--mp-col-6-width); }
::v-deep thead th:nth-child(7) { width: var(--mp-col-7-width); }
::v-deep thead th:nth-child(8) { width: var(--mp-col-8-width); }
::v-deep thead th:nth-child(9) { width: var(--mp-col-9-width); }
::v-deep thead th:nth-child(10) { width: var(--mp-col-10-width); }
::v-deep thead th:nth-child(11) { width: var(--mp-col-11-width); }
::v-deep thead th:nth-child(12) { width: var(--mp-col-12-width); }

// Con la tabla vacía se reserva una altura mínima (aprox. cuatro filas) en
// el cuerpo para que el bloque no quede reducido a la línea del encabezado;
// el mensaje de vacío se centra en ese espacio (ver .mp-grid-empty).
::v-deep .mp-grid-empty-table .md-table-content {
	min-height: 160px;
}

	.mp-grid-pagination-bar {
		display: grid;
		// La columna central mide el 50% del ancho de la grilla y siempre está
		// centrada; las columnas laterales (spacer y Mostrar) se reparten el
		// resto en partes iguales, así "Mostrar" queda a la derecha sin correr
		// el centrado del medio.
		grid-template-columns: 20% 60% 20%;
		padding-right: 30px;
		align-items: center;
		gap: 12px;
		margin-top: 4px;
	}

.mp-grid-pagination-center {
	display: grid;
	// Anterior y Siguiente ocupan columnas del mismo ancho (1fr cada una),
	// aunque su texto tenga largos distintos: así el rango, en la columna
	// del medio (auto), queda centrado en la zona central.
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	gap: 8px;
}

.mp-grid-nav-btn {
	font-size: 13px;
	white-space: nowrap;
}

.mp-grid-nav-prev {
	justify-self: start;
}

.mp-grid-nav-next {
	justify-self: end;
}

// Cuando no hay más de una página, Anterior/Siguiente no tienen a dónde ir:
// se ocultan sin sacarlas del layout (visibility, no display), para que el
// rango se mantenga centrado en la misma posición haya o no navegación.
.mp-grid-nav-hidden {
	visibility: hidden;
}

.mp-grid-pagination-range {
	font-size: 13px;
	color: #666;
	padding-top: 1px;
	white-space: nowrap;
	text-align: center;
}

.mp-grid-pagesize {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 4px;
}

.mp-grid-pagesize-label {
	font-size: 13px;
	padding-top: 1px;
	color: #666;
}

.offsetSearch {
	transform: translateX(40px)!important;
}

.mp-grid-pagesize-select {
		font-size: 13px;
		color: inherit;
		border: none;
		background: transparent;
		cursor: pointer;
}
</style>
