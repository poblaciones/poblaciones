<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<clippingRegion-popup ref="editPopup" @completed="popupSaved">
			</clippingRegion-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div class="md-layout-item md-size-100">
				<md-table style="max-width: 1100px;" v-model="list" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Nombre">
							<span :style="'padding-left: ' + (item.Level * 18) + 'px'">{{ item.Caption }}{{ (item.Version ? ',' : '')}} {{ item.Version }} ({{ item.LabelsMinZoom }}-{{ item.LabelsMaxZoom }})</span>
						</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Código">{{ item.FieldCodeName }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Ícono">{{ item.Symbol }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Ítems">{{ item.ChildCount }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Prioridad">{{ item.Priority }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Buscador">{{ formatBool(!item.NoAutocomplete) }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Segmenta">{{ formatBool(item.IsCrawlerIndexer) }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap" v-if="isAdmin">
							<md-button class="md-icon-button" @click="openEdition(item)">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Modificar</md-tooltip>
							</md-button>
							<md-button class="md-icon-button" @click="openMetadata(item)">
								<div class="metadataLabel">{{ item.Metadata.Id }}</div>
								<md-icon :style="'transform: scaleX(2); color: #' + resolveColor(item)">label</md-icon>
								<md-tooltip md-direction="bottom">Metadatos</md-tooltip>
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
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';
import c from '@/common/framework/color';


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


	.metadataLabel {
		position: absolute;
		top: 6px;
		font-size: 11px;
		color: #ffffff;
		z-index: 1;
		left: -2px;
		text-shadow: 0 0 4px #9E9E9E;
	}

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
