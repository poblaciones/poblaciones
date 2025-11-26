<template>
	<div v-if="metric.IsUpdatingSummary" class="skeleton">
	</div>
	<div v-else class="chartContainer">
		<quick-chart :data="chartData"
								 :width="518"
								 :height="122"
								 :yLabel="getValueHeader()"
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
								 @selectSerie="handleSelectSerie"
								 @select="handleSelect" />

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
			var format = this.getFormat();
			var total = this.total.aniTotal;
			Helper.animateNum(this, 'aniTotal', total, total, format, this.variable.Decimals);
			var totalCount = this.totalCount;
			Helper.animateNum(this, 'aniTotalCount', totalCount, totalCount, format, this.variable.Decimals);
		},
		data() {
			return {
				panelWidth: 270,
				h: Helper,
				aniTotal: 0,
				aniTotalCount: 0,
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
						label: label.Name, value: this.getValue(label.Values, this.variableValueLabels),
						valueFormatted: this.getValueFormatted(this.getValue(label.Values, this.variableValueLabels), this.variable.Decimals),
						color: label.FillColor, enabled: label.Visible, labelObject: label
					};
					serie.values.push(value);
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
			visibleValues() {
				if (!this.variableValueLabels) {
					return 0;
				}
				if (this.variable.ShowEmptyCategories) {
					return this.variableValueLabels.length;
				} else {
					var c = 0;
					for (var n = 0; n < this.variableValueLabels.length; n++) {
						if (this.displayLabel(this.variableValueLabels[n])) {
							c++;
						}
					}
					return c;
				}
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
			},
			getMutedClass(value) {
				if (value !== '1') {
					return ' text-muted';
				} else {
					return '';
				}
			},
			getVerb(value) {
				if (value === 1) {
					return 'Ocultar';
				} else {
					return 'Mostrar';
				}
			},
			getMuted() {
				if (this.metric.IsUpdatingSummary) {
					return ' text-muted';
				} else {
					return '';
				}
			},
			clickMetric(metric) {
				this.metric.properties.SummaryMetric = metric;
			},
			getFormat() {
				var format = 'num';
				switch (this.metric.properties.SummaryMetric) {
					case 'D':
					case 'N':
						format = 'num';
						break;
					case 'K':
					case 'H':
						format = 'km';
						break;
					case 'P':
					case 'A':
						format = '%';
						break;
					case 'I':
						switch (this.variable.NormalizationScale) {
							case 100:
								format = '%100';
								break;
							case 1:
								format = '%1';
								break;
							case 1000:
								format = '%1000';
								break;
							case 10000:
								format = '%10000';
								break;
							case 100000:
								format = '%100000';
								break;
						}
				}
				return format;
			},
			getValueHeader() {
				var delta = (this.metric.Compare.Active ? 'Δ ' : '');
				switch (this.metric.properties.SummaryMetric) {
					case 'K':
						return 'Km<sup>2</sup>';
					case 'H':
						return 'Ha';
					case 'A':
						return '% Km<sup>2</sup>';
					case 'P':
						return 'COL %';
					case 'I':
						switch (this.variable.NormalizationScale) {
							case 100:
								return delta + '%';
							case 1:
								return delta + '/1';
							case 1000:
								return delta + '/k';
							case 10000:
								return delta + '/10k';
							case 100000:
								return delta + '/100k';
							case 1000000:
								return delta + '/1M';
						}
						return 'N/A';
					case 'D':
						return 'N/Km<sup>2</sup>';
					case 'N':
						return 'N';
					default:
						return '?';
				}
			},
			getValueFormatted(value, decimals) {
				if (this.metric.properties.SummaryMetric === 'N') {
					return Helper.formatNum(value, decimals);
				} else if (this.metric.properties.SummaryMetric === 'I') {
					return Helper.formatPercentNumber(value);
				} else if (this.metric.properties.SummaryMetric === 'P') {
					return Helper.formatPercentNumber(value);
				} else if (this.metric.properties.SummaryMetric === 'K') {
					return Helper.formatKm(value);
				} else if (this.metric.properties.SummaryMetric === 'H') {
					return Helper.formatKm(value);
				} else if (this.metric.properties.SummaryMetric === 'A') {
					return Helper.formatPercentNumber(value);
				} else if (this.metric.properties.SummaryMetric === 'D') {
					return Helper.formatKm(value);
				} else {
					return '';
				}
			},
			getValue(values, labels) {
				if (this.metric.Compare.Active && this.metric.properties.SummaryMetric === 'I') {
					var tuple = this.getValueTuple(values, labels);
					var compareTuple = { value: tuple.valueCompare, normalization: tuple.normalizationCompare };
					var useProportionalDelta = this.metric.Compare.UseProportionalDelta(this.metric.SelectedVariable());
					return Helper.calculateCompareValue(useProportionalDelta, tuple, compareTuple);
				} else {
					return Helper.calculateValue(this.getValueTuple(values, labels));
				}
			},
			total() {
				return this.getTotal();
			},
			totalCount() {
				var ret = 0;
				var values = this.variableValueLabels;
				values.forEach(function (label) {
					ret += Number(label.Values.Count);
				});
				return ret;
			},
			getTotal() {
				// calcula el total para barras azules
				var loc = this;
				var percTotal = 0;
				for (var label of this.variableValueLabels) {
					percTotal += Number(Math.abs(loc.getValue(label.Values, this.variableValueLabels)));
				};
				// calcula el total general
				var total = null, value = 0, totalCompare = null, valueCompare = null;
				var labels = this.variableValueLabels;
				labels.forEach(function (label) {
					var tuple = loc.getValueTuple(label.Values, labels);
					if (tuple.normalization !== undefined) {
						total = (total == null ? 0 : total) + tuple.normalization;
					}
					if (tuple.normalizationCompare !== undefined) {
						totalCompare = (total == null ? 0 : totalCompare) + tuple.normalizationCompare;
					}
					if (tuple.valueCompare !== undefined) {
						valueCompare = (valueCompare == null ? 0 : valueCompare) + tuple.valueCompare;
					}
					value += Number(tuple.value);
				});
				var totalTuple = { value: value, normalization: total };
				var aniTotal = 100;
				if (this.metric.properties.SummaryMetric == 'I' && this.metric.Compare.Active) {
					// calcula la diferencia en puntos porcentajes o %
					var compareTuple = { value: valueCompare, normalization: totalCompare };
					var useProportionalDelta = this.metric.Compare.UseProportionalDelta(this.metric.SelectedVariable());
					aniTotal = Helper.calculateCompareValue(useProportionalDelta, totalTuple, compareTuple);
				} else if (this.metric.properties.SummaryMetric !== 'P' && this.metric.properties.SummaryMetric !== 'A') {
					aniTotal = Helper.calculateValue(totalTuple);
				}
				// devuelve el par
				return {
					aniTotal: aniTotal,
					percTotal: percTotal
				};
			},
			getNumericValue(values) {
				if (this.metric.Compare.Active) {
					return values.Value; // - values.ValueCompare;
				} else {
					return values.Value;
				}
			},
			getValueTuple(values, labels) {
				var value = this.getNumericValue(values);
				var area = Number(values.Km2);
				if (this.metric.properties.SummaryMetric === 'N') {
					return { value: value };
				} else if (this.metric.properties.SummaryMetric === 'P') {
					let tot = 0;
					var loc = this;
					labels.forEach(function (label) {
						var tvalue = loc.getNumericValue(label.Values);
						tot += Math.abs(Number(tvalue));
					});
					return { value: Math.abs(value), normalization: tot / 100 };
				} else if (this.metric.properties.SummaryMetric === 'K') {
					return { value: area };
				} else if (this.metric.properties.SummaryMetric === 'I') {
					if (this.metric.Compare.Active) {
						return {
							value: Number(values.Value),
							valueCompare: Number(values.ValueCompare),
							normalization: Number(values.Total) / this.variable.NormalizationScale,
							normalizationCompare: Number(values.TotalCompare) / this.variable.NormalizationScale
						};
					} else {
						var nTotal = Number(values.Total);
						return { value: value, normalization: nTotal / this.variable.NormalizationScale };
					}
				} else if (this.metric.properties.SummaryMetric === 'H') {
					return { value: area, normalization: 0.01 };
				} else if (this.metric.properties.SummaryMetric === 'A') {
					var tot2 = 0;
					labels.forEach(function (label) {
						tot2 += Number(label.Values.Km2);
					});
					return { value: area, normalization: tot2 / 100 };
				} else if (this.metric.properties.SummaryMetric === 'D') {
					return { value: value, normalization: area };
				} else {
					return { value: 0 };
				}
			},
			getLength(value, variable) {
				//return '';
				var tot = this.total.percTotal;
				var prop = (tot > 0 ? Math.abs(value) / tot : 0);
				return 'width: calc(' + (prop * 100) + '% - ' + (60 * prop) + 'px)';
			},
			clickLabel(label) {
				label.Visible = !label.Visible;
				this.metric.RefreshMap();
			},
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

	.skeleton {
		width: calc(100% - 60px);
		height: 90px;

		margin-top: 15px;
		margin-bottom: 10px;
		margin-right: 30px;
		margin-left: 32px;
		margin-right: 30px;
		background: linear-gradient(90deg, #eeeeee 25%, #dddddd 50%, #eeeeee 75%);
		border: 1px solid #cbcbcb;
		opacity: .3;
		background-size: 200% 100%;
		border-radius: 4px;
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}

		100% {
			background-position: -200% 0;
		}
	}
</style>

