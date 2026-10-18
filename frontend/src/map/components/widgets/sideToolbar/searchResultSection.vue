<template>
  <div v-if="rows.length" class="result-section">
    <div class="section-title">{{ title }}</div>
    <div class="section-list">
      <div v-for="row in visibleRows" :key="row.Key">
        <slot name="row" :row="row"></slot>
      </div>
    </div>
    <search-more-button v-if="hiddenCount > 0" @more="$emit('more', $event)" />
  </div>
</template>

<script>
import SearchMoreButton from './searchMoreButton.vue';

// Una sección de los resultados del panel de búsqueda: separador con título,
// filas (el contenido de cada una lo define el slot "row") y, si hay más
// filas que `limit`, el botón "Ver más". Los elementos navegables por teclado
// son las filas del slot (data-kbd-item="result") y el botón; el separador no
// lleva el atributo, por lo que la lista lo saltea.
export default {
  name: 'SearchResultSection',
  components: { SearchMoreButton },
  props: {
    title: { type: String, required: true },
    rows: { type: Array, required: true },
    // Cantidad de filas visibles; null muestra todas.
    limit: { type: Number, default: null }
  },
  computed: {
    visibleRows() {
      return this.limit === null ? this.rows : this.rows.slice(0, this.limit);
    },
    hiddenCount() {
      return this.rows.length - this.visibleRows.length;
    }
  }
};
</script>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: #707070;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 8px 8px 6px 18px;
}

.section-title::after {
  content: '';
  flex: 1;
  border-top: 1px solid #e0e0e0;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
