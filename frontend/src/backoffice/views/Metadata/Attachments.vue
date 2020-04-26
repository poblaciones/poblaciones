<template>
	<div>
		<title-bar title="Adjuntos" help="<p>
			La sección de adjuntos permite agregar archivos que complementen la comprensión o descripción
			de los datos puestos a disposición.
			</p><p>Estos pueden incluir artículos publicados en base a los mismos datos, informes del trabajo de
			campo, especificación del muestreo o las herramientas utilizadas para la construcción de la información,
			cuestionarios, tablas detalladas de códigos o descriptores geográficos, entre otros.
			</p><p>No debe incluirse aquí un adjunto con los metadatos generales ni con las listas de variables
			de los datasets ya que dicha información se brinda a los usuarios en forma automática.
			</p><p>El tipo de archivo permitido es Acrobat/PDF.
		</p>" />

		<div class="app-container">
			<invoker ref="invoker"></invoker>

			<attachment-popup ref="editPopup">
			</attachment-popup>

			<div v-if="Work.CanEdit()" class="md-layout">
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
								<div v-if="Work.CanEdit()">
									<md-button class="md-icon-button" title="Modificar adjunto" @click="openEdition(item)">
										<md-icon>edit</md-icon>
									</md-button>
									<md-button v-if="!isFirst(item)" title="Subir una ubicación" class="md-icon-button" @click="up(item)">
										<md-icon>arrow_upward</md-icon>
									</md-button>
									<md-button v-if="!isLast(item)" title="Bajar una ubicación" class="md-icon-button" @click="down(item)">
										<md-icon>arrow_downward</md-icon>
									</md-button>
									<md-button class="md-icon-button" title="Eliminar adjunto" @click="onDelete(item)">
										<md-icon>delete</md-icon>
									</md-button>
								</div>
								<md-button v-else="" class="md-icon-button" title="Ver adjunto" @click="openEdition(item)">
									<md-icon>remove_red_eye</md-icon>
								</md-button>

							</md-table-cell>
						</md-table-row>
					</md-table>
				</div>
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
	data() {
		return {

			};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		list() {
			return this.Work.Files;
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
			return this.Work.Files[0] === item;
		},
		isLast(item) {
			return this.Work.Files[this.Work.Files.length - 1] === item;
		},
		getAttachUrl(item) {
			return window.host + '/services/backoffice/GetMetadataFile?m=' + this.Work.properties.Metadata.Id + '&f=' + item.File.Id;
		},
		openEdition(item) {
			this.$refs.editPopup.show(item);
		},
		onDelete(item) {
			this.$refs.invoker.confirmDo('Eliminar archivo adjunto', 'El adjunto seleccionado será eliminado',
					this.Work, this.Work.DeleteFile, item);
		},
    up(item) {
      this.$refs.invoker.do(this.Work, this.Work.MoveFileUp, item);
    },
    down(item) {
      this.$refs.invoker.do(this.Work, this.Work.MoveFileDown, item);
    },
  },
  components: {
      AttachmentPopup,
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-layout-item .md-size-15 {
    padding: 0 !important;
}

.md-layout-item .md-size-25 {
    padding: 0 !important;
}

.md-layout-item .md-size-20 {
    padding: 0 !important;
}

.md-layout-item .md-size-10 {
    padding: 0 !important;
}

.md-avatar {
    min-width: 200px;
    min-height: 200px;
    border-radius: 200px;
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
