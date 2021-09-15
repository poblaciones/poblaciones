<template>
  <div>
    <md-dialog :md-active.sync="openImport">
      <md-dialog-title>Importar datos</md-dialog-title>

      <stepper ref="stepper" title="Importando datos" @closed="onCloseStepper"></stepper>
      <md-dialog-content>
        <div>
          <p>Seleccione el archivo que desea importar. Los tipos de archivo aceptados son:</p>
					<ul>
						<li>Archivos Excel (.xls, xlsx)</li>
						<li>Archivos de datos de SPSS (.sav)</li>
						<li>Archivos de texto separados por comas (.csv)</li>
						<li>Archivos de texto estructurados en tags (.kml/.kmz)</li>
					</ul>
					<!--
					https://poblaciones.org/wp-content/uploads/2019/11/Poblaciones-Como-convertir-shapefiles-a-CSV-con-QGIS.pdf
						-->
        </div>

        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-100">
            <vue-dropzone style="float:left"
              ref="myVueDropzone"
              @vdropzone-success="afterSuccess"
              @vdropzone-complete="afterComplete"
              @vdropzone-sending="beforeSending"
							@vdropzone-max-files-exceeded="maxfilesexceeded"
              id="dropzone"
              :options="dropzoneOptions"
            >
						</vue-dropzone>
						<md-button style="float:left;background-color: #ececec;" v-if="hasFiles" title="Quitar" class="md-icon-button" v-on:click="clear">
							<md-icon>close</md-icon>
						</md-button>
						<div class="messageBlock" v-if="verifying">Analizando archivo...</div>
						<div class="messageBlock" v-if="selectedSheet !== null && selectedSheet.Caption !== '' && selectedSheet.Caption !== false">Dataset: {{ selectedSheet.Caption }}</div>
          </div>
					<div v-if="Dataset !== null && Dataset.Columns !== null && Dataset.Columns.length > 0" class="md-layout-item md-size-100" style="margin-top: -10px; margin-bottom: 12px;">
						<p>
							<md-switch class="md-primary" v-model="keepLabels">
								Mantener etiquetas de variables coincidentes

						<div class="mp-label" style="margin-top: 4px; margin-bottom: 4px">
							Cuando una variable sea de igual nombre que una existente, su etiqueta
							y las etiquetas de sus valores se conservarán. Si desea en cambio actualizarlos, desmarque 'Mantener etiquetas'.
						</div>
							</md-switch>
						</p>
					</div>

				</div>
      </md-dialog-content>
			<input-popup ref="datasetDialog" @selected="CreateDataset" />
			<list-selection-popup ref="datasetSelectionDialog" @selected="SaveDatasetSelected" />
			<invoker ref="invoker"></invoker>

      <md-dialog-actions>
        <md-button @click="openImport = false">Cancelar</md-button>
        <md-button class="md-primary" :disabled="sending || verifying" @click="save()">Aceptar</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
import InputPopup from "@/backoffice/components/InputPopup";
import ListSelectionPopup from "@/backoffice/components/ListSelectionPopup";
import vueDropzone from "vue2-dropzone";
import "vue2-dropzone/dist/vue2Dropzone.min.css";
import h from '@/public/js/helper';

