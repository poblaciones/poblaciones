<template>
	<div>
		<md-dialog :md-active.sync="openPopup" :md-click-outside-to-close="false">

			<invoker ref="invoker"></invoker>
			<stepper ref="stepper" @completed="stepperComplete" title="Calcular indicador"></stepper>

			<md-dialog-title>
				Calcular indicador {{ by }}
				Paso {{ step }} {{ maxSteps }}
			</md-dialog-title>

			<md-dialog-content>
				<step-type v-show="currentStep == 'stepType'" ref="stepType" />
				<step-source v-show="currentStep == 'stepSource'" ref="stepSource" :newMetric="newMetric" />
				<step-coverage v-show="currentStep == 'stepCoverage'" ref="stepCoverage" :newMetric="newMetric" />
				<step-distance-output v-show="currentStep == 'stepDistanceOutput'" ref="stepDistanceOutput" :newMetric="newMetric" />
				<step-area-output  v-show="currentStep == 'stepAreaOutput'" ref="stepAreaOutput" :newMetric="newMetric" />
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
				return ' de ' + (this.steps[this.newMetric.Type].length + 1) + '.';
			}
		},
		currentStep() {
			return this.calculateStep(this.step);
		},
		by() {
			let ret = '';
			if (this.newMetric.Type == 'formula') {
				//TODO: definir.
				ret = ' según fórmula';
			} else if (this.newMetric.Type == 'distance') {
				ret = ' según distancia';
				if (this.step == 2) {
					ret += ' > Objetivo';
				} else if (this.step == 3) {
					ret += ' > Objetivo > Salida';
				}
			} else if (this.newMetric.Type == 'area') {
				ret = ' según contenido';
				if (this.step == 2) {
					ret += ' > Objetivo';
				} else if (this.step == 3) {
					ret += ' > Objetivo > Área';
				} else if (this.step == 4) {
					ret += ' > Objetivo > Área > Salida';
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
			//TODO: revisar todos los defaults
			let defaultIsInclusionPoint = false;
			return {
				SourceMetric: {},
				DefaultIsInclusionPoint: defaultIsInclusionPoint,
				SelectedVersion: null,
				SelectedLevel: null,
				SelectedVariable: null,

				Id: null,
				Type: '',
				Output: {
					//Distance
					HasDescription: false,
					HasValue: true,
					HasCoords: true,
					HasMaxDistance: false,
					MaxDistance: 20,

					// Area
					HasAdditionValue: false,
					HasMaxValue: false,
					HasMinValue: false,
					HasCount: false,

					//Ambos
					HasNormalizationValue: false,
					InSameProvince: false,
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
			return {
				k: this.Dataset.properties.Id,
				t: this.newMetric.Type,
				a: JSON.stringify(this.newMetric.Area),
				s: JSON.stringify(this.newMetric.Source),
				o: JSON.stringify(this.newMetric.Output),
			};
		},
		stepperComplete() {
			const STEP_CREATE_VARIABLES = 0;
			const STEP_UPDATE_ROWS = 1;
			const STEP_CREATE_METRIC = 2;
			const STEP_COMPLETED = 3;

			var stepper = this.$refs.stepper;
			//TODO: ver como implementar esto.
			switch (stepper.step)
			{
				case STEP_CREATE_VARIABLES:
					// stepper.error = 'Falló en.';
					break;
				case STEP_UPDATE_ROWS:
					// stepper.error = 'Falló en.';
					break;
				case STEP_CREATE_METRIC:
					// stepper.error = 'Falló en.';
					break;
				case STEP_COMPLETED:
					stepper.complete = 'Creación exitosa.';
					this.openPopup = false;
					break;
				default:
					stepper.error = 'Paso desconocido.';
					break;
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
</style>

