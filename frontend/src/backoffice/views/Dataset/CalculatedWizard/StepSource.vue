<template>
	<div>
		<div class="md-layout md-gutter">
			<div class="md-layout-item md-size-100 mp-label"
					 style="margin-bottom: 8px; padding-left: 12px!important; width: 1000px">
				Elementos a localizar en el {{ action }}
			</div>
			<div class="md-layout-item md-size-100">
				<md-chip class="md-primary" md-deletable @md-delete="clearMetric"
								 style="margin-top: 4px; margin-bottom: 18px;"
								 v-if="caption.length > 0">{{ caption }}{{ (versions.length == 1 ? ' (' + newMetric.SelectedVersion.Version.Name + ')': '') }}</md-chip>
			</div>
		</div>
		<div class="md-layout md-gutter" v-show="caption.length > 0">
			<div class="md-layout-item md-size-50 md-small-size-100" v-if="versions.length > 1">
				<mp-select :list="versions" :allowNull="false" :disabled="!newMetric.SourceMetric.Metric"
									 label="Edición" listKey="Id" :canEdit="versions.length > 1"
									 v-model="newMetric.SelectedVersion" :render="formatVersion" />
			</div>
			<div class="md-layout-item md-size-50 md-small-size-100" v-if="levels.length > 1 || showLevelName">
				<mp-select :list="levels" :allowNull="false" :disabled="!newMetric.SourceMetric.Metric"
									 label="Nivel" :canEdit="levels.length > 1"
									 v-model="newMetric.SelectedLevel" listCaption="Name" />
			</div>
			<div class="md-layout-item md-size-75 md-small-size-100" v-if="showVariable">
				<mp-select :list="variables" :allowNull="false" :disabled="!newMetric.SourceMetric.Metric"
									 label="Variable" :canEdit="variables.length > 1"
									 v-model="newMetric.SelectedVariable" listCaption="Name" />
			</div>
			<template v-if="showVariable && newMetric.SelectedVariable.IsCategorical">
				<div v-if="valueLabels.length > 0" class="md-layout-item md-size-100 md-small-size-100">
					Filtrar por: {{ showLevelName ? '(' + newMetric.SelectedLevel.Name + ')' : '' }}
				</div>
				<div v-if="valueLabels.length > 1" class="md-layout-item md-size-30 md-small-size-50">
					<md-checkbox class="md-primary" v-model="allCategories" @change="selectAll">[Todos] </md-checkbox>
				</div>
				<div v-for='valueLabel in valueLabels' :key='valueLabel.Id' :value='valueLabel.Id'
						 class="md-layout-item md-size-30 md-small-size-50">
					<md-checkbox class="md-primary" v-model="newMetric.Source.ValueLabelIds" :value="valueLabel.Id">{{ valueLabel.Name }}</md-checkbox>
				</div>
			</template>
		</div>
	</div>
</template>

<script>
import axiosClient from '@/common/js/axiosClient';

