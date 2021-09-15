<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<clippingRegion-popup ref="editPopup" @completed="popupSaved">
			</clippingRegion-popup>
			<div class="md-layout-item md-size-100">
				<md-table style="max-width: 1100px;" v-model="list" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Nombre"><span
									:style="'padding-left: ' + (item.Level * 18) + 'px'">{{ item.Caption }} ({{ item.LabelsMinZoom }}-{{ item.LabelsMaxZoom }})</span></md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Código">{{ item.FieldCodeName }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Ícono">{{ item.Symbol }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Ítems">{{ item.ChildCount }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Buscador">{{ formatBool(!item.NoAutocomplete) }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Segmenta">{{ formatBool(item.IsCrawlerIndexer) }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap" v-if="isAdmin">
							<md-button class="md-icon-button" title="Modificar" @click="openEdition(item)">
								<md-icon>edit</md-icon>
							</md-button>
						</md-table-cell>
					</md-table-row>
				</md-table>
			</div>
		</div>
		</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import ClippingRegionPopup from './ClippingRegionPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';

	export default {
	name: 'ClippingRegions',
	data() {
		return {
			list: []
			};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
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
		popupSaved(item) {
			arr.ReplaceByIdOrAdd(this.list, item);
		},
  },
  components: {
      ClippingRegionPopup,
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
