<template>
	<div>
		<div class="md-layout">
			<div class="md-layout-item md-size-100">
				Indique los elementos a incluir en la búsqueda:
			</div>
			<div class="md-layout-item md-size-80 md-small-size-100" style="line-height: 4em">
				Indicador: {{ caption }}
				<md-button :disabled="!canEdit" class="md-raised" @click="addMetric">
					<md-icon>search</md-icon>
					Seleccionar...
				</md-button>
			</div>
			<div class="md-layout-item md-size-50 md-small-size-100">
				<mp-select :list="versions" :allowNull="false" :disabled="!newMetric.SourceMetric.Metric"
										label="Edición" helper="Edición a utilizar" listKey="Id"
										v-model="newMetric.SelectedVersion" :render="formatVersion" />
			</div>
			<div class="md-layout-item md-size-50 md-small-size-100">
				<mp-select :list="levels" :allowNull="false" :disabled="!newMetric.SourceMetric.Metric"
									 label="Nivel" helper="Nivel de agregación a utilizar"
									 v-model="newMetric.SelectedLevel" listCaption="Name" />
			</div>
			<div class="md-layout-item md-size-100 md-small-size-100">
				<mp-select :list="variables" :allowNull="false" :disabled="!newMetric.SourceMetric.Metric"
									 label="Variable" helper="Variable a utilizar"
									 v-model="newMetric.SelectedVariable" listCaption="Name" />
			</div>
			<div v-if="valueLabels.length > 0" class="md-layout-item md-size-100 md-small-size-100">
				Categorías
			</div>
			<div v-if="valueLabels.length > 1" class="md-layout-item md-size-30 md-small-size-50">
				<md-checkbox class="md-primary" v-model="todos" @change="selectAll">[Seleccionar todos] </md-checkbox>
			</div>
			<div v-for='valueLabel in valueLabels' :key='valueLabel.Id' :value='valueLabel.Id'
						class="md-layout-item md-size-30 md-small-size-50">
				<md-checkbox class="md-primary" v-model="newMetric.Source.ValueLabelIds" :value="valueLabel.Id">{{ valueLabel.Name }}</md-checkbox>
			</div>
			<search-popup ref="addMetricPopup" @selected="metricSelected" :getDraftMetrics="false" searchType="m" />
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
			if (this.newMetric.SourceMetric.Versions != null) {
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
		formatVersion(version) {
			return version.Version.Name;
		},
		metricSelected(metric) {
			this.newMetric.SourceMetric = {};
			this.newMetric.Source.Version = null;
			this.newMetric.Source.Variable = null;
			this.newMetric.Source.Level = null;
			this.newMetric.Source.ValueLabelIds = [];

			const loc = this;
			axios.get(window.host + '/services/metrics/GetSelectedMetric', {
				params: { l: metric.Id }
			}).then(function (res) {
				loc.newMetric.SourceMetric = res.data;
				if(res.data.Versions.length > 0) {
					loc.newMetric.Source.Version = res.data.Versions[res.data.Versions.length - 1];
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
};
</script>

<style scoped>
</style>

