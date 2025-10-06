<template>
	<div>
		<invoker ref="invoker"></invoker>

		<attachment-popup ref="editPopup" :canEdit="canEdit" :Metadata="Metadata">
		</attachment-popup>

		<div v-if="canEdit" class="md-layout">
			<md-button @click="createNewAttachment()">
				<md-icon>add_circle_outline</md-icon>
				Agregar adjunto
			</md-button>
		</div>
		<div class="md-layout">
			<div class="md-layout-item">
				<md-table v-model="list" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell @click.native="openEdition(item)" class="selectable" md-label="Nombre">{{ item.Caption }}</md-table-cell>
						<md-table-cell md-label="Archivo">
							<a v-if="item.File !== null" target="_blank" :href="getAttachUrl(item)">{{ formatFile('PDF', item.File.Size, item.File.Pages) }}</a>
						</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<div v-if="canEdit">
								<md-button class="md-icon-button" @click="openEdition(item)">
									<md-icon>edit</md-icon>
									<md-tooltip md-direction="bottom">Modificar adjunto</md-tooltip>
								</md-button>
								<md-button v-if="!isFirst(item)" class="md-icon-button" @click="up(item)">
									<md-icon>arrow_upward</md-icon>
									<md-tooltip md-direction="bottom">Subir una ubicación</md-tooltip>
								</md-button>
								<md-button v-if="!isLast(item)" class="md-icon-button" @click="down(item)">
									<md-icon>arrow_downward</md-icon>
									<md-tooltip md-direction="bottom">Bajar una ubicación</md-tooltip>
								</md-button>
								<md-button class="md-icon-button" @click="onDelete(item)">
									<md-icon>delete</md-icon>
									<md-tooltip md-direction="bottom">Eliminar adjunto</md-tooltip>
								</md-button>
							</div>
							<md-button v-else="" class="md-icon-button" @click="openEdition(item)">
								<md-icon>remove_red_eye</md-icon>
								<md-tooltip md-direction="bottom">Ver adjunto</md-tooltip>
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
import AttachmentPopup from './AttachmentPopup.vue';
import f from '@/backoffice/classes/Formatter';

export default {
		name: 'Adjuntos',
		props: [
			'canEdit',
			'Metadata'
		],
	data() {
		return {

			};
	},
	computed: {
		list() {
			return this.Metadata.Files;
		}
	},
	methods: {
		createNewAttachment() {
			var loc = this;
			window.Context.Factory.GetCopy('MetadataFile', function(data) {
					loc.openEdition(data);
			});
    },
		formatFile(type, size, pages) {
			return f.formatFile(type, size, pages);
		},
		isFirst(item) {
			return this.Metadata.Files[0] === item;
		},
		isLast(item) {
			return this.Metadata.Files[this.Metadata.Files.length - 1] === item;
		},
		getAttachUrl(item) {
			return window.host + '/services/' + (this.Metadata.WorkId() ? 'backoffice' : 'admin') + '/GetMetadataFile?m=' + this.Metadata.properties.Id + '&f=' + item.File.Id;
		},
		openEdition(item) {
			this.$refs.editPopup.show(item);
		},
		onDelete(item) {
			this.$refs.invoker.message = 'Eliminando...';
			this.$refs.invoker.confirmDo('Eliminar archivo adjunto', 'El adjunto seleccionado será eliminado',
				this.Metadata, this.Metadata.DeleteFile, item);
		},
    up(item) {
			this.$refs.invoker.doSave(this.Metadata, this.Metadata.MoveFileUp, item);
    },
    down(item) {
			this.$refs.invoker.doSave(this.Metadata, this.Metadata.MoveFileDown, item);
    },
  },
  components: {
      AttachmentPopup,
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
