<template>
	<div>
		<invoker ref="invoker"></invoker>
		<calculated-metric-wizard ref="calculatedMetricWizard" />

		<level-popup ref="levelPopup"></level-popup>

		<metric-popup ref="metricPopup">
		</metric-popup>

		<variable-formula-popup ref="editVariableFormulaPopup">
		</variable-formula-popup>
		<variable-symbology-popup ref="editVariableSymbologyPopup">
		</variable-symbology-popup>
		<variable-options-popup ref="editVariableOptionsPopup">
		</variable-options-popup>

		<new-metric ref="newMetric">
		</new-metric>

		<pick-metric-version ref="pickMetricVersion" :list="unUsedWorkVersionsList" @onSelectMetricVersion="onCompleteLevel">
		</pick-metric-version>

		<div v-if="Work.CanEdit()" class="md-layout">
			<md-button @click="createNewMetric">
				<md-icon>add_circle_outline</md-icon>
				Agregar indicador
			</md-button>
			<md-button v-if="calculateEnabled" @click="calculateNewMetricDistance">
				<md-icon>radar</md-icon>
				Rastreo
			</md-button>
			<md-button v-if="calculateEnabled" @click="calculateNewMetricAreaCount">
				<md-icon>functions</md-icon>
				Conteo
			</md-button>
			<md-button @click="createNewLevel()" v-if="Dataset !== null && Dataset.properties.MultilevelMatrix !== null" :disabled="unUsedWorkVersionsList.length === 0">
				<md-icon>add_circle_outline</md-icon>
				Completar nivel
			</md-button>
			<md-button @click="levelDataset" v-if="canLevel">
				<md-icon>view_week</md-icon>
				Nivelar
			</md-button>
		</div>
		<div class="md-layout" v-if="Dataset && list && Dataset.Columns">
			<div class="md-layout-item">
				<md-table v-model="list" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }" md-alignment-top md-alignment-left-top>
						<md-table-cell class="selectable" md-label="Nombre" style="padding-right: 45px">
							<div style="padding-top: 11px">
								{{ item.MetricVersion.Metric.Caption }} ({{ item.MetricVersion.Caption }})
							</div>
							<template v-if="Work.CanEdit()">
								<md-button v-if="Work.CanEdit()" class="md-icon-button" @click="openEdition(item)">
									<md-icon>edit</md-icon>
									<md-tooltip md-direction="bottom">Cambiar el nombre {{ (Work.properties.Type === 'P' ? ', la categoría': '') }} o la edición</md-tooltip>
								</md-button>
								<md-button v-if="Work.CanEdit()" class="md-icon-button" @click="onDelete(item)">
									<md-icon>delete</md-icon>
									<md-tooltip md-direction="bottom">Eliminar indicador</md-tooltip>
								</md-button>
								<md-button class="md-icon-button" @click="createNewVariable(item)" style="position: absolute; right: 0px">
									<md-icon>add_circle_outline</md-icon>
									<md-tooltip md-direction="bottom">Agregar variable</md-tooltip>
								</md-button>
							</template>
						</md-table-cell>
						<md-table-cell v-if="Work.properties.Type === 'P'" class="selectable" md-label="Categoría">{{ formatGroup(item.MetricVersion.Metric.MetricGroup) }}</md-table-cell>
						<md-table-cell class="selectable"
													 style="vertical-align: top" md-label="Fórmula">
							<md-list class="innerList">
								<md-list-item v-for="variable in item.Variables" style="display: -webkit-box"
															:key='variable.Id' :value='variable.Id'>
									<span :style="'font-size: 13px; white-space: normal;' + (variable.IsDefault && item.Variables.length > 1 ? 'font-weight: bold': '')">
										<span v-if="variable.DataColumnIsCategorical">
											Conteo
										</span>
										<span v-else>
											{{ Dataset.formatTwoColumnVariable(variable.Data, variable.DataColumn, true) }}
											<md-tooltip md-direction="bottom" v-if="Dataset.formatTwoColumnVariableTooltip(variable.Data, variable.DataColumn)">
												{{ Dataset.formatTwoColumnVariableTooltip(variable.Data, variable.DataColumn) }}
											</md-tooltip>
										</span>
										<template v-if="variable.Normalization !== null">
											/
											<span>
												{{
 Dataset.formatTwoColumnVariable(variable.Normalization, variable.NormalizationColumn, true)
												}}
												<md-tooltip md-direction="bottom" v-if="Dataset.formatTwoColumnVariableTooltip(variable.Normalization, variable.NormalizationColumn)">
													{{ Dataset.formatTwoColumnVariableTooltip(variable.Normalization, variable.NormalizationColumn) }}
												</md-tooltip>
											</span>
											{{
 formatScaleFormula(variable)
											}}
										</template>
										<template v-if="variable.Symbology.CutMode === 'V' && variable.Symbology.CutColumn !== null">
											por
											<span>
												{{ f.formatColumn(variable.Symbology.CutColumn, true) }}
												<md-tooltip md-direction="bottom" v-if="f.formatColumnTooltip(variable.Symbology.CutColumn)">
													{{ f.formatColumnTooltip(variable.Symbology.CutColumn) }}
												</md-tooltip>
											</span>
										</template>
										<template v-if="variable.FilterValue !== null">
											(<span>{{ f.formatColumn(getFilterColumn(variable), true) }}
												<md-tooltip md-direction="bottom" v-if="f.formatColumnTooltip(getFilterColumn(variable))">
													{{  f.formatColumnTooltip(getFilterColumn(variable)) }}
												</md-tooltip>
											</span><span style="font-family: sans-serif;">{{ formatFilterOperator(variable) }}</span>{{ formatFilterValue(variable) }})
										</template>
									</span>
									<md-button class="md-icon-button" @click="openVariableFormulaEdition(item, variable)">
										<md-icon>edit</md-icon>
										<md-tooltip md-direction="bottom">Fórmula</md-tooltip>
									</md-button>
								</md-list-item>
							</md-list>
						</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<md-list v-if="item.Variables.length > 0" class="innerList">
								<md-list-item v-for="variable in item.Variables" :key='variable.Id' :value='variable.Id'>
									<md-button class="md-icon-button" @click="openVariableSymbologyEdition(item, variable)">
										<md-icon>format_color_fill</md-icon>
										<md-tooltip md-direction="bottom">Simbología y coloreo</md-tooltip>
									</md-button>
									<md-button class="md-icon-button" @click="openVariableOptionsEdition(item, variable)">
										<md-icon>settings</md-icon>
										<md-tooltip md-direction="bottom">Opciones</md-tooltip>
									</md-button>
									<md-button v-if="Work.CanEdit()" class="md-icon-button" @click="onDeleteVariable(item, variable)">
										<md-icon>delete</md-icon>
										<md-tooltip md-direction="bottom">Quitar variable</md-tooltip>
									</md-button>
									<md-button v-if="Work.CanEdit() && item.Variables.length > 1 && !isFirst(item, variable)" class="md-icon-button" @click="up(item, variable)">
										<md-icon>arrow_upward</md-icon>
										<md-tooltip md-direction="bottom">Subir una ubicación</md-tooltip>
									</md-button>
									<md-button v-if="Work.CanEdit() && item.Variables.length > 1 && !isLast(item, variable)" class="md-icon-button" @click="down(item, variable)">
										<md-icon>arrow_downward</md-icon>
										<md-tooltip md-direction="bottom">Bajar una ubicación</md-tooltip>
									</md-button>
								</md-list-item>
							</md-list>
						</md-table-cell>
					</md-table-row>
				</md-table>
			</div>
		</div>

	</div>
