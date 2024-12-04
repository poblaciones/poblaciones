<template>
	<div>
		<table class="localTableCompact">
			<tbody>
				<tr>
					<td colspan="3" class="statsHeader">
						<div v-if="!variable.IsSimpleCount || version.Levels.length > 1" :style="levelLabelMargin">
							<button type="button" style="padding-left: 2px!important;"
											class="lightButton close exp-hiddable-visiblity"
											v-if='version.Levels.length > 1' :title="(level.Pinned ? 'Liberar' : 'Fijar')"
											@click="togglePin">
								<PinIcon v-if="!level.Pinned" class="icon" />
								<UnpinIcon v-else class="icon" style="-webkit-transform: rotate(90deg); -moz-transform: rotate(90deg);
								-ms-transform: rotate(90deg); -o-transform: rotate(90deg);transform: rotate(90deg);" />
							</button>
							<span style="line-height: 2.3rem">
								{{ level.Name }}
							</span>
						</div>
					</td>
					<td class="statsHeader textRight" style="min-width: 75px; padding-left: 15px; line-height: 2.3rem">
						<span class="hand" :title="currentMetric.Title" @click="clickMetric(currentMetric.Next.Key)"
									v-html="getValueHeader()">
						</span>
					</td>
				</tr>
				<tr @click="clickLabel(label)" v-for="label in variableValueLabels" class="hand" :key="label.Id">
					<template v-if="displayLabel(label)">
						<template v-if="label.Visible" class="labelRow">
							<td class="dataBox center">
								<div v-if="label.Symbol" class="categoryIcon" :style="'border-color: ' + label.FillColor + '; background-color: ' + label.FillColor">
									<span v-html="resolveIcon(label.Symbol)"></span>
								</div>
								<i v-else :style="'border-color: ' + label.FillColor + '; color: ' + label.FillColor + dropBorder(label.FillColor) " class="fa drop fa-tint exp-category-bullets"></i>
							</td>
							<td class="dataBox" style="width: 100%">
								{{ label.Name }}
								<div class="bar" :style="getLength(getValue(label.Values, variableValueLabels), variable)"></div>
							</td>
							<td class='textRight' :class="getMuted()"><span v-if="!variable.IsSimpleCount">{{ h.formatNum(label.Values.Count) }}</span></td>
							<td style="width: 75px" class='textRight' :class="getMuted()">{{ getValueFormatted(getValue(label.Values, variableValueLabels), variable.Decimals) }}</td>
						</template>
						<template v-else class="labelRow">
							<td class="dataBox action-muted center">
								<div v-if="label.Symbol" class="categoryIcon categoryMuted">
									<span v-html="resolveIcon(label.Symbol)"></span>
								</div>
								<i v-else class="fa drop fa-tint exp-category-bullets" style="border-color: inherit"></i>
							</td>
							<td class="dataBox text-muted" style="width: 100%">
								{{ applySymbols(label.Name) }}
								<div class="bar-muted" :style="getLength( getValue(label.Values, variableValueLabels), variable)"></div>
							</td>
							<td class='text-muted textRight'><span v-if="!variable.IsSimpleCount">{{ h.formatNum(label.Values.Count) }}</span></td>
							<td class='text-muted textRight'>{{ getValueFormatted(getValue(label.Values, variableValueLabels), variable.Decimals) }}</td>
						</template>
					</template>
				</tr>
				<tr v-if="showTotals">
					<td class="stats" colspan="2">
						&nbsp;Total
					</td>
					<td class="stats textRight">
						<span v-if="!variable.IsSimpleCount">{{ aniTotalCount }}</span>
					</td>
					<td class="stats textRight">
						{{ aniTotal }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
import Helper from '@/public/js/helper';
import PinIcon from '@/public/assets/pin-outline.svg';
import UnpinIcon from '@/public/assets/pin-off-outline.svg';
import str from '@/common/framework/str';
	import color from '@/common/framework/color';
import iconManager from '@/common/js/iconManager';

export default {
	name: 'metricValues',
	props: [
		'metric',
		'variable',
	],
	components: {
		PinIcon,
		UnpinIcon
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
		};
	},
	watch: {
		'total.aniTotal'(newValue, oldValue) {
			var format = this.getFormat();
			Helper.animateNum(this, 'aniTotal', newValue, oldValue, format, this.variable.Decimals);
		},
		totalCount(newValue, oldValue) {
			var format = this.getFormat();
			Helper.animateNum(this, 'aniTotalCount', newValue, oldValue, format, this.variable.Decimals);
		},
	},
	computed: {
		levelLabelMargin() {
			var margin = 0;
			if (this.version.Levels.length > 1) {
				margin -= 20;
			}
			return 'margin-right: ' + margin + 'px;';
		},
		total() {
			return this.getTotal();
		},
		totalCount() {
			var ret = 0;
			var values = this.variableValueLabels;
			values.forEach(function(label) {
				ret += Number(label.Values.Count);
			});
			return ret;
		},
		variableValueLabels() {
			return this.metric.getVariableValueLabels(this.variable);
		},
		showTotals() {
			return this.variable.ShowSummaryTotals === 1 &&
							this.visibleValues !== 1;
		},
		visibleValues() {
			if (!this.variableValueLabels) {
				return 0;
			}
			if (this.variable.ShowEmptyCategories) {
				return this.variableValueLabels.length;
			} else {
				var c = 0;
				for(var n = 0; n < this.variableValueLabels.length; n++) {
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
			for(var n = 0; n < ret.length; n++) {
				if (ret[n].Key === this.metric.properties.SummaryMetric) {
					return ret[n];
				}
			}
			return ret[0];
		},
	},
	methods: {
		displayLabel(label) {
			return label.Values && ((this.variable.ShowEmptyCategories && !this.metric.Compare.Active) || label.Values.Count !== '');
		},
		dropBorder(dropColor) {
			if (color.IsReallyLightColor(dropColor)) {
				var strokeColor = color.ReduceColor(dropColor, .5);
				return '; text-shadow: 0 0 1px ' + strokeColor + '; font-size: 13px';
			}
			else {
				return '';
			}
		},
		applySymbols(cad) {
			return str.applySymbols(cad);
		},
		togglePin() {
			if (this.level.Pinned) {
				this.level.Pinned = false;
				if (this.metric.UpdateLevel()) {
					this.metric.UpdateMap();
				}
			} else {
				this.level.Pinned = true;
			}
			window.SegMap.SaveRoute.UpdateRoute();
		},
		resolveIcon(symbol) {
			var customIcons = this.metric.SelectedVersion().Work.Icons;
			return iconManager.showIcon(symbol, customIcons, '1.5em;vertical-align: unset;padding-top: 0px', null, '1.2r');
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
			switch(this.metric.properties.SummaryMetric) {
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
				switch(this.variable.NormalizationScale) {
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
			switch(this.metric.properties.SummaryMetric) {
			case 'K':
				return 'Km<sup>2</sup>';
			case 'H':
				return 'Ha';
			case 'A':
				return '% Km<sup>2</sup>';
			case 'P':
				return 'COL %';
			case 'I':
				switch(this.variable.NormalizationScale) {
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
			if(this.metric.properties.SummaryMetric === 'N') {
				return Helper.formatNum(value, decimals);
			} else if(this.metric.properties.SummaryMetric === 'I') {
				return Helper.formatPercentNumber(value);
			} else if(this.metric.properties.SummaryMetric === 'P') {
				return Helper.formatPercentNumber(value);
			} else if(this.metric.properties.SummaryMetric === 'K') {
				return Helper.formatKm(value);
			} else if(this.metric.properties.SummaryMetric === 'H') {
				return Helper.formatKm(value);
			} else if(this.metric.properties.SummaryMetric === 'A') {
				return Helper.formatPercentNumber(value);
			} else if(this.metric.properties.SummaryMetric === 'D') {
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
			return { aniTotal: aniTotal,
							 percTotal: percTotal };
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

</style>

