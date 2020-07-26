<template>
	<div>
		<table class="localTableCompact">
			<tbody>
				<tr>
					<td colspan="3" class="statsHeader">
						<span v-if="hasUrbanityFilter && urbanity != 'N'" style="float: left; padding-top: 4px;"
									:title="getUrbanityTextTooltip">
							{{ getUrbanityTextActive }}
						</span>
						<div v-if="!variable.IsSimpleCount || version.Levels.length > 1" :style="levelLabelMargin">
							<button type="button" style="padding-left: 2px!important;"
											class="lightButton close exp-hiddable-visiblity"
											v-if='version.Levels.length > 1' :title="(level.Pinned ? 'Liberar' : 'Fijar')"
											v-on:click="togglePin">
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
						<span class="dropdown exp-hiddable-unset" v-show="Use.UseUrbanity && hasUrbanityFilter" style="float: left">
							<button type="button"
											:class="(urbanity != 'N' ? 'activeFilter' : '')"
											class="filterDropdownButton lightButton close" data-toggle="dropdown"
											:title="getUrbanityTextActive">
								<i class="fas fa-filter" />
							</button>
							<ul class="dropdown-menu filterDropdownMargin">
								<li v-for="(value, key) in metric.GetUrbanityFilters()" :key="key">
									<button type="button" class="filterDropdownItem close" v-on:click="changeUrbanity(key)">
										<i class="fa-circle" :class="(key === urbanity ? 'fas activeFilter' : 'far')"
											 style="font-size: 10px;" :style="'margin-left: '+ (value.level * 8) +'px'" aria-hidden="true" />
										{{ value.item }}
									</button>
								</li>
							</ul>
						</span>

						<span class="hand" :title="currentMetric.Title" v-on:click="clickMetric(currentMetric.Next.Key)"
									v-html="getValueHeader()">
						</span>
					</td>
				</tr>
				<tr v-on:click="click(label)" v-for="label in variable.ValueLabels" class="hand" :key="label.Id">
					<template v-if="displayLabel(label)">
						<template v-if="label.Visible" class="labelRow">
							<td class="dataBox">
								<!-- 2575fb -->
								<i :style="'border-color: ' + label.FillColor + '; color: ' + label.FillColor" class="fa drop fa-tint exp-category-bullets"></i>
							</td>
							<td class="dataBox" style="width: 100%">
								{{ label.Name }}
								<div class="bar" :style="getLength(getValue(label.Values, variable.ValueLabels), variable)"></div>
							</td>
							<td class='textRight' :class="getMuted()"><span v-if="!variable.IsSimpleCount">{{ h.formatNum(label.Values.Count) }}</span></td>
							<td style="width: 75px" class='textRight' :class="getMuted()">{{ getValueFormatted(label.Values, variable.ValueLabels) }}</td>
						</template>
						<template v-else class="labelRow">
							<td class="dataBox action-muted">
								<i class="fa drop fa-tint exp-category-bullets" style="border-color: inherit"></i>
							</td>
							<td class="dataBox text-muted" style="width: 100%">
								{{ applySymbols(label.Name) }}
								<div class="bar-muted" :style="getLength( getValue(label.Values, variable.ValueLabels), variable)"></div>
							</td>
							<td class='text-muted textRight'><span v-if="!variable.IsSimpleCount">{{ h.formatNum(label.Values.Count) }}</span></td>
							<td class='text-muted textRight'>{{ getValueFormatted(label.Values, variable.ValueLabels) }}</td>
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
import str from '@/common/js/str';

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
		var total = this.total;
    Helper.animateNum(this, 'aniTotal', total, total, format);
		var totalCount = this.totalCount;
    Helper.animateNum(this, 'aniTotalCount', totalCount, totalCount);
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
		total(newValue, oldValue) {
			var format = this.getFormat();
			Helper.animateNum(this, 'aniTotal', newValue, oldValue, format);
		},
		totalCount(newValue, oldValue) {
			Helper.animateNum(this, 'aniTotalCount', newValue, oldValue);
		},
	},
	computed: {
		Use() {
			return window.Use;
		},
		urbanity() {
			return this.metric.properties.SelectedUrbanity;
		},
		hasUrbanityFilter() {
			return this.Use.UseUrbanity && this.metric.SelectedLevel().HasUrbanity;
		},
		getUrbanityTextTooltip() {
			return this.metric.GetSelectedUrbanityInfo().tooltip;
		},
		getUrbanityTextActive() {
			return this.metric.GetSelectedUrbanityInfo().label;
		},
		levelLabelMargin() {
			var margin = 0;
			if (this.version.Levels.length > 1) {
				margin -= 20;
			}
			return 'margin-right: ' + margin + 'px;';
		},
		total() {
			if(this.metric.properties.SummaryMetric === 'P' ||
				this.metric.properties.SummaryMetric === 'A') {
				return 100.00;
			}
			const loc = this;
			var ret = 0;
			var tot = 0;
			this.variable.ValueLabels.forEach(function(label) {
				var tvalue = label.Values.Value;
				if(loc.metric.properties.SummaryMetric === 'N' || loc.metric.properties.SummaryMetric === 'I') {
					ret += Number(tvalue);
					tot += Number(label.Values.Total);
				} else if(loc.metric.properties.SummaryMetric === 'K') {
					ret += Number(label.Values.Km2);
				} else if(loc.metric.properties.SummaryMetric === 'H') {
					ret += Number(label.Values.Km2) / 0.01;
				} else if(loc.metric.properties.SummaryMetric === 'D') {
					ret += (label.Values.Km2 > 0 ? Number(tvalue) / Number(label.Values.Km2) : 0);
				}
			});
			if (loc.metric.properties.SummaryMetric === 'I') {
				ret = (tot > 0 ? ret * this.variable.NormalizationScale / tot : 0);
			}
			return ret;
		},
		totalCount() {
			var ret = 0;
			this.variable.ValueLabels.forEach(function(label) {
				ret += Number(label.Values.Count);
			});
			return ret;
		},
		showTotals() {
			return this.variable.ShowSummaryTotals === 1 &&
							this.visibleValues !== 1;
		},
		visibleValues() {
			if (!this.variable.ValueLabels) {
				return 0;
			}
			if (this.variable.ShowEmptyCategories) {
				return this.variable.ValueLabels.length;
			} else {
				var c = 0;
				for(var n = 0; n < this.variable.ValueLabels.length; n++) {
					if (this.displayLabel(this.variable.ValueLabels[n])) {
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
			return label.Values && (this.variable.ShowEmptyCategories || label.Values.Count !== '');
		},
		applySymbols(cad) {
			return str.applySymbols(cad);
		},
		changeUrbanity(mode) {
			this.metric.properties.SelectedUrbanity = mode;
			window.SegMap.SaveRoute.UpdateRoute();
			window.SegMap.UpdateMap();
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
		toggleShowDescriptions() {
			this.variable.ShowDescriptions = (this.level.ShowDescriptions === 1 ? 0 : 1);
			this.metric.UpdateMap();
		},
		toggleShowValues() {
			this.variable.ShowValues = (this.level.ShowValues === 1 ? 0 : 1);
			this.metric.UpdateMap();
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
						return '%';
          case 1:
            return '/1';
          case 1000:
            return '/k';
          case 10000:
            return '/10k';
          case 100000:
            return '/100k';
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
		getValueHeaderTooltip() {
			switch(this.metric.properties.SummaryMetric) {
			case 'K':
				return 'Área (Km²)';
			case 'H':
				return 'Área (Ha)';
			case 'A':
				return 'Distribución de áreas (% de Km²)';
			case 'P':
				return 'Distribución (%)';
			case 'I':
				switch(this.variable.NormalizationScale) {
					case '100':
            return 'Incidencia (%)';
          case '1':
            return 'Incidencia (/n)';
          case '1000':
            return 'Incidencia (/1k)';
          case '10000':
            return 'Incidencia (/10k)';
          case '100000':
            return 'Incidencia (/100k)';
        }
        return 'n/d';
			case 'D':
				return 'Densidad (N/Km²)';
			case 'N':
				return 'N'; //this.level.SummaryCaption;
			default:
				return '?';
			}
		},
		getValueFormatted(values, labels) {
			var value = this.getValue(values, labels);
			if(this.metric.properties.SummaryMetric === 'N') {
				return Helper.formatNum(value);
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
			var value = values.Value;
			var area = Number(values.Km2);
			if(this.metric.properties.SummaryMetric === 'N') {
				return value;
			} else if(this.metric.properties.SummaryMetric === 'P') {
				let tot = 0;
				labels.forEach(function(label) {
					var tvalue = label.Values.Value;
					tot += Number(tvalue);
				});
				return (tot > 0 ? value * 100 / tot : 0);
			} else if(this.metric.properties.SummaryMetric === 'K') {
				return area;
			} else if(this.metric.properties.SummaryMetric === 'I') {
				var nTotal = Number(values.Total);
				return (nTotal > 0 ? value * this.variable.NormalizationScale / nTotal : 0);
			} else if(this.metric.properties.SummaryMetric === 'H') {
				return area / 0.01;
			} else if(this.metric.properties.SummaryMetric === 'A') {
				var tot2 = 0;
				labels.forEach(function(label) {
					tot2 += Number(label.Values.Km2);
				});
				return (tot2 > 0 ? area * 100 / tot2 : 0);
			} else if(this.metric.properties.SummaryMetric === 'D') {
				return (area > 0 ? value / area : 0);
			} else {
				return 0;
			}
		},
		getLength(value, variable) {
			var tot = 0;
			var loc = this;
			variable.ValueLabels.forEach(function(label) {
				tot += Number(loc.getValue(label.Values, variable.ValueLabels));
			});
			//return 'width:' + ((tot > 0 ? value / tot : 0) * this.panelWidth) + 'px';
			var prop = (tot > 0 ? value / tot : 0);
			return 'width: calc(' + (prop * 100) + '% - ' + (60 * prop) + 'px)';
		},
		click(label) {
			label.Visible = !label.Visible;
			this.metric.UpdateMap();
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

.filterDropdownItem {
	width: 100%;
	font-weight: 500;
	color: black;
	opacity: .6;
	text-align: left;
	padding: 6px 4px;
	font-size: 13px;
}

.filterDropdownItem:hover {
	background-color: #eeeeee;
}

.filterDropdownButton {
	font-size: 12px;
	float: none;
}
.filterDropdownMargin {
	left: -42px;
	right: auto;
	min-width: 100px;
	margin-top: 0px;
}
	.activeFilter {
		opacity: 1;
		color: #6d6d6d;
	}
</style>

