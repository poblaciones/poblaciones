<template>
	<div>
		<invoker ref="invoker"></invoker>
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

		<calculated-metric-wizard ref="calculatedMetricWizard">
		</calculated-metric-wizard>

		<pick-metric-version ref="pickMetricVersion" :list="unUsedWorkVersionsList" @onSelectMetricVersion="onCompleteLevel">
		</pick-metric-version>

		<div v-if="Work.CanEdit()" class="md-layout">
			<md-button @click="createNewMetric">
				<md-icon>add_circle_outline</md-icon>
				Agregar indicador
			</md-button>
			<md-button v-if="calculateEnabled" @click="calculateNewMetric">
				<md-icon>add_circle_outline</md-icon>
				Calcular indicador
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
		<div class="md-layout" v-if="Dataset && list">
			<div class="md-layout-item">
				<md-table v-model="list" md-card="">
					<md-table-row slot="md-table-row" slot-scope="{ item }" md-alignment-top md-alignment-left-top>
						<md-table-cell class="selectable" md-label="Nombre">
							<div style="padding-top: 11px">
								{{ item.MetricVersion.Metric.Caption }} ({{ item.MetricVersion.Caption }})
							</div>
							<template v-if="Work.CanEdit()">
								<md-button class="md-icon-button" title="Agregar variable" @click="createNewVariable(item)">
									<md-icon>add_circle_outline</md-icon>
								</md-button>
								<md-button v-if="Work.CanEdit()" class="md-icon-button" :title="'Cambiar el nombre' + (Work.properties.Type === 'P' ? ', la categoría': '') + ' o la edición'" @click="openEdition(item)">
									<md-icon>edit</md-icon>
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
										<span :title="Dataset.formatTwoColumnVariableTooltip(variable.Data, variable.DataColumn)">
											{{ Dataset.formatTwoColumnVariable(variable.Data, variable.DataColumn, true) }}
										</span>
										<template v-if="variable.Normalization !== null">
											/
											<span :title="Dataset.formatTwoColumnVariableTooltip(variable.Normalization, variable.NormalizationColumn)">
												{{ Dataset.formatTwoColumnVariable(variable.Normalization, variable.NormalizationColumn, true) }}
											</span>
											{{ formatScaleFormula(variable) }}
										</template>
										<template v-if="variable.Symbology.CutMode === 'V' && variable.Symbology.CutColumn !== null">
											por
											<span :title="f.formatColumnTooltip(variable.Symbology.CutColumn)">
												{{ f.formatColumn(variable.Symbology.CutColumn, true) }}
											</span>
										</template>
									</span>
									<md-button class="md-icon-button" title="Fórmula" @click="openVariableFormulaEdition(item, variable)">
										<md-icon>edit</md-icon>
									</md-button>
								</md-list-item>
							</md-list>
						</md-table-cell>
						<md-table-cell md-label="Acciones" class="mpNoWrap">
							<md-list v-if="item.Variables.length > 0" class="innerList">
								<md-list-item v-for="variable in item.Variables" :key='variable.Id' :value='variable.Id'>
									<md-button class="md-icon-button" title="Simbología y coloreo" @click="openVariableSymbologyEdition(item, variable)">
										<md-icon>format_color_fill</md-icon>
									</md-button>
									<md-button class="md-icon-button" title="Opciones" @click="openVariableOptionsEdition(item, variable)">
											<md-icon>settings</md-icon>
									</md-button>
									<md-button v-if="Work.CanEdit()" class="md-icon-button" title="Quitar variable" @click="onDeleteVariable(item, variable)">
										<md-icon>delete</md-icon>
									</md-button>
									<md-button v-if="Work.CanEdit() && item.Variables.length > 1 && !isFirst(item, variable)" title="Subir una ubicación" class="md-icon-button" @click="up(item, variable)">
										<md-icon>arrow_upward</md-icon>
									</md-button>
									<md-button v-if="Work.CanEdit() && item.Variables.length > 1 && !isLast(item, variable)" title="Bajar una ubicación" class="md-icon-button" @click="down(item, variable)">
										<md-icon>arrow_downward</md-icon>
									</md-button>
								</md-list-item>
							</md-list>
							<div v-else="">
								<md-button v-if="Work.CanEdit()" class="md-icon-button" title="Eliminar indicador" @click="onDelete(item)">
									<md-icon>delete</md-icon>
								</md-button>
							</div>
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
import NewMetric from './NewMetric.vue';
import CalculatedMetricWizard from './CalculatedMetricWizard/CalculatedWizard.vue';
import PickMetricVersion from './PickMetricVersion.vue';
import f from '@/backoffice/classes/Formatter';
import LevelPopup from "@/backoffice/views/Dataset/LevelPopup";
import arr from '@/common/js/arr';

