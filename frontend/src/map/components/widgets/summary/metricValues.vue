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
									v-html="metric.Summary.getValueHeader(variable)">
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
								<div class="bar" :style="getLength(metric.Summary.getValue(variable, variableValueLabels, label.Values, variableValueLabels), variable)"></div>
							</td>
							<td class='textRight' :class="getMuted()"><span v-if="!variable.IsSimpleCount">{{ h.formatNum(label.Values.Count) }}</span></td>
							<td style="width: 75px" class='textRight' :class="getMuted()">{{ metric.Summary.getValueFormatted(metric.Summary.getValue(variable, variableValueLabels, label.Values, variableValueLabels), variable.Decimals) }}</td>
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
								<div class="bar-muted" :style="getLength( metric.Summary.getValue(variable, variableValueLabels, label.Values, variableValueLabels), variable)"></div>
							</td>
							<td class='text-muted textRight'><span v-if="!variable.IsSimpleCount">{{ h.formatNum(label.Values.Count) }}</span></td>
							<td class='text-muted textRight'>{{ metric.Summary.getValueFormatted(metric.Summary.getValue(variable, variableValueLabels, label.Values, variableValueLabels), variable.Decimals) }}</td>
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
import Helper from '@/map/js/helper';
import PinIcon from '@/map/assets/pin-outline.svg';
import UnpinIcon from '@/map/assets/pin-off-outline.svg';
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
		var format = this.metric.Summary.getFormat(this.variable);
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
			var format = this.metric.Summary.getFormat(this.variable);
			Helper.animateNum(this, 'aniTotal', newValue, oldValue, format, this.variable.Decimals);
		},
		totalCount(newValue, oldValue) {
			var format = this.metric.Summary.getFormat(this.variable);
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
			return this.metric.Summary.getTotal(this.variable, this.variableValueLabels);
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

