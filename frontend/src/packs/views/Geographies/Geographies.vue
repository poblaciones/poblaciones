<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<geography-popup ref="editPopup" @completed="popupSaved">
			</geography-popup>
			<geography-clipping-regions-popup ref="editClippingRegionsPopup">
			</geography-clipping-regions-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div v-if="canEdit" class="md-layout-item md-size-100">
				<md-button @click="createNewGeography">
					<md-icon>add_circle_outline</md-icon>
					Nueva geografía
				</md-button>
			</div>
			<div class="md-layout-item md-size-100">
				<mp-grid
					:items="treeList" :pageSize="50"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick"
					:canDelete="canEdit"
					entityName="geografía"
					:deleteConfirmMessage="deleteConfirmMessage"
					@itemDelete="onItemDelete"
					hasChildren />
			</div>
		</div>
		</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import GeographyPopup from './GeographyPopup.vue';
import GeographyClippingRegionsPopup from './GeographyClippingRegionsPopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';

	export default {
		name: 'Geographies',
		components: {
			GeographyPopup,
			GeographyClippingRegionsPopup,
			MetadataPopup
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
		// El servidor entrega el listado plano, en orden, con el nivel de
		// profundidad de cada ítem (Level); mismo patrón que ClippingRegions.
		treeList() {
			return arr.ListToTreeFromIndentedItems(this.list, 'Level', 'Items');
		},
		gridColumns() {
			var loc = this;
			return [
				{
					property: 'Caption', caption: 'Nombre',
					value: function (item) {
						if (item.Revision) {
							return item.Caption + ' (' + item.Revision + ')';
						}
						return item.Caption;
					},
					tooltip: function (item) { return item.Metadata ? item.Metadata.Title : null; },
				},
				{ property: 'RootCaption', caption: 'Relevamiento' },
				{ property: 'Gradient.Caption', caption: 'Gradiente' },
				{ property: 'MaxZoom', caption: 'Zoom máx.', sortType: 'number' },
				{
					property: 'UseForClipping', caption: 'Clipping', sortType: 'boolean',
					value: function (item) { return loc.formatBool(item.UseForClipping); },
				},
				{
					property: 'IsTrackingLevel', caption: 'Seguimiento', sortType: 'boolean',
					value: function (item) { return loc.formatBool(item.IsTrackingLevel); },
				},
			];
		},
		// 'Regiones asociadas' y 'Metadatos' son acciones de consulta: se
		// abren igual sin importar el nivel de permisos (los popups que
		// abren ya manejan su propia edición con :canEdit). Solo
		// 'Modificar' cambia de ícono/etiqueta a 'Ver' cuando no se puede
		// editar, en vez de ocultarse: sin esto no había forma de ver el
		// detalle de una geografía sin permisos de edición.
		gridActions() {
			var loc = this;
			var editIcon = 'edit';
			var editCaption = 'Modificar';
			if (!this.canEdit) {
				editIcon = 'visibility';
				editCaption = 'Ver';
			}
			return [
				{ icon: editIcon, caption: editCaption, onClick: function (grid, item) { loc.openEdition(item); } },
				{
					icon: 'map',
					caption: 'Regiones asociadas',
					onClick: function (grid, item) { loc.openClippingRegions(item); },
				},
				{
					icon: 'label',
					caption: 'Metadatos',
					isEnabled: function (item) { return !!item.MetadataId; },
					onClick: function (grid, item) { loc.openMetadata({ Id: item.MetadataId }); },
				},
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo geografías', window.Db,
				window.Db.GetGeographies).then(function(data) {
					arr.AddRange(loc.list, data);
			});
	},
	methods: {
		formatBool(v) {
			if (v) {
				return 'Sí';
			}
			return '-';
		},
		createNewGeography() {
			var loc = this;
			window.Context.Factory.GetCopy('Geography', function(data) {
					loc.openEdition(data);
			});
		},
		openEdition(item) {
			this.$refs.editPopup.show(item);
		},
		openClippingRegions(item) {
			this.$refs.editClippingRegionsPopup.show(item);
		},
		onRowClick(grid, item) {
			this.openEdition(item);
		},
		openMetadata(metadata) {
			var loc = this;
			window.Db.LoadMetadata(metadata).then(function (activeMetadata) {
				loc.$refs.editMetadataPopup.show(activeMetadata);
			});
		},
		popupSaved(item) {
			if (item.Level === undefined || item.Level === null) {
				if (item.Parent) {
					item.Level = item.Parent.Level + 1;
				} else {
					item.Level = 0;
				}
			}
			arr.ReplaceByIdOrAdd(this.list, item);
		},
		deleteConfirmMessage(item) {
			return 'Esta acción no puede deshacerse: se eliminará la geografía \'' + item.Caption
				+ '\' junto con sus subniveles e ítems.';
		},
		onItemDelete(item) {
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.DeleteGeography, item).then(function () {
				loc.removeGeographyAndDescendants(item);
			});
		},
		removeGeographyAndDescendants(geography) {
			var descendantIds = this.collectDescendantIds(geography);
			var index = 0;
			while (index < this.list.length) {
				var current = this.list[index];
				if (current === geography || descendantIds.indexOf(current.Id) !== -1) {
					this.list.splice(index, 1);
				} else {
					index++;
				}
			}
		},
		collectDescendantIds(geography) {
			var ret = [];
			if (geography.Items) {
				for (var n = 0; n < geography.Items.length; n++) {
					ret.push(geography.Items[n].Id);
					ret = ret.concat(this.collectDescendantIds(geography.Items[n]));
				}
			}
			return ret;
		},
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-dialog-actions {
  padding: 8px 20px 8px 24px !important;
}

.close-button {
    min-width: unset;
    height: unset;
    margin: unset;
    float: right;
}

</style>