const DEFAULT_SINGLE_COLOR = '0ce800';

export default {
	name: 'MetricsTab',
	data() {
		return {
			unUsedWorkVersionsList: [],
		};
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
		calculateEnabled() {
			return window.Context.Configuration.UseCalculated;
		},
		canLevel() {
			if (!this.Dataset) {
				return false;
			}
			return this.Work.properties.Type === 'P' && this.list && this.list.length > 0;
		}
	},
	methods: {
		createNewMetric() {
			this.$refs.newMetric.show();
		},
		calculateNewMetric() {
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
		onCompleteLevel(metricVersion) {
			this.$refs.invoker.do(this.Dataset.LevelGenerator, this.Dataset.LevelGenerator.CompleteLevel, metricVersion);
		},
		levelDataset() {
			var loc = this;
			this.$refs.invoker.do(this.Dataset, this.Dataset.GetRelatedDatasets).then(function(datasets) {
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
			this.$refs.invoker.confirmDo('Eliminar indicador', 'El indicador seleccionado será eliminado',
				this.Dataset, this.Dataset.DeleteMetricVersionLevel, item);
		},
		// DE VARIABLES
		createNewVariable(item) {
			var loc = this;
			window.Context.Factory.GetCopy('Variable', function(data) {
				data.Values = [];
				var value = ScaleGenerator.CreateValue('Total', 1, DEFAULT_SINGLE_COLOR, 1);
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
			this.$refs.invoker.do(this.Dataset, this.Dataset.MoveVariableUp, level, variable);
		},
		down(level, variable) {
			this.$refs.invoker.do(this.Dataset, this.Dataset.MoveVariableDown, level, variable);
		},
		openVariableFormulaEdition(item, variable) {
			this.$refs.editVariableFormulaPopup.show(item, variable);
		},
		openVariableSymbologyEdition(item, variable) {
			/*var hasCalculatedColumns = (variable.Data !== null && variable.Data !== 'O') ||
																	(variable.Normalization !== null && variable.Normalization !== 'O');
			if (hasCalculatedColumns && !this.Dataset.properties.Geocoded) {
				alert('La fórmula del indicador incluye variables calculadas a partir de la cartografía. Para definir su simbología es necesario antes georreferenciar el dataset.');
				return;
			}*/
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
				this.$refs.invoker.do(this.Dataset.ScaleGenerator,
					this.Dataset.ScaleGenerator.GetColumnDistributions, variable).then(
						open);
			}
		},
		openVariableOptionsEdition(item, variable) {
			this.$refs.editVariableOptionsPopup.show(item, variable);
		},
		onDeleteVariable(item, variable) {
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
	components: {
		MetricPopup,
		VariableFormulaPopup,
		VariableSymbologyPopup,
		VariableOptionsPopup,
		LevelPopup,
		NewMetric,
		CalculatedMetricWizard,
		PickMetricVersion,
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.md-layout-item .md-size-15 {
	padding: 0 !important;
}

.md-layout-item .md-size-25 {
	padding: 0 !important;
}

.md-layout-item .md-size-20 {
	padding: 0 !important;
}

.md-layout-item .md-size-10 {
	padding: 0 !important;
}

.md-avatar {
	min-width: 200px;
	min-height: 200px;
	border-radius: 200px;
}

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
