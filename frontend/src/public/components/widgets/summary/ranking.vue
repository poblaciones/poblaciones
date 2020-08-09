<template>
	<div>
		<div>
			<table class="localTableCompact">
				<tbody>
					<tr>
						<td class="statsHeader" style="text-align: left" colspan="2">
							Ranking de {{ level.Name }}
						</td>
						<td class="statsHeader textRight" style="min-width: 75px">
							{{ getValueHeader() }}
						</td>
					</tr>
					<tr v-on:click="clickItem(item)" v-for="item in ranking" class="hand" :key="item.Id">
						<template class="labelRow">
							<td class="dataBox" style="width: 100%" :class="getMuted()">
								{{ item.Name }}
							</td>
							<td class="dataBox" :class="getMuted()">
								<!-- 2575fb -->
								<i :style="'border-color: ' + getColor(item) + '; color: ' + getColor(item)" class="fas fa-circle exp-category-bullets"></i>
							</td>
							<td style="width: 75px" class='textRight' :class="getMuted()">{{ getFormattedValue(item) }}</td>
						</template>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="sourceRow exp-hiddable-block">
			<div class="btn-group">
				<button v-for="sizeItem in possibleSizes" type="button" :key="sizeItem" :id="sizeItem"
								 onmouseup="this.blur()" class="btn btn-default btn-xs" :class="getActiveSize(sizeItem)"
								v-on:click="changeSize(sizeItem)">{{ sizeItem }}</button>
			</div>
			<div class="btn-group">
				<button v-for="direction in possibleDirections" type="button" :key="direction.Value" :id="direction.Value"
								 onmouseup="this.blur()" class="btn btn-default btn-xs" :class="getActiveDirection(direction.Value)"
								v-on:click="changeDirection(direction.Value)" :title="direction.Tooltip"><i :class="direction.Icon" /></button>
			</div>
		</div>
	</div>
</template>

<script>
import h from '@/public/js/helper';

export default {
	name: 'metricValues',
	props: [
		'metric',
	],
	components: {
	},
  mounted() {
		this.updateRanking();
  },
  data() {
		return {
			panelWidth: 270,
			possibleSizes: [10, 25, 50],
			possibleDirections: [{ Value: 'D', Tooltip: 'De mayor a menor', Icon: 'fas fa-sort-amount-down' }, { Value: 'A', Tooltip: 'De menor a mayor', Icon: 'fas fa-sort-amount-down-alt' }],
			h: h
		};
	},
	computed: {
		version() {
			return this.metric.properties.Versions[this.metric.properties.SelectedVersionIndex];
		},
		level() {
			return this.version.Levels[this.version.SelectedLevelIndex];
		},
		variable() {
			return this.metric.SelectedVariable();
		},
		ranking() {
			if (!this.variable || this.variable.RankingItems === null) {
				var ret = [ { Id: 1, Name: '-', Value: '-', Total: 0 },
										{ Id: 2, Name: '-', Value: '-', Total: 0 },
										{ Id: 3, Name: '-', Value: '-', Total: 0 },
										{ Id: 4, Name: '-', Value: '-', Total: 0 }];
				return ret;
			}
			return (this.variable ? this.variable.RankingItems : []);
		},
	},
	methods: {
		getMuted() {
			if (this.metric.IsUpdatingRanking) {
				return ' text-muted';
			} else {
				return '';
			}
		},
		getValueHeader() {
			return h.ResolveNormalizationCaption(this.variable, true);
		},
		getFormattedValue(item) {
			return h.renderMetricValue(item.Value, item.Total, this.variable.HasTotals, this.variable.NormalizationScale, this.variable.Decimals);
		},
		getColor(item) {
			var label = h.getValueLabel(this.variable.ValueLabels, item.ValueId);
			return (label ? label.FillColor : '');
		},
		clickItem(item) {
			var position = { Coordinate: { Lat: item.Lat, Lon: item.Lon },
												Envelope: item.Envelope };
			var parentInfo = {
						MetricName: this.metric.properties.Metric.Name,
						MetricId: this.metric.properties.Metric.Id,
						MetricVersionId: this.metric.SelectedVersion().Version.Id,
						LevelId: this.metric.SelectedLevel().Id,
						VariableId: this.metric.SelectedVariable().Id
					};
			window.SegMap.InfoRequestedInteractive(position, parentInfo, item.FID);
		},
		changeSize(itemSize) {
			this.metric.RankingSize = itemSize;
			this.updateRanking();
			window.SegMap.SaveRoute.UpdateRoute();
		},
		changeDirection(direction) {
			this.metric.RankingDirection = direction;
			this.updateRanking();
			window.SegMap.SaveRoute.UpdateRoute();
		},
		getActiveDirection(direction) {
			if (direction === this.metric.RankingDirection) {
				return ' active';
			} else {
				return '';
			}
		},
		getActiveSize(currentSize) {
			if (currentSize === this.metric.RankingSize) {
				return ' active';
			} else {
				return '';
			}
		},
		updateRanking() {
			if (this.variable !== null) {
				this.metric.UpdateRanking();
			} else {
			}
		}
	},
	watch: {
		variable() {
			this.updateRanking();
		},
	}
}; //</script>

<style scoped>
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
	padding: 2px;
	vertical-align: top;
}

</style>

