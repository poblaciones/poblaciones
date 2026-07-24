<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<geography-popup ref="editPopup" @completed="popupSaved">
			</geography-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div v-if="isAdmin" class="md-layout-item md-size-100">
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
					:canDelete="isAdmin"
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
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';
import c from '@/common/framework/color';
import MpGridHelper from '@/backoffice/components/MpGrid.helper';

	export default {
		name: 'Geographies',
		components: {
			GeographyPopup,
			MetadataPopup
		},
	data() {
		return {
			list: [],
			uniqueMetadatas: []
			};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		},
		// El servidor entrega el listado plano, en orden, con el nivel de
		// profundidad de cada ítem (Level); mismo patrón que ClippingRegions.
		treeList() {
			return MpGridHelper.BuildTreeFromLevels(this.list, 'Level', 'Items');
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
		gridActions() {
			var loc = this;
			if (!this.isAdmin) {
				return [];
			}
			return [
				{ icon: 'edit', caption: 'Modificar', onClick: function (grid, item) { loc.openEdition(item); } },
				{
					icon: 'label',
					caption: 'Metadatos',
					iconStyle: function (item) { return 'color: #' + loc.resolveColor(item); },
					badge: function (item) { return item.Metadata.Id; },
					isEnabled: function (item) { return !!item.Metadata; },
					onClick: function (grid, item) { loc.openMetadata(item); },
				},
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo geografías', window.Db,
				window.Db.GetGeographies).then(function(data) {
					arr.AddRange(loc.list, data);
					loc.list.forEach(item => {
						const id = item?.Metadata?.Id;
						if (id && !loc.uniqueMetadatas.includes(id)) {
							loc.uniqueMetadatas.push(id);
						}
					});
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
		onRowClick(grid, item) {
			this.openEdition(item);
		},
		openMetadata(item) {
			var loc = this;
			this.$refs.invoker.do(window.Db, window.Db.LoadMetadata,
				item.Metadata).then(function (activeMetadata) {
					loc.$refs.editMetadataPopup.show(activeMetadata);
				});
		},
		resolveColor(item) {
			if (!item.Metadata) {
				return '';
			}
			var palete = c.GetColorPalete();
			var position = this.uniqueMetadatas.indexOf(item.Metadata.Id);
			var positionTrimed = position % palete.length;
			return palete[positionTrimed];
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
