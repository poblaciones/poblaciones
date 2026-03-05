<template>
  <div class="map-style-selector-wrapper exp-hiddable-block">
    <!-- Botón compacto para mostrar tipo de mapa al que se podría ir -->
    <button
      class="map-style-btn btn btn-default btn-xs"
      :class="{ 'expanded': isExpanded }"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"

            :title="'Cambiar a ' + nextMapStyle.name.toLowerCase()"
    >
      <div class="map-style-icon preview-default" :style="{ backgroundImage: 'url(' + nextMapStyle.asset + ')' }"></div>
    </button>

    <!-- Panel expandido con opciones -->
    <transition name="fade">
      <div
        v-if="isExpanded"
        class="map-options-panel panel card"
        @mouseenter="keepPanelOpen = true"
        @mouseleave="handlePanelLeave"
      >


        <!-- Sección de capas adicionales -->
        <div class="panel-section">
          <div class="section-title" style="margin-bottom: 4px;">Detalles del mapa</div>
          <div class="map-layers-list">
            <div
              v-for="layer, index in activeLayers"
              :key="index"
              class="layer-item hand" :class="(layer.Separator ? 'layer-separator' : '')"
              @click="toggleLayer(layer)"
            >
              <div class="layer-info">
                <i :class="layer.Icon" class="layer-icon"></i>
                <span class="layer-name">{{ layer.Caption }}</span>
              </div>
              <div class="layer-toggle">
                <div class="toggle-switch" :class="{ 'active': layer.Visible }">
                  <div class="toggle-slider"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

 <!-- Separador -->
 <div class="panel-divider"></div>
         <!-- Sección de tipos de mapa -->
 <div class="panel-section">
   <div class="section-title">Tipo de mapa</div>
   <div class="map-types-grid">
     <div
       v-for="style in mapStyles"
       :key="style.id"
       class="map-type-card hand"


     :class="{ 'active': currentMapStyle.id === style.id }"
       @click="mapStyleSelected(style)"
     >
       <div class="map-type-preview preview-default" :style="{ backgroundImage: 'url(' + style.asset + ')' }"></div>
       <div class="map-type-name">{{ style.name }}</div>
     </div>
   </div>
 </div>

      </div>
    </transition>
  </div>
</template>

<script>

  import defaultMapType from '@/common/assets/maps/default.png';
  import streetsMapType from '@/common/assets/maps/streets.png';
  import satelliteMapType from '@/common/assets/maps/satellite.png';

  export default {
    name: 'mpBasemapButton',
    props: ['toolbarStates', 'readonly'],
    data() {
      return {
        isExpanded: false,
        keepPanelOpen: false,
        isTouchDevice: false,
        hoverTimeout: null,
        currentMapStyleId: 'default',
        mapStyles: [
          {
            id: 'default',
            name: 'Simple',
            class: 'preview-default',
            asset: defaultMapType
          },
          {
            id: 'satellite',
            name: 'Satélite',
            class: 'preview-satellite',
            asset: satelliteMapType
          },
          {
            id: 'streets',
            name: 'Calles',
            class: 'preview-streets',
            asset: streetsMapType
          },
          {
            id: 'blank',
            name: 'Blanco',
            class: 'preview-blank',
            asset: ''
          }
        ],
        mapLayers:  [{
           Id: 'labels',
           Caption: 'Etiquetas',
           Icon: 'fas fa-tag',
           Visible: true
            }, {
            Id: 'elevation',
              Caption: 'Relieve',
                Icon: 'fas fa-mountain',
                  Visible: false
              }]
      /*
                {
                  id: 'roads',
                  name: 'Rutas',
                  icon: 'fas fa-road',
                  Visible: true
                },
                {
                  id: 'rivers',
                  name: 'Cursos de agua',
                  icon: 'fas fa-water',
                  Visible: false
                },
                {
                  id: 'trains',
                  name: 'Trenes',
                  icon: 'fas fa-train',
                  Visible: false
                }
              ]*/
      };
    },
    mounted() {
      // Detectar si es dispositivo táctil
      this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },
    beforeDestroy() {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }
    },
    computed: {
      useElevation() {
        return this.toolbarStates.hasElevation;
      },
      currentMapStyle() {
        return this.mapStyles.find(s => s.id === this.currentMapStyleId);
      },
      nextMapStyle() {
        var next = '';
        switch (this.currentMapStyleId) {
          case 'default':
					case 'streets':
            next = 'satellite';
            break;
          case 'satellite':
					case 'blank':
            next = 'default';
            break;
        }
        return this.mapStyles.find(s => s.id === next);
			},
      activeLayers() {
        var ret = [];
        for (var l of this.mapLayers) {
          if (l.Id != 'elevation' || this.useElevation) {
            ret.push(l);
          }
        }
        return ret;
      }
    },
    methods: {
      handleClick() {
        if (this.readonly) {
          return;
        }
        if (this.isTouchDevice) {
          // En dispositivos táctiles, toggle del panel
          this.isExpanded = !this.isExpanded;
          if (this.isExpanded) {
            this.expandit();
          }
        } else {
          // En desktop, cambiar al siguiente tipo de mapa sin abrir panel
          //if (!this.isExpanded) {
						this.mapStyleSelected(this.nextMapStyle);
          //}
        }
      },
      handleMouseEnter() {
        if (this.readonly) {
          return;
        }
        if (!this.isTouchDevice) {
          // En desktop, expandir panel con hover
          if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
          }
          this.hoverTimeout = setTimeout(() => {
            this.isExpanded = true;
            this.expandit();
          }, 200);
        }
      },
      expandit() {
        for (var l of this.mapLayers) {
          if (l.Id == 'elevation') {
            l.Visible = this.toolbarStates.showElevation;
          }
        }
      },
      handleMouseLeave() {
        if (this.readonly) {
          return;
        }
        if (!this.isTouchDevice) {
          if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
          }
          this.hoverTimeout = setTimeout(() => {
            if (!this.keepPanelOpen) {
              this.isExpanded = false;
            }
          }, 300);
        }
      },
      handlePanelLeave() {
        this.keepPanelOpen = false;
        if (!this.isTouchDevice) {
          this.hoverTimeout = setTimeout(() => {
            this.isExpanded = false;
          }, 300);
        }
      },
      selectMapStyleById(styleId) {
        this.currentMapStyleId = styleId;
      },
      mapStyleSelected(style) {
        this.currentMapStyleId = style.id;
        this.$emit('styleChanged', style.id);
        // En desktop, cerrar panel después de seleccionar
        if (!this.isTouchDevice) {
          setTimeout(() => {
            this.isExpanded = false;
            this.keepPanelOpen = false;
          }, 150);
        }
      },
      toggleLayer(layer) {
        if (layer.Id == 'labels') {
          layer.Visible = !layer.Visible;
          window.SegMap.ToggleShowLabels();
        } else if (layer.Id == 'elevation') {
          window.SegMap.ToggleShowElevation();
          layer.Visible = this.toolbarStates.showElevation;
        } else {
          window.SegMap.ToggleBasemapMetric(layer);
        }
        this.$emit('layerToggled', {
          layerId: layer.Id,
          Visible: layer.Visible
        });
      }
    }
};
</script>

