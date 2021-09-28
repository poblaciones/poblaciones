<template>
	<div>
		<div class="md-layout md-gutter">
			<div class="md-layout-item md-size-100 mp-label" style="margin-bottom: 12px; padding-left: 12px!important;">
				Seleccione el tipo de elementos a localizar en el {{ action }} (Escuelas, Nivel educativo, etc.)
			</div>
			<div class="md-layout-item md-size-80 md-small-size-100">
				<search-panel ref="searchPanel" @selected="metricSelected"
											:currentWork="Work.properties.Id"
											:getDraftMetrics="false" searchType="m" />
			</div>
		</div>
	</div>
</template>

<script>
import axiosClient from '@/common/js/axiosClient';
import SearchPanel from '@/backoffice/components/SearchPanel.vue';

export default {
	//Step 2
	name: 'stepMetric',
	components: {
		SearchPanel,
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
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
	},
	methods: {
		focus(pressedNext) {
			if (this.newMetric.SourceMetric && this.newMetric.SourceMetric.Metric
						&& pressedNext) {
				this.$emit('raiseNext');
				return;
			}
			this.$refs.searchPanel.focus();
		},
		clearMetric() {
			this.newMetric.SourceMetric = null;
			this.newMetric.Source.VariableId = null;
			this.newMetric.Source.ValueLabelIds = [];

			this.newMetric.SelectedVersion = null;
			this.newMetric.SelectedLevel = null;
			this.newMetric.SelectedVariable = null;
			this.newMetric.columnExists = null;
		},
		metricSelected(metric) {
			this.clearMetric();

			const loc = this;
			axiosClient.getPromise(window.host + '/services/metrics/GetSelectedMetric',
				{ l: metric.Id }, 'consultar el indicador').then(function (res) {
				loc.newMetric.SourceMetric = res;
					if (res.Versions.length > 0) {
						loc.newMetric.SelectedVersion = res.Versions[res.Versions.length - 1];
						loc.$emit('raiseNext');
					} else {
						alert('El indicador no posee ninguna serie de datos.');
					}
			});
		},
		validate() {
			if (!this.newMetric.SourceMetric || this.newMetric.SourceMetric.Metric == null) {
				alert("Debe seleccionar un indicador.");
				return false;
			}
			if (this.newMetric.SelectedVersion == null) {
				alert("El indicador seleccionado no posee ninguna serie de datos.");
				return false;
			}
			return true;
		}
	},
};
</script>

<style scoped>

</style>

