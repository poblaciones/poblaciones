<template>
	<div>
		<div class="btn-group pull-right exp-hiddable-unset" style="clear:both; margin-top: 2px">
			<h5 class="title">
				<mp-close-button @click="clickQuitar" title="Quitar indicador"
												 v-if="!metric.IsLocked" class="exp-hiddable-block" />

				<mp-dropdown-menu :items="menuItems" @itemClick="dropdownSelected"
											 icon="fas fa-ellipsis-v" />
			</h5>
		</div>
	</div>
</template>

<script>
	import Mercator from '@/public/js/Mercator';

	// https://materialdesignicons.com/cdn/1.9.32/

	export default {
		name: 'metricDropdown',
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
			keyValueToList(dict) {
				var ret = [];
				for (var key in dict) {
					var value = dict[key];
					value.key = key;
					ret.push(value);
				}
				return ret;
			},
			clickCustomize() {
				window.Popups.MetricCustomize.show(this.metric);
			},
			clickQuitar(e) {
				this.metric.Remove();
			},
			toggleRankings() {
				this.metric.ShowRanking = !this.metric.ShowRanking;
				window.SegMap.SaveRoute.UpdateRoute();
				if (this.metric.ShowRanking) {
					this.$emit('RankingShown');
				}
			},
			toggleShowValues() {
				if (this.metric.SelectedVariable().ShowValues == 1) {
					this.metric.SetShowValuesToSelectedVariableSet("0");
				} else {
					this.metric.SetShowValuesToSelectedVariableSet("1");
				}
				this.metric.UpdateMap();
			},
			changeUrbanity(mode) {
				this.metric.properties.SelectedUrbanity = mode.key;
				window.SegMap.SaveRoute.UpdateRoute();
				window.SegMap.UpdateMap();
			},
			clickDescargar() {
				window.Popups.MetricDownload.show(this.metric);
			},
			clickFuente() {
				window.Popups.WorkMetadata.showByMetric(this.metric, this.metric.properties.Metric.Name);
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
				//this.$refs.zoomExtentsBtn.blur();
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
			},
			dropdownSelected(item) {
				switch (item.key) {
					case 'SETTINGS':
						this.clickCustomize();
						break;
					case 'RANKINGS':
						this.toggleRankings();
						break;
					case 'SHOWVALUES':
						this.toggleShowValues();
						break;
					case 'EXTENTS':
						this.zoomExtents();
						break;
					case 'DOWNLOAD':
						this.clickDescargar();
						break;
					case 'SOURCE':
						this.clickFuente();
						break;
					case 'REMOVE':
						this.clickQuitar();
						break;
					default:
						this.changeUrbanity(item);
				}
			}
		},
		computed: {
			Use() {
				return window.Use;
			},
			menuItems() {
				var ret = [];
				var selectedVariable = this.metric.SelectedVariable();
				// opciones
				if (selectedVariable) {
					ret.push({ label: 'Personalizar', key: 'SETTINGS', icon: 'fas fa-sliders-h' });

					if (!selectedVariable.IsSimpleCount || this.metric.useRankings()) {
						ret.push({ 'separator': true });
					}
					// muestra valores
					if (!selectedVariable.IsSimpleCount) {
						ret.push({
							label: (this.metric.SelectedVariable().ShowValues == '1' ? 'Ocultar valores' : 'Mostrar valores'),
							key: 'SHOWVALUES',
						});
					}
					// muestra ránking
					if (this.metric.useRankings()) {
						ret.push({
							label: (this.metric.ShowRanking ? 'Ocultar ranking' : 'Mostrar ranking'),
							key: 'RANKINGS',
							/* icon: 'fa fa-signal' */
						});
					}
				}
				// agrega el filtro de urbano
				if (this.hasUrbanityFilter) {
					ret.push({ 'separator': true });
					ret.push({
						label: 'Filtro', items: this.keyValueToList(this.metric.GetUrbanityFilters(true))
					});
				};
				ret.push({ 'separator': true });
				ret.push({
					label: 'Zoom al indicador',
					key: 'EXTENTS',
					/* icon: 'fas fa-expand-arrows-alt' */
				});
				ret.push({ 'separator': true });
				ret.push({
					label: 'Fuente',
					key: 'SOURCE',
					/* icon: 'fas fa-expand-arrows-alt' */
				});
				ret.push({
					label: 'Descargar',
					key: 'DOWNLOAD',
					/* icon: 'fas fa-expand-arrows-alt' */
				});

				// agrega las métricas
				if (this.metric.properties.RelatedMetrics && this.metric.properties.RelatedMetrics.length > 1) {
					ret.push({ 'separator': true });
					ret.push({
						label: 'Relacionados', items: this.keyValueToList(this.metric.properties.RelatedMetrics)
					});
				};
				// agregar el quitar
				if (!this.metric.IsLocked) {
					ret.push({ 'separator': true });
					ret.push({ label: 'Quitar', key: 'REMOVE' });
				}
				return ret;
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
