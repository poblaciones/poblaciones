<template>
	<div>
		<md-dialog :md-active.sync="openPopup" :md-click-outside-to-close="false">

			<invoker ref="invoker"></invoker>
			<stepper ref="stepper" @closed="stepperClosed" title="Calcular indicador"></stepper>

			<md-dialog-title>
				Calcular indicador {{ by }}
				<div class="stepProgress">
					Paso {{ step }} {{ maxSteps }}
				</div>
			</md-dialog-title>

			<md-dialog-content>
				<div style="min-height: 300px">
					<step-type v-show="currentStep == 'stepType'" ref="stepType" />
					<step-source v-show="currentStep == 'stepSource'" ref="stepSource" :newMetric="newMetric" />
					<step-coverage v-show="currentStep == 'stepCoverage'" ref="stepCoverage" :newMetric="newMetric" />
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
import StepType from './StepType.vue';
import StepSource from './StepSource.vue';
import StepCoverage from './StepCoverage.vue';
import StepAreaOutput from './StepAreaOutput.vue';
import StepDistanceOutput from './StepDistanceOutput.vue';


export default {
	name: 'calculateMetric',
	components: {
		StepType,
		StepSource,
		StepCoverage,
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
				'area': ['stepSource', 'stepCoverage', 'stepAreaOutput'],
				'distance': ['stepSource', 'stepDistanceOutput']
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
		currentStep() {
			return this.calculateStep(this.step);
		},
		by() {
			let ret = '';
			if (this.newMetric.Type == 'formula') {
				ret = ' según fórmula';
			} else if (this.newMetric.Type == 'distance') {
				ret = ' según distancia';
				if (this.step == 2) {
					ret += '. Objetivo';
				} else if (this.step == 3) {
					ret += '. Salida';
				}
			} else if (this.newMetric.Type == 'area') {
				ret = ' según contenido';
				if (this.step == 2) {
					ret += '. Objetivo';
				} else if (this.step == 3) {
					ret += '. Área';
				} else if (this.step == 4) {
					ret += '. Salida';
				}
			}
			return ret;
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
					MaxDistance: 20,
				},
				OutputArea: {
					HasAdditionValue: false,
					HasMaxValue: false,
					HasMinValue: false,
					HasCount: false,
				},
				Area: {
					IsInclusionPoint: defaultIsInclusionPoint,
					InclusionDistance: 0,
					IsInclussionFull: false,
				},
				Source: {
					ValueLabelIds: [],
					VariableId: null,
				},
			};
		},
		calculateStep(step) {
			if (this.step == 1) {
				return "stepType";
			}
			var steps = this.steps[this.newMetric.Type];
			step -= 2;
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
			if (this.step === 1) {
				this.defineType(this.$refs.stepType.type);
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
		show() {
			this.step = 1;
			this.openPopup = true;
		},
		save() {
			if (!this.validate()) {
				return;
			}
			let stepper = this.$refs.stepper;
			stepper.startUrl = this.Dataset.CalculateNewMetricUrl();
			stepper.stepUrl = this.Dataset.StepCalculateNewMetricUrl();
			stepper.args = this.args();
			stepper.Start();
		},
		args() {
			if(this.newMetric.Type == 'distance') {
				return {
					k: this.Dataset.properties.Id,
					t: this.newMetric.Type,
					s: JSON.stringify(this.newMetric.Source),
					o: JSON.stringify(this.newMetric.Output),
				};
			}
			// Definir
			return {};
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

