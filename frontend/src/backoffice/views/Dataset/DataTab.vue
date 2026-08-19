<template>
  <div class="dataTabRoot" @click.self="clearGridSelection">
    <div class="md-layout" @click.self="clearGridSelection">
			<ActiveGrid ref="grid" :showingErrors="false"></ActiveGrid>
    </div>
  </div>
</template>

<script>
import ActiveGrid from '@/backoffice/components/ActiveGrid';

export default {
  components: {
    ActiveGrid
  },
  methods: {
    // Clic en el área vacía del tab (fuera de la grilla y sus botones):
    // deselecciona las filas seleccionadas, igual que al hacer clic afuera
    // de una selección en el explorador de archivos.
    clearGridSelection() {
      if (this.$refs.grid) {
        this.$refs.grid.clearSelection();
      }
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.md-layout-item .md-size-25 {
  padding: 0 !important;
}

.dataTabRoot {
  min-height: 100%;
}
</style>