</template>

<script>

import Context from '@/backoffice/classes/Context';
import ScaleGenerator from '@/backoffice/classes/ScaleGenerator';
import MetricPopup from './MetricPopup.vue';
import VariableFormulaPopup from './VariableFormulaPopup.vue';
import VariableSymbologyPopup from './VariableSymbologyPopup.vue';
import VariableOptionsPopup from './VariableOptionsPopup.vue';
import CalculatedMetricWizard from '@/backoffice/views/Dataset/CalculatedWizard/CalculatedWizard.vue';
import NewMetric from './NewMetric.vue';
import PickMetricVersion from './PickMetricVersion.vue';
import f from '@/backoffice/classes/Formatter';
import LevelPopup from "@/backoffice/views/Dataset/LevelPopup";
import arr from '@/common/framework/arr';
import color from '@/common/framework/color';

export default {
	name: 'MetricsTab',
	data() {
		return {
			unUsedWorkVersionsList: [],
		};
	},
	components: {
		MetricPopup,
		VariableFormulaPopup,
		VariableSymbologyPopup,
		VariableOptionsPopup,
		CalculatedMetricWizard,
		LevelPopup,
		NewMetric,
		PickMetricVersion,
	},
	mounted() {
		this.ReloadUnUsedMetricVersions();
	},
	computed: {
		Work() {
			return window.Context.CurrentWork;
		},
		Dataset() {
			return window.Context.CurrentDataset;
		},
		list() {
			return this.Dataset.MetricVersionLevels;
		},
		f() {
			return f;
		},
		canLevel() {
			if (!this.Dataset) {
				return false;
			}
			return this.Work.properties.Type === 'P' && this.list && this.list.length > 0;
		},
	},
	methods: {
		createNewMetric() {
			this.$refs.newMetric.show();
		},
		calculateEnabled() {
			return window.Context.Configuration.UseCalculated;
		},
		calculateNewMetricDistance() {
			if (!this.Dataset.properties.Geocoded) {
				alert('Para realizar un rastreo es necesario antes georreferenciar el dataset.');
				return;
			}
			this.$refs.calculatedMetricWizard.show(true);
		},
		calculateNewMetricAreaCount() {
			if (!this.Dataset.properties.Geocoded) {
				alert('Para definir un conteo es necesario antes georreferenciar el dataset.');
				return;
			}
			this.$refs.calculatedMetricWizard.show();
		},
		createNewLevel() {
			this.$refs.pickMetricVersion.show();
		},
		formatScaleFormula(variable) {
			if (variable.Normalization === null) {
				return '';
			}
			switch(variable.NormalizationScale) {
				case 1:
					return '';
				case 100:
					return ' * 100';
				case 1000:
					return ' * 1000';
				case 10000:
					return ' * 10.000';
				case 100000:
					return ' * 100.000';
				case 1000000:
					return ' * 1.000.000';
				default:
					return '';
			}
		},
		formatGroup(item) {
			if (item === null) {
				return '-';
			} else {
				return item.Caption;
			}
		},
		getFilterColumn(variable) {
			if (variable.FilterValue !== null) {
				var filter = this.Dataset.parseFilter(variable);
				return filter.Column;
			} else {
				return null;
			}
		},
		formatFilterOperator(variable) {
			var filter = this.Dataset.parseFilter(variable);
			return filter.FormattedOperator;
		},
		formatFilterValue(variable) {
			var filter = this.Dataset.parseFilter(variable);
			return filter.FormattedValue;
		},
		onCompleteLevel(metricVersion) {
			this.$refs.invoker.doMessage('Completando nivel', this.Dataset.LevelGenerator, this.Dataset.LevelGenerator.CompleteLevel, metricVersion);
		},
		levelDataset() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo niveles', this.Dataset, this.Dataset.GetRelatedDatasets).then(function(datasets) {
				// se saca a sí mismo
				var i = arr.IndexById(datasets, loc.Dataset.properties.Id);
				arr.RemoveAt(datasets, i);
				loc.$refs.levelPopup.show(datasets);
			});
		},
		formatMultilevel(item) {
			if (item.MetricVersion.Multilevel) {
				return 'Sí';
			} else {
				return 'No';
			}
		},
		openEdition(item) {
			this.$refs.metricPopup.show(item);
		},
		onDelete(item) {
			this.$refs.invoker.message = 'Eliminando...';
			this.$refs.invoker.confirmDo('Eliminar indicador', 'El indicador seleccionado será eliminado',
				this.Dataset, this.Dataset.DeleteMetricVersionLevel, item);
		},
		// DE VARIABLES
		createNewVariable(item) {
			var loc = this;
			window.Context.Factory.GetCopy('Variable', function(data) {
				data.Values = [];
				var value = ScaleGenerator.CreateValue('Total', 1, color.GetRandomDefaultColor(), 1);
				data.Values.push(value);
				loc.openVariableFormulaEdition(item, data);
			});
		},
		isFirst(level, variable) {
			return level.Variables[0] === variable;
		},
		isLast(level, variable) {
			return level.Variables[level.Variables.length - 1] === variable;
		},
		up(level, variable) {
			this.$refs.invoker.doSave(this.Dataset, this.Dataset.MoveVariableUp, level, variable);
		},
		down(level, variable) {
			this.$refs.invoker.doSave(this.Dataset, this.Dataset.MoveVariableDown, level, variable);
		},
		openVariableFormulaEdition(item, variable) {
			this.$refs.editVariableFormulaPopup.show(item, variable);
		},
		openVariableSymbologyEdition(item, variable) {
			if (!this.Dataset.properties.Geocoded) {
				alert('Para definir la simbología del indicador es necesario antes georreferenciar el dataset.');
				return;
			}
			var loc = this;
			var open = function () {
				loc.$refs.editVariableSymbologyPopup.show(item, variable);
			};
			if (this.Dataset.ScaleGenerator.HasData(variable)) {
				open();
			} else {
				this.$refs.invoker.doMessage('Calculando distribuciones', this.Dataset.ScaleGenerator,
					this.Dataset.ScaleGenerator.GetColumnDistributions, variable).then(
						open);
			}
		},
		openVariableOptionsEdition(item, variable) {
			this.$refs.editVariableOptionsPopup.show(item, variable);
		},
		onDeleteVariable(item, variable) {
			this.$refs.invoker.message = 'Eliminando...';
			this.$refs.invoker.confirmDo('Eliminar variable', 'La variable seleccionada será quitada del indicador',
				this.Dataset, this.Dataset.DeleteVariable, item, variable);
		},
		filterNotMatched(data) {
			var ret = [];
			for(var n = 0; n < data.length; n++) {
				var version = data[n];
				if (this.hasMatchingMatrix(version) && this.containsCurrentDataset(version) === false) {
					ret.push(version);
				}
			}
			return ret;
		},
		hasMatchingMatrix(version) {
			for(var n = 0; n < version.Levels.length; n++) {
				if (version.Levels[n].MultilevelMatrix === this.Dataset.properties.MultilevelMatrix) {
					return true;
				}
			}
			return false;
		},
		containsCurrentDataset(version) {
			for(var n = 0; n < version.Levels.length; n++) {
				if (version.Levels[n].DatasetId === this.Dataset.properties.Id) {
					return true;
				}
			}
			return false;
		},
		ReloadUnUsedMetricVersions() {
			var loc = this;
			this.Work.MetricVersions.GetAll(function(data) {
				loc.unUsedWorkVersionsList = loc.filterNotMatched(data);
			});
		}
	},
	watch: {
		"Work.MetricVersions.list"() {
			this.ReloadUnUsedMetricVersions();
		}
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-dialog-actions {
	padding: 8px 20px 8px 24px !important;
}

.innerList {
	background-color: transparent;
	margin-left: -16px;
	margin-right: -16px;
}

.close-button {
	min-width: unset;
	height: unset;
	margin: unset;
	float: right;
}

</style>
