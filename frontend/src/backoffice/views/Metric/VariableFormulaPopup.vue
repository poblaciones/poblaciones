<template>
	<div>
	<md-dialog :md-active.sync="showDialog" :md-click-outside-to-close="false">
		<md-dialog-title>{{ title }}</md-dialog-title>
		<md-dialog-content style="margin-bottom: -16px;">
			<invoker ref="invoker"></invoker>

			<div v-if="Variable">
				<div class='md-layout md-gutter'>
					<div class='md-layout-item md-size-75 md-small-size-100'>
						<mp-select label='Variable' :canEdit='canEdit'
											 v-model='newVariable'
											 list-key='Id'
											 :list='Dataset.GetNumericTextAndRichColumns()'
											 :render='formatColumn'
											 @selected="updateValues"
											 helper='Variable de categorías o valor numérico para el cálculo del indicador.' />
					</div>

					<div class='md-layout-item md-size-75 md-small-size-100' v-show="!DataColumnIsCategorical()">
						<mp-select label='Normalización' :canEdit='canEdit'
											 v-model='newNormalization'
											 list-key='Id'
											 :list='Dataset.GetNumericAndRichColumns(true)'
											 :render='formatColumn'
											 @selected="updateValues"
											 helper='Total para realizar porcentajes o tasas con el indicador.' />
					</div>
					<div v-show='!(newNormalization && newNormalization.Code === null)' class='md-layout-item md-size-70 md-small-size-100'>
						<mp-select label='Porcentaje / tasa' :canEdit='canEdit'
											 v-model='Variable.NormalizationScale'
											 :model-key='true'
											 list-key='Id' :disabled='newNormalization && newNormalization.Code === null'
											 list-caption='Caption'
											 :list='Dataset.GetNormalizationScales()'
											 helper='Indica el modo de normalización. Ej. Porcentaje, 1 cada 10 mil.' />
					</div>
					<div class='md-layout-item md-size-100 md-small-size-100'>
						<md-switch class="md-primary" :disabled="!Work.CanEdit()" v-model="useFilter">Aplicar un filtro de filas.</md-switch>

					</div>
					<div class='md-layout-item md-size-0 md-small-size-0' v-show="useFilter">

					</div>
					<div class='md-layout-item md-size-40 md-small-size-40' v-show="useFilter">
						<div class="helper" style="position: absolute; bottom: 26px;">
							Importante: el filtro del indicador no se aplicará en la descarga del dataset.
						</div>
						<mp-select label='Variable de filtro' :canEdit='canEdit'
															v-model='filterVariable'
															list-key='Id'
															:list='Dataset.Columns'
															:render='formatColumn' />
					</div>
					<div class='md-layout-item md-size-30 md-small-size-20' v-show="useFilter">
						<md-field>
							<label class="mp-label">
								Condición
							</label>
							<md-select md-dense v-model="filterOperator" ref="operator" :disabled="!canEdit">
								<md-option value="=">igual a</md-option>
								<md-option value=">">mayor que</md-option>
								<md-option value="<">menor que</md-option>
								<md-option value="<>">diferente a</md-option>
								<md-option value=">=">mayor o igual que</md-option>
								<md-option value="<=">menor o igual que</md-option>
								<md-option value="LIKE">contiene</md-option>
								<md-option value="NOT LIKE">no contiene</md-option>
								<md-option value="IS NULL">es nulo o vacío</md-option>
								<md-option value="IS NOT NULL">no es nulo ni vacío</md-option>
							</md-select>
						</md-field>
					</div>
					<div class='md-layout-item md-size-20 md-small-size-30' v-show="useFilter && filterOperator !== 'IS NULL' && filterOperator !== 'IS NOT NULL'">
						<md-field style="padding-top: 0px; margin-top: 0px; overflow: hidden;">
							<md-autocomplete v-model="filterValue" ref="filterVal" :md-open-on-focus="false" :md-options="columnsForFilter" md-dense>
								<label>Valor</label>

							</md-autocomplete>
						</md-field>
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

import str from '@/common/framework/str';
import f from '@/backoffice/classes/Formatter';

