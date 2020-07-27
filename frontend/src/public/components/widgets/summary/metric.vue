<template>
	<div class="metricBlock">
		<hr class="moderateHr exp-hiddable-visiblity"/>
		<div>
			<MetricTopButtons :metric="metric" :clipping="clipping" :key="metric.index"
												class="exp-hiddable-block" @RankingShown="rankingShown" />
			<h4 class="title">
				<span class="drag">{{ metric.properties.Metric.Name }}</span>
			</h4>
			<div class="filterElement" v-if="hasUrbanityFilter && urbanity != 'N'"
					 :title="getUrbanityTextTooltip">
				{{ getUrbanityTextActive }}
				<mp-close-button v-on:click="changeUrbanity('N')" title="Quitar filtro"
												 style="font-size: 16px; margin-top: -1px; margin-left: 2px;"
												 class="exp-hiddable-block" />
			</div>

			<MetricVariables :metric="metric" />
			<div class="sourceRow">
				<div class="btn-group" style="float: left">
					<button v-for="(ver, index) in metric.properties.Versions" :key="ver.Id" type="button" v-on:click="changeSelectedVersionIndex(index)" class="btn btn-default btn-xs exp-serie-item" :class="getActive(index)">{{ ver.Version.Name }}</button>
				</div>
				<MetricSource :metric="metric" style="float:right" />
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
	</div>
</template>

<script>
import MetricVariables from './metricVariables';
import MetricTopButtons from './metricTopButtons';
import MetricSource from './metricSource';
import Ranking from './ranking';
import Mercator from '@/public/js/Mercator';

export default {
	name: 'metric',
	props: [
		'metric',
		'clipping',
	],
	components: {
		MetricTopButtons,
		MetricSource,
		MetricVariables,
		Ranking,
	},
	methods: {
		getActive(index) {
			if(this.metric.properties.SelectedVersionIndex === index) {
				return ' active';
			}
			return '';
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
	}
};
</script>

<style scoped>

.metricBlock
{
	padding-top: 1px;
	cursor: default;
}
.drag {
	cursor: move; /* fallback if grab cursor is unsupported */
	cursor: grab;
	cursor: -moz-grab;
	cursor: -webkit-grab;
}
.drag:active {
	cursor: move; /* fallback if grab cursor is unsupported */
	cursor: grabbing;
	cursor: -moz-grabbing;
	cursor: -webkit-grabbing;
}
.filterElement {
	color: #888888;
	font-weight: 300;
	font-size: 13px;
	padding: 2px 6px;
	margin-top: 9px;
	background-color: #dddddd;
	margin-left: -3px;
	margin-bottom: -3px;
	display: inline-block;
	border-radius: 4px;
	border: 1px solid #dddddd;
	text-transform: uppercase;
}

.rankingBox {
	padding: 16px 0px 0px 0px;
}

</style>
