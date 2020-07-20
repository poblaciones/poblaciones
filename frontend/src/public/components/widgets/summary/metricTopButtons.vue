<template>
	<div>
		<div class="btn-group pull-right" style="clear:both">
			<h5 class="title">
				<mp-close-button v-on:click="clickQuitar" />

				<button title="Opciones" type="button" class="close "
								v-on:click="clickCustomize" style="margin-right: 7px; margin-left: -2px; margin-top: 3px; font-size: 0.8rem">
					<i class="fas fa-sliders-h"></i>
				</button>

				<button type="button" v-on:click="toogleRankings" v-if="metric.useRankings()" onmouseup="this.blur()"
								class="close lightButton" :class="(metric.ShowRanking ? 'activeButton' : '')" :title="(metric.ShowRanking ? 'Ocultar ranking' : 'Mostrar ranking')">
					<i class="fa fa-signal" style="margin-left: -6px;" />
				</button>
				<span v-else style="width: 2px; height: 1px; float:right">&nbsp;</span>

				<button v-if="metric.SelectedLevel().Extents" ref="zoomExtentsBtn" type="button"
								class="close lightButton" title="Zoom al indicador" v-on:click="zoomExtents()">
					<i class="fas fa-expand-arrows-alt" style="margin-left: 2px;" />
				</button>

				<span class="dropdown">
					<button type="button" class="close lightButton" data-toggle="dropdown" title="Urbano/Rural">
						<i class="fas fa-users" v-text="getUrbanityTextActive()"/>
					</button>
					<ul class="dropdown-menu dropdownMargin">
						<li>
							<button type="button" class="close lightButton btn-full" v-on:click="changeUrbanity('N')">Todo</button>
						</li>
						<li>
							<button type="button" class="close lightButton btn-full" v-on:click="changeUrbanity('UD')">Urbano</button>
						</li>
						<li>
							<button type="button" class="close lightButton btn-full" v-on:click="changeUrbanity('U')">Urbano Agrupado</button>
						</li>
						<li>
							<button type="button" class="close lightButton btn-full" v-on:click="changeUrbanity('D')">Urbano Disperso</button>
						</li>
						<li>
							<button type="button" class="close lightButton btn-full" v-on:click="changeUrbanity('RL')">Rural</button>
						</li>
						<li>
							<button type="button" class="close lightButton btn-full" v-on:click="changeUrbanity('R')">Rural Agrupado</button>
						</li>
						<li>
							<button type="button" class="close lightButton btn-full" v-on:click="changeUrbanity('L')">Rural Disperso</button>
						</li>
					</ul>
				</span>

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
			urbanity: '',
		};
	},
	methods: {
		addMetric(id) {
			window.SegMap.AddMetricById(id);
		},
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
		getUrbanityTextActive() {
			if(this.urbanity === 'N') {
				return '';
			}else if(this.urbanity === 'UD') {
				return ' - U';
			}else if(this.urbanity === 'U') {
				return ' - UA';
			}else if(this.urbanity === 'D') {
				return ' - UD';
			}else if(this.urbanity === 'RL') {
				return ' - R';
			}else if(this.urbanity === 'R') {
				return ' - RA';
			}else if(this.urbanity === 'L') {
				return ' - RD';
			}
		},
		changeUrbanity(mode) {
			this.metric.properties.SelectedUrbanity = mode;
			window.SegMap.SaveRoute.UpdateRoute();
			window.SegMap.UpdateMap();
			this.urbanity = mode;
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

	}
};
</script>

<style scoped>
  .vellipsis:after {
  content: '\2807';
  font-size: .8em;
  }

.lightButton {
	font-size: 12px;
  padding: 4px;
	line-height: 1em;
}

.activeButton {
	opacity: .45;
}
.btn-full {
	width: 100%;
}
.dropdownMargin {
	left: -70px;
	right: auto;
	margin-top: 25px;
}
</style>
