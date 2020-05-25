<template>
	<div>
		<md-dialog :md-active.sync="openPopup">

			<invoker ref="invoker"></invoker>
			<stepper ref="stepper" @completed="stepperComplete" title="Calcular indicador"></stepper>

			<md-dialog-title>
				Calcular indicador{{ segun }}
				Paso {{ step }}{{ maxSteps }}
			</md-dialog-title>

			<md-dialog-content>
				<div v-if="step == 1">
					<step-type ref="stepType" />
				</div>
				<div v-if="step == 2">
					<step-source :canEdit="canEdit" :newMetric="newMetric" />
				</div>
				<div v-if="step == 3 && newMetric.Type == 'area'">
					<step-coverage :canEdit="canEdit" :newMetric="newMetric" />
				</div>
				<div v-if="isLast">
					<step-distance-output v-if="newMetric.Type == 'distance'" :canEdit="canEdit" :newMetric="newMetric" />
					<step-area-output v-if="newMetric.Type == 'area'" :canEdit="canEdit" :newMetric="newMetric" />
				</div>
			</md-dialog-content>

			<md-dialog-actions>
				<div v-if="newMetric.columnExists" style='color:red;margin:auto'>Sobreescribiendo</div>
				<div>
					<md-button @click="openPopup = false" style="float: left">Cancelar</md-button>
					<md-button class="md-primary" :disabled="step == 1" @click="prev">Anterior</md-button>
					<md-button class="md-primary" v-if="!isLast" @click="next">Siguiente</md-button>
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
import axios from 'axios';
import str from '@/common/js/str';

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
		};
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		Dataset() {
			return window.Context.CurrentDataset;
		},
		isLast() {
			return this.step == 4
				|| (this.step == 3 && this.newMetric.Type != 'area');
		},
		maxSteps() {
			if(this.step == 1) {
				return '.';
			} else if(this.newMetric.Type == 'area') {
				return ' de 4.';
			}
			return ' de 3.';
		},
		segun() {
			let ret = '.';
			if(this.newMetric.Type == 'formula') {
				//TODO: definir.
				ret = ' según fórmula.';
			} else if(this.newMetric.Type == 'distance') {
				ret = ' según distancia.';
				if(this.step == 2) {
					ret += ' > Objetivo.';
				} else if(this.step == 3) {
					ret += ' > Objetivo > Salida.';
				}
			} else if(this.newMetric.Type == 'area') {
				ret = ' según contenido.';
				if(this.step == 2) {
					ret += ' > Objetivo.';
				} else if(this.step == 3) {
					ret += ' > Objetivo > Área.';
				} else if(this.step == 4) {
					ret += ' > Objetivo > Área > Salida.';
				}
			}
			return ret;
		},
		canEdit() {
			if (this.Work) {
				return this.Work.CanEdit();
			}
			return false;
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
				columnExists: null,

				Id: null,
				Type: '',
				Output: {
					//Distance
					HasDescription: false,
					HasValue: false,
					HasCoords: false,
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
		next() {
			if(this.validate() == false) {
				return;
			}
			if (this.step === 1) {
				this.defineType(this.$refs.stepType.type);
			}
			if(this.step === 2
				&& this.newMetric.columnExists === null) {
				const loc = this;
				this.$refs.invoker.do(this.Dataset, loc.Dataset.CalculatedMetricExists,
					loc.newMetric.Source.VariableId)
				.then(function(data) {
					loc.newMetric.columnExists = data;
					if(loc.newMetric.columnExists) {
						alert('El indicador ya fue calculado con este Dataset, se sobreescribirán los datos.');
					}
				});
			}
			if(this.step < 4) {
				this.step++;
			}
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
			if(this.validate() == false) {
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
					break;
				default:
					stepper.error = 'Paso desconocido.';
					break;
			}

			//TODO: Acá hay que cerrar o qué?
			this.openPopup = false;
		},
		validate() {
			if(this.step == 2) {
				if(this.newMetric.SourceMetric.Metric == null) {
					alert("Debe seleccionar un indicador.");
					return false;
				}
				if(this.newMetric.SelectedVersion == null) {
					alert("Debe seleccionar una versión.");
					return false;
				}
				if(this.newMetric.SelectedLevel == null) {
					alert("Debe seleccionar un nivel.");
					return false;
				}
				if(this.newMetric.SelectedVariable == null) {
					alert("Debe seleccionar una variable.");
					return false;
				}
				if(this.newMetric.Source.ValueLabelIds.length == 0) {
					alert("Debe seleccionar al menos una categoría.");
					return false;
				}
			}
			if(this.step == 3) {
				if(this.newMetric.Type == 'distance') {
					if(this.newMetric.Output.HasMaxDistance
						&& str.IsIntegerGreaterThan0(this.newMetric.Output.MaxDistance) == false) {
						alert("Debe ingresar la distancia máxima en kms.");
						return false;
					}
				} else if(this.newMetric.Type == 'area') {
					if(this.newMetric.Area.IsInclusionPoint
						&& str.IsIntegerGreaterThan0(this.newMetric.Area.InclusionDistance) == false) {
						alert("Debe ingresar la distancia máxima en kms.");
						return false;
					}
				}
			}
			return true;
		},
	},
};
</script>

<style scoped>
</style>

