<template>
  <div>
    <!-- Toolbar con los botones principales -->
    <MapToolbar
      :active-panel="activePanel"
      @panel-toggle="handlePanelToggle"
    />

    <!-- Panel de Indicadores (el FAB original) -->
    <IndicatorSelector
      :is-open="activePanel === 'indicators'"
      :metrics="metrics"
      @close="closePanel"
      @selected-item="handleIndicatorSelected"
    />

    <!-- Panel de Búsqueda -->
    <SearchPanel
      :is-open="activePanel === 'search'"
      @close="closePanel"
    />

    <!-- Panel de Lugares Frecuentes -->
    <QuickPlaces
      :is-open="activePanel === 'places'" :boundariesData="boundaries"
      @close="closePanel"
      @place-selected="handlePlaceSelected"
    />
  </div>
</template>

<script>
import MapToolbar from './mapToolbar.vue';
import IndicatorSelector from './indicatorSelector.vue';
import SearchPanel from './searchPanel.vue';
import QuickPlaces from './quickPlaces.vue';

export default {
  name: 'SideToolbar',
  components: {
    MapToolbar,
    IndicatorSelector,
    SearchPanel,
    QuickPlaces
  },
  props: {
    metrics: {
      type: Array,
      default: () => []
    },
    boundaries: {
      type: Array,
      default: () => []
    },
  },
  data() {
    return {
      activePanel: null // 'indicators', 'search', 'places', or null
    };
  },
  methods: {
    handlePanelToggle(panel) {
      this.activePanel = panel;
    },
    closePanel() {
      this.activePanel = null;
    },
    handleIndicatorSelected(item) {
      // Maneja la selección de un indicador
      this.$emit('selectedItem', item);
      console.log('Indicator selected:', item);
    },
    handlePlaceSelected(item) {
      // Maneja la selección de un lugar frecuente
      this.$emit('placeSelected', { Id: item.place.Id});
    }
  }
};
</script>

<style scoped>
</style>
