<template>
	<div class="md-layout-item md-size-100" v-if="list.length > 0">
		<md-button @click="toggle" v-if="label" style="margin: 10px 0px 10px 0px">
			<md-icon>{{ (expanded ? 'expand_less' : 'expand_more' ) }}</md-icon>
			<md-icon>{{ icon }}</md-icon>
			{{ label }} ({{ list.length }})
		</md-button>
		<transition name="fade">
			<!--
				max-width: 1000px en este contenedor permite usar right: 0 en el overlay
				de selección múltiple para que quede alineado con el borde derecho de la tabla.
			-->
			<div style="position: relative; max-width: 1000px;">
				<!-- Buscador: posición original, superpuesto sobre la cabecera de la tabla -->
				<mp-search
					@search="searchOnTable"
					v-model="search"
					v-show="(expanded || actions == 'I')"
					style="left: 200px;" />

				<!--
					Overlay de selección múltiple: mismo plano que el buscador,
					superpuesto sobre el encabezado de la columna "Acciones".
					Solo para listas activa (I) y archivada (A).
				-->
				<div
					v-if="actions === 'I' || actions === 'A'"
					v-show="(expanded || actions == 'I')"
					class="multiselect-overlay">
					<transition name="bulk-actions-fade">
						<span v-if="multiSelectMode && localSelectedItems.length > 0" class="bulk-actions-group">
							<span class="selection-count">
								{{ localSelectedItems.length }} seleccionada{{ localSelectedItems.length !== 1 ? 's' : '' }}
							</span>
							<md-button
								class="md-icon-button md-dense"
								v-if="actions === 'A'"
								@click="emitBulkAction('UNARCHIVE')"
								title="Desarchivar seleccionadas">
								<md-icon>unarchive</md-icon>
							</md-button>
							<md-button
								class="md-icon-button md-dense"
								v-if="actions === 'I'"
								@click="emitBulkAction('ARCHIVE')"
								title="Archivar seleccionadas">
								<md-icon>archive</md-icon>
							</md-button>
							<md-button
								class="md-icon-button md-dense"
								@click="emitBulkAction('DELETE')"
								title="Eliminar seleccionadas">
								<md-icon>delete</md-icon>
							</md-button>
						</span>
					</transition>
					<md-button
						class="md-icon-button"
						:class="{ 'md-primary': multiSelectMode }"
						@click="$emit('toggle-multi-select')"
						:title="multiSelectMode ? 'Cancelar selección múltiple (ESC)' : 'Selección múltiple'">
						<md-icon>playlist_add_check</md-icon>
					</md-button>
				</div>

				<md-table
					:key="tableKey"
					style="max-width: 1000px;"
					v-show="(expanded || actions == 'I')"
					v-model="listFiltered"
					:md-sort.sync="currentSort"
					:md-sort-order.sync="currentSortOrder"
					:md-sort-fn="customSort"
					md-card
					@md-selected="onMdSelected">

					<md-table-row
						slot="md-table-row"
						slot-scope="{ item }" md-auto-select
						v-bind="multiSelectMode ? { 'md-selectable': 'multiple' } : {}">

						<md-table-cell
							style="width: 400px"
							@click.native="onCellClick(item)"
							class="selectable"
							md-label="Título"
							md-sort-by="Caption">
							<a v-if="!multiSelectMode" :href="getWorkUri(item)" class="normalTextLink">{{ item.Caption }}</a>
							<span v-else>{{ item.Caption }}</span>
						</md-table-cell>

						<md-table-cell
							@click.native="onCellClick(item)"
							class="selectable"
							md-label="Modificado"
							md-sort-by="History">
							<span>
								<i v-if="logInfo(item)" style="margin-right: 5px; font-size: 11px;"
								   class="tinyIcon vsm-icon fa fa-history"></i>
								<md-tooltip md-direction="bottom">{{ logInfo(item) }}</md-tooltip>
							</span>
							<span>
								{{ item.DatasetCount }} <i class="tinyIcon vsm-icon fa fa-table"></i>
								<md-tooltip md-direction="bottom">{{ item.DatasetCount + (item.DatasetCount == 1 ? ' dataset' : ' datasets') }}</md-tooltip>
							</span>,<span>
								{{ item.MetricCount }} <i class="tinyIcon vsm-icon fa fa-chart-bar"></i>
								<md-tooltip md-direction="bottom">{{ item.MetricCount + (item.MetricCount == 1 ? ' indicador' : ' indicadores') }}</md-tooltip>
							</span>
						</md-table-cell>

						<md-table-cell
							@click.native="onCellClick(item)"
							class="selectable"
							md-label="Estado">
							<md-icon :style="'color: ' + status(item).color">{{ status(item).icon }}</md-icon>
							<md-tooltip md-direction="bottom">{{ status(item).label }}</md-tooltip>
							<div class="extraIconContainer">
								<md-icon v-if="item.IsPrivate" class="extraIcon">
									lock
									<md-tooltip md-direction="bottom">Visiblidad: Privado. Para cambiar la visiblidad, acceda a Editar > Visiblidad.</md-tooltip>
								</md-icon>
								<md-icon v-if="!item.IsPrivate && !item.IsIndexed && status(item).tag !== 'unpublished'"
										 class="extraIcon">error_outline</md-icon>
								<md-tooltip md-direction="bottom">
									No indexada. El buscador de Poblaciones no publica los indicadores de esta cartografía en sus resultados.
									Para que sean incluidos, debe solictar una revisión desde Modificar > Visiblidad > Solicitar revisión.
								</md-tooltip>
							</div>
						</md-table-cell>

						<!--
							Las acciones individuales permanecen siempre visibles:
							en modo selección múltiple el usuario puede seguir usándolas.
						-->
						<md-table-cell md-label="Acciones">
							<md-button v-if="!canEdit(item)" class="md-icon-button" @click="selected('VIEW', item)">
								<md-icon>remove_red_eye</md-icon>
								<md-tooltip md-direction="bottom">Consultar</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item) && !publishDisabled(item)" class="md-icon-button" @click="selected('PUBLISH', item)">
								<md-icon>public</md-icon>
								<md-tooltip md-direction="bottom">Publicar</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item) && !revokeDisabled(item)" class="md-icon-button" @click="selected('REVOKE', item)">
								<md-icon>pause_circle_filled</md-icon>
								<md-tooltip md-direction="bottom">Revocar publicación</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item)" class="md-icon-button" @click="selected('VIEW', item)">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Modificar</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item)" @click="selected('DUPLICATE', item)" class="md-icon-button">
								<md-icon>file_copy</md-icon>
								<md-tooltip md-direction="bottom">Duplicar</md-tooltip>
							</md-button>
							<md-button v-if="canCreatePublic && item.Type !== 'P'" class="md-icon-button" @click="selected('PROMOTE', item)">
								<md-icon>playlist_add</md-icon>
								<md-tooltip md-direction="bottom">Promover a Dato público</md-tooltip>
							</md-button>
							<md-button v-if="isAdmin && item.Type !== 'P'" class="md-icon-button" @click="selected('PROMOTEEXAMPLE', item)">
								<md-icon>lightbulb</md-icon>
								<md-tooltip md-direction="bottom">Convertir a ejemplo</md-tooltip>
							</md-button>
							<md-button v-if="canCreatePublic && item.Type === 'P'" class="md-icon-button" @click="selected('DEMOTE', item)">
								<md-icon>playlist_remove</md-icon>
								<md-tooltip md-direction="bottom">Convertir en Cartografía</md-tooltip>
							</md-button>
							<md-button class="md-icon-button" v-if="actions == 'I'" @click="selected('ARCHIVE', item)">
								<md-icon>archive</md-icon>
								<md-tooltip md-direction="bottom">Archivar</md-tooltip>
							</md-button>
							<md-button class="md-icon-button" v-if="actions == 'A'" @click="selected('UNARCHIVE', item)">
								<md-icon>unarchive</md-icon>
								<md-tooltip md-direction="bottom">Desarchivar</md-tooltip>
							</md-button>
							<md-button v-if="canEdit(item)" class="md-icon-button" @click="selected('DELETE', item)">
								<md-icon>delete</md-icon>
								<md-tooltip md-direction="bottom">Eliminar</md-tooltip>
							</md-button>
						</md-table-cell>

					</md-table-row>
				</md-table>
			</div>
		</transition>
	</div>
