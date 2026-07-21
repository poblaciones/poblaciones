<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<clippingRegion-popup ref="editPopup" @completed="popupSaved">
			</clippingRegion-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div class="md-layout-item md-size-100">
				<mp-grid
					:items="treeList" :pageSize="50"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick"
					hasChildren />
			</div>
		</div>
		</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import ClippingRegionPopup from './ClippingRegionPopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';
import c from '@/common/framework/color';
import MpGridHelper from '@/backoffice/components/MpGrid.helper';


	export default {
		name: 'ClippingRegions',
		components: {
			ClippingRegionPopup,
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
		// profundidad de cada ítem (Level); acá se reconstruye la jerarquía
		// que espera la grilla.
		treeList() {
			return MpGridHelper.BuildTreeFromLevels(this.list, 'Level', 'Items');
		},
		gridColumns() {
			var loc = this;
			return [
				{
					property: 'Caption', caption: 'Nombre',
					value: function (item) {
						var ret = item.Caption;
						if (item.Version) {
							ret += ', ' + item.Version;
						}
						ret += ' (' + item.LabelsMinZoom + '-' + item.LabelsMaxZoom + ')';
						return ret;
					},
				},
				{ property: 'FieldCodeName', caption: 'Código' },
				{ property: 'Symbol', caption: 'Ícono' },
				{ property: 'ChildCount', caption: 'Ítems', sortType: 'number' },
				{ property: 'Priority', caption: 'Prioridad', sortType: 'number' },
				{
					property: 'NoAutocomplete', caption: 'Buscador', sortType: 'boolean',
					value: function (item) { return loc.formatBool(!item.NoAutocomplete); },
					sortValue: function (item) { return !item.NoAutocomplete; },
				},
				{
					property: 'IsCrawlerIndexer', caption: 'Segmenta',
					value: function (item) { return loc.formatBool(item.IsCrawlerIndexer); },
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
					iconStyle: function (item) { return 'transform: scaleX(2); color: #' + loc.resolveColor(item); },
					badge: function (item) { return item.Metadata.Id; },
					isEnabled: function (item) { return !!item.Metadata; },
					onClick: function (grid, item) { loc.openMetadata(item); },
				},
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo regiones', window.Db,
				window.Db.GetClippingRegions).then(function(data) {
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
			return (v ? 'Sí' : '-');
		},
		createNewClippingRegion() {
			var loc = this;
			window.Context.Factory.GetCopy('ClippingRegion', function(data) {
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
			arr.ReplaceByIdOrAdd(this.list, item);
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
