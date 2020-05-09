<template>
	<div>
		<md-dialog :md-active.sync="openPopup">

			<invoker ref="invoker"></invoker>
			<md-dialog-title>
				Calcular indicador{{ segun }}
				Paso {{ step }}{{ maxSteps }}
			</md-dialog-title>

			<md-dialog-content>
				<div v-if="step == 1">
					<calculated-type @formulaClick="formulaClick" @radarClick="radarClick" @rulerClick="rulerClick" />
				</div>
				<div v-if="step == 2">
					<calculated-objective :canEdit="canEdit" :newMetric="newMetric" />
				</div>
				<div v-if="step == 3 && newMetric.Type == 'radar'">
					<calculated-area :canEdit="canEdit" :newMetric="newMetric" />
				</div>
				<div v-if="isLast">
					<calculated-ruler-output v-if="newMetric.Type == 'ruler'" :canEdit="canEdit" :newMetric="newMetric" />
					<calculated-radar-output v-if="newMetric.Type == 'radar'" :canEdit="canEdit" :newMetric="newMetric" />
				</div>
			</md-dialog-content>

			<md-dialog-actions>
				<div>
					<md-button @click="openPopup = false">Cancelar</md-button>
					<md-button class="md-primary" v-if="step != 1" @click="prev">Anterior</md-button>
					<md-button class="md-primary" v-if="step != 1 && !isLast" @click="next">Siguiente</md-button>
					<md-button class="md-primary" v-if="isLast" @click="save">Calcular</md-button>
				</div>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>
import CalculatedType from './CalculatedWizard/CalculatedType.vue';
import CalculatedObjective from './CalculatedWizard/CalculatedObjective.vue';
import CalculatedArea from './CalculatedWizard/CalculatedArea.vue';
import CalculatedRadarOutput from './CalculatedWizard/CalculatedRadarOutput.vue';
import CalculatedRulerOutput from './CalculatedWizard/CalculatedRulerOutput.vue';
import str from '@/common/js/str';

export default {
	name: 'calculateMetric',
	components: {
		CalculatedType,
		CalculatedObjective,
		CalculatedArea,
		CalculatedRadarOutput,
		CalculatedRulerOutput,
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
				|| (this.step == 3 && this.newMetric.Type != 'radar');
		},
		maxSteps() {
			if(this.step == 1) {
				return '.';
			} else if(this.newMetric.Type == 'radar') {
				return ' de 4.';
			}
			return ' de 3.';
		},
		segun() {
			let ret = '.';
			if(this.newMetric.Type == 'formula') {
				//TODO: definir.
				ret = ' según fórmula.';
			} else if(this.newMetric.Type == 'ruler') {
				ret = ' según distancia.';
				if(this.step == 2) {
					ret += ' > Objetivo.';
				} else if(this.step == 3) {
					ret += ' > Objetivo > Salida.';
				}
			} else if(this.newMetric.Type == 'radar') {
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
			return {
				BaseMetric: {},

				Id: null,
				Type: '',
				//TODO: revisar defaults
				HasDescription: false,
				HasDistance: false,
				HasValue: false,
				HasCoords: true,
				HasNormalizationValue: false,

				HasMaxDistance: 20,
				MaxDistance: 0,
				InSameProvince: false,

				HasAdditionValue: false,
				HasMaxValue: false,
				HasMinValue: false,
				HasCount: false,

				ValueLabelIds: [],

				IsInclusionPoint: false,
				InclusionDistance: 0,
				IsInclussionFull: true,

				VersionId: null,
				LevelId: null,
				VariableId: null,

				SelectedVersion: null,
				SelectedLevel: null,
				SelectedVariable: null,
			};
		},
		next() {
			if(this.validate() == false) {
				return;
			}
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
		formulaClick() {
			this.newMetric.Type = 'formula';
			this.step = 2;
		},
		rulerClick() {
			this.newMetric.Type = 'ruler';
			this.step = 2;
		},
		radarClick() {
			this.newMetric.Type = 'radar';
			this.step = 2;
		},
		show() {
			this.newMetric = this.initNewMetric();
			this.step = 1;
			this.openPopup = true;
		},
		save() {
			if(this.validate() == false) {
				return;
			}
			// this.openPopup = false;
			const loc = this;
			this.$refs.invoker.do(this.Dataset,
				loc.Dataset.CalculateNewMetric, loc.newMetric)
			.then(function(data) {
				loc.openPopup = false;
			});
		},
		validate() {
			return true;
			if(this.step == 2) {
				if(this.newMetric.BaseMetric.Metric == null) {
					alert("Debe seleccionar un indicador.");
					return false;
				}
				if(this.newMetric.VersionId == null) {
					alert("Debe seleccionar una versión.");
					return false;
				}
				if(this.newMetric.LevelId == null) {
					alert("Debe seleccionar un nivel.");
					return false;
				}
				if(this.newMetric.VariableId == null) {
					alert("Debe seleccionar una variable.");
					return false;
				}
				//TODO: ver si es obligatorio
				if(this.newMetric.ValueLabelIds.length == 0) {
					alert("Debe seleccionar al menos una categoría.");
					return false;
				}
			}
			if(this.step == 3) {
				if(this.newMetric.Type == 'ruler') {
					if(this.newMetric.HasMaxDistance
						&& str.IsIntegerGreaterThan0(this.newMetric.MaxDistance) == false) {
						alert("Debe ingresar la distancia máxima en kms.");
						return false;
					}
				} else if(this.newMetric.Type == 'radar') {
					if(this.newMetric.IsInclusionPoint
						&& str.IsIntegerGreaterThan0(this.newMetric.InclusionDistance) == false) {
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

