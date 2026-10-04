<template>
  <div>
    <div class="map-toolbar exp-hiddable-block" :class="'pos-' + sidebarPosition"
         v-if="!Embedded.HideAddMetrics || !Embedded.HideSearch">
      <!-- Manija de arrastre: mové la barra a la posición que quieras (arriba,
           medio o abajo), siempre pegada al borde izquierdo. Solo visible al
           pasar el mouse por la barra. -->
      <div class="drag-handle" title="Arrastrar para mover"
           @mousedown="startDrag" @touchstart="startDrag">
        <i class="fas fa-grip-lines-vertical"></i>
      </div>

      <!-- Botón para Indicadores. Abajo a la izquierda queda último (el resto
           mantiene su orden), para no ser el más próximo al selector de mapa
           que se corre a esa misma esquina. -->
      <button v-show="!Embedded.HideAddMetrics"
              class="mp-icon-btn mp-icon-btn--lg mp-icon-btn--accent"
              :class="{ 'is-selected': activePanel === 'indicators', 'toolbar-button-last': sidebarPosition === 'bottom' }"
              @click="togglePanel('indicators')"
              title="Explorar indicadores (Ctrl+I)"
              aria-label="Explorar indicadores"
              :aria-pressed="$ariaPressed(activePanel === 'indicators')">
        <i class="fas fa-plus"></i>
      </button>

      <!-- Botón para filtrar -->
      <button class="mp-icon-btn mp-icon-btn--lg"
              :class="{ 'is-selected': activePanel === 'places' }"
              @click="togglePanel('places')"
              title="Filtrar (Ctrl+F)"
              aria-label="Filtrar"
              :aria-pressed="$ariaPressed(activePanel === 'places')">
        <i class="fas fa-filter"></i>
      </button>

      <!-- Botón para Búsqueda -->
      <button v-show="!Embedded.HideSearch"
              class="mp-icon-btn mp-icon-btn--lg"
              :class="{ 'is-selected': activePanel === 'search' }"
              @click="togglePanel('search')"
              title="Buscar (Ctrl+B)"
              aria-label="Buscar"
              :aria-pressed="$ariaPressed(activePanel === 'search')">
        <i class="fas fa-search"></i>
      </button>

      <!-- Botón para subir archivo -->
      <button v-show="!Embedded.HideSearch" v-if="useUpload"
              class="mp-icon-btn mp-icon-btn--lg"
              :class="{ 'is-selected': activePanel === 'upload' }"
              @click="togglePanel('upload')"
              title="Subir archivo georreferenciable"
              aria-label="Subir archivo georreferenciable"
              :aria-pressed="$ariaPressed(activePanel === 'upload')">
        <i class="fas fa-cloud-upload-alt"></i>
      </button>
    </div>

    <!-- Zonas de destino, superpuestas al mapa, visibles solo mientras se
         arrastra. Siempre en el borde izquierdo; solo cambia el tercio
         vertical al que apuntan. Van fuera de .map-toolbar a propósito: ese
         div tiene transform en la posición 'middle', y position:fixed en un
         descendiente de un elemento con transform se posiciona relativo a
         ese elemento, no al viewport. -->
    <div v-if="dragging" class="drop-zone drop-zone-top" :class="{ 'drop-zone-hover': hoverZone === 'top' }"></div>
    <div v-if="dragging" class="drop-zone drop-zone-middle" :class="{ 'drop-zone-hover': hoverZone === 'middle' }"></div>
    <div v-if="dragging" class="drop-zone drop-zone-bottom" :class="{ 'drop-zone-hover': hoverZone === 'bottom' }"></div>
  </div>
</template>

