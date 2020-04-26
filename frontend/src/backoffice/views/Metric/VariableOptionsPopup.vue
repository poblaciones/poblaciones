<template>
	<div>
		<md-dialog :md-active.sync="showDialog" :md-click-outside-to-close="false">
			<md-dialog-title>{{ title }}</md-dialog-title>
			<md-dialog-content>
				<invoker ref="invoker"></invoker>

				<div v-if="Variable" class="md-layout md-gutter">
		<div class="md-layout-item md-size-100 separator">
			Panel de resumen
		</div>
		<div class="md-layout-item md-size-50 md-small-size-100">
			<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.Symbology.ShowEmptyCategories">
				Mostrar categorías sin valores
			</md-switch>
		</div>
		<div class="md-layout-item md-size-100 separator">
			Mapa
		</div>
		<div v-if="Dataset.properties.CaptionColumn !== null" class="md-layout-item md-size-50 md-small-size-100">
			<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.Symbology.ShowLabels">
				Mostrar descripción en el mapa
			</md-switch>
		</div>
		<div class="md-layout-item md-size-50 md-small-size-100">
			<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.Symbology.ShowValues">
				Mostrar valores en el mapa
			</md-switch>
		</div>
		<template v-if="Level.Variables.length > 1">
			<div class="md-layout-item md-size-100 separator">
				Variable predeterminada
			</div>
			<div class="md-layout-item md-size-70 md-small-size-100">
				<md-switch class="md-primary" :disabled="!canEdit" v-model="Variable.IsDefault">
					Mostrar como variable inicial del indicador
				</md-switch>
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
  methods: {
	show(level, variable) {
			// Se pone visible
			this.Level = level;
			if (variable.Symbology.CutMode === null) {
				variable.Symbology.CutMode = 'S';
			}
			this.Variable = f.clone(variable);
			this.showDialog = true;
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
			this.$refs.invoker.do(this.Dataset,
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
			showDialog: false
		};
	},
};
</script>


<style rel='stylesheet/scss' lang='scss' scoped=''>

</style>

