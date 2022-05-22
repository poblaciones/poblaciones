<template>
	<div class="metricPanel">
		<div class="dragHandle exp-hiddable-block" v-if="!metric.IsLocked">
			<div style="top: -10px; position: absolute; left: 0; right: 0">
				<drag-horizontal title="Arrastrar para reubicar" />
			</div>
		</div>
		<MetricTopButtons :metric="metric" :clipping="clipping" :key="metric.index" v-if="!Embedded.Readonly"
											class="exp-hiddable-block" @RankingShown="rankingShown" />
		<div v-if="isSimpleMetric && metric.SelectedVersion().Levels.length < 2">
			<h4 class="title" v-on:click="clickLabel(singleLabel)" style="margin-bottom: 6px;cursor: pointer">
				<i v-if="singleLabel.Visible" :style="'border-color: ' + singleLabel.FillColor + '; color: ' + singleLabel.FillColor"
					 class="fa drop fa-tint exp-category-bullets-large smallIcon"></i>
				<i v-else class="fa drop fa-tint exp-category-bullets-large smallIcon action-muted" style="border-color: inherit" />
				{{ metric.properties.Metric.Name }} <span style="font-size: .95em" v-show="h.formatNum(singleLabel.Values.Count) !== '-'">
					({{ h.formatNum(singleLabel.Values.Count) }})
				</span>
			</h4>
			<mp-filter-badge style="margin-top: 0.3rem; margin-bottom: 0.9rem;" v-if="hasUrbanityFilter && urbanity != 'N'"
											 :title="getUrbanityTextActive" :tooltip="getUrbanityTextTooltip"
											 v-on:click="changeUrbanity('N')" />
		</div>
		<template v-else>
			<h4 class="title">
				{{ metric.properties.Metric.Name }}
			</h4>
			<mp-filter-badge style="margin-top: 0.9rem;" v-if="hasUrbanityFilter && urbanity != 'N'"
											 :title="getUrbanityTextActive" :tooltip="getUrbanityTextTooltip"
											 v-on:click="changeUrbanity('N')" />
			<MetricVariables :metric="metric" />
		</template>
		<div class="coverageBox" v-if="hasLegends(metric.SelectedLevel())">
			<template v-for="variable, index in metric.SelectedLevel().Variables">
				<div v-if="(index === metric.SelectedLevel().SelectedVariableIndex || metric.SelectedLevel().Variables.length == 1) && variable.Legend !== null && variable.Legend !== ''" :key="index">
					<span style="padding-right: 2px;">{{ variable.Asterisk }}</span>{{ variable.Legend }}
				</div>
			</template>
		</div>
		<div class="sourceRow">
			<div class="btn-group" style="float: left">
				<button v-for="(ver, index) in metric.properties.Versions" :key="ver.Id" type="button"
								v-on:click="changeSelectedVersionIndex(index)"
								class="btn btn-default btn-xs exp-serie-item"
								:class="getActive(index)">
					{{ ver.Version.Name }}
				</button>
			</div>
			<Source style="float:right" :sourceTitle="metric.properties.Metric.Name" v-if="!Embedded.Readonly"
							@clickDownload="clickDescargar" @clickSource="clickFuente" />
			<div style="clear: both; height: 0px">
			</div>
		</div>
		<div class="coverageBox" v-if="metric.SelectedVersion().Version.PartialCoverage">
			Cobertura: {{ metric.SelectedVersion().Version.PartialCoverage }}.
		</div>
		<div ref="rankings" v-if="metric.ShowRanking && metric.useRankings()" class="rankingBox">
			<Ranking :metric="metric" :clipping="clipping" />
		</div>
	</div>
</template>
<script>
import MetricVariables from './metricVariables';
import MetricTopButtons from './metricTopButtons';
import Source from './source';
import Ranking from './ranking';
import DragHorizontal from 'vue-material-design-icons/DragHorizontal.vue';
import Helper from '@/public/js/helper';
export default {
	name: 'metric',
	components: {
		MetricTopButtons,
		Source,
		DragHorizontal,
		MetricVariables,
		Ranking,
	},
	props: [
		'metric',
		'clipping',
	],
	methods: {
		getActive(index) {
			if (this.metric.properties.Versions.length == 1) {
				return ' frozen';
			} else if (this.metric.properties.SelectedVersionIndex === index) {
				return ' active';
			}
			return '';
		},
		clickLabel(label) {
			label.Visible = !label.Visible;
			this.metric.UpdateMap();
		},
		clickDescargar() {
			window.Popups.MetricDownload.show(this.metric);
		},
		clickFuente() {
			window.Popups.WorkMetadata.showByMetric(this.metric, this.metric.properties.Metric.Name);
		},
		hasLegends(level) {
			for (var variable of level.Variables) {
				if (variable.Legend !== null && variable.Legend.length > 0) {
					return true;
				}
			}
			return false;
		},
		changeSelectedVersionIndex(index) {
			this.metric.SelectVersion(index);
		},
		changeUrbanity(mode) {
			this.metric.properties.SelectedUrbanity = mode;
			window.SegMap.SaveRoute.UpdateRoute();
			window.SegMap.UpdateMap();
		},
		changeMetricVisibility() {
			this.metric.ChangeMetricVisibility();
		},
		rankingShown() {
			var vScrollTo = require('vue-scrollto');
			var loc = this;
			setTimeout(function () {
				vScrollTo.scrollTo(loc.$refs.rankings, 500, { container: '#panRight', force: false });
			}, 100);
		},
		remove(e) {
			e.preventDefault();
			this.metric.Remove();
		}
	},
	computed: {
			Use() {
				return window.Use;
			},
			Embedded() {
				return window.Embedded;
			},
			urbanity() {
				return this.metric.properties.SelectedUrbanity;
			},
			h() {
				return Helper;
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
			isSimpleMetric() {
				return (this.metric.SelectedLevel().Variables.length === 1 &&
					this.metric.SelectedLevel().Variables[0].IsSimpleCount && this.metric.SelectedLevel().Variables[0].ValueLabels.length === 1);
			},
			singleLabel() {
				var variable = this.metric.SelectedLevel().Variables[0];
				return variable.ValueLabels[0];
			}
		}
};
</script>
<style scoped>
.metricBlock
{
	padding-top: 1px;
	cursor: default;
}
.rankingBox {
	padding: 16px 0px 0px 0px;
}
	.smallIcon {
		font-size: 14px;
		margin-top: 2px
	}
</style>
