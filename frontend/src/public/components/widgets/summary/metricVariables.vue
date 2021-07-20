<template>
	<div class="variablesBlock">
		<div v-for="(variable, index) in level.Variables" :key="variable.Id" class="variableBlock" :class="rowClass(index)">
			<div v-show="!(level.Variables.length === 1 && level.Variables[0].Name === '') && (!Embedded.Readonly || index === level.SelectedVariableIndex) " class="variableRow hand" v-on:click="clickVariable(index)">
				<i :class="dropClass(index)" class="fas drop fasVariable fa-left fa-circle exp-hiddable-inline"></i>
				{{ (variable.Name ? variable.Name : 'Conteo') }}
				<span v-if="index === level.SelectedVariableIndex || level.Variables.length == 1" v-on:click="toggleVariable()" class='hand exp-hiddable-inline'>
					<chevron-down-icon v-if="version.LabelsCollapsed"
															title="Mostrar categorías"/>
					<chevron-up-icon v-else title="Ocultar categorías"/>
				</span>
			</div>
			<metricValues v-show="!version.LabelsCollapsed && (index === level.SelectedVariableIndex || level.Variables.length == 1)" :metric="metric" :variable="variable" />
		</div>
	</div>
</template>

<script>
import metricValues from './metricValues';
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import ChevronUpIcon from 'vue-material-design-icons/ChevronUp.vue';
// https://materialdesignicons.com/cdn/1.9.32/

export default {
	name: 'metricVariables',
	props: [ 'metric' ],
	components: {
		metricValues,
		ChevronDownIcon,
		ChevronUpIcon
	},
	computed: {
		version() {
			return this.metric.SelectedVersion();
		},
		level() {
			return this.metric.SelectedLevel();
		},
		Embedded() {
			return window.Embedded;
		},
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
		dropClass(index) {
			if (this.level.SelectedVariableIndex === index) {
				return 'dropMetric';
			} else {
				return 'dropMetricMuted';
			}
		},
		rowClass(index) {
			if (this.level.SelectedVariableIndex === index) {
				return '';
			} else {
				return 'exp-hiddable-block';
			}
		},
		clickVariable(index) {
			if (this.level.SelectedVariableIndex === index) {
				this.selectVariable(-1);
			} else {
				this.selectVariable(index);
			}
		},
		selectVariable(index) {
			for (var v = 0; v < this.metric.properties.Versions.length; v++) {
				var version = this.metric.properties.Versions[v];
				for (var l = 0; l < version.Levels.length; l++) {
					var level = version.Levels[l];
					if (level.Variables.length > index) {
						level.SelectedVariableIndex = index;
					}
				}
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
.variableRow
{
	padding: 0.6rem 0rem 0rem 0rem;
}
.variableBlock
{
	padding: 0.2rem 0rem 0.2rem 0rem;
}
.variablesBlock
{
	padding: 0.5rem 0rem 1.5rem 0rem;
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
