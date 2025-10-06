<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<boundary-popup ref="editPopup" @completed="popupSaved">
			</boundary-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div class="md-layout-item md-size-100">
				<md-table style="max-width: 1100px;" v-model="list" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Nombre">{{ item.Caption }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Grupo">{{ item.Group.Caption }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Contenido" v-html="asHtml(item.VersionsSummary)"></md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Público">{{ formatBool(!item.IsPrivate) }}</md-table-cell>
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Recomendado">{{ formatBool(item.IsSuggestion) }}</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap" v-if="isAdmin">
							<md-button class="md-icon-button" @click="openEdition(item)">
								<md-icon>edit</md-icon>
								<md-tooltip md-direction="bottom">Modificar</md-tooltip>
							</md-button>
							<md-button v-if="item.Metadata" class="md-icon-button" @click="openMetadata(item.Metadata)">
								<div class="metadataLabel">{{ item.Metadata.Id }}</div>
								<md-icon :style="'color: #' + resolveColor(item)">label</md-icon>
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
import BoundaryPopup from './BoundaryPopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';
import c from '@/common/framework/color';

	export default {
		name: 'Boundaries',
		components: {
			BoundaryPopup,
			MetadataPopup
		},
	data() {
		return {
			list: [],
			uniqueMetadatas: [],
			groups: [],
			};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		},
	},
	mounted() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo delimitaciones', window.Db,
				window.Db.GetBoundaries).then(function(data) {
					arr.AddRange(loc.list, data);
					loc.list.forEach(item => {
						const id = item?.Metadata?.Id;
						if (id && !this.uniqueMetadatas.includes(id)) {
							loc.uniqueMetadatas.push(id);
						}
					});
			});
		var loc = this;
		window.Context.BoundaryGroups.GetAll(function (data) {
			arr.AddRange(loc.groups, data);
		});
	},
	methods: {
		formatBool(v) {
			return (v ? 'Sí' : '-');
		},
		createNewBoundary() {
			var loc = this;
			window.Context.Factory.GetCopy('Boundary', function(data) {
					loc.openEdition(data);
			});
		},
		asHtml(text) {
			if (text) {
				return text.replace('\n', '<br>');
			} else {
				return '';
			}

		},
		openEdition(item) {
			this.$refs.editPopup.show(item, this.groups);
		},
		openMetadata(item) {
			this.$refs.editMetadataPopup.show(item);
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
