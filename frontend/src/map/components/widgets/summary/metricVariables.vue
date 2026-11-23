<template>
	<div class="variablesBlock">
		<div v-for="(variable, index) in level.Variables" :key="variable.Id" class="variableBlock" :class="rowClass(index)">
			<div v-if="showsVariable(variable)" v-show="isRowVisible(index)"
					 class="variableRow hand" :class="activeClass(index)" @click="clickVariable(index)">
				{{ variableName(variable) }} {{ divider(variable) }}<span v-if="isActive(index)" style="padding-left: 1px;">{{ variable.Asterisk }}</span>
				<span v-if="isActive(index)" @click.stop="toggleVariable()" class='hand exp-hiddable-inline'>
					<chevron-down-icon v-if="version.LabelsCollapsed"
														 title="Mostrar categorías" />
					<chevron-up-icon v-else title="Ocultar categorías" />
				</span>
			</div>
			<mp-collapse>
				<div v-show="isActive(index)" class="variableDetail">
					<mp-collapse>
						<div v-show="isDetailVisible(index)">
							<metricChart v-if="useCharts && metric.ShowChart == 1 && metric.useChart()" :metric="metric" :variable="variable" />
							<metricValues :metric="metric" :variable="variable" />
						</div>
					</mp-collapse>
					<div v-if="isActive(index)" class="detailSlot" :class="{ 'detailSlot--followed': isFollowedByVariable(index) }">
						<slot></slot>
					</div>
				</div>
			</mp-collapse>
		</div>
		<div v-if="ownsSelectedLevel && hasComparableVariables && hasNonComparableVariables" class="coverageBox" style="padding: 12px 0px 0px 0px">
			<sup>+</sup> {{ hiddenLegend }}
		</div>
	</div>
</template>

<script>
import h from '@/map/js/helper';
import str from '@/common/framework/str';
import metricValues from './metricValues';
import metricChart from './metricChart';
import MpCollapse from '@/map/components/controls/mpCollapse';
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import ChevronUpIcon from 'vue-material-design-icons/ChevronUp.vue';
// https://materialdesignicons.com/cdn/1.9.32/