var columnFormatEnum = require("@/common/enums/columnFormatEnum");

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
			/*arr.Clear(this.columnsForFilter);
			for (var n = 0; n < this.Dataset.Columns.length; n++) {
				this.columnsForFilter.push("[" + this.Dataset.Columns[n].Caption + "]");
			}*/
			if (variable.Symbology.CutMode === null) {
				variable.Symbology.CutMode = 'S';
			}
			this.Variable = f.clone(variable);
			this.originalFilterValue = variable.FilterValue;
			if (this.Variable.Symbology.NormalizationScale === null) {
				this.Variable.Symbology.NormalizationScale = 100;
			}
			this.useFilter = this.Variable.FilterValue !== null;
			this.showDialog = true;
			setTimeout(() => {
				var loc = this;
				this.$refs.operator.$el.validity = {};
				this.$refs.filterVal.$el.onkeydown = function (e) {
					if (e.keyCode === 13) {
						loc.Save();
						return false;
					}
				};

			}, 50);
			this.receiveValue();
		},
		hide() {
			this.showDialog = false;
		},
		Save() {
			if (this.Variable.Data === null) {
				alert("Debe indicar una variable para el valor para la fórmula.");
				return;
			}
			if (!this.updateFilterValues()) {
				return;
			}
			var loc = this;
			this.updateValues();
			if (this.originalFilterValue !== this.Variable.FilterValue) {
				// El filtro impacta en las escalas... regenera
				this.$refs.invoker.doSave(this.Dataset.ScaleGenerator,
					this.Dataset.ScaleGenerator.RegenAndSaveVariable, this.Level, this.Variable).then(function () {
						loc.hide();
					});
			} else {
				// Simplemente la graba
				this.$refs.invoker.doSave(this.Dataset,
					this.Dataset.UpdateVariable, this.Level, this.Variable).then(function () {
						loc.hide();
					});
			}
		},
		updateFilterValues() {
			if (!this.useFilter) {
				this.Variable.FilterValue = null;
				return true;
			}
			if (this.filterVariable === null) {
				alert("Debe indicar una variable para el filtro.");
				return false;
			}
			if (this.filterValue === null || this.filterValue === '') {
				alert("Debe indicar un valor para el filtro.");
				return false;
			}
			if (this.filterOperator === null) {
				alert("Debe indicar un operador para el filtro.");
				return false;
			}
			if (!str.isNumericFlex(this.filterValue) && !this.filterValue.startsWith('"') && !this.filterValue.startsWith("'")) {
				alert('Los valores de filtro de tipo texto deben indicarse entre comillas ("valor")');
				return false;
			}
			this.Variable.FilterValue = this.Dataset.makeFilter(this.filterVariable, this.filterOperator, this.filterValue);
			return true;
		},
		receiveValue() {
			this.newVariable = this.Dataset.fromTwoColumnVariable(this.Variable.Data, this.Variable.DataColumn);
			this.newNormalization = this.Dataset.fromTwoColumnVariable(this.Variable.Normalization, this.Variable.NormalizationColumn);
			this.receiveFilter();
		},
		receiveFilter() {
			this.filterOperator = null;
			this.filterValue = null;
			this.filterVariable = null;
			var filter = this.Variable.FilterValue;
			if (filter === null) {
				this.useFilter = false;
				return;
			} else {
				this.useFilter = true;
			}
			var filter = this.Dataset.parseFilter(this.Variable);
			this.filterVariable = filter.Column;
			this.filterOperator = filter.Operator;
			this.filterValue = filter.Value;
		},
		DataColumnIsCategorical() {
			if (!this.Variable || !this.Variable.DataColumn) {
				return false;
			}
			return this.Variable.DataColumn.Format === columnFormatEnum.STRING ||
								this.Dataset.ColumnHasLabels(this.Variable.DataColumn);
		},
		updateValues() {
			// Resuelve valor
			var wasCategorical = this.Variable.DataColumnIsCategorical;

			var data = this.Dataset.toTwoColumnVariable(this.newVariable);
			this.Variable.Data = data.Info;
			this.Variable.DataColumn = data.Column;
			this.Variable.DataColumnIsCategorical = this.DataColumnIsCategorical();

			if (this.Variable.DataColumnIsCategorical) {
				// La pone como variable de corte
				this.Variable.Symbology.CutMode = 'V';
				this.Variable.Symbology.CutColumn = this.Variable.DataColumn;
				this.Variable.Normalization = null;
				this.Variable.NormalizationColumn = null;
			} else {
				// Resuelve normalización
				var normalization = this.Dataset.toTwoColumnVariable(this.newNormalization);
				this.Variable.Normalization = normalization.Info;
				this.Variable.NormalizationColumn = normalization.Column;
				// No deja categorías zombies
				if (wasCategorical) {
					this.Variable.Symbology.CutMode = 'S';
					this.Variable.Symbology.CutColumn = null;
				}
			}
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
			useFilter: false,
			Variable: null,
			filterOperator: null,
			filterValue: null,
			filterVariable: null,
			originalFilterValue: null,
			showDialog: false,
			newVariable: null,
			newNormalization: null,
			columnsForFilter: [],
		};
	},
};
</script>

<style lang="scss">

</style>

