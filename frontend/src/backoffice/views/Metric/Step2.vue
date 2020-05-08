<template>
	<div>
		<div>Indique los elementos a incluir en la búsqueda:</div>

		<div class="md-layout-item md-size-80 md-small-size-100">
			<md-button :disabled="!canEdit" class="md-raised" @click="addMetric">
				<md-icon>search</md-icon>
				Elegir un indicador...
			</md-button>
		</div>
		<div>Indicador: {{ caption }}</div>

		<search-popup ref="addMetricPopup" @selected="metricSelected" :getDraftMetrics="false" searchType="m" />
		<md-field>
			<label>Edición</label>
			<md-select :disabled="!canEdit" v-model="newMetric.Version" v-if="newMetric.BaseMetric">
				<md-option v-for='version in versions' :key='version.Version.Id' :value='version.Version.Id'>
					{{ version.Version.Name }}
				</md-option>
			</md-select>
		</md-field>
		<md-field>
			<label>Nivel</label>
			<md-select :disabled="!canEdit" v-model="newMetric.Level" v-if="levels">
				<md-option v-for='level in levels' :key='level.Id' :value='level.Id'>
					{{ level.Name }}
				</md-option>
			</md-select>
		</md-field>
		<md-field>
			<label>Variable</label>
			<md-select :disabled="!canEdit" v-model="newMetric.Variable">
				<md-option v-for='variable in variables' :key='variable.Id' :value='variable.Id'>
					{{ variable.Name }}
				</md-option>
			</md-select>
		</md-field>
		<md-field>
			<label>Categorías</label>
			<md-select :disabled="!canEdit" v-model="selectedValueLabels" multiple>
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
	name: 'step2',
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
		//TODO: quitar default
		canEdit: {
			type: Boolean,
			default: true,
		},
	},
	data() {
		return {
			selectedValueLabels: [],
		};
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
			if(this.newMetric.Version != null) {
				return this.versions[this.versionIndex].Levels;
			}
			return [];
		},
		variables() {
			if(this.newMetric.Level != null) {
				return this.versions[this.versionIndex].Levels[this.levelIndex].Variables;
			}
			return [];
		},
		valueLabels() {
			if(this.newMetric.Variable != null) {
				return this.versions[this.versionIndex].Levels[this.levelIndex].Variables[this.variableIndex].ValueLabels;
			}
			return [];
		},
		versionIndex() {
			return arr.IndexById(this.newMetric.BaseMetric.Versions,
				this.newMetric.Version, 'Version');
		},
		levelIndex() {
			return arr.IndexById(
				this.newMetric.BaseMetric.Versions[this.versionIndex].Levels,
				this.newMetric.Level);
		},
		variableIndex() {
			return arr.IndexById(
				this.newMetric.BaseMetric.Versions[this.versionIndex].Levels[this.levelIndex].Variables,
				this.newMetric.Variable);
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
				//TODO: sacar esto
				window.MET = res.data;
			}).catch(function (error) {
				err.err('Step2', error);
			});
		},
	},
};
</script>

<style scoped>

</style>