<style scoped>
/* Reset básico */
* {
  box-sizing: border-box;
}

	.map-style-btn {
		position: absolute;
		left: 20px;
		bottom: 20px;
		width: 64px;
		height: 64px;
		border-radius: 8px;
		background: #ffffffc0;
		border: 1px solid #ddd;
		box-shadow: rgb(0 0 0 / 20%) 0px 1px 3px 2px;
		color: #333;
		cursor: pointer;
		z-index: 890;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
	}

.map-style-btn:hover {
  background: #f8f9fa;
  border-color: #ccc;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 2px 4px;
}

.map-style-btn.expanded {
  background: #f8f9fa;
  border-color: #999;
}

.map-style-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

	.map-style-icon {
		width: 100%;
		height: 100%;
		border-radius: 6px;
		border: 1px solid #ddd;
		flex-shrink: 0;
	}

.map-style-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-icon {
  font-size: 12px;
  color: #666;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

/* Panel de opciones */
.map-options-panel {
  position: absolute;
  bottom: -6px;
  left: 100px; /* Al lado del botón */
  width: 320px;
  background: white;
  border-radius: 6px;
  box-shadow: rgba(0, 0, 0, 0.18) 0px 1px 1px;
  border: 1px solid #ddd;
  z-index: 1040;
  overflow: hidden;
}

/* Secciones del panel */
.panel-section {
  padding: 12px;
}

.panel-divider {
  height: 1px;
  background: #e9ecef;
  margin: 0;
}

/* Grid de tipos de mapa */
.map-types-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

	.map-type-card {
		background: white;
		/* border: 2px solid #ddd;*/
		border-radius: 4px;
		padding: 8px;
		justify-items: center;
    text-align: center;
		transition: all 0.2s;
	}

.layer-separator {
	border-bottom: 1px solid #cdcdcd;
	border-radius: 0px;
}

.map-type-card:hover {
  border-color: #999;
  background: #f1f1f1;
}

	.map-type-card.active {
		border-color: #4a90e2;
		background: #e9e9e9;
	}

.map-type-preview {
  width: 55px;
  height: 55px;
  border-radius: 6px;
  margin-bottom: 6px;
  border: 1px solid #e9ecef;
}

/* Estilos de preview para cada tipo de mapa */
	.preview-default {
		background: white;
		background-size: contain;
		background-origin: border-box;
    border: 1px solid #ddd !important;
	}

.map-type-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

/* Lista de capas */
	.map-layers-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: 2px;
	}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.layer-item:hover {
  background-color: #f8f9fa;
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.layer-icon {
  width: 16px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.layer-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* Toggle switch */
.layer-toggle {
  flex-shrink: 0;
}

.toggle-switch {
  width: 38px;
  height: 20px;
  background: #ccc;
  border-radius: 10px;
  position: relative;
  transition: background-color 0.2s;
  cursor: pointer;
}

.toggle-switch.active {
  background: #4a90e2;
}

.toggle-slider {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 3px;
}

.toggle-switch.active .toggle-slider {
  transform: translateX(18px);
}

/* Animaciones */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Utilidades */
.hand {
  cursor: pointer;
}

/* Media queries para responsive */
@media (max-width: 768px) {
  .map-style-btn {
    left: auto;
    right: 20px;
    top: 20px;
    width: 48px;
    height: 48px;
  }

  .map-options-panel {
    position: absolute;
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-height: 70vh;
    border-radius: 16px 16px 0 0;
    transform-origin: bottom;
  }

  .fade-enter, .fade-leave-to {
    transform: translateY(100%);
  }

  .map-types-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .map-type-preview {
    height: 50px;
  }

  .map-type-name {
    font-size: 12px;
  }
}

/* Para pantallas muy pequeñas */
@media (max-width: 480px) {
  .map-style-btn {
    width: 40px;
    height: 40px;
  }

  .map-style-icon {
    width: 32px;
    height: 32px;
  }
}
</style>
