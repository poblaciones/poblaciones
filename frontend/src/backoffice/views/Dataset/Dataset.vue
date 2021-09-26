<template>
	<div>
		<invoker ref="invoker"></invoker>
		<import-popup ref="importPopup"></import-popup>

		<div v-if="Work.CanEdit()">
				<div class="topToolbar">
					<md-button @click="beginCloneDataset" >
						<md-icon>file_copy</md-icon>
						Duplicar dataset
					</md-button>

				<md-button @click="deleteDataset">
						<md-icon>delete</md-icon>
						Eliminar dataset
					</md-button>
				</div>
			<div style="height: 48px;"></div>
		</div>

		<div class="app-container">
			<div class="md-layout md-gutter">
				<div class="md-layout-item md-size-100">
					<md-card>
						<md-card-content>

							<div v-if="Dataset" class="md-layout md-gutter">
									<div class="md-layout-item md-size-80 md-small-size-100">
										<mp-text :canEdit="Work.CanEdit()" label="Título" :maxlength="100"
														 helper="Nombre del dataset. Ej. Escuelas primarias."
														 :required="true" @update="Update"
														 v-model="Dataset.properties.Caption" />
								</div>
							</div>

							<div>
								<div v-if="Dataset && !Dataset.properties.Table">
										<md-card style="max-width: 400px; margin-top: 15px; margin-left: 15px; padding: 15px 15px 3px 15px;">
											<md-card-content v-if="Work.CanEdit()">
												El dataset está vacío. Para agregarle información,
												seleccione la acción Importar.
												<md-button @click="upload" class="md-raised" style="margin-left: 30px;
																 margin-top: 45px;">
												<md-icon>cloud_upload</md-icon> Importar
												</md-button>
											</md-card-content>
											<md-card-content v-else>
												El dataset está vacío.
											</md-card-content>
										</md-card>
								</div>
								<md-tabs v-else md-sync-route ref="tabs">
											<template slot="md-tab" slot-scope="{ tab }">
												{{ tab.label }}  <i class="badge" v-if="tab.data.badge">{{ tab.data.badge }}</i>
													<mp-help :text="tab.data.help" :large="true" />
											</template>

											<md-tab style='flex: 1 0 100% !important;overflow-x: auto;' id="metrics" md-label="Indicadores"
														:to="makePath('metrics')" :md-active="isPath(makePath('metrics'))"
													:md-template-data="{ badge: (Dataset && Dataset.MetricVersionLevels ? Dataset.MetricVersionLevels.length : ''), help: `
														<p>
															Los indicadores vuelven la información visible en el mapa.
														</p><p>
															Cada indicador muestra un aspecto de los datos (ej. Nivel educativo, Antiguedad de la escuela), pudiendo seleccionarse colores y criterios de segmentación para las variables utilizadas.
														</p>`}" >
												<metrics-tab></metrics-tab>
											</md-tab>
											<md-tab style='flex: 1 0 100% !important;' id="georeference" md-label="Georreferenciar"
															:to="makePath('georeference')" :md-active="isPath(makePath('georeference'))"
															:md-template-data="{ help: `<p>
													La georreferenciación es el proceso que vincula los datos con una ubicación espacial en el mapa. Para poder publicar los datos es necesario previamente georreferenciarlos.
												</p>
												<p>
													Existen tres formas de georreferenciar los datos:
												</p>
												<ul style='padding-left: 20px;'>
													<li>
														Ubicaciones: esta modalidad supone que cada fila del dataset contiene una coordenada especificada por latitud y longitud.
													</li>
													<li>
														Códigos: al referenciar por código, se requiere que cada fila del dataset posea un código compatible con las geografías definidas en la plataforma.
																Estos códigos pueden ser códigos de Provincia, Departamento o Radio, homologados según su uso en los censos de los años 1991, 2001 y 2010.
													</li>
													<li>
														Polígonos: se identifica la localización de la fila por el reconocimiento de un polígono en alguna de las variables del dataset, en formato Well-known-text (WKT) o GeoJson.
													</li>
												</ul>` }">
												<georeference-tab></georeference-tab>
											</md-tab>
											<md-tab style='flex: 1 0 100% !important;' id="data" md-label="Datos" @click="EnsureColumns"
															:to="makePath('data')" :md-active="isPath(makePath('data'))"
															:md-template-data="{ help: `
															<p>
																La información de un dataset debe ser incorporada mediante la importación
																de sus datos a partir de un archivo de texto separados por comas (.CSV) o
																archivos de formato SPSS (.SAV).
															</p><p>
																Una vez incorporada la información,
																es posible volver a importar los datos en caso de haberse agregado nuevas
																filas o nuevas columnas a la información primaria.
															</p>` }">
												<data-tab></data-tab>
											</md-tab>
											<md-tab style='flex: 1 0 100% !important;' id="variables" md-label="Variables" @click="EnsureColumns"
															:to="makePath('variables')" :md-active="isPath(makePath('variables'))"
																:md-template-data="{ help: `<p>
															El listado de variables detalla qué variables (columnas) posee el dataset.
														</p><p>
															Permite modificar sus descripciones, etiquetas de valores, remover variables y
															recodificarlas (convertir en códigos numéricos con etiquetas) variables
															existentes.</p>` }">
													<columns-tab></columns-tab>
												</md-tab>
												<md-tab style='flex: 1 0 100% !important;' id="identity" md-label="Identificación"
															:to="makePath('identity')" :md-active="isPath(makePath('identity'))"
																:md-template-data="{ help: `
															<p>
																La identificación permite indicar las variables para la ficha de resumen de cada elemento.
															</p><p>
																Pueden elegirse opcionalmente la variable que contenga la descripción de cada fila (ej. Nombre de escuela),
																así como especificar un ícono para los elementos del dataset.
															</p>`}" >
													<identity-tab></identity-tab>
												</md-tab>
												<md-tab v-if="Work.Datasets.length > 1" id="multilevel" md-label="Multinivel"
														:to="makePath('multilevel')" :md-active="isPath(makePath('multilevel'))"
															>
													<multilevel-tab></multilevel-tab>
												</md-tab>
											</md-tabs>
								</div>
						</md-card-content>
					</md-card>
				</div>
			</div>
		</div>
		<md-dialog-prompt
				:md-active.sync="activateSaveAs"
				v-model="newDatasetName"
				md-title="Duplicar dataset"
				md-input-maxlength="100"
				md-input-placeholder="Nombre de la nueva copia..."
				md-confirm-text="Guardar"
				md-cancel-text="Cancelar"
				@md-confirm="performSaveAsDataset">
		</md-dialog-prompt>

	</div>
</template>

<script>
import DataTab from './DataTab.vue';
import ColumnsTab from './ColumnsTab.vue';
import IdentityTab from './IdentityTab.vue';
import MetricsTab from './../Metric/MetricsTab.vue';
import MultilevelTab from './MultilevelTab.vue';
import GeoreferenceTab from './Georeference/GeoreferenceTab.vue';
import ImportPopup from "./ImportPopup";

export default {
	name: 'datasets',
	components: {
		DataTab,
		ColumnsTab,
		IdentityTab,
		ImportPopup,
		MultilevelTab,
		MetricsTab,
		GeoreferenceTab
	},
	mounted() {
		var datasetId = this.$route.params.datasetId;
		window.Db.BindDataset(datasetId);
	},
	data() {
		return {
			activateSaveAs: false,
			newDatasetName: ''
			};
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
	},
	methods: {
		EnsureColumns() {
			if (this.Dataset) {
				this.$refs.invoker.doMessage('Obteniendo información del dataset', this.Dataset,
					this.Dataset.EnsureColumnsAndExec);
			}
		},
		isPath(path) {
			if (this.$refs.tabs) {
				if (this.$route.path.endsWith('/variables')) {
					this.$refs.tabs.activeTab = 'variables';
				} else if (this.$route.path.endsWith('/georeference')) {
					this.$refs.tabs.activeTab = 'georeference';
				} else if (this.$route.path.endsWith('/multilevel')) {
					this.$refs.tabs.activeTab = 'multilevel';
				} else if (this.$route.path.endsWith('/data')) {
					this.$refs.tabs.activeTab = 'data';
				} else if (this.$route.path.endsWith('/identity')) {
					this.$refs.tabs.activeTab = 'identity';
				} else {
					this.$refs.tabs.activeTab = 'metrics';
				}
			}
			return this.$route.path === path;
		},
		makePath(relativePath) {
			if (!this.Work || !this.Dataset) {
				return '';
			} else {
				return '/cartographies/' + this.Work.properties.Id + '/datasets/' +
							this.Dataset.properties.Id + (relativePath === '' ? '' : '/') + relativePath;
			}
		},
		beginCloneDataset() {
			this.newDatasetName = 'Copia de ' + this.Dataset.properties.Caption;
			this.activateSaveAs = true;
		},
		upload() {
      this.$refs.importPopup.show();
    },
		performSaveAsDataset() {
			var loc = this;
			if (this.newDatasetName.trim().length === 0) {
				alert('Debe indicar un nombre.');
				this.$nextTick(() => {
					loc.activateSaveAs = true;
				});
				return;
			}
			this.$refs.invoker.doSave(this.Dataset,
														this.Dataset.CloneDataset,
															this.Work.properties.Id, this.newDatasetName.trim())
															.then(function(data) {
																	loc.$refs.invoker.doMessage('Obteniendo dataset', window.Db, window.Db.RebindAndFocusLastDataset, loc.$router);
															});
		},
		deleteDataset() {
			var loc = this;
			this.$refs.invoker.confirm("Eliminar dataset", "El dataset con sus indicadores correspondientes serán eliminados",
					function () {
							loc.$refs.invoker.doMessage('Eliminando', loc.Dataset, loc.Dataset.DeleteDataset, loc.Work.properties.Id).then(
								function() {
									loc.$refs.invoker.doMessage('Obteniendo cartografía', window.Db, window.Db.RebindAndFocusMetadataContent, loc.$router);
								});
					});
		},
		Update() {
      this.$refs.invoker.doSave(this.Dataset, this.Dataset.Update);
		}
	},
	watch: {
		'Dataset.properties.Geocoded'() {
			window.Db.LoadWorks();
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.md-tab {
	flex: 1 0 101% !important;
	}

.topToolbar {
	position: fixed;
	padding-top: 4px;
	padding-bottom: 1px;
	line-height: 1.25;
	font-size: 25px;
	color: #676767;
	width: 100%;
	margin-top: -3px;
	z-index: 10;
	background-color: #f5f5f5;
	}

.badge {
  padding: 2px 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 6px;
  right: 6px;
  background: #b7b7b7;
  border-radius: 6px;
  color: #fff;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: -.05em;
  font-family: 'Roboto Mono', monospace;
}
</style>

