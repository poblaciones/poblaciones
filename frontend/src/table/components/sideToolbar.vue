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
      :selectable-branches="true"
      :filter-mode="true"
      :emit-container="true"
      :multi-select.sync="boundaryMulti"
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
      return this.metrics
        .filter(m => !m.isBaseMetric && !m.isBoundary)
        .map(m => toChip({ Id: m.properties.Metric.Id, Name: m.properties.Metric.Name }));
    },
    // Chips de delimitaciones: las capas de delimitación activas en el mapa
    // (métricas de tipo boundary) más las regiones de recorte (clipping).
    // Cada chip lleva en Item un Type que vuelve al removerlo:
    //   'B' capa de delimitación (RemoveBoundaryById)
    //   'C' región de recorte (ResetClippingRegion)
    boundarySelection() {
      var chips = [];

      // Capas de delimitación activas (boundaries, no base, no indicadores).
      this.metrics
        .filter(m => !m.isBaseMetric && m.isBoundary)
        .forEach(m => {
          chips.push({
            Id: 'B:' + m.properties.Id,
            Caption: m.properties.Name,
            Description: m.properties.Name,
            Item: { Type: 'B', Id: m.properties.Id }
          });
        });

      // Regiones de recorte activas.
      if (this.clipping &&
        this.clipping.Region &&
        this.clipping.Region.Summary &&
        this.clipping.Region.Summary.Regions != null) {
        this.clipping.Region.Summary.Regions
          .filter(r => r.Id && r.Name)
          .forEach(r => {
            chips.push({
              Id: 'C:' + r.Id,
              Caption: r.Name,
              Description: r.Name,
              Item: { Type: 'C', Id: r.Id }
            });
          });
      }

      return chips;
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
      items.forEach(it => this.$emit('selectedItem', { Id: it.Id, Type: 'C', Item: it, Append: this.boundaryMulti }));
    },
    onBoundaryDeselect(items) {
      items.forEach(it => {
        // Desde un chip: it lleva Type ('B' capa, 'C' recorte) y su Id propio.
        // Desde una hoja del árbol: es una región de recorte (comportamiento previo).
        if (it && it.Type === 'B') {
          this.$emit('deselectedItem', { Id: it.Id, Type: 'B', Item: it });
        } else {
          this.$emit('deselectedItem', { Id: it.Id, Type: 'C', Item: it });
        }
      });
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