<script>
export default {
  name: 'sideButtons',
    props: {
      activePanel: {
        type: String,
        default: null
      },
      backgroundColor: {
        type: String,
        default: ''
      },
      // 'top' | 'middle' (default) | 'bottom'. Siempre pegado al borde
      // izquierdo; solo cambia la posición vertical.
      sidebarPosition: {
        type: String,
        default: 'middle'
      },
    },
  data() {
    return {
      dragging: false,
      hoverZone: null,
    };
  },
 computed: {
 		Embedded() {
				return window.Embedded;
			},
  		useUpload() {
	  		return window.Use.UseUploadFromMap;
		  }
    },
  methods: {
    togglePanel(panel) {
      if (this.activePanel === panel) {
        this.$emit('panel-toggle', null);
      } else {
        this.$emit('panel-toggle', panel);
      }
    },
    startDrag(e) {
      e.preventDefault();
      this.dragging = true;
      this.hoverZone = this.sidebarPosition;
      window.addEventListener('mousemove', this.onDragMove);
      window.addEventListener('mouseup', this.onDragEnd);
      window.addEventListener('touchmove', this.onDragMove, { passive: false });
      window.addEventListener('touchend', this.onDragEnd);
    },
    onDragMove(e) {
      if (e.touches) {
        e.preventDefault();
      }
      var clientY = e.touches ? e.touches[0].clientY : e.clientY;
      var h = window.innerHeight;
      if (clientY < h / 3) {
        this.hoverZone = 'top';
      } else if (clientY > (h * 2) / 3) {
        this.hoverZone = 'bottom';
      } else {
        this.hoverZone = 'middle';
      }
    },
    onDragEnd() {
      this.dragging = false;
      if (this.hoverZone && this.hoverZone !== this.sidebarPosition) {
        this.$emit('update:sidebarPosition', this.hoverZone);
      }
      this.hoverZone = null;
      this.removeDragListeners();
    },
    removeDragListeners() {
      window.removeEventListener('mousemove', this.onDragMove);
      window.removeEventListener('mouseup', this.onDragEnd);
      window.removeEventListener('touchmove', this.onDragMove);
      window.removeEventListener('touchend', this.onDragEnd);
    },
  },
  beforeDestroy() {
    // Limpieza defensiva por si el componente se destruye a mitad de un drag.
    this.removeDragListeners();
  },
};
</script>

<style scoped>
.map-toolbar {
	border: 1px solid rgb(165 164 164 / 50%);
  position: absolute;
  left: calc(20px + var(--mp-side-offset, 0px));
  transition: left .3s ease;
  z-index: 990;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffffc0;
  padding: 8px;
  border-radius: 30px;
}

.map-toolbar.pos-middle {
  top: 50%;
  transform: translateY(-50%);
}

.map-toolbar.pos-top {
  top: 20px;
}

.map-toolbar.pos-bottom {
  bottom: 20px;
}

.drag-handle {
  position: absolute;
  left: 2px;
  top: 26%;
  width: 9px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: #aaa;
  font-size: 8px;
  opacity: 0;
  transition: opacity .15s ease;
  touch-action: none;
}

.map-toolbar:hover .drag-handle {
  opacity: 1;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Con el panel abajo a la izquierda, el botón de indicadores pasa al final
   (el drag-handle y los demás botones no tienen order, quedan en su
   posición natural). */
.toolbar-button-last {
  order: 1;
}

/* Zonas de destino del arrastre: siempre pegadas al borde izquierdo, un
   tercio de la altura de la pantalla cada una. */
.drop-zone {
  position: fixed;
  left: 0;
  width: 110px;
  z-index: 985;
  box-sizing: border-box;
  border: 2px dashed transparent;
  border-radius: 8px;
  pointer-events: none;
  transition: background-color .15s ease, border-color .15s ease;
}

/* Cada zona ocupa el 65% de su tercio de pantalla, centrada dentro de él
   (33.33vh * 0.65 ≈ 21.67vh, con un margen de ≈5.83vh arriba y abajo). */
.drop-zone-top { top: 0; height: 21.67vh; }
.drop-zone-middle { top: 39.16vh; height: 21.67vh; }
.drop-zone-bottom { bottom: 0; height: 21.67vh; }

.drop-zone-hover {
  border-color: #0fa7d8;
}

@media (max-width: 768px) {
  .map-toolbar {
    left: 10px;
    padding: 8px;
    gap: 8px;
  }

  .mp-icon-btn {
    font-size: 16px;
  }
}
</style>