export default {
  name: "General",
	components: {
		vueDropzone,
		InputPopup,
		ListSelectionPopup
	},
  data() {
    return {
      openImport: false,
      extension: "",
			sending: false,
			verifying: false,
      hasFiles: false,
      bucketId: 0,
			selectedSheet: null,
      keepLabels: true,
      createdDataset: null,
      forceCreateNewDataset: false,
      dropzoneOptions: {
        url: this.getCreateFileUrl,
        thumbnailWidth: 150,
        withCredentials: true,
        maxFiles: 1,
        acceptedFiles: '.csv,.txt,.sav,.kml,.kmz,.xls,.xlsx',
        dictDefaultMessage: "Arrastre su archivo aquí o haga click para examinar.",
        forceChunking: true,
        chunking: true,
        chunkSize: 500000,
        datasets: null,
        chunksUploaded: function(file, done) {
          done();
        }
      }
    };
  },
  computed: {
    Work() {
      return window.Context.CurrentWork;
    },
    Dataset() {
      return (this.forceCreateNewDataset ? null : window.Context.CurrentDataset);
		},
  },
  methods: {
    getCreateFileUrl() {
      return this.Work.GetCreateFileUrl(this.getBucketId());
    },
    getBucketId() {
      return this.bucketId;
    },
    beforeSending(file) {
			this.extension = h.extractFileExtension(file.name);
			this.filename = h.extractFilename(file.name);
			this.createdDataset = null;
			this.datasets = null;
			this.selectedSheet = null;
			this.sending = true;
    },
		maxfilesexceeded(file) {
			this.$refs.myVueDropzone.removeAllFiles();
			this.$refs.myVueDropzone.addFile(file);
		},
		clear() {
			this.$refs.myVueDropzone.removeAllFiles();
			this.generateBucketId();
			this.hasFiles = false;
			this.verifying = false;
			this.datasets = null;
			this.selectedSheet = null;
		},
    afterSuccess(file, response) {
      this.sending = false;
			this.hasFiles = true;
			if (this.extension == 'kml' || this.extension == 'kmz' ||
				this.extension == 'xlsx' || this.extension == 'xls') {
				this.verifyDatasets(this.getBucketId(), this.extension);
			}
    },
    verifyDatasets(bucketId, fileExtension) {
			var loc = this;
			this.verifying = true;
			this.Work.VerifyDatasetsImportFile(bucketId, fileExtension).then(
				function (list) {
					if (!loc.verifying || loc.getBucketId() !== bucketId) {
						return;
					}
					if (list.length > 1) {
						loc.datasets = list;
						loc.RequestDatasetSelection();
					} else if (list.length == 1) {
						loc.selectedSheet = list[0];
					} else {
						loc.selectedSheet = null;
					}
				}).finally(function () {
					loc.verifying = false;
				});
    },
		RequestDatasetSelection() {
			var allItem = this.hasAllItemOnSheets();
			var text =  "Seleccione uno de los datasets dentro del archivo a importar";
			if (allItem) {
				text += ", o elija la opción 'TODOS' para incorporar la totalidad de los contenidos del archivo";
			}
      this.$refs.datasetSelectionDialog.show(
        'Selección de dataset',
				text,
				this.selectedSheet,
				this.datasets,
				allItem);
		},
    SaveDatasetSelected(item) {
      var loc = this;
			loc.selectedSheet = item;
			if (!loc.selectedSheet || loc.selectedSheet.Caption == ''){
        loc.clear();
      }
    },
    afterComplete(file) {
      this.sending = false;
    },
		hasAllItemOnSheets() {
			return this.extension == 'kml' || this.extension == 'kmz';
		},
    save() {
      var stepper = this.$refs.stepper;
      stepper.startUrl = this.Work.GetDatasetFileImportUrl(this.keepLabels);
      stepper.stepUrl = this.Work.GetStepDatasetFileImportUrl();
      let bucketId = this.getBucketId();
      let extension = this.extension;
      if (extension !== 'sav' && extension !== 'csv' && extension !== 'txt'
          && extension !== 'xls' && extension !== 'xlsx'
          && extension !== 'kml' && extension !== 'kmz') {
				alert('La extensión del archivo debe ser CSV, TXT, XLS, XLSX, SAV, KML o KMZ.');
        return;
      }
      if (!this.Dataset && !this.createdDataset) {
        this.RequestDataset();
        return;
      }
			let datasetId = (this.Dataset ? this.Dataset.properties.Id : this.createdDataset.Id);
			stepper.args = { b: bucketId, d: datasetId, fe: extension, s: (this.selectedSheet ? this.selectedSheet.Id : null) };
			let loc = this;
			stepper.Start().then(function() {
				loc.Work.WorkChanged();
				if (loc.Dataset) {
					loc.Dataset.ReloadProperties();
					loc.Dataset.ReloadColumns();
				} else {
					loc.$refs.invoker.doMessage('Obteniendo dataset', window.Db, window.Db.RebindAndFocusLastDataset, loc.$router);
				}
			});
		},
		onCloseStepper(success) {
			if (success) {
				this.openImport = false;
			}
		},
		RequestDataset() {
			var suggested = this.filename;
			if (this.selectedSheet && this.selectedSheet.Caption && this.selectedSheet.Caption !== 'Sheet1' && this.selectedSheet.Caption !== 'Hoja1' && this.selectedSheet.Caption !== '[ TODOS ]') {
				suggested = this.selectedSheet.Caption;
			}
			this.$refs.datasetDialog.show('Importar', 'Indique un nombre para el dataset',
								'', 'Ej. Escuelas primarias.', suggested, 100);
		},
		CreateDataset(name) {
			var loc = this;
			this.$refs.invoker.doMessage('Creando dataset', this.Work,
				this.Work.CreateNewDataset,
				name.trim())
				.then(function (dataset) {
					loc.createdDataset = dataset;
					loc.save();
				});
		},
		generateBucketId() {
			this.bucketId = new Date().getTime() * 10000;
		},
		show(forceCreateNewDataset) {
			this.extension = '';
			this.generateBucketId();
			this.sending = false;
			this.verifying = false;
			this.selectedSheet = null;
			this.hasFiles = false;
			this.openImport = true;
			this.createdDataset = null;
			this.forceCreateNewDataset = forceCreateNewDataset;
		}
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.md-layout-item .md-size-25 {
  padding: 0 !important;
}
.hidden {
  display: none;
}

.visible {
  display: inline;
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
  width: 164px;
}

.dropzone .dz-preview {
  background: #666;
  height: 100px !important;
}

.messageBlock {
	padding: 10px;
	float: left;
}
</style>
