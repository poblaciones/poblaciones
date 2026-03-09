<template>
  <div class="map-toolbar exp-hiddable-block sidepanelOffset" v-if="!Embedded.HideAddMetrics || !Embedded.HideSearch">
    <!-- Botón para Indicadores -->
    <button v-show="!Embedded.HideAddMetrics"
            class="toolbar-button"
            :class="{ 'active': activePanel === 'indicators' }"
            @click="togglePanel('indicators')"
            title="Explorar indicadores">
      <i class="fas fa-plus"></i>
    </button>

    <!-- Botón para filtrar -->
    <button class="toolbar-button"
            :class="{ 'active': activePanel === 'places' }"
            @click="togglePanel('places')"
            title="Filtrar">
      <i class="fas fa-filter"></i>
    </button>

    <!-- Botón para Búsqueda -->
    <button v-show="!Embedded.HideSearch"
            class="toolbar-button"
            :class="{ 'active': activePanel === 'search' }"
            @click="togglePanel('search')"
            title="Buscar">
      <i class="fas fa-search"></i>
    </button>

    <!-- Botón para subir archivo -->
    <button v-show="!Embedded.HideSearch"
            class="toolbar-button"
            :class="{ 'active': activePanel === 'upload' }"
            @click="togglePanel('upload')"
            title="Subir archivo georreferenciable">
      <i class="fas fa-cloud-upload-alt"></i>
    </button>
  </div>
</template>

<script>
export default {
  name: 'MapToolbar',
    props: {
      activePanel: {
        type: String,
        default: null
      },
      backgroundColor: {
        type: String,
        default: ''
      },
    },
 computed: {
 		Embedded() {
				return window.Embedded;
			}
    },
  methods: {
    togglePanel(panel) {
      if (this.activePanel === panel) {
        this.$emit('panel-toggle', null);
      } else {
        this.$emit('panel-toggle', panel);
      }
    }
  }
};
</script>

<style scoped>
.map-toolbar {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 990;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffffc0;
  padding: 8px;
  border-radius: 30px;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 2px 8px;
}

.toolbar-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #666;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.toolbar-button:hover {
  background: #f0f0f0;
  color: #333;
  transform: scale(1.05);
}

.toolbar-button.active {
  background: #0fa7d8;
  color: white;
}

.toolbar-button:active {
  transform: scale(0.95);
}

/* Primer botón con color azul por defecto */
.toolbar-button:first-child {
  background: #0fa7d8;
  color: white;
}

.toolbar-button:first-child:hover {
  background: #0fa7d8;
}

.toolbar-button:first-child.active {
  background: #0fa7d8;
}

@media (max-width: 768px) {
  .map-toolbar {
    left: 10px;
    padding: 8px;
    gap: 8px;
  }

  .toolbar-button {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
}
</style>
