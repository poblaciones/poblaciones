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
			<label>Edición</label>
			<md-select :disabled="!canEdit || !newMetric.BaseMetric.Metric" v-model="newMetric.VersionId">
				<md-option v-for='version in versions' :key='version.Version.Id' :value='version.Version.Id'>
					{{ version.Version.Name }}
				</md-option>
			</md-select>
		</md-field>
		<md-field>
			<label>Nivel</label>
			<md-select :disabled="!canEdit || !newMetric.BaseMetric.Metric" v-model="newMetric.LevelId" v-if="levels">
				<md-option v-for='level in levels' :key='level.Id' :value='level.Id'>
					{{ level.Name }}
				</md-option>
			</md-select>
		</md-field>
		<md-field>
			<label>Variable</label>
			<md-select :disabled="!canEdit || !newMetric.BaseMetric.Metric" v-model="newMetric.VariableId">
				<md-option v-for='variable in variables' :key='variable.Id' :value='variable.Id'>
					{{ variable.Name }}
				</md-option>
			</md-select>
		</md-field>
		<md-field>
			<label>Categorías</label>
			<md-select :disabled="!canEdit || !newMetric.BaseMetric.Metric" v-model="newMetric.ValueLabelIds" multiple>
				<md-option v-for='valueLabel in valueLabels' :key='valueLabel.Id' :value='valueLabel.Id'>
					{{ valueLabel.Name }}
				</md-option>
			</md-select>
		</md-field>
	</div>
</template>

<script>
import SearchPopup from '@/backoffice/components/SearchPopup.vue';
import axios from 'axios';
import err from '@/common/js/err';
import arr from '@/common/js/arr';

export default {
	//Step 2
	name: 'calculatedObjective',
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
	computed: {
		caption() {
			if(this.newMetric.BaseMetric.Metric != null) {
				return this.newMetric.BaseMetric.Metric.Name;
			}
			return '';
		},
		versions() {
			if(this.newMetric.BaseMetric.Versions != null) {
				return this.newMetric.BaseMetric.Versions;
			}
			return [];
		},
		levels() {
			if(this.newMetric.VersionId != null) {
				return this.newMetric.SelectedVersion.Levels;
			}
			return [];
		},
		variables() {
			if(this.newMetric.LevelId != null) {
				return this.newMetric.SelectedLevel.Variables;
			}
			return [];
		},
		valueLabels() {
			if(this.newMetric.VariableId != null) {
				return this.newMetric.SelectedVariable.ValueLabels;
			}
			return [];
		},
		versionIndex() {
			return arr.IndexById(this.newMetric.BaseMetric.Versions,
				this.newMetric.VersionId, 'Version');
		},
		levelIndex() {
			return arr.IndexById(this.newMetric.SelectedVersion.Levels,
				this.newMetric.LevelId);
		},
		variableIndex() {
			return arr.IndexById(this.newMetric.SelectedLevel.Variables,
				this.newMetric.VariableId);
		},
	},
	methods: {
		addMetric() {
			this.$refs.addMetricPopup.show();
		},
		metricSelected(metric) {
			const loc = this;
			axios.get(window.host + '/services/metrics/GetSelectedMetric', {
				params: { l: metric.Id }
			}).then(function (res) {
				loc.newMetric.BaseMetric = res.data;
				if(res.data.Versions.length == 1) {
					loc.newMetric.VersionId = res.data.Versions[0].Version.Id;
				}
			}).catch(function (error) {
				err.err('Step2', error);
			});
		},
	},
	watch: {
		"newMetric.VersionId"() {
			if(this.newMetric.VersionId != null) {
				this.newMetric.SelectedVersion = this.newMetric.BaseMetric.Versions[this.versionIndex];
				if(this.newMetric.SelectedVersion.Levels.length == 1) {
					this.newMetric.LevelId = this.newMetric.SelectedVersion.Levels[0].Id;
				}
			} else {
				this.newMetric.SelectedVersion = null;
			}
		},
		"newMetric.LevelId"() {
			if(this.newMetric.LevelId != null) {
				this.newMetric.SelectedLevel = this.newMetric.SelectedVersion.Levels[this.levelIndex];
				if(this.newMetric.SelectedLevel.Dataset.Type != 'L') {
					this.newMetric.IsInclusionPoint = true;
				}
				if(this.newMetric.SelectedLevel.Variables.length == 1) {
					this.newMetric.VariableId = this.newMetric.SelectedLevel.Variables[0].Id;
				}
			} else {
				this.newMetric.SelectedLevel = null;
				//TODO: ver default, y volver a ese valor
				this.newMetric.IsInclusionPoint = false;
			}
		},
		"newMetric.VariableId"() {
			if(this.newMetric.VariableId != null) {
				this.newMetric.SelectedVariable = this.newMetric.SelectedLevel.Variables[this.variableIndex];
			} else {
				this.newMetric.SelectedVariable = null;
			}
		},
	}
};
</script>

<style scoped>
</style>

