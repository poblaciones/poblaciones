<template>
	<div>
		<md-dialog :md-active.sync="openPopup">

			<invoker ref="invoker"></invoker>
			<md-dialog-title>
				Calcular indicador. Paso {{ step }} de 3.
			</md-dialog-title>

			<md-dialog-content>
				<div v-if="step == 1">
					<step1 @formulaClick="formulaClick" @radarClick="radarClick" @rulerClick="rulerClick" />
				</div>
				<div v-if="step == 2">
					<step2 :newMetric="newMetric" />
				</div>
				<div v-if="step == 3">
					<step3 :newMetric="newMetric" />
				</div>
				<div v-if="step == 4">
					<step4 />
				</div>
			</md-dialog-content>

			<md-dialog-actions>
				<div>
					<md-button @click="openPopup = false">Cancelar</md-button>
					<md-button class="md-primary" v-if="step != 1" @click="prev">Anterior</md-button>
					<md-button class="md-primary" v-if="step > 1 && step < 4" @click="next">Siguiente</md-button>
					<md-button class="md-primary" v-if="step == 3" @click="last">Calcular</md-button>
				</div>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import Step1 from './Step1.vue';
import Step2 from './Step2.vue';
import Step3 from './Step3.vue';
import Step4 from './Step4.vue';

export default {
	name: 'calculateMetric',
	components: {
		Step1,
		Step2,
		Step3,
		Step4,
	},
	data() {
		return {
			step: 1,
			type: '',
			newMetric: {},

			newMetricName: '',
			newMetricGroup: null,
			newMetricVersion: '',
			selectedMetric: null,
			openPopup: false,
			};
	},
	computed: {
		//TODO: agregar como propiedad
		// canEdit() {
		// 	if (this.Work) {
		// 		return this.Work.CanEdit();
		// 	} else {
		// 		return false;
		// 	}
		// },
	},
	mounted() {
		this.newMetric = this.initNewMetric();
	},
	methods: {
		initNewMetric() {
			return {
				BaseMetric: { },
				//TODO: revisar defaults
				Description: false,
				Distance: false,
				Value: false,
				Coords: true,
				NormalizationValue: false,
				MaxDistance: false,
				SameProvince: false,
				ValueLabels: [],
			};
		},
		next() {
			if(this.step < 4) {
				this.step++;
			}
		},
		prev() {
			if(this.step > 1) {
				this.step--;
			}
			if(this.step == 1) {
				this.newMetric = this.initNewMetric();
			}
		},
		last() {
			this.step = 1;
		},
		formulaClick() {
			this.type = 'formula';
			this.step = 2;
			console.log('final formula click');
		},
		rulerClick() {
			this.type = 'ruler';
			this.step = 2;
			console.log('ruler click');
		},
		radarClick() {
			this.type = 'radar';
			this.step = 2;
			console.log('radar click');
		},
		show() {
			// this.newMetricName = '';
			// this.newMetricVersion = '';
			// this.newMetricGroup = null;
			// this.selectedMetric = null;
			this.openPopup = true;
			this.newMetric = this.initNewMetric();
			this.step = 1;
			// setTimeout(() => {
			// 	// this.$refs.metricInput.focus();
			// }, 100);
		},
		save() {
			// var loc = this;
			// if (this.newMetricName.trim().length === 0) {
			// 	alert('Debe indicar un nombre para el indicador.');
			// 	this.$nextTick(() => {
			// 		this.$refs.metricInput.focus();
			// 	});
			// 	return;
			// }
			// if (this.newMetricVersion.trim().length === 0) {
			// 	alert('Debe indicar una edición para el indicador.');
			// 	this.$nextTick(() => {
			// 		this.$refs.metricVersionInput.focus();
			// 	});
			// 	return;
			// }
			// if (this.Work.IsPublicData() && this.newMetricGroup === null) {
			// 	alert('Debe indicar una categoría para el indicador.');
			// 	this.$nextTick(() => {
			// 		this.$refs.categoryInput.$el.focus();
			// 	});
			// 	return;
			// }
			// window.Context.Factory.GetCopy('MetricVersionLevel',
			// 	function(level) {
			// 		loc.SaveAndClose(level);
			// });
		},
		SaveAndClose(level) {
			// var loc = this;
			// if (this.selectedMetric !== null) {
			// 	level.MetricVersion.Metric = this.selectedMetric;
			// }
			// level.MetricVersion.Caption = loc.newMetricVersion.trim();
			// level.MetricVersion.Metric.Caption = loc.newMetricName.trim();
			// level.MetricVersion.Metric.MetricGroup = loc.newMetricGroup;
			// level.MetricVersion.Metric.IsBasicMetric = false;
			// level.Variables = [];
			// this.$refs.invoker.do(this.Dataset,
			// 	loc.Dataset.UpdateMetricVersionLevel, level).then(function(data) {
			// 		loc.openPopup = false;
			// 	});
		},
		pickMetric() {
			// this.$refs.pickMetric.show();
		},
		onSelectMetric(metric) {
			// this.selectedMetric = metric;
			// this.newMetricVersion = "";
			// var groupId = metric.GroupId;
			// this.newMetricGroup = arr.GetById(this.MetricGroups, groupId, null);
			// this.newMetricName = metric.Caption;
			// this.$refs.metricVersionInput.focus();
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>

