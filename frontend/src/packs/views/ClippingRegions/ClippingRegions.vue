<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<clippingRegion-popup ref="editPopup" @completed="popupSaved">
			</clippingRegion-popup>
			<clipping-region-geography-popup ref="editGeographyPopup">
			</clipping-region-geography-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div v-if="isAdmin" class="md-layout-item md-size-100">
				<md-button @click="createNewClippingRegion">
					<md-icon>add_circle_outline</md-icon>
					Nueva región
				</md-button>
			</div>
			<div class="md-layout-item md-size-100">
				<mp-grid compact
					:items="treeList" :pageSize="50"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick"
					:canDelete="isAdmin"
					entityName="región"
					:deleteConfirmMessage="deleteConfirmMessage"
					@itemDelete="onItemDelete"
					hasChildren />
			</div>
		</div>
		</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import ClippingRegionPopup from './ClippingRegionPopup.vue';
import ClippingRegionGeographyPopup from './ClippingRegionGeographyPopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';
import MpGridHelper from '@/backoffice/components/MpGrid.helper';


	export default {
		name: 'ClippingRegions',
		components: {
			ClippingRegionPopup,
			ClippingRegionGeographyPopup,
			MetadataPopup
		},
	data() {
		return {
			list: [],
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
				{
					property: 'Color', caption: 'Color', html: true, sortable: false, size: 1,
					value: function (item) { return loc.formatColor(item.Color); },
				},
				{
					property: 'Symbol', caption: 'Ícono', type: 'status', sortable: false,
					icon: function (item) { return loc.formatIcon(item.Symbol); },
				},
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
				{
					property: 'IndexCode', caption: 'Indexa', sortType: 'boolean',
					value: function (item) { return loc.formatBool(item.IndexCode); },
				},
				{ property: 'FieldCodeName', caption: 'Códigos' },
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
					icon: 'public',
					caption: 'Geografías asociadas',
					onClick: function (grid, item) { loc.openGeographies(item); },
				},
				{
					icon: 'label',
					caption: 'Metadatos',
					isEnabled: function (item) { return !!item.Metadata; },
					onClick: function (grid, item) { loc.openMetadata(item.Metadata); },
				},
			];
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo regiones', window.Db,
				window.Db.GetClippingRegions).then(function(data) {
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
		formatColor(color) {
			var hex = '#e0e0e0';
			if (color) {
				hex = '#' + color.replace('#', '');
			}
			return '<span style="display:inline-block;width:16px;height:16px;border-radius:50%;'
				+ 'background-color:' + hex + ';border:1px solid rgba(0,0,0,0.2);"></span>';
		},
		// El símbolo se guarda como clase FontAwesome sin el prefijo (ej.
		// 'fa-chart-bar'), pero MpGrid solo lo reconoce como ícono si
		// empieza con 'fas ' o 'fa ' (ver MpGridHelper.IsFontAwesome).
		formatIcon(symbol) {
			if (!symbol) {
				return null;
			}
			if (symbol.indexOf('fas ') === 0 || symbol.indexOf('fa ') === 0) {
				return symbol;
			}
			return 'fas ' + symbol;
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
		openGeographies(item) {
			this.$refs.editGeographyPopup.show(item);
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
			window.Context.ClippingRegions.Invalidate();
		},
		deleteConfirmMessage(item) {
			return 'Esta acción no puede deshacerse: se eliminará la región \'' + item.Caption
				+ '\' junto con sus subregiones e ítems.';
		},
		onItemDelete(item) {
			var loc = this;
			this.$refs.invoker.doSave(window.Db, window.Db.DeleteClippingRegion, item).then(function () {
				loc.removeRegionAndDescendants(item);
				window.Context.ClippingRegions.Invalidate();
			});
		},
		removeRegionAndDescendants(region) {
			var descendantIds = this.collectDescendantIds(region);
			var index = 0;
			while (index < this.list.length) {
				var current = this.list[index];
				if (current === region || descendantIds.indexOf(current.Id) !== -1) {
					this.list.splice(index, 1);
				} else {
					index++;
				}
			}
		},
		collectDescendantIds(region) {
			var ret = [];
			if (region.Items) {
				for (var n = 0; n < region.Items.length; n++) {
					ret.push(region.Items[n].Id);
					ret = ret.concat(this.collectDescendantIds(region.Items[n]));
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
