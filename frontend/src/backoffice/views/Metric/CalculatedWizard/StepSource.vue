<template>
	<div>
		<div>Indique los elementos a incluir en la búsqueda:</div>

		<div class="md-layout-item md-size-80 md-small-size-100">
			<md-button :disabled="!canEdit" class="md-raised" @click="addMetric">
				<md-icon>search</md-icon>
				Elegir un indicador...
			</md-button>
		</div>
		<div class="md-title">Indicador: {{ caption }}</div>

		<search-popup ref="addMetricPopup" @selected="metricSelected" :getDraftMetrics="false" searchType="m" />
		<md-field>
			<div class="md-title" v-if="newMetric.SourceMetric.Metric && versions.length == 1">Edición: {{ newMetric.SelectedVersion.Version.Name }}</div>
			<label v-if="versions.length != 1">Edición</label>
			<md-select :disabled="!canEdit || !newMetric.SourceMetric.Metric" v-model="newMetric.Source.VersionId" v-if="versions.length != 1">
				<md-option v-for='version in versions' :key='version.Version.Id' :value='version.Version.Id'>
					{{ version.Version.Name }}
				</md-option>
			</md-select>
		</md-field>
		<md-field>
			<div class="md-title" v-if="newMetric.SourceMetric.Metric && levels.length == 1">Nivel: {{ newMetric.SelectedLevel.Name }}</div>
			<label v-if="levels.length != 1">Nivel</label>
			<md-select :disabled="!canEdit || !newMetric.SourceMetric.Metric" v-model="newMetric.Source.LevelId" v-if="levels.length != 1">
				<md-option v-for='level in levels' :key='level.Id' :value='level.Id'>
					{{ level.Name }}
				</md-option>
			</md-select>
		</md-field>
		<md-field>
			<div class="md-title" v-if="newMetric.SourceMetric.Metric && variables.length == 1">Variable: {{ newMetric.SelectedVariable.Name }}</div>
			<label v-if="variables.length != 1">Variable</label>
			<md-select :disabled="!canEdit || !newMetric.SourceMetric.Metric" v-model="newMetric.Source.VariableId" v-if="variables.length != 1">
				<md-option v-for='variable in variables' :key='variable.Id' :value='variable.Id'>
					{{ variable.Name }}
				</md-option>
			</md-select>
		</md-field>
		<div>
			<div>Categorías</div>
			<br>
			<div v-if="valueLabels.length > 1">
				<md-checkbox class="md-primary" v-model="todos" @change="selectAll">Seleccionar todos / ninguno</md-checkbox>
			</div>
			<div v-for='valueLabel in valueLabels' :key='valueLabel.Id' :value='valueLabel.Id'>
				<md-checkbox class="md-primary" v-model="newMetric.Source.ValueLabelIds" :value="valueLabel.Id">{{ valueLabel.Name }}</md-checkbox>
			</div>
		</div>
	</div>
</template>

<script>
import SearchPopup from '@/backoffice/components/SearchPopup.vue';
import axios from 'axios';
import err from '@/common/js/err';
import arr from '@/common/js/arr';

export default {
	//Step 2
	name: 'stepSource',
	components: {
		SearchPopup,
	},
	props: {
		newMetric: {
			type: Object,
			default: function () {
				return {};
			},
		},
		canEdit: Boolean,
	},
	data() {
		return {
			todos: false,
		};
	},
	computed: {
		caption() {
			if(this.newMetric.SourceMetric.Metric != null) {
				return this.newMetric.SourceMetric.Metric.Name;
			}
			return '';
		},
		versions() {
			if(this.newMetric.SourceMetric.Versions != null) {
				return this.newMetric.SourceMetric.Versions;
			}
			return [];
		},
		levels() {
			if(this.newMetric.Source.VersionId != null) {
				return this.newMetric.SelectedVersion.Levels;
			}
			return [];
		},
		variables() {
			if(this.newMetric.Source.LevelId != null) {
				return this.newMetric.SelectedLevel.Variables;
			}
			return [];
		},
		valueLabels() {
			if(this.newMetric.Source.VariableId != null) {
				return this.newMetric.SelectedVariable.ValueLabels;
			}
			return [];
		},
		versionIndex() {
			return arr.IndexById(this.newMetric.SourceMetric.Versions,
				this.newMetric.Source.VersionId, 'Version');
		},
		levelIndex() {
			return arr.IndexById(this.newMetric.SelectedVersion.Levels,
				this.newMetric.Source.LevelId);
		},
		variableIndex() {
			return arr.IndexById(this.newMetric.SelectedLevel.Variables,
				this.newMetric.Source.VariableId);
		},
	},
	methods: {
		addMetric() {
			this.$refs.addMetricPopup.show();
		},
		metricSelected(metric) {
			this.newMetric.SourceMetric = {};
			this.newMetric.Source.VersionId = null;
			this.newMetric.Source.VariableId = null;
			this.newMetric.Source.LevelId = null;
			this.newMetric.Source.ValueLabelIds = [];

			const loc = this;
			axios.get(window.host + '/services/metrics/GetSelectedMetric', {
				params: { l: metric.Id }
			}).then(function (res) {
				loc.newMetric.SourceMetric = res.data;
				if(res.data.Versions.length > 0) {
					loc.newMetric.Source.VersionId = res.data.Versions[res.data.Versions.length - 1].Version.Id;
				}
			}).catch(function (error) {
				err.err('Step Source', error);
			});
		},
		selectAll() {
			this.newMetric.Source.ValueLabelIds = [];
			if(this.todos) {
				const loc = this;
				this.valueLabels.forEach(function(item) {
					loc.newMetric.Source.ValueLabelIds.push(item.Id);
				});
			}
		},
	},
	watch: {
		"newMetric.Source.VersionId"() {
			if(this.newMetric.Source.VersionId != null) {
				this.newMetric.SelectedVersion = this.newMetric.SourceMetric.Versions[this.versionIndex];
				if(this.newMetric.SelectedVersion.Levels.length > 0) {
					let i = this.newMetric.SelectedVersion.Levels.findIndex(function(item) {
						return item.Name == "Radios";
					});
					if(i == -1) {
						i = 0;
					}
					this.newMetric.Source.LevelId = this.newMetric.SelectedVersion.Levels[i].Id;
				}
			} else {
				this.newMetric.SelectedVersion = null;
			}
		},
		"newMetric.Source.LevelId"() {
			if(this.newMetric.Source.LevelId != null) {
				this.newMetric.SelectedLevel = this.newMetric.SelectedVersion.Levels[this.levelIndex];
				if(this.newMetric.SelectedLevel.Dataset.Type != 'L') {
					this.newMetric.Area.IsInclusionPoint = true;
				}
				if(this.newMetric.SelectedLevel.Variables.length > 0) {
					this.newMetric.Source.VariableId = this.newMetric.SelectedLevel.Variables[0].Id;
				}
			} else {
				this.newMetric.SelectedLevel = null;
				this.newMetric.Area.IsInclusionPoint = this.newMetric.DefaultIsInclusionPoint;
			}
		},
		"newMetric.Source.VariableId"() {
			if(this.newMetric.Source.VariableId != null) {
				this.newMetric.SelectedVariable = this.newMetric.SelectedLevel.Variables[this.variableIndex];
			} else {
				this.newMetric.SelectedVariable = null;
			}
		},
	},
};
</script>

<style scoped>
</style>

