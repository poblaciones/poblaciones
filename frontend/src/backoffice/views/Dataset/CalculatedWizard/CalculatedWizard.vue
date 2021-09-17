<template>
	<div v-if="newMetric.Type">
		<md-dialog :md-active.sync="openPopup" :md-click-outside-to-close="false">

			<invoker ref="invoker"></invoker>
			<stepper ref="stepper" @closed="stepperClosed" :title="'Realizando ' + action"></stepper>

			<md-dialog-title>
				Asistente de {{ action }}
				<div class="stepProgress">

				</div>
			</md-dialog-title>

			<md-dialog-content>
				<div style="padding-top: 18px; min-height: 280px;">
					<step-distance-welcome v-show="currentStep == 'stepDistanceWelcome'" ref="stepDistanceWelcome" @raiseNext="next()" />
					<step-area-welcome v-show="currentStep == 'stepAreaWelcome'" ref="stepAreaWelcome" @raiseNext="next()" />
					<step-source v-show="currentStep == 'stepSource'" ref="stepSource" :newMetric="newMetric" />
					<step-distance-output v-show="currentStep == 'stepDistanceOutput'" ref="stepDistanceOutput" :newMetric="newMetric" />
					<step-area-output v-show="currentStep == 'stepAreaOutput'" ref="stepAreaOutput" :newMetric="newMetric" />
				</div>
			</md-dialog-content>

			<md-dialog-actions>
				<div v-if="columnExists" style='color:red;margin:auto'>Sobreescribiendo</div>
				<div>
					<md-button @click="openPopup = false" style="float: left">Cancelar</md-button>
					<md-button class="md-primary" :disabled="step == 1 || processing" @click="prev()">Anterior</md-button>
					<md-button class="md-primary" :disabled="processing" v-if="!isLast" @click="next()">Siguiente</md-button>
					<md-button class="md-primary" v-if="isLast" @click="save">Finalizar</md-button>
				</div>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import StepAreaWelcome from './StepAreaWelcome.vue';
import StepDistanceWelcome from './StepDistanceWelcome.vue';
import StepSource from './StepSource.vue';
import StepAreaOutput from './StepAreaOutput.vue';
import StepDistanceOutput from './StepDistanceOutput.vue';


export default {
	name: 'calculateMetric',
	components: {
		StepAreaWelcome,
		StepDistanceWelcome,
		StepSource,
		StepAreaOutput,
		StepDistanceOutput,
	},
	data() {
		return {
			step: 1,
			newMetric: {},
			openPopup: false,
			processing: false,
			steps: {
				'area': ['stepAreaWelcome', 'stepSource', 'stepAreaOutput'],
				'distance': ['stepDistanceWelcome', 'stepSource', 'stepDistanceOutput']
			}
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		Dataset() {
			return window.Context.CurrentDataset;
		},
		columnExists() {
			return (this.$refs.stepSource && this.$refs.stepSource.columnExists);
		},
		isLast() {
			return this.calculateStep(this.step + 1) === null;
		},
		maxSteps() {
			if (this.step == 1) {
				return '';
			} else {
				return ' de ' + (this.steps[this.newMetric.Type].length + 1);
			}
		},
		action() {
			if (this.newMetric.Type == 'distance') {
				return 'rastreo';
			} else {
				return 'conteo';
			}
		},
		currentStep() {
			return this.calculateStep(this.step);
		},
		by() {
			let ret = '';
			if (this.newMetric.Type == 'distance') {
				if (this.step == 2) {
					ret += 'Objetivo';
				} else if (this.step == 3) {
					ret += 'Salida';
				}
			} else if (this.newMetric.Type == 'area') {
				if (this.step == 2) {
					ret += 'Objetivo';
				} else if (this.step == 3) {
					ret += 'Área';
				} else if (this.step == 4) {
					ret += 'Salida';
				}
			}
			if (ret == '') {
				return ret;
			} else {
				return ': ' + ret;
			}
		},
	},
	mounted() {
		this.newMetric = this.initNewMetric();
	},
	methods: {
		initNewMetric() {
			let defaultIsInclusionPoint = false;
			let defaultHasDescription = false;
			return {
				SourceMetric: {},
				DefaultIsInclusionPoint: defaultIsInclusionPoint,
				DefaultHasDescription: defaultHasDescription,
				SelectedVersion: null,
				SelectedLevel: null,
				SelectedVariable: null,

				Id: null,
				Type: '',
				Output: {
					HasDescription: defaultHasDescription,
					HasValue: true,
					HasCoords: true,
					HasMaxDistance: false,
					MaxDistance: 10,
				},
				OutputArea: {
					HasSumValue: false,
					HasMaxValue: false,
					HasMinValue: false,
					HasCount: false,
					IsInclusionPoint: defaultIsInclusionPoint,
					InclusionDistance: 2,
				},
				Source: {
					ValueLabelIds: [],
					VariableId: null,
				},
			};
		},
		calculateStep(step) {
			var steps = this.steps[this.newMetric.Type];
			step -= 1;
			if (step < steps.length) {
				return steps[step];
			} else {
				return null;
			}
		},
		next(assyncPassed) {
			var loc = this;
			var currentStepControl = this.$refs[this.currentStep];
			if (currentStepControl.asyncValidate && !assyncPassed) {
				loc.processing = true;
				currentStepControl.asyncValidate().then(function (passed) {
					loc.processing = false;
					return loc.next(passed);
				}).catch(function (ret) {
					loc.processing = false;
					return ret;
					});
				return;
			}

			if (!this.validate()) {
				return;
			}
			this.step++;
		},
		prev() {
			if(this.step > 1) {
				this.step--;
			}
		},
		defineType(type) {
			if (this.newMetric.Type != type) {
				this.newMetric = this.initNewMetric();
			}
			this.newMetric.Type = type;
		},
		show(typeDistance = false) {
			this.step = 1;
			this.defineType(typeDistance ? 'distance' : 'area');
			this.openPopup = true;
		},
		save() {
			if (!this.validate()) {
				return;
			}
			let stepper = this.$refs.stepper;
			stepper.startUrl = this.Dataset.CalculateNewMetricUrl(this.newMetric.Type);
			stepper.stepUrl = this.Dataset.StepCalculateNewMetricUrl(this.newMetric.Type);
			stepper.args = this.args();
			stepper.Start();
		},
		args() {
			this.newMetric.Source.MetricId = this.newMetric.SourceMetric.Metric.Id;
			this.newMetric.Source.VersionId = this.newMetric.SelectedVersion.Version.Id;
			this.newMetric.Source.LevelId = this.newMetric.SelectedLevel.Id;

			var ret = {
					k: this.Dataset.properties.Id,
					s: JSON.stringify(this.newMetric.Source)
			};

			if (this.newMetric.Type == 'area') {
				ret.o = JSON.stringify(this.newMetric.OutputArea);
			} else {
				ret.o = JSON.stringify(this.newMetric.Output);
			}
			// Definir
			return ret;
		},
		stepperClosed() {
			let stepper = this.$refs.stepper;
			if (stepper.complete) {
				this.openPopup = false;
				this.Dataset.ReloadColumns();
				this.Dataset.ScaleGenerator.Clear();
			}
		},
		validate() {
			var currentStepControl = this.$refs[this.currentStep];
			if (currentStepControl.validate) {
				return currentStepControl.validate();
			} else {
				return true;
			}
		},
	},
};
</script>

<style scoped>
	.stepProgress
	{
		float: right;
	}
</style>

