<template>
	<div class="table-side-toolbar">
		<div class="tst-buttons">
			<button class="mp-icon-btn mp-icon-btn--lg mp-icon-btn--accent"
							:class="{ 'is-selected': activePanel === 'indicators' }"
							@click="toggle('indicators', $event)"
							title="Indicadores" aria-label="Indicadores"
							:aria-pressed="$ariaPressed(activePanel === 'indicators')">
				<i class="fas fa-plus"></i>
			</button>
			<button class="mp-icon-btn mp-icon-btn--lg"
							:class="{ 'is-selected': activePanel === 'filters' }"
							@click="toggle('filters', $event)"
							title="Filtrar" aria-label="Filtrar"
							:aria-pressed="$ariaPressed(activePanel === 'filters')">
				<i class="fas fa-filter"></i>
			</button>
		</div>

		<!-- Los paneles del visor se ubican con coordenadas de la pantalla
		     (position: absolute respecto de su contenedor). Esta capa fija ocupa
		     toda la pantalla, para que se ubiquen bien y floten sobre el resto del
		     tablero en vez de quedar recortados por el panel de la tabla. -->
		<div class="tst-panel-layer">
			<IndicatorSelector :is-open="activePanel === 'indicators'"
												 :anchor="anchor"
												 :categories="indicatorCategories"
												 :selection="metricSelection"
												 :suggestions="[]"
												 :expand-leaves="true"
												 :filter-mode="true"
												 title="Agregar indicadores"
												 root-label="Categorías"
												 search-placeholder="Buscar indicador..."
												 item-noun="indicador"
												 item-noun-plural="indicadores"
												 @select="onMetricSelect"
												 @deselect="onMetricDeselect"
												 @close="close" />

			<IndicatorSelector :is-open="activePanel === 'filters'"
												 :anchor="anchor"
												 :categories="boundaryCategories"
												 :selection="placeSelection"
												 :suggestions="[]"
												 :selectable-branches="true"
												 :filter-mode="true"
												 :emit-container="true"
												 :multi-select.sync="filterMulti"
												 title="Filtrar"
												 root-label="Categorías"
												 search-placeholder="Buscar región..."
												 item-noun="región"
												 item-noun-plural="regiones"
												 :noun-from-node-name="true"
												 @select="onPlaceSelect"
												 @deselect="onPlaceDeselect"
												 @close="close" />
		</div>
	</div>
</template>

<script>
	import IndicatorSelector from '@/map/components/widgets/sideToolbar/indicatorSelector.vue';

	/*
	 * TableSideToolbar — barra lateral flotante de la tabla: agregar indicadores y
	 * filtrar. Usa el selector del visor. Filtrar elige regiones concretas (no
	 * delimitaciones enteras): con selección simple, la región elegida reemplaza la
	 * selección de filas; con selección múltiple, se suma. No muta la pivot: emite
	 * eventos que aplica PivotTable.
	 */
	export default {
		name: 'TableSideToolbar',
		components: { IndicatorSelector },
		props: {
			pivot: { type: Object, required: true },
			// Cambia en cada refresco de la pivot: fuerza a releer la selección de filas,
			// que vive en clases que Vue no observa en detalle.
			tick: { type: Number, default: 0 }
		},
		data() {
			return {
				activePanel: '',
				anchor: null,
				filterMulti: false
			};
		},
		computed: {
			indicatorCategories() {
				return window.Context.Metrics;
			},
			boundaryCategories() {
				return window.Context.Boundaries;
			},
			metricSelection() {
				var chips = [];
				for (var i = 0; i < this.pivot.Metrics.length; i++) {
					var metric = this.pivot.Metrics[i];
					chips.push({
						Id: metric.properties.Metric.Id,
						Key: 'm:' + metric.InstanceId,
						Caption: metric.properties.Metric.Name,
						Description: metric.properties.Metric.Name,
						Item: metric
					});
				}
				return chips;
			},
			// Las regiones elegidas en las filas (la más profunda de cada rama).
			placeSelection() {
				this.tick;
				var chips = [];
				var leaves = this.pivot.RowTree.SelectionLeaves();
				for (var i = 0; i < leaves.length; i++) {
					var item = leaves[i].item;
					chips.push({ Id: item.FID, Caption: item.Caption, Description: item.Caption, Item: item });
				}
				return chips;
			}
		},
		methods: {
			toggle(panel, event) {
				if (this.activePanel === panel) {
					this.close();
				} else {
					var rect = event.currentTarget.getBoundingClientRect();
					this.anchor = { left: rect.right, centerY: rect.top + rect.height / 2 };
					this.activePanel = panel;
				}
			},
			close() {
				this.activePanel = '';
			},
			onMetricSelect(items) {
				var ids = [];
				for (var i = 0; i < items.length; i++) {
					ids.push(items[i].Id);
				}
				this.$emit('add-metrics', ids);
			},
			onMetricDeselect(items) {
				this.$emit('remove-metrics', items);
			},
			onPlaceSelect(items, container) {
				var chains = [];
				for (var i = 0; i < items.length; i++) {
					var chain = this.chainFor(items[i], container);
					if (chain.length) {
						chains.push(chain);
					}
				}
				this.$emit('select-places', chains, this.filterMulti);
			},
			onPlaceDeselect(items) {
				var fids = [];
				for (var i = 0; i < items.length; i++) {
					fids.push(items[i].Id);
				}
				this.$emit('remove-places', fids);
			},
			// Cadena desde la raíz hasta la región elegida. El contenedor puede ser la
			// delimitación o un agrupador; si no la ubica, se busca la región en el catálogo.
			chainFor(item, container) {
				var hierarchy = window.Context.BoundaryHierarchy;
				var chain = [];
				if (container && container.Id != null) {
					chain = hierarchy.ChainFor(container.Id, item.Id);
				}
				if (!chain.length) {
					chain = hierarchy.ChainForCandidates([item.Id]);
				}
				return chain;
			}
		}
	};
</script>

<style scoped>
	.table-side-toolbar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		z-index: 20;
	}
	.tst-buttons {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 6px 4px;
		background: #fff;
		border-radius: 0 10px 10px 0;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
	}
	.tst-panel-layer {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2000;
		pointer-events: none;
	}
	.tst-panel-layer > * {
		pointer-events: auto;
	}
</style>
