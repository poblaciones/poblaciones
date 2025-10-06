<template>
  <div>

		<md-dialog :md-active.sync="openEditableAttach">

			<invoker ref="invoker"></invoker>
			<md-dialog-title>
				Archivo adjunto
			</md-dialog-title>

			<md-dialog-content>
				<p>
					Indique el archivo que desea adjuntar y la descripción con que debe ser mostrado.
				</p>
				<div v-if="!isNew && this.item !== null" class="md-layout md-gutter">
						<div class="md-layout-item md-size-100">
							<mp-simple-text label="Descripción" ref="inputName" :maxlength="200"
															v-model="localCaption" @enter="save()" :canEdit="canEdit" />
						</div>
				</div>
				<div class="md-layout md-gutter" v-if="!isNew">
						<div class="md-layout-item md-size-20">
							<label>Tamaño: </label>
						</div>
						<div class="md-layout-item md-size-80">
								<label>{{ formatFile('PDF', item.File.Size, item.File.Pages) }}</label>
						</div>
				</div>
				<div v-if="canEdit" class="md-layout md-gutter">
						<div class="md-layout-item md-size-20" style="padding-top: 30px;">
										<label>Archivo:</label>
						</div>
						<div class="md-layout-item md-size-80">

										<vue-dropzone style="float:left" ref="myVueDropzone" id="drop1"
																	@vdropzone-success="afterSuccess"
																	@vdropzone-complete="afterComplete"
																	@vdropzone-sending="beforeSending"
																	@vdropzone-max-files-exceeded="maxfilesexceeded"
											:options="dropzoneOptions">
										</vue-dropzone>
							<md-button style="float:left;background-color: #ececec;" v-if="hasFiles" class="md-icon-button" @click="clear">
								<md-icon>close</md-icon>
								<md-tooltip md-direction="bottom">Quitar</md-tooltip>
							</md-button>
						</div>
				</div>
				<div v-if="isNew && this.item !== null" class="md-layout md-gutter">
						<div class="md-layout-item md-size-100">
							<mp-simple-text label="Descripción" :maxlength="200"
															v-model="localCaption" @enter="save()" :canEdit="canEdit" />
						</div>
				</div>

			</md-dialog-content>

		<md-dialog-actions>
			<div v-if="canEdit">
				<md-button @click="openEditableAttach = false">Cancelar</md-button>
				<md-button class="md-primary" :disabled="sending" @click="save()">Aceptar</md-button>
			</div>
			<div v-else>
						<md-button @click="openEditableAttach = false">Cerrar</md-button>
				</div>
		</md-dialog-actions>
		</md-dialog>
    </div>
  </template>

<script>
import Context from '@/backoffice/classes/Context';
import vue2Dropzone from 'vue2-dropzone';
import 'vue2-dropzone/dist/vue2Dropzone.min.css';
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';

export default {
		name: 'Adjuntos',
		props: [
			'canEdit',
			'Metadata'
		],
  data() {
		var loc = this;
    return {
      list: null,
      done: null,
			item: null,
			hasFiles: false,
			bucketId: '',
			localCaption: '',
			sending: false,
			saveRequested: false,
      openEditableAttach: false,
      dropzoneOptions: {
        url: this.getCreateFileUrl,
				thumbnailWidth: 150,
				acceptedFiles: 'application/pdf',
				maxFiles: 1,
				maxFilesize: 50, // File size in Mb,
				withCredentials: true,
				dictDefaultMessage: 'Arrastre su archivo aquí o haga click para examinar.',
				forceChunking: true,
		    chunking: true,
				chunkSize: 500000,
        chunksUploaded: function(file, done) {
          done();
        }
			}
    };
  },
  computed: {
		isNew() {
			return this.item === null || this.item.File === null || this.item.File.Id === null;
		},
		metadata() {
			return this.Metadata.properties;
		}
	},
	methods: {
		getCreateFileUrl() {
      return window.Context.GetCreateFileUrl(this.getBucketId());
    },
    getBucketId() {
      return this.bucketId;
    },
    show(item) {
			this.bucketId = new Date().getTime() * 10000;
      this.sending = false;
			this.hasFiles = false;
			this.item = item;
			this.localCaption = this.item.Caption;
	    this.openEditableAttach = true;
			if (!this.isNew) {
				var loc = this;
				setTimeout(() => {
					loc.$refs.inputName.focus();
				}, 100);
			}
	 	},
		formatFile(type, size) {
			return f.formatFile(type, size);
		},
		IsNotUniqueName() {
			for(var n = 0; n < this.Metadata.Files.length; n++) {
				if (this.Metadata.Files[n].Caption === this.localCaption &&
					this.Metadata.Files[n].Id !== this.item.Id) {
					return true;
				}
			}
			return false;
		},
		save() {
			if (this.item.Caption === '') {
				alert('Debe indicar una descripción para el adjunto.');
				return;
			}
			if (this.IsNotUniqueName()) {
				alert('Ya existe un adjunto con esa descripción.');
				return;
			}
			if (this.sending) {
				this.saveRequested = true;
				return;
			}
			this.saveRequested = false;
			var loc = this;
			var itemToUpdate = f.clone(this.item);
			itemToUpdate.Caption = this.localCaption;
			this.$refs.invoker.doSave(this.Metadata, this.Metadata.UpdateFile, itemToUpdate, (this.hasFiles ? this.bucketId : null)).then(
					function() {
						loc.openEditableAttach = false;
						loc.bucketId = '';
				});
	  },
		maxfilesexceeded(file) {
			this.$refs.myVueDropzone.removeAllFiles();
			this.$refs.myVueDropzone.addFile(file);
		},
		clear() {
			this.$refs.myVueDropzone.removeAllFiles();
			this.hasFiles = false;
		},
    beforeSending(file) {
			this.item.File.Name = file.name;
			this.item.File.Type = 'application/pdf';
			if (this.localCaption === '' || this.localCaption === null) {
				this.localCaption = str.Replace(file.name,'.pdf', '');
			}
			this.sending = true;
    },
    afterComplete(file, response) {
			this.sending = false;
			this.hasFiles = true;
    },
    afterSuccess(file, response) {
			this.sending = false;
			this.hasFiles = true;
    }
  },
  components: {
   vueDropzone: vue2Dropzone,
   }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.form-wrapper {
  margin: 20px;
}

.md-card .md-title {
  margin-top: 0;
  font-size: 18px;
  letter-spacing: 0;
  line-height: 18px;
}

.md-card-header {
  padding: 10px;
}

.full-width{
    width: 100%;
}
</style>

<style rel="stylesheet/scss" lang="scss">

#drop1 {
  padding: 6px;
}

.dz-preview {
	margin: 0px !important;
}
.dropzone {
	min-height: unset ! important;
	padding: 0px!important;
  width: 200px;
  margin-top: 6px;
}

.dropzone .dz-message {
  text-align: left!important;
  padding-left: 20px;
  padding-right: 20px;
}

.dropzone .dz-preview {
  background: #666;
  height: 100px !important;
}
</style>
