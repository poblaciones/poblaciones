<template>
	<div class="metricBlock">
		<hr class="moderateHr"/>
		<div>
      <MetricTopButtons :metric="metric" :clipping="clipping" :key="metric.index"/>
      <h4 class="title">
				<span class="drag">{{ metric.properties.Metric.Name }}</span>
			</h4>
			<MetricVariables :metric="metric" />
			<div class="sourceRow">
				<div class="btn-group">
					<button v-for="(ver, index) in metric.properties.Versions" :key="ver.Id" type="button" v-on:click="changeSelectedVersionIndex(index)" class="btn btn-default btn-xs" :class="getActive(index)">{{ ver.Version.Name }}</button>
				</div>

				<button v-show="false" v-if="metric.SelectedLevel().Extents" ref="zoomExtentsBtn" type="button" class="btn btn-default btn-xs" title="Zoom al indicador" v-on:click="zoomExtents()">
					<i class="fas fa-expand-arrows-alt" />
				</button>

				<MetricSource :metric="metric" :clipping="clipping" />
			</div>
      <div class="coverageBox" v-if="metric.SelectedVersion().Version.PartialCoverage">
        Cobertura: {{ metric.SelectedVersion().Version.PartialCoverage }}.
      </div>
		</div>
	</div>
</template>

<script>
import MetricVariables from '@/public/components/widgets/metricVariables';
import MetricTopButtons from '@/public/components/widgets/metricTopButtons';
import MetricSource from '@/public/components/widgets/metricSource';

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
			window.SegMap.MapsApi.FitEnvelope(extents);
			this.$refs.zoomExtentsBtn.blur();
		},
		remove(e) {
			e.preventDefault();
			this.metric.Remove();
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

</style>
