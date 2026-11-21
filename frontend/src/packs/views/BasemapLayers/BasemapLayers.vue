<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<basemap-layer-popup ref="editPopup" @completed="popupSaved">
			</basemap-layer-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div v-if="canEdit" class="md-layout-item md-size-100">
				<md-button @click="createNewLayer">
					<md-icon>add_circle_outline</md-icon>
					Nueva capa base
				</md-button>
			</div>
			<div class="md-layout-item md-size-100">
				<mp-grid
					compact
					:items="list"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick"
					:canDelete="canEdit"
					entityName="capa base"
					:deleteConfirmMessage="deleteConfirmMessage"
					@itemDelete="onItemDelete" />
			</div>
		</div>
	</div>
</template>

<script>
import BasemapLayerPopup from './BasemapLayerPopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import arr from '@/common/framework/arr';
import f from '@/backoffice/classes/Formatter';

const LAYER_TYPE_CAPTIONS = {
	R: 'Raster',
	M: 'Indicador',
	B: 'Delimitación',
	L: 'Etiquetas',
};

export default {
	name: 'BasemapLayers',
	components: {
		BasemapLayerPopup,
		MetadataPopup,
	},
	data() {
		return {
			list: [],
		};
	},
	computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		gridColumns() {
			var loc = this;
			// Ninguna columna es ordenable: el orden de la lista es el orden en que se
			// muestran en el panel del mapa y se cambia con las acciones Subir/Bajar. La
			// grilla ordena por la primera columna, que por eso se compara por Order.
			return [
				{
					property: 'Caption', caption: 'Nombre', sortable: false, size: 5, sortType: 'number',
					sortValue: function (item) { return item.Order; },
				},
				{
					property: 'Icon', caption: 'Ícono', type: 'status', sortable: false, size: 1,
						// El ícono de una columna 'status' se declara en icon (no se lee de property).
						icon: function (item) { return item.Icon; },
				},
				{
					property: 'Type', caption: 'Tipo', sortable: false, size: 2,
					value: function (item) { return loc.formatType(item.Type); },
				},
				{
					property: 'ItemsSummary', caption: 'Contenido', sortable: false, align: 'left', size: 5,
					value: function (item) { return loc.formatContent(item); },
				},
				{ property: 'RouteTag', caption: 'Letra', sortable: false },
				{
					property: 'HideOnSatellite', caption: 'Oculta en satélite', sortable: false,
					value: function (item) { return loc.formatBool(item.HideOnSatellite); },
				},
			];
		},
		// 'Modificar' se degrada a 'Ver' sin permisos de edición; Subir y Bajar se ocultan.
		gridActions() {
			var loc = this;
			var editIcon = 'edit';
			var editCaption = 'Modificar capa base';
			if (!this.canEdit) {
				editIcon = 'visibility';
				editCaption = 'Ver capa base';
			}
			return [
				{
					icon: editIcon,
					caption: editCaption,
					onClick: function (grid, item) { loc.openEdition(item); },
				},
				{
					icon: 'arrow_upward',
					caption: 'Subir',
					isEnabled: function (item) { return loc.canEdit && !loc.isFirst(item); },
					onClick: function (grid, item) { loc.moveLayer(item, true); },
				},
				{
					icon: 'arrow_downward',
					caption: 'Bajar',
					isEnabled: function (item) { return loc.canEdit && !loc.isLast(item); },
					onClick: function (grid, item) { loc.moveLayer(item, false); },
				},
				{
					icon: 'label',
					caption: 'Metadatos',
					isEnabled: function (item) { return !!item.MetadataId || loc.canCreateMetadata(item); },
					onClick: function (grid, item) { loc.openItemMetadata(item); },
				},
			];
		},
	},
	mounted() {
		this.reloadList();
	},
	methods: {
		formatType(type) {
			if (LAYER_TYPE_CAPTIONS[type]) {
				return LAYER_TYPE_CAPTIONS[type];
			}
			return type;
		},
		formatBool(value) {
			if (value) {
				return 'Sí';
			}
			return '-';
		},
		formatContent(item) {
			if (item.Type === 'R') {
				return item.RasterUrl;
			}
			if (item.Type === 'L') {
				return 'Etiquetas del mapa';
			}
			return item.ItemsSummary;
		},
		reloadList() {
			var loc = this;
			return this.$refs.invoker.doMessage('Obteniendo capas base', window.Db,
				window.Db.GetBasemapLayers).then(function (data) {
					arr.ReplaceAll(loc.list, data);
				});
		},
		createNewLayer() {
			var loc = this;
			window.Context.Factory.GetCopy('BasemapLayer', function (data) {
				loc.$refs.editPopup.show(data, loc.list);
			});
		},
		openEdition(item) {
			this.$refs.editPopup.show(item, this.list);
		},
		onRowClick(grid, item) {
			this.openEdition(item);
		},
		// Los cambios de tipo, contenido o metadatos modifican datos derivados
		// (ItemsSummary, MetadataId, Order): se recarga desde el servidor.
		popupSaved() {
			this.reloadList();
		},
		moveLayer(item, up) {
			var method = window.Db.MoveBasemapLayerDown;
			if (up) {
				method = window.Db.MoveBasemapLayerUp;
			}
			var loc = this;
			this.$refs.invoker.doSave(window.Db, method, item).then(function () {
				loc.reloadList();
			});
		},
		isFirst(item) {
			return this.list.length > 0 && this.list[0].Id === item.Id;
		},
		isLast(item) {
			return this.list.length > 0 && this.list[this.list.length - 1].Id === item.Id;
		},
		// Raster y etiquetas no heredan metadatos: siempre los tienen propios, y si todavía
		// no se crearon (capas existentes antes de esta función) se crean al abrirlos.
		canCreateMetadata(item) {
			return this.canEdit && (item.Type === 'R' || item.Type === 'L');
		},
		openItemMetadata(item) {
			if (item.MetadataId) {
				this.openMetadata({ Id: item.MetadataId });
				return;
			}
			var loc = this;
			var layer = f.clone(item);
			layer.HasOwnMetadata = true;
			this.$refs.invoker.doSave(window.Db, window.Db.UpdateBasemapLayer, layer).then(function () {
				return loc.reloadList();
			}).then(function () {
				var updated = arr.GetById(loc.list, item.Id);
				loc.openMetadata({ Id: updated.MetadataId });
			});
		},
		openMetadata(metadata) {
			var loc = this;
			window.Db.LoadMetadata(metadata).then(function (activeMetadata) {
				loc.$refs.editMetadataPopup.show(activeMetadata);
			});
		},
		deleteConfirmMessage(item) {
			return 'Esta acción no puede deshacerse: se eliminará la capa base \'' + item.Caption +
				'\'. Las cartografías que la tuvieran configurada como predeterminada pasarán a usar el valor por defecto.';
		},
		onItemDelete(item) {
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.DeleteBasemapLayer, item).then(function () {
				var index = loc.list.indexOf(item);
				if (index !== -1) {
					loc.list.splice(index, 1);
				}
			});
		},
	}
};
</script>
