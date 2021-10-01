<template>
	<div>
		<md-dialog :md-active.sync="showDialog" :md-click-outside-to-close="false" style="min-width: 670px!important;">
			<md-dialog-title>{{ title }}</md-dialog-title>
			<md-dialog-content>
				<invoker ref="invoker"></invoker>

				<div v-if="Variable" class="md-layout md-gutter">
					<div class="md-layout-item md-size-100">
						<md-card>
							<md-card-content>
								<div class="md-layout md-gutter">
									<div class="md-layout-item md-size-100 separator">
										Mapa
									</div>
									<div class="md-layout-item md-size-100" v-if="Dataset.properties.Type !== 'L'">
										<div class="md-layout">
											<div class="md-layout-item md-size-30 md-small-size-100" style="padding-top: 16px;">
												Transparencia:
											</div>
											<div class="md-layout-item md-size-70 md-small-size-100">
												<md-radio class="md-primary" v-model="Variable.Symbology.Opacity" value="H">Baja</md-radio>
												<md-radio class="md-primary" v-model="Variable.Symbology.Opacity" value="M">Media</md-radio>
												<md-radio class="md-primary" v-model="Variable.Symbology.Opacity" value="L">Alta</md-radio>
											</div>
										</div>
									</div>
									<div class="md-layout-item md-size-100" v-if="useGradients && Dataset.properties.Type !== 'L' && Dataset.properties.Geography.GradientId">
										<div class="md-layout">
											<div class="md-layout-item md-size-30 md-small-size-100" style="padding-top: 16px;">
												Ajuste poblacional:
												<mp-help :text="`<p><b>¿Qué es el ajuste poblacional?</b></p><p>La geografía que utilizó para georreferenciar
								contiene estimaciones espaciales de población con resolución de 100m x 100m, facilitada por el proyecto
								WorldPop (https://www.worldpop.org/). </p><p>Habilitando esta opción, los polígonos en el mapa serán suavizados
								en la zonas de menor densidad poblaciones, para dar más importancia a las zonas habitadas.
									</p></p>`" />

											</div>
											<div class="md-layout-item md-size-70 md-small-size-100">
												<md-radio class="md-primary" v-model="Variable.Symbology.GradientOpacity" value="H">Bajo</md-radio>
												<md-radio class="md-primary" v-model="Variable.Symbology.GradientOpacity" value="M">Medio</md-radio>
												<md-radio class="md-primary" v-model="Variable.Symbology.GradientOpacity" value="L">Alto</md-radio>
												<md-radio class="md-primary" v-model="Variable.Symbology.GradientOpacity" value="N">Deshabilitado</md-radio>
											</div>
										</div>
									</div>
									<div v-if="Dataset.properties.CaptionColumn !== null" class="md-layout-item md-size-50 md-small-size-100">
										<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.Symbology.ShowLabels">
											Mostrar descripciones
										</md-switch>
									</div>
									<div class="md-layout-item md-size-50 md-small-size-100">
										<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.Symbology.ShowValues">
											Mostrar etiquetas con los valores
										</md-switch>
									</div>
									<div class="md-layout-item md-size-50 md-small-size-100" v-if="!Dataset.properties.AreSegments">
										<md-switch class="md-primary" :disabled="!canEdit" @change="updatePerimeterVisibility" v-model="usePerimeter">
											Mostrar perímetro de cobertura
										</md-switch>
										<mp-simple-text style="padding-left: 50px; margin-top: -8px" :canEdit="canEdit"
																		type="number" v-show="usePerimeter" @enter="Save" ref="perimeter" label="Radio del perímetro" suffix="km"
																		v-model="Variable.Perimeter"></mp-simple-text>
									</div>
									<div v-if="Dataset.properties.Type === 'L' && !Dataset.properties.AreSegments" class="md-layout-item md-size-50 md-small-size-100">
										<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.Symbology.IsSequence">
											Organizar los elementos como secuencia
										</md-switch>
										<mp-select label='Variable de secuencia' v-show="Variable.Symbology.IsSequence" :canEdit='canEdit && Variable.Symbology.IsSequence'
															 v-model='Variable.Symbology.SequenceColumn'
															 list-key='Id' :allowNull="true"
															 :list='columnsForSequenceColumn'
															 :render='formatColumn'
															 helper='Seleccione la variable que da el orden a la secuencia' />
									</div>
								</div>
							</md-card-content>
						</md-card>
					</div>
					<div class="md-layout-item md-small-size-100" :class="(Level.Variables.length > 1 ? 'md-size-50' : 'md-size-100')">
						<md-card>
							<md-card-content>
								<div class="md-layout md-gutter">
									<div class="md-layout-item md-size-100 separator">
										Panel de resumen
									</div>
									<div class="md-layout-item md-size-70 md-small-size-100">
										<mp-simple-text label="Leyenda" :canEdit="canEdit" :multiline="true"
																		v-model="Variable.Legend" :maxlength="500" helper="Nota aclaratoria (opcional) que se mostrará al pie del indicador." />
									</div>
									<div class="md-layout-item md-size-50 md-small-size-100">
										<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.Symbology.ShowEmptyCategories">
											Mostrar categorías sin valores
										</md-switch>
									</div>
								</div>
							</md-card-content>
						</md-card>
					</div>
					<template v-if="Level.Variables.length > 1">
						<div class="md-layout-item md-size-50 md-small-size-100">
							<md-card>
								<md-card-content>
									<div class="md-layout md-gutter">
										<div class="md-layout-item md-size-100 separator">
											Variable predeterminada
										</div>
										<div class="md-layout-item md-size-100 md-small-size-100">
											<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.IsDefault">
												Mostrar como variable inicial del indicador
											</md-switch>
										</div>
									</div>
								</md-card-content>
							</md-card>
						</div>
					</template>
				</div>
</md-dialog-content>
			<md-dialog-actions>
				<template v-if="canEdit">
					<md-button @click="hide">Cancelar</md-button>
					<md-button class="md-primary" @click="Save">Guardar</md-button>
				</template>
				<md-button v-else="" @click="hide">Cerrar</md-button>
			</md-dialog-actions>

		</md-dialog>
	</div>
</template>


<script>

import axios from 'axios';
import f from '@/backoffice/classes/Formatter';

export default {
  name: 'variableSymbology',
	data() {
		return {
			usePerimeter: false,
			Level: null,
			Variable: null,
			showDialog: false
		};
	},
  methods: {
	show(level, variable) {
			// Se pone visible
			this.Level = level;

			if (variable.Symbology.CutMode === null) {
				variable.Symbology.CutMode = 'S';
			}
			this.Variable = f.clone(variable);
			this.usePerimeter = this.Variable.Perimeter && this.Variable.Perimeter > 0;
			this.showDialog = true;
		},
		updatePerimeterVisibility() {
			if (this.usePerimeter) {
				var loc = this;
				setTimeout(() => {
					loc.$refs.perimeter.focus();
				}, 100);
			}
		},
		hide() {
			this.showDialog = false;
		},
		formatColumn(column) {
			return f.formatColumn(column);
		},
		Save() {
			if (this.Variable.Data === null) {
				alert("Debe indicar una variable para el valor para la fórmula.");
				return;
			}
			if (this.usePerimeter && !this.Variable.Perimeter) {
				alert("El perímetro debe tener un valor numérico.");
				return;
			}
			if (this.Variable.Symbology.IsSequence &&
				!this.Variable.Symbology.SequenceColumn) {
				alert("Debe indicar una variable que defina el orden de la secuencia.");
				return;
			}
			var loc = this;
			if (!this.usePerimeter) {
				this.Variable.Perimeter = null;
			}
			this.$refs.invoker.doSave(this.Dataset,
					this.Dataset.UpdateVariable, this.Level, this.Variable).then(function() {
					loc.hide();
					});
		},
		DisplayError(errMessage) {
			this.error = 'El proceso no ha podido ser completado. ' + errMessage;
		},
  },
	computed: {
		 Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
		useGradients() {
			return window.Context.Configuration.useGradients;
		},
		columnsForSequenceColumn() {
			return this.Dataset.GetColumnsForSequenceColumn();
		},
		canEdit() {
			if (this.Work) {
				return this.Work.CanEdit();
			} else {
				return false;
			}
		},
		title() {
			if (this.Level) {
				return this.Level.MetricVersion.Metric.Caption;
			} else {
				return '';
			}
		}
	},
};
</script>


<style rel='stylesheet/scss' lang='scss' scoped=''>

</style>

