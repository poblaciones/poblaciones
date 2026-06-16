<template>
  <div>
    <!-- Toolbar con los botones principales -->
    <SideButtons
      :active-panel="activePanel" :backgroundColor="backgroundColor"
      @panel-toggle="handlePanelToggle"
    />

    <!-- Panel de Indicadores -->
    <IndicatorSelector
      :is-open="activePanel === 'indicators'"
      :categories="indicators"
      :selection="indicatorSelection"
      :expand-leaves="true"
      :suggestions="suggestions"
      title="Explorar indicadores"
      root-label="Categorías"
      search-placeholder="Buscar indicador..."
      item-noun="indicador"
      item-noun-plural="indicadores"
      @select="onIndicatorSelect"
      @deselect="onIndicatorDeselect"
      @close="closePanel"
    />

    <!-- Panel de Delimitaciones (botón de filtro) -->
    <IndicatorSelector
      :is-open="activePanel === 'places'"
      :categories="boundaries"
      :selection="boundarySelection"
      :show-add-all="true"
      :multi-select.sync="boundaryMulti"
      add-all-label="Ver en el mapa"
      title="Filtrar"
      root-label="Categorías"
      search-placeholder="Buscar delimitación..."
      item-noun="delimitación"
      item-noun-plural="delimitaciones"
      :noun-from-node-name="true"
      @select="onBoundarySelect"
      @deselect="onBoundaryDeselect"
      @select-group="onBoundaryGroup"
      @close="closePanel"
    />

    <!-- Panel de Búsqueda -->
    <SearchPanel :is-open="activePanel === 'search'" @close="closePanel" />

    <!-- Panel de Subida -->
    <SearchPanel :is-open="activePanel === 'upload'" @close="closePanel" />
  </div>
</template>

<script>
import SideButtons from './sideButtons.vue';
import IndicatorSelector from './indicatorSelector.vue';
import SearchPanel from './searchPanel.vue';
import { toChip } from './selectorTooltips';

export default {
  name: 'SideToolbar',
  components: {
    SideButtons,
    IndicatorSelector,
    SearchPanel,
  },
  props: {
    backgroundColor: {
      type: String,
      default: '',
    },
    // Árbol de categorías de indicadores, alimentado desde App.vue.
    indicators: {
      type: Array,
      default: () => [],
    },
    // Árbol de categorías de delimitaciones, alimentado desde App.vue.
    boundaries: {
      type: Array,
      default: () => [],
    },
    // Referencia reactiva a window.SegMap.Metrics.metrics (this.metrics de App.vue).
    // Es la fuente de verdad para los chips activos.
    metrics: {
      type: Array,
      default: () => [],
    },
    // Objeto clipping de App.vue; se usa para incluir las regiones de recorte activas
    // en el listado de chips de delimitaciones.
    clipping: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      activePanel: null, // 'indicators', 'places', 'search', 'upload', o null
      suggestions: [],
      // Estado del modo de selección múltiple del panel de delimitaciones.
      boundaryMulti: false,
    };
  },
  computed: {
    // Chips de indicadores: métricas activas que no son boundary ni isBaseMetric.
    indicatorSelection() {
			const result = [];

			for (const m of this.metrics) {
				if (!m.isBaseMetric && !m.isBoundary) {
					result.push(
						toChip({
							Id: m.properties.Metric.Id,
							Name: m.properties.Metric.Name
						})
					);
				}
			}
			return result;
		},
    // Chips de delimitaciones: métricas activas que son boundary y no IsBaseMetric,
    // más las regiones de recorte activas en clipping.Region.Summary.Regions.
    boundarySelection() {
      if (!(this.clipping &&
        this.clipping.Region &&
        this.clipping.Region.Summary &&
        this.clipping.Region.Summary.Regions != null)) return [];

      return this.clipping.Region.Summary.Regions
        .filter(r => r.Id && r.Name)
        .map(r => toChip({ Id: r.Id, Name: r.Name }));
    },
  },
  methods: {
    handlePanelToggle(panel) {
      this.activePanel = panel;
    },
    closePanel() {
      this.activePanel = null;
    },

    // ── Indicadores ────────────────────────────────────────────────────────────
    onIndicatorSelect(items) {
      items.forEach(it => this.$emit('selectedItem', { Id: it.Id, Type: 'M', Item: it }));
    },
    onIndicatorDeselect(items) {
      items.forEach(it => this.$emit('deselectedItem', { Id: it.Id, Type: 'M', Item: it }));
    },

    // ── Delimitaciones ───────────────────────────────────────────────────────────
    onBoundarySelect(items) {
      items.forEach(it => this.$emit('selectedItem', { Id: it.Id, Type: 'B', Item: it, Append: this.boundaryMulti }));
    },
    onBoundaryDeselect(items) {
      items.forEach(it => this.$emit('deselectedItem', { Id: it.Id, Type: 'B', Item: it }));
    },
    // "Ver todas en el mapa": el nodo es el tipo de delimitación (boundary);
    // se emite su Id (de boundary, no de boundaryItem) como selección de grupo.
    onBoundaryGroup(node) {
      this.$emit('selectedGroup', { Id: node.Id, Type: 'B', Item: node });
    },
  },
};
</script>

<style scoped>
</style>
