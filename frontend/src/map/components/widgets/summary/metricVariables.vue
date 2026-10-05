<template>
	<div class="variablesBlock">
		<div v-for="(variable, index) in level.Variables" :key="variable.Id" class="variableBlock" :class="rowClass(index)">
			<div v-if="fixedLevel || metric.matchesComparableFilter(variable)" v-show="!(level.Variables.length === 1 && level.Variables[0].Name === '')
					 && (!Embedded.Readonly || index === level.SelectedVariableIndex)" class="variableRow hand" :class="activeClass(index)" @click="clickVariable(index)">
				{{ variableName(variable) }} {{ divider(variable) }}<span v-if="isActive(index)" style="padding-left: 1px;">{{ variable.Asterisk }}</span>
				<span v-if="isActive(index)" @click.stop="toggleVariable()" class='hand exp-hiddable-inline'>
					<chevron-down-icon v-if="version.LabelsCollapsed"
														 title="Mostrar categorías" />
					<chevron-up-icon v-else title="Ocultar categorías" />
				</span>
			</div>
			<mp-collapse>
				<div v-show="isDetailVisible(index)" class="variableDetail">
					<metricChart v-if="useCharts && metric.ShowChart == 1 && metric.useChart()" :metric="metric" :variable="variable" />
					<metricValues :metric="metric" :variable="variable" />
				</div>
			</mp-collapse>
		</div>
		<div v-if="hasComparableVariables && hasNonComparableVariables" class="coverageBox" style="padding: 12px 0px 0px 0px">
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
		variableName(variable) {
			var ret = variable.Name ? variable.Name : 'Conteo';
			return str.RemoveDot(ret);
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
			if (this.fixedLevel) {
				for (var v = 0; v < this.metric.properties.Versions.length; v++) {
					var version = this.metric.properties.Versions[v];
					var level = version.Levels[version.Levels.length - 1];
					if (level.Variables.length > index) {
						level.SelectedVariableIndex = index;
					}
				}
			} else {
				for (var v = 0; v < this.metric.properties.Versions.length; v++) {
					var version = this.metric.properties.Versions[v];
					var lastLevelDontMultilevel = version.Levels.length > 1 && version.Levels[version.Levels.length - 1].Dataset.Type !== 'D';
					for (var l = 0; l < version.Levels.length - (lastLevelDontMultilevel ? 1 : 0); l++) {
						var level = version.Levels[l];
						if (level.Variables.length > index) {
							level.SelectedVariableIndex = index;
						}
					}
				}
			}
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
