<template>
  <div>
		<md-dialog :md-active.sync="openPopup">

			<invoker ref="invoker"></invoker>
			<md-dialog-title>
				Agregar indicador
			</md-dialog-title>


			<pick-metric ref="pickMetric" @onSelectedMetric="onSelectMetric">
			</pick-metric>


			<md-dialog-content>
				<div class="md-layout-item md-size-90 md-small-size-100">
						<mp-simple-text :canEdit="selectedMetric === null"
											label="Nuevo indicador" ref="metricInput"
											helper="Ej. Acceso a agua potable" @enter="save"
											:maxlength="75" v-model="newMetricName"
									></mp-simple-text>
				</div>

				<div v-if="Work.IsPublicData()" class='md-layout-item md-size-75 md-small-size-100'>
					<mp-select label='Categoría'
										ref='categoryInput'
										v-model="newMetricGroup"
										list-key='Id'
										:list='MetricGroups'
										helper='Indique el tipo de información del indicador.'
										/>
				</div>

				<div class="md-layout-item md-size-60 md-small-size-100">
					<mp-simple-text
									ref="metricVersionInput"
									label="Edición" @enter="save"
									helper="Año de referencia de la edición o serie de datos. Ej. 2010"
									:maxlength="20" v-model="newMetricVersion"
								></mp-simple-text>
				</div>

				<div class="md-layout-item md-size-80 md-small-size-100">
					<md-button class="md-raised" @click="pickMetric()">
						<md-icon>search</md-icon>
						Elegir un indicador existente...
					</md-button>
				</div>

			</md-dialog-content>

		<md-dialog-actions>
			<div>
				<md-button @click="openPopup = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Aceptar</md-button>
			</div>
		</md-dialog-actions>
		</md-dialog>
    </div>
  </template>



<script>

import PickMetric from './PickMetric.vue';
import arr from '@/common/js/arr';

export default {
	name: 'newMetric',
	components: {
		PickMetric
	},
	data() {
		return {
			newMetricName: '',
			newMetricGroup: null,
			newMetricVersion: '',
			selectedMetric: null,
			openPopup: false,
			};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		Dataset() {
			return window.Context.CurrentDataset;
		},
		MetricGroups() {
			return window.Context.MetricGroups.list;
		},
	},
	mounted() {

	},
	methods: {
		show() {
			this.newMetricName = '';
			this.newMetricVersion = '';
			this.newMetricGroup = null;
			this.openPopup = true;
			this.selectedMetric = null;
			setTimeout(() => {
				this.$refs.metricInput.focus();
			}, 100);

		},
		save() {
			var loc = this;
			if (this.newMetricName.trim().length === 0) {
				alert('Debe indicar un nombre para el indicador.');
				this.$nextTick(() => {
					this.$refs.metricInput.focus();
				});
				return;
			}
			if (this.newMetricVersion.trim().length === 0) {
				alert('Debe indicar una edición para el indicador.');
				this.$nextTick(() => {
					this.$refs.metricVersionInput.focus();
				});
				return;
			}
			if (this.Work.IsPublicData() && this.newMetricGroup === null) {
				alert('Debe indicar una categoría para el indicador.');
				this.$nextTick(() => {
					this.$refs.categoryInput.$el.focus();
				});
				return;
			}
			window.Context.Factory.GetCopy('MetricVersionLevel',
				function(level) {
					loc.SaveAndClose(level);
			});
		},
		SaveAndClose(level) {
			var loc = this;
			if (this.selectedMetric !== null) {
				level.MetricVersion.Metric = this.selectedMetric;
			}
			level.MetricVersion.Caption = loc.newMetricVersion.trim();
			level.MetricVersion.Metric.Caption = loc.newMetricName.trim();
			level.MetricVersion.Metric.MetricGroup = loc.newMetricGroup;
			level.MetricVersion.Metric.IsBasicMetric = false;
			level.Variables = [];
			this.$refs.invoker.do(this.Dataset,
				loc.Dataset.UpdateMetricVersionLevel, level).then(function(data) {
					loc.openPopup = false;
				});
		},
		pickMetric() {
			this.$refs.pickMetric.show();
		},
		onSelectMetric(metric) {
			this.selectedMetric = metric;
			this.newMetricVersion = "";
			var groupId = metric.GroupId;
			this.newMetricGroup = arr.GetById(this.MetricGroups, groupId, null);
			this.newMetricName = metric.Caption;
			this.$refs.metricVersionInput.focus();
		},
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>

