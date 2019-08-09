<template>
	<div style="position: relative">
		<div class="statsHeader">&nbsp;
			<span :title="getValueHeaderTooltip()" v-html="getValueHeader()" style="width: 75px; text-align: right" class='pull-right'>
			</span>
			<span class='pull-right' :style="(version.Levels.length > 1 ? 'margin-right: -15px;' : '')">{{ level.Name }}
				<span v-if='version.Levels.length > 1' :title="(level.Pinned ? 'Liberar' : 'Fijar')"
							class="hand" v-on:click="togglePin">
					<PinIcon v-if="!level.Pinned" class="icon" />
					<UnpinIcon v-else class="icon" style="-webkit-transform: rotate(90deg); -moz-transform: rotate(90deg);
								-ms-transform: rotate(90deg); -o-transform: rotate(90deg);transform: rotate(90deg);" />
				</span>
			</span>
		</div>
		<div class="hand" v-on:click="click(label)" v-for="label in variable.ValueLabels" :key="label.Id">
			<div v-if="displayLabel(label)">
				<div v-if="label.Visible" class="labelRow">
					<!-- 2575fb -->
					<i :style="'color: ' + label.FillColor" class="fa drop fa-tint"></i> {{ label.Name }}
					<span style="width: 75px; text-align: right" class='pull-right padleft' :class="getMuted()">{{ getValueFormatted(label.Values, variable.ValueLabels) }}</span>
					<span class='pull-right' :class="getMuted()">{{ h.formatNum(label.Values.Count) }}</span>
					<div class="bar" :style="getLength(getValue(label.Values, variable.ValueLabels), variable)"></div>
				</div>
				<div v-else class="labelRow">
					<span class="action-muted"><i class="fa drop fa-tint"></i></span>
					<span class="text-muted"> {{ label.Name }}
						<span style="width: 75px; text-align: right" class='pull-right'>{{ getValueFormatted(label.Values, variable.ValueLabels) }}</span>
						<span class='pull-right'>{{ h.formatNum(label.Values.Count) }}</span>
					</span>
					<div class="bar-muted" :style="getLength( getValue(label.Values, variable.ValueLabels), variable)"></div>
				</div>
			</div>
		</div>
		<div v-if="showTotals" class="stats">&nbsp;
			<span>Total
			<span style="width: 75px; text-align: right" class='pull-right'>&nbsp;{{ aniTotal }}</span>
			<span class='pull-right'>{{ aniTotalCount }}</span>
			</span>
		</div>
		<div class='smallIcons hand'>
      <span :title="currentMetric.Title" v-on:click="clickMetric(currentMetric.Next.Key)">
        #
      </span>
		</div>
	</div>
</template>

<script>
import Helper from '@/public/js/helper';
import PinIcon from '@/public/assets/pin-outline.svg';
import UnpinIcon from '@/public/assets/pin-off-outline.svg';

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
				ret = (tot > 0 ? ret * this.metric.SelectedVariable().NormalizationScale / tot : 0);
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
			var ret = this.metric.getValidMetrics();
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
		togglePin() {
			if (this.level.Pinned) {
				this.level.Pinned = false;
				if (this.metric.UpdateLevel()) {
					this.metric.UpdateMap();
				}
			} else {
				this.level.Pinned = true;
			}
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
			if (this.metric.IsUpdating) {
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
				switch(this.metric.SelectedVariable().NormalizationScale) {
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
				switch(this.metric.SelectedVariable().NormalizationScale) {
					case '100':
						return '%';
          case '1':
            return '/1';
          case '1000':
            return '/k';
          case '10000':
            return '/10k';
          case '100000':
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
				switch(this.metric.SelectedVariable().NormalizationScale) {
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
				return (nTotal > 0 ? value * this.metric.SelectedVariable().NormalizationScale / nTotal : 0);
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
			return 'width:' + ((tot > 0 ? value / tot : 0) * this.panelWidth) + 'px';
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
	margin-left: 1.6em;
}
.bar-muted {
	border: 1px solid #999;
	margin-left: 1.6em;
}
.labelRow
{
	padding: 0px 0px 6px 3px;
}
.padleft
{
	padding-left: 3px;
}
.smallIcons
{
	position: absolute;
	color: #999;
	right: 0px;
	bottom: -17px;
	font-size: 10px;
}

</style>

