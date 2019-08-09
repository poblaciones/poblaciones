<template>
  <div v-if="Dataset">
    <md-dialog :md-active.sync="openDialog">
      <md-dialog-title>Nivelar</md-dialog-title>
			<invoker ref="invoker"></invoker>

			<md-dialog-content>
        <div>
          <p>La herramienta para nivelar le permite establecer para todos los indicadores del dataset
					actual los puntos de corte de otro dataset. Esto permite administrar series
					utilizando segmentaciones uniformes entre datasets.
				</p>
					<p>
						Para poder nivelar series de indicadores es necesario que los indicadores existan en ambos
						datasets y que posean fórmulas idénticas (mismo nombre de variable de datos y de normalización).
					</p>
					<p>
						Seleccione el dataset del que quiere tomar los niveles de referencia:
					</p>
        </div>
				<div class='md-layout'>
					<div class='md-layout-item md-size-75 md-small-size-100'>
						<mp-select :list="relatedWorks" :allowNull="true"
						label="Cartografía" helper="Origen del dataset a utilizar"
						v-model="sourceWork" :render="formatWork"
												/>
					</div>
					<div class='md-layout-item md-size-75 md-small-size-100'>
						<mp-select :list="relatedDatasets" :allowNull="true"
						label="Dataset" helper="Dataset a utilizar como referencia"
						v-model="sourceDataset" :render="formatDataset"
												/>
					</div>
				</div>
				 <div>
          <p>* Coincide el tipo de nivel de georreferenciación con el dataset actual.
					</p>
        </div>
      </md-dialog-content>

      <md-dialog-actions>
        <md-button @click="openDialog = false">Cancelar</md-button>
        <md-button class="md-primary" @click="save()">Aceptar</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
import Context from "@/backoffice/classes/Context";

export default {
  name: "General",
  data() {
    return {
      openDialog: false,
			sourceDataset: null,
			sourceWork: null,
			allRelatedDatasets: []
    };
  },
  computed: {
    Work() {
      return window.Context.CurrentWork;
    },
    Dataset() {
      return window.Context.CurrentDataset;
    },
		relatedWorks() {
			var ret = [];
			var retKeys = [];
			for(var n = 0; n < this.allRelatedDatasets.length; n++) {
				if (retKeys.includes(this.allRelatedDatasets[n].Work.Id) === false) {
					ret.push(this.allRelatedDatasets[n].Work);
					retKeys.push(this.allRelatedDatasets[n].Work.Id);
				}
			}
			return ret;
		},
		relatedDatasets() {
			var ret = [];
			if (this.sourceWork === null) {
				return ret;
			}
			for(var n = 0; n < this.allRelatedDatasets.length; n++) {
				if (this.allRelatedDatasets[n].Work.Id === this.sourceWork.Id) {
					ret.push(this.allRelatedDatasets[n]);
				}
			}
			return ret;
		},
  },
  methods: {
    save() {
			var loc = this;
			if (this.sourceDataset === null) {
				alert('Debe seleccionar un dataset.');
				return;
			}
			this.$refs.invoker.do(this.Dataset, this.Dataset.LevelMetrics, this.sourceDataset.Id).then(
							function() {
								loc.openDialog = false;
							});
		},
		formatWork(work) {
			return work.Metadata.Title;
		},
		geographyMatches(dataset) {
			return dataset.Geography !== null &&
					this.Dataset.properties.Geography !== null &&
					dataset.Geography.Caption === this.Dataset.properties.Geography.Caption;
		},
		formatDataset(dataset) {
			var ret = dataset.Caption;
			if (this.geographyMatches(dataset)) {
				ret += "*";
			}
			return ret;
		},
		selectedDefaultWork() {
			for(var n = 0; n < this.allRelatedDatasets.length; n++) {
				var dataset = this.allRelatedDatasets[n];
				if (this.geographyMatches(dataset)) {
					this.sourceWork = dataset.Work;
					return;
				}
			}
			this.sourceWork = null;
		},
		selectedDefaultDataset() {
			if (this.sourceWork !== null) {
				for(var n = 0; n < this.relatedDatasets.length; n++) {
					var dataset = this.relatedDatasets[n];
					if (this.geographyMatches(dataset)) {
						this.sourceDataset = dataset;
						return;
					}
				}
			}
			this.sourceDataset = null;
		},
		show(allRelatedDatasets) {
			this.allRelatedDatasets = allRelatedDatasets;
			this.selectedDefaultWork();
			this.openDialog = true;
		}
	},
	components: {
	},
	watch: {
		'sourceWork'() {
			this.selectedDefaultDataset();
		}
	}
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
</style>