</template>

<script>

	import ActiveWork from '@/backoffice/classes/ActiveWork';
	import str from '@/common/framework/str';
	import speech from '@/common/js/speech';
	import arr from '@/common/framework/arr';

	export default {
		name: 'WorkItems',
		components: {},
		data() {
			return {
				currentSort: 'History',
				currentSortOrder: 'desc',
				search: '',
				listFiltered: [],
				expanded: true,
				// Clave que fuerza el remontaje completo de md-table al cambiar de modo.
				tableKey: 0,
				// Copia local de los ítems seleccionados: se actualiza sincrónicamente
				// cuando @md-selected dispara, sin esperar el roundtrip Works → prop.
				// Esto garantiza que los botones de acción en lote aparezcan de inmediato.
				localSelectedItems: [],
			};
		},
		mounted() {
			this.currentSort = window.Db.GetUserSetting(this.settingsKey, 'History');
			this.currentSortOrder = window.Db.GetUserSetting(this.settingsKey + 'Order', 'desc');
			this.expanded = window.Db.GetUserSetting(this.settingsKey + 'Expanded', '0') == '1';
			this.search = '';
			this.listFiltered = this.customSort(arr.SearchByCaption(this.list, this.search));
		},
		props: {
			list: Array,
			label: String,
			icon: String,
			filter: String,
			actions: { type: String, default: null },
			multiSelectMode: { type: Boolean, default: false },
			selectedItems: { type: Array, default: () => [] },
		},
		computed: {
			canAdmin() {
				if (window.Context.User.Privileges === 'A') {
					return true;
				}
				return this.item.privileges === 'A';
			},
			isAdmin() {
				return window.Context.IsAdmin();
			},
			settingsKey() {
				return 'worksSort-' + this.filter + '-' + this.actions;
			},
		},
		methods: {
			selected(action, item) {
				this.$emit('action', action, item);
			},

			// En modo normal navega; en selección múltiple el clic lo gestiona Vue Material.
			onCellClick(item) {
				if (!this.multiSelectMode) {
					this.selected('VIEW', item);
				}
			},

			// Vue Material dispara este evento con el array de ítems seleccionados.
			// Se actualiza localSelectedItems sincrónicamente antes de emitir al padre.
			onMdSelected(items) {
				this.localSelectedItems = [...items];
				this.$emit('update:selected-items', [...items]);
			},

			// Emite la operación en lote usando los ítems almacenados localmente,
			// que siempre están sincronizados con @md-selected.
			emitBulkAction(type) {
				this.$emit('bulk-action', { type, items: [...this.localSelectedItems] });
			},

			searchOnTable() {
				this.listFiltered = this.customSort(arr.SearchByCaption(this.list, this.search));
			},
			logInfo(item) {
				return speech.FormatWorkInfo(item);
			},
			publishDisabled(item) {
				return !(item.MetadataLastOnline === null || item.HasChanges !== 0);
			},
			revokeDisabled(item) {
				return (item.MetadataLastOnline === null);
			},
			status(item) {
				return ActiveWork.CalculateListItemStatus(item);
			},
			canCreatePublic() {
				return window.Context.CanCreatePublicData();
			},
			canEdit(item) {
				if (window.Context.User.Privileges === 'A') {
					return true;
				}
				if (this.filter === 'P' && window.Context.User.Privileges === 'E') {
					return true;
				}
				if (item.IsIndexed) {
					return false;
				}
				return item.Privileges !== 'V';
			},
			toggle() {
				this.expanded = !this.expanded;
			},
			doSort(value, sortBy, direction) {
				var loc = this;
				return value.sort((a, b) => {
					var sign = (direction === 'desc' ? -1 : 1);
					if (sortBy === 'History') {
						return sign * loc.ocompare(speech.GetValidaDate(a), speech.GetValidaDate(b));
					} else {
						return sign * str.humanCompare(a[sortBy], b[sortBy]);
					}
				});
			},
			ocompare(o1, o2) {
				if (o1 === o2) { return 0; }
				if (o1 === null) { return -1; }
				if (o2 === null) { return 1; }
				if (typeof o1 === 'string' && typeof o2 === 'string') {
					return o1.localeCompare(o2, undefined, { sensitivity: 'accent' });
				} else {
					return o1 < o2 ? -1 : o1 > o2 ? 1 : 0;
				}
			},
			customSort(value) {
				return this.doSort(value, this.currentSort, this.currentSortOrder);
			},
			getWorkUri(element) {
				return '/users/#/cartographies/' + element.Id + '/metadata/content';
			},
		},
		watch: {
			'currentSort'() {
				window.Db.SetUserSetting(this.settingsKey, this.currentSort);
			},
			'list'() {
				this.listFiltered = this.list;
				this.search = '';
			},
			'currentSortOrder'() {
				window.Db.SetUserSetting(this.settingsKey + 'Order', this.currentSortOrder);
			},
			'expanded'() {
				window.Db.SetUserSetting(this.settingsKey + 'Expanded', (this.expanded ? '1' : '0'));
			},
			'multiSelectMode'(newVal) {
				// Remonta la tabla para aplicar/quitar md-selectable y limpiar la selección interna.
				this.tableKey++;
				if (!newVal) {
					this.localSelectedItems = [];
				}
			},
		},
	};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
/* Overlay de selección múltiple: mismo plano z que el buscador,
   superpuesto sobre el encabezado de la columna "Acciones". */
.multiselect-overlay {
	position: absolute;
	right: 0;
	top: 8px;
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
</style>