export default {
	name: 'metricVariables',
	props: [ 'metric', 'fixedLevel' ],
	components: {
		metricValues,
		metricChart,
		MpCollapse,
		ChevronDownIcon,
		ChevronUpIcon
	},
	computed: {
		version() {
			return this.metric.SelectedVersion();
		},
		useCharts() {
			return window.Use.UseCharts;
		},
		level() {
			if (this.fixedLevel) {
				return this.fixedLevel;
			} else {
				return this.metric.AutomaticLevel();
			}
		},
		Embedded() {
			return window.Embedded;
		},
		// Con dos bloques, la leyenda de variables ocultas corresponde solo al que muestra el nivel elegido.
		ownsSelectedLevel() {
			return this.metric.SelectedLevel() === this.level;
		},
		hasSingleUnnamedVariable() {
			return this.level.Variables.length === 1 && this.level.Variables[0].Name === '';
		},
		useComparer() {
			return window.Use.UseCompareSeries && this.metric.properties.Comparable && this.metric.properties.Versions.length > 1;
		},
		hiddenLegend() {
			var c = this.metric.getNonComparableVariables().length;
			if (c == 1) {
				return "Una variable oculta por no poseer series de comparación.";
			} else {
				return c + " variables ocultas por no poseer series de comparación.";
			}
		},
		hasNonComparableVariables() {
			return this.metric.hasNonComparableVariables();
		},
		hasComparableVariables() {
			return this.metric.hasComparableVariables();
		}
	},
	methods: {
		getArrow() {
			if(!this.version.LabelsCollapsed) {
				return 'fas fa-caret-down';
			} else {
				return 'fas fa-caret-left';
			}
		},
		getArrowMaterial() {
			if(!this.version.LabelsCollapsed) {
				return 'keyboard_arrow_up';
			} else {
				return 'keyboard_arrow_down';
			}
		},
		// Las ubicaciones aparte se ofrecen completas salvo que alguna de sus variables se pueda comparar.
		// Indica si debajo del detalle de la variable se ve la fila de otra variable: en ese caso el contenido
		// del detalle (el ranking) necesita un espacio inferior. El bloque de ubicaciones aparte va siempre
		// antes del principal.
		isFollowedByVariable(index) {
			if (this.fixedLevel) {
				return true;
			}
			for (var n = index + 1; n < this.level.Variables.length; n++) {
				if (this.showsVariable(this.level.Variables[n]) && this.isRowVisible(n)) {
					return true;
				}
			}
			return false;
		},
		showsVariable(variable) {
			if (this.fixedLevel && !this.metric.LevelHasComparableVariables(this.level)) {
				return true;
			}
			return this.metric.matchesComparableFilter(variable);
		},
		variableName(variable) {
			if (this.isLocationsBlockWithGenericVariable(variable)) {
				return this.locationsBlockTitle();
			}
			var ret = variable.Name;
			if (!ret) {
				ret = 'Conteo';
			}
			return str.RemoveDot(ret);
		},
		// En el bloque de ubicaciones aparte, una única variable sin nombre o llamada "Total" no dice nada
		// del contenido: la fila se rotula con el tipo de elementos del nivel.
		isLocationsBlockWithGenericVariable(variable) {
			if (!this.fixedLevel || this.level.Variables.length !== 1) {
				return false;
			}
			var name = String(variable.Name || '').trim().toLowerCase();
			return name === '' || name === 'total';
		},
		locationsBlockTitle() {
			if (this.level.Dataset.Type === 'S') {
				return 'Zonas';
			}
			return 'Ubicaciones';
		},
		// Una única variable sin nombre no necesita fila, salvo que el nivel
		// de ubicaciones esté aparte: ahí la fila es lo que permite alternar
		// entre ubicaciones y niveles agregados.
		isRowVisible(index) {
			if (this.hasSingleUnnamedVariable && !this.metric.HasSeparateBottomLevel()) {
				return false;
			}
			if (this.Embedded.Readonly) {
				return this.isActive(index);
			}
			return true;
		},
		activeClass(index) {
			if (this.isActive(index) && this.level.SelectedVariableIndex === index) {
				return 'active';
			} else {
				return '';
			}
		},
		rowClass(index) {
			if (this.isActive(index) && this.level.SelectedVariableIndex === index) {
				return '';
			} else {
				return 'exp-hiddable-block';
			}
		},
		divider(variable) {
			var normalization = h.ResolveNormalizationCaption(variable);
			if (variable.IsGap) {
				return "";
			}
			if (normalization != '%') {
				return normalization;
			} else {
				return '';
			}
		},
		isDetailVisible(index) {
			return !this.version.LabelsCollapsed && this.isActive(index);
		},
		isActive(index) {
			return this.metric.SelectedLevel() == this.level &&
				(index === this.level.SelectedVariableIndex);
		},
		clickVariable(index) {
			var changingLevel = this.metric.SelectedLevel() !== this.level;
			if (changingLevel) {
				this.metric.SetLevel(this.level);
			}
			if (this.level.SelectedVariableIndex === index && !changingLevel) {
				this.selectVariable(-1);
			} else {
				this.selectVariable(index);
			}
			this.$emit('variableChanged');
		},
		selectVariable(index) {
			this.metric.SelectVariableInAllVersions(this.level, index, !!this.fixedLevel);
			var variable = this.metric.SelectedVariable();
			if (variable) {
				window.SegMap.Session.Content.SelectVariable(variable.Id);
			}
			this.metric.UpdateMap();
		},
		toggleVariable() {
			this.version.LabelsCollapsed = !this.version.LabelsCollapsed;
		},
	},
}; //
</script>

<style scoped>

.variableDetail
{
	display: flow-root;
	padding-left: 10px;
	padding-right: 10px;
}
.detailSlot--followed
{
	padding-bottom: 12px;
}
.fa-left
{
	text-align: left;
	width: 12px;
	vertical-align: baseline;
}
.fasVariable
{
	font-size: 12px;
  vertical-align: top;
  padding-top: 4px;
  margin-right: 2px;
}
</style>
