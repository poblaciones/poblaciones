<template>
	<div class="metricBlock">
		<hr class="moderateHr"/>
		<div>
			<MetricTopButtons :metric="metric" :clipping="clipping" :key="metric.index" />
			<h4 class="title">
				<span class="drag">{{ metric.properties.Metric.Name }}</span>
			</h4>
			<MetricVariables :metric="metric" />
			<div class="sourceRow">
				<div class="btn-group">
					<button v-for="(ver, index) in metric.properties.Versions" :key="ver.Id" type="button" v-on:click="changeSelectedVersionIndex(index)" class="btn btn-default btn-xs" :class="getActive(index)">{{ ver.Version.Name }}</button>
				</div>

				<div class="btn-group">
					<button v-if="metric.SelectedLevel().Extents" ref="zoomExtentsBtn" type="button" class="btn btn-default btn-xs" title="Zoom al indicador" v-on:click="zoomExtents()">
						<i class="fas fa-expand-arrows-alt" style="margin-left: 2px;" />
					</button>

					<button type="button" v-on:click="toogleRankings" v-if="useRankings" onmouseup="this.blur()"
									class="btn btn-default btn-xs" :class="(metric.ShowRanking ? 'active' : '')" title="Ranking">
						<i class="fa fa-signal" style="margin-left: -4px;" />
					</button>
				</div>

				<MetricSource :metric="metric" :clipping="clipping" />
			</div>
			<div class="coverageBox" v-if="metric.SelectedVersion().Version.PartialCoverage">
				Cobertura: {{ metric.SelectedVersion().Version.PartialCoverage }}.
			</div>
			<div v-if="metric.ShowRanking && useRankings" class="rankingBox">
				<Ranking :metric="metric" :clipping="clipping" />
			</div>
		</div>
	</div>
</template>

<script>
import MetricVariables from '@/public/components/widgets/metricVariables';
import MetricTopButtons from '@/public/components/widgets/metricTopButtons';
import MetricSource from '@/public/components/widgets/metricSource';
import Ranking from '@/public/components/widgets/ranking';
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
		zoomExtents() {
			var extents = this.metric.SelectedLevel().Extents;
			if (!window.SegMap.Clipping.FrameHasNoClipping()) {
				var m = new Mercator();
				extents = m.rectanglesIntersection(extents, this.clipping.Region.Envelope);
			}
			window.SegMap.MapsApi.FitEnvelope(extents);
			this.$refs.zoomExtentsBtn.blur();
		},
		toogleRankings() {
			this.metric.ShowRanking = !this.metric.ShowRanking;
			window.SegMap.SaveRoute.UpdateRoute();
		},
		remove(e) {
			e.preventDefault();
			this.metric.Remove();
		}
	},
	computed: {
		useRankings() {
			var variable = this.metric.SelectedVariable();
			if (variable) {
				return !variable.IsSimpleCount;
			} else {
				return false;
			}
		}
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
