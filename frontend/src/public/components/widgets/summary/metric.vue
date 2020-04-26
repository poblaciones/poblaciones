<template>
	<div class="metricBlock">
		<hr class="moderateHr"/>
		<div>
			<MetricTopButtons :metric="metric" :clipping="clipping" :key="metric.index" @RankingShown="rankingShown" />
			<h4 class="title">
				<span class="drag">{{ metric.properties.Metric.Name }}</span>
			</h4>
			<MetricVariables :metric="metric" />
			<div class="sourceRow">
				<div class="btn-group">
					<button v-for="(ver, index) in metric.properties.Versions" :key="ver.Id" type="button" v-on:click="changeSelectedVersionIndex(index)" class="btn btn-default btn-xs" :class="getActive(index)">{{ ver.Version.Name }}</button>
				</div>
				<MetricSource :metric="metric" :clipping="clipping" />
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

	}
};
</script>

<style scoped>

.metricBlock
{
	padding-top: 2px;
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

.rankingBox {
	padding: 16px 0px 0px 0px;
}

</style>
