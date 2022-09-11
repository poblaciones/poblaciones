<template>
	<div>
		<div class="btn-group pull-right exp-hiddable-unset" style="clear:both; margin-top: 2px">
			<h5 class="title">
				<mp-close-button @click="clickQuitar" title="Quitar indicador"
												 v-if="!metric.IsLocked" class="exp-hiddable-block" />

				<button title="Opciones" v-show="metric.SelectedVariable()" type="button" class="close "
								@click="clickCustomize" style="margin-right: 6px; margin-left: -2px; margin-top: 4px; font-size: 1.2rem">
					<i class="fas fa-sliders-h"></i>
				</button>

				<button type="button" v-if="hasUrbanityFilter" id="filterDropId"
								class="filterDropdownButton lightButton close" data-toggle="dropdown"
								title="Agregar filtro">
					<i class="fas fa-filter" />
				</button>
				<ul class="dropdown-menu dropdown-menu-right dropFilter" aria-labelledby="filterDropId">
					<li v-for="(value, key) in metric.GetUrbanityFilters(true)" :key="key" :class="(value.border ? 'liDividerNext' : '')">
						<a :style="'padding-left: '+ (15 + value.level * 14) +'px'"
										@click="changeUrbanity(key)">
							{{ value.label }}
						</a>
					</li>
				</ul>

				<button type="button" @click="toogleRankings" v-if="metric.useRankings()" onmouseup="this.blur()"
								class="close lightButton" :class="(metric.ShowRanking ? 'activeButton' : '')" :title="(metric.ShowRanking ? 'Ocultar ranking' : 'Mostrar ranking')">
					<i class="fa fa-signal" style="margin-left: -8px;" />
				</button>

				<button v-if="metric.SelectedLevel().Extents" ref="zoomExtentsBtn" type="button"
								class="close lightButton" title="Zoom al indicador" @click="zoomExtents()">
					<i class="fas fa-expand-arrows-alt" style="margin-left: 2px; margin-right: 2px;" />
				</button>
			</h5>
		</div>
	</div>
</template>

<script>
import Mercator from '@/public/js/Mercator';

// https://materialdesignicons.com/cdn/1.9.32/

export default {
	name: 'metricTopButtons',
	props: [
		'metric',
		'clipping',
	],
	components: {

	},
	data() {
		return {
			work: {},
		};
	},
	methods: {
		clickCustomize(e) {
			e.preventDefault();
			window.Popups.MetricCustomize.show(this.metric);
		},
		clickQuitar(e) {
			e.preventDefault();
			this.metric.Remove();
		},
		toogleRankings() {
			this.metric.ShowRanking = !this.metric.ShowRanking;
			window.SegMap.SaveRoute.UpdateRoute();
			if (this.metric.ShowRanking) {
				this.$emit('RankingShown');
			}
		},
		changeUrbanity(mode) {
			this.metric.properties.SelectedUrbanity = mode;
			window.SegMap.SaveRoute.UpdateRoute();
			window.SegMap.UpdateMap();
		},
		zoomExtents() {
			var extents = this.metric.SelectedLevel().Extents;
			if (!window.SegMap.Clipping.FrameHasNoClipping()) {
				var m = new Mercator();
				if (window.SegMap.Clipping.FrameHasClippingCircle()) {
					var intersect = m.rectanglesIntersection(extents, this.clipping.Region.Envelope);
					if (this.shouldClearSelection(intersect, extents)) {
						window.SegMap.Clipping.ResetClippingCircle();
					}
				}
				if (window.SegMap.Clipping.FrameHasClippingCircle() == false &&
								window.SegMap.Clipping.FrameHasClippingRegionId()) {
					var intersect = m.rectanglesIntersection(extents, this.clipping.Region.Envelope);
					if (this.shouldClearSelection(intersect, extents)) {
						window.SegMap.Clipping.ResetClippingRegion();
					}
				}
			}
			window.SegMap.MapsApi.FitEnvelope(extents, true);
			this.$refs.zoomExtentsBtn.blur();
		},
		shouldClearSelection(intersect, extents) {
			if (intersect === null) {
				return true;
			}
			var m = new Mercator();
			// Se fija si el área de intersección es menor al área del indicador
			// con 10% de tolerancia
			var area1 = m.rectanglePixelArea(intersect);
			var area2 = m.rectanglePixelArea(extents);
			return area1 < area2 * .9;
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
	}
};
</script>

<style scoped>
  .vellipsis:after {
  content: '\2807';
  font-size: .8em;
  }

.activeButton {
	opacity: .45;
}

.filterDropdownButton {
	font-size: 11px;
	margin-left: -5px;
	margin-right: 3px;
}

.dropFilter {
  margin-top: 0px;
	cursor: pointer;
}
</style>
