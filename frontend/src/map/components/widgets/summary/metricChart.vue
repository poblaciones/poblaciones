<template>
	<div>
		<div class="chartContainer" style="margin-bottom: -10px">
			<quick-chart :data="chartData"
									 :width="518"
									 :height="122"
									 :yLabel="metric.Summary.getValueHeader(variable)"
									 :stacked-normalize="normalized"
									 :theme="{
                     selection: '#D50000',    /* Rojo al seleccionar */
                     disabled: '#EEEEEE',     /* Gris muy claro al deshabilitar */
                     zoneBg: '#FFFFFF',       /* Fondo blanco puro */
                     zoneStroke: '#333333'    /* Borde negro */
                   }"
									 :layout="{
                     top: 10, right: 10, bottom: 20, left: 40,
                     inner: 30
                   }"
									 :isUpdating="metric.IsUpdatingSummary"
									 @selectSerie="handleSelectSerie"
									 @select="handleSelect" />

		</div>
	</div>
</template>

<script>
import Helper from '@/map/js/helper';
import str from '@/common/framework/str';
	import color from '@/common/framework/color';
import iconManager from '@/common/js/iconManager';

import QuickChart from '@/map/components/controls/quickChart';

	export default {
		name: 'metricChart',
		props: [
			'metric',
			'variable',
		],
		components: {
			QuickChart,
		},
		mounted() {

		},
		data() {
			return {
				panelWidth: 270,
				h: Helper,
				chartType: 'bar',
				normalized: false,
				selection: null,
				types: ['bar', 'bar-horizontal', 'stacked', 'stacked-horizontal', 'donut']
			};
		},
		computed: {
			isLoading() {
				return this.variableValueLabels.length == 0;
			},
			chartData() {
				var serie = {
					text: this.version.Version.Name,
					values: []
				};

				for (var label of this.variableValueLabels) {
					var value = {
						label: label.Name, value: this.metric.Summary.getValue(this.variable, this.variableValueLabels, label.Values, this.variableValueLabels),
						valueFormatted: this.metric.Summary.getValueFormatted(this.metric.Summary.getValue(this.variable, this.variableValueLabels, label.Values, this.variableValueLabels), this.variable.Decimals),
						color: label.FillColor, enabled: label.Visible, labelObject: label
					};
					if (value.value !== '') {
						serie.values.push(value);
					}
				}
				return {
					type: this.chartType,
					series: [serie]
				};
			},
			levelLabelMargin() {
				var margin = 0;
				if (this.version.Levels.length > 1) {
					margin -= 20;
				}
				return 'margin-right: ' + margin + 'px;';
			},
			variableValueLabels() {
				return this.metric.getVariableValueLabels(this.variable);
			},
			version() {
				return this.metric.properties.Versions[this.metric.properties.SelectedVersionIndex];
			},
			level() {
				return this.version.Levels[this.version.SelectedLevelIndex];
			},
			currentMetric() {
				var ret = this.metric.getValidMetrics(this.variable);
				for (var n = 0; n < ret.length; n++) {
					if (ret[n].Key === this.metric.properties.SummaryMetric) {
						return ret[n];
					}
				}
				return ret[0];
			},
			summaryMetric() {
				return this.metric.properties.SummaryMetric;
			}
		},
		watch: {
			summaryMetric(newValue, oldValue) {
				if (newValue == 'P' || newValue == 'A') {
					this.chartType = 'stacked';
					this.normalized = true;
				} else {
					this.chartType = 'bar';
					this.normalized = false;
				}
			},
		},
		methods: {
			handleSelect(val) {
				this.selection = val;
				var value = this.chartData.series[val.seriesIndex].values[val.valueIndex];
				value.labelObject.Visible = !value.labelObject.Visible;
				this.metric.RefreshMap();
			},
			handleSelectSerie(val) {
				this.selection = val;
			},

			applySymbols(cad) {
				return str.applySymbols(cad);
			}
		},
	}; //
</script>

<style scoped>
.bar {
	border: 1px solid #2575fb;
	position: absolute;
}
.bar-muted {
	border: 1px solid #999;
	position: absolute;
}
.labelRow
{
	padding: 0px 0px 6px 3px;
}
.textRight {
	text-align: right;
}
.statsHeader {
	text-align: right;
	color: #a9a9a9;
	font-weight: 300;
	font-size: 11px;
	height: 16px;
	padding: 0px;
	text-transform: uppercase;
}

.categoryMuted {
	color: #000!important;
	background-color: #DDDDDD;
	border-color: #DDDDDD !important;
	filter: grayscale(1) brightness(.1) invert(1) opacity(1);
}

.categoryIcon {
	text-align: center;
	border: 0px solid;
	border-radius: 1rem;
	text-align: center;
	overflow: hidden;
	margin-left: 5px;
  margin-right: 5px;
	object-fit: scale-down;
	justify-content: center;
	width: 2.15rem;
	height: 2.1rem;
	color: #fff;
}
.dataBox {
	padding-left: 2px!important;
	padding-right: 2px!important;
	padding-bottom: 5px!important;
}
.localTableCompact {
}

.localTableCompact td {
	border: 0px;
	padding: 3px;
	vertical-align: top;
}
	.chartContainer {
		display: flex;
		background: #fff;
		padding: 0px;
	}

		.chartContainer > * {
			flex: 1;
			min-width: 0;
		}
</style>

