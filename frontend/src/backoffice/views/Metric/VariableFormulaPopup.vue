<template>
	<div>
	<md-dialog :md-active.sync="showDialog" :md-click-outside-to-close="false">
		<md-dialog-title>{{ title }}</md-dialog-title>
		<md-dialog-content>
		<invoker ref="invoker"></invoker>

	<div v-if="Variable">
		<div class='md-layout'>
				<div class='md-layout-item md-size-75 md-small-size-100'>
					<mp-select label='Variable' :canEdit='canEdit'
										 v-model='newVariable'
										 list-key='Id'
										 :list='Dataset.GetNumericAndRichColumns()'
										 :render='formatColumn'
										 @selected="updateValues"
										 helper='Valor numérico para el cálculo del indicador.'
										 />
				</div>

			<div class='md-layout-item md-size-75 md-small-size-100'>
				<mp-select label='Normalización' :canEdit='canEdit'
										v-model='newNormalization'
										list-key='Id'
										:list='Dataset.GetNumericAndRichColumns(true)'
										:render='formatColumn'
										@selected="updateValues"
										helper='Total para realizar porcentajes o tasas con el indicador.'
										/>
				</div>
				<div v-show='!(newNormalization && newNormalization.Code === null)' class='md-layout-item md-size-70 md-small-size-100'>
					<mp-select label='Porcentaje / tasa' :canEdit='canEdit'
										 v-model='Variable.NormalizationScale'
										 :model-key='true'
										 list-key='Id' :disabled='newNormalization && newNormalization.Code === null'
										 list-caption='Caption'
										 :list='Dataset.GetNormalizationScales()'
										 helper='Indica el modo de normalización. Ej. Porcentaje, 1 cada 10 mil.'
										 />
			</div>
		</div>
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
	name: 'metricVariables',
	components: {
	},
	methods: {

		formatColumn(column) {
			return f.formatColumn(column);
		},
		show(level, variable) {
			// Se pone visible
			this.Level = level;
			if (variable.Symbology.CutMode === null) {
				variable.Symbology.CutMode = 'S';
			}
			this.Variable = f.clone(variable);
			if (this.Variable.Symbology.NormalizationScale === null) {
				this.Variable.Symbology.NormalizationScale = 100;
			}
			this.showDialog = true;
			this.receiveValue();
		},
		hide() {
			this.showDialog = false;
		},
		Save() {
			if (this.Variable.Data === null) {
				alert("Debe indicar una variable para el valor para la fórmula.");
				this.currentTab = 'tab-formula';
				return;
			}
			var loc = this;
			this.updateValues();
			this.$refs.invoker.do(this.Dataset,
					this.Dataset.UpdateVariable, this.Level, this.Variable).then(function() {
					loc.hide();
					});
		},
		receiveValue() {
			this.newVariable = this.Dataset.fromTwoColumnVariable(this.Variable.Data, this.Variable.DataColumn);
			this.newNormalization = this.Dataset.fromTwoColumnVariable(this.Variable.Normalization, this.Variable.NormalizationColumn);
		},
		updateValues() {
			// Resuelve valor
			var data = this.Dataset.toTwoColumnVariable(this.newVariable);
			this.Variable.Data = data.Info;
			this.Variable.DataColumn = data.Column;
			// Resuelve normalización
			var normalization = this.Dataset.toTwoColumnVariable(this.newNormalization);
			this.Variable.Normalization = normalization.Info;
			this.Variable.NormalizationColumn = normalization.Column;
		},
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
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
	data() {
		return {
			Level: null,
			Variable: null,
			showDialog: false,
			newVariable: null,
			newNormalization: null,
		};
	},
};
</script>

<style lang="scss">
</style>