export default {
	//Step 2
	name: 'stepSource',
	components: {
	},
	props: {
		newMetric: {
			type: Object,
			default: function () {
				return {};
			},
		},
	},
	data() {
		return {
			allCategories: false,
			columnExists: null,
		};
	},
	computed: {
		caption() {
			if (this.newMetric.SourceMetric && this.newMetric.SourceMetric.Metric != null) {
				return this.newMetric.SourceMetric.Metric.Name;
			}
			return '';
		},
		action() {
			if (this.newMetric.Type == 'distance') {
				return 'rastreo';
			} else {
				return 'conteo';
			}
		},
		showVariable() {
			if (this.variables.length === 0) {
				return false;
			}
			if (this.variables.length === 1 && (this.newMetric.SelectedVariable.IsSimpleCount
																&& this.newMetric.SelectedVariable.ValueLabels.length < 2)) {
				return false;
			}
			return true;
		},
		showLevelName() {
			return this.newMetric.SelectedLevel && this.newMetric.SelectedLevel.HasArea && this.newMetric.SelectedLevel.Dataset.Type !== 'S';
		},
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
		versions() {
			if (this.newMetric.SourceMetric && this.newMetric.SourceMetric.Versions != null) {
				var ret = this.newMetric.SourceMetric.Versions;
				for (var n = 0; n < ret.length; n++) {
					ret[n].Id = ret[n].Version.Id;
				}
				return ret;
			}
			return [];
		},
		levels() {
			if (this.newMetric.SelectedVersion != null) {
				return this.newMetric.SelectedVersion.Levels;
			}
			return [];
		},
		variables() {
			if (this.newMetric.SelectedLevel != null) {
				return this.newMetric.SelectedLevel.Variables;
			}
			return [];
		},
		valueLabels() {
			if (this.newMetric.SelectedVariable != null) {
				return this.newMetric.SelectedVariable.ValueLabels;
			}
			return [];
		},
	},
	methods: {
		addMetric() {
			this.$refs.addMetricPopup.show();
		},
		formatVersion(version) {
			return version.Version.Name;
		},
		clearMetric() {
			this.newMetric.SourceMetric = null;
			this.newMetric.Source.VariableId = null;
			this.newMetric.Source.ValueLabelIds = [];

			this.newMetric.SelectedVersion = null;
			this.newMetric.SelectedLevel = null;
			this.newMetric.SelectedVariable = null;
			this.newMetric.columnExists = null;
			this.$emit('raisePrev');
		},
		selectAll() {
			this.newMetric.Source.ValueLabelIds = [];
			if (this.allCategories) {
				const loc = this;
				this.valueLabels.forEach(function(item) {
					loc.newMetric.Source.ValueLabelIds.push(item.Id);
				});
			}
		},
		asyncValidate() {
			const loc = this;
			// Si ya la tiene, no la pide
			if (this.columnExists !== null || !loc.newMetric.Source.VariableId) {
				return new Promise((resolve, reject) => {
					// devuelve true para indicar que ya fue resuelta con éxito
					// la validación asincrónica
					resolve(true);
				});
			}
			// Consulta en el servidor
			var service = '';
			if (this.newMetric.Type == 'distance') {
				service = 'CalculatedMetricDistanceExists';
			} else {
				service = 'CalculatedMetricAreaExists';
			}
			return axiosClient.getPromise(window.host + '/services/backoffice/' + service,
				{ k: loc.Dataset.properties.Id, v: loc.newMetric.Source.VariableId }, 'verificar si ya existe una variable calculado'
			).then(function (res) {
				loc.columnExists = res.columnExists;
			});
		},
		validate() {
			if (!this.newMetric.SourceMetric || this.newMetric.SourceMetric.Metric == null) {
				alert("Debe seleccionar un indicador.");
				return false;
			}
			if (this.newMetric.SelectedVersion == null) {
				alert("Debe seleccionar una versión.");
				return false;
			}
			if (this.newMetric.SelectedLevel == null) {
				alert("Debe seleccionar un nivel.");
				return false;
			}
			if (this.newMetric.SelectedVariable == null) {
				alert("Debe seleccionar una variable.");
				return false;
			}
			if (this.newMetric.Source.ValueLabelIds.length == 0) {
				alert("Debe seleccionar al menos una categoría.");
				return false;
			}
			if (this.columnExists
				&& confirm("El indicador ya fue calculado con este dataset. \n\n¿Desea continuar y sobreescribirlo?") == false) {
				return false;
			}
			return true;
		}
	},
	watch: {
		"newMetric.SelectedVersion"() {
			this.allCategories = false;
			if(this.newMetric.SelectedVersion != null) {
				if(this.newMetric.SelectedVersion.Levels.length > 0) {
					var i = this.newMetric.SelectedVersion.Levels.findIndex(function(item) {
						return item.Name == "Radios";
					});
					if (i == -1) {
						i = this.newMetric.SelectedVersion.Levels.findIndex(function (item) {
							return item.Name == "Ubicaciones";
						});
					}
					if (i == -1) {
						i = this.newMetric.SelectedVersion.Levels.findIndex(function (item) {
							return item.Name == "Departamentos";
						});
					}
					if (i == -1) {
						i = 0;
					}
					this.newMetric.SelectedLevel = this.newMetric.SelectedVersion.Levels[i];
				}
			} else {
				this.newMetric.SelectedLevel = null;
				this.newMetric.Output.HasDescription = false;
			}
		},
		"newMetric.SelectedLevel"() {
			this.allCategories = false;
			if(this.newMetric.SelectedLevel != null) {
				this.newMetric.OutputArea.IsInclusionPoint = (this.Dataset.properties.Type === 'L');
				if(this.newMetric.SelectedLevel.Variables.length > 0) {
					this.newMetric.SelectedVariable = this.newMetric.SelectedLevel.Variables[0];
				}
			} else {
				this.newMetric.SelectedVariable = null;
				this.newMetric.OutputArea.IsInclusionPoint = true;
			}
		},
		"newMetric.SelectedVariable"() {
			this.allCategories = false;
			this.columnExists = null;
			if(this.newMetric.SelectedVariable != null) {
				this.newMetric.Source.VariableId = this.newMetric.SelectedVariable.Id;
				this.newMetric.Output.HasValue = !this.newMetric.SelectedVariable.IsSimpleCount;
				this.newMetric.OutputArea.HasSumValue = !this.newMetric.SelectedVariable.IsSimpleCount;
				this.newMetric.OutputArea.HasMaxValue = false;
				this.newMetric.OutputArea.HasMinValue = false;
				this.newMetric.OutputArea.HasCount = true;
			} else {
				this.newMetric.Source.VariableId = null;
			}
			if (this.valueLabels.length > 0) {
				this.allCategories = true;
				this.selectAll();
			}
		},
		"newMetric.Source.ValueLabelIds"() {
			if (this.allCategories && this.valueLabels.length != this.newMetric.Source.ValueLabelIds.length) {
				this.allCategories = false;
			}
		}
	}
};
</script>

<style scoped>

</style>

