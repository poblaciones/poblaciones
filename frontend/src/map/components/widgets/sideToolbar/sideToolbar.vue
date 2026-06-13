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
// Ajustá la ruta si ubicás los helpers en otra carpeta.
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
  },
  data() {
    return {
      activePanel: null, // 'indicators', 'places', 'search', 'upload', o null
      // Árboles que alimenta App.vue por referencia (arr.AddRange).
      indicators: [],
      boundaries: [],
      suggestions: [],
      // Selección controlada de cada panel: [{ Id, Caption, Description, Item }].
      // Son las dos fuentes de verdad de lo insertado/quitado desde el panel.
      indicatorSelection: [],
      boundarySelection: [],
      // Estado del modo de selección múltiple del panel de delimitaciones;
      // mientras está activo, las altas en el mapa se acumulan (appendSelection).
      boundaryMulti: false,
    };
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
      this.addChips(this.indicatorSelection, items);
      items.forEach(it => this.$emit('selectedItem', { Id: it.Id, Type: 'M', Item: it }));
    },
    onIndicatorDeselect(items) {
      this.removeChips(this.indicatorSelection, items);
      items.forEach(it => this.$emit('deselectedItem', { Id: it.Id, Type: 'M', Item: it }));
    },

    // ── Delimitaciones ───────────────────────────────────────────────────────────
    onBoundarySelect(items) {
      this.addChips(this.boundarySelection, items);
      items.forEach(it => this.$emit('selectedItem', { Id: it.Id, Type: 'B', Item: it, Append: this.boundaryMulti }));
    },
    onBoundaryDeselect(items) {
      this.removeChips(this.boundarySelection, items);
      items.forEach(it => this.$emit('deselectedItem', { Id: it.Id, Type: 'B', Item: it }));
    },
    // "Ver todas en el mapa": el nodo es el tipo de delimitación (boundary);
    // se emite su Id (de boundary, no de boundaryItem) como selección de grupo.
    onBoundaryGroup(node) {
      this.$emit('selectedGroup', { Id: node.Id, Type: 'B', Item: node });
    },

    // ── Mantenimiento de la selección (chips) ────────────────────────────────────
    addChips(target, items) {
      for (const item of items) {
        if (!target.some(c => c.Id === item.Id)) target.unshift(toChip(item));
      }
    },
    removeChips(target, items) {
      for (const item of items) {
        const i = target.findIndex(c => c.Id === item.Id);
        if (i >= 0) target.splice(i, 1);
      }
    },

    // ── API pública para sincronizar desde afuera ───────────────────────────────
    // Cuando un indicador/delimitación se quita desde otro lugar (p. ej. la lista
    // de capas activas del mapa), llamá a estos métodos para reflejarlo en los chips.
    syncIndicatorRemoved(id) {
      const i = this.indicatorSelection.findIndex(c => c.Id === id);
      if (i >= 0) this.indicatorSelection.splice(i, 1);
    },
    syncBoundaryRemoved(id) {
      const i = this.boundarySelection.findIndex(c => c.Id === id);
      if (i >= 0) this.boundarySelection.splice(i, 1);
    },
  },
};
</script>

<style scoped>
</style>
