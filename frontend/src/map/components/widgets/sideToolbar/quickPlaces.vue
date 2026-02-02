<template>
  <transition name="slide-right">
    <div class="quick-places-wrapper sidepanelOffset" v-if="isOpen">
      <div class="quick-places-panel" v-on-clickaway="close">
        <div class="panel-header">
          <div class="panel-title">Ir a ...</div>
          <button class="btn-close" @click="close">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div class="tabs-container">
          <div class="tabs-header">
            <button
              v-for="boundary in boundariesData"
              :key="boundary.Id"
              class="tab-button"
              :class="{ 'active': activeTab === boundary.Id }"
              @click="activeTab = boundary.Id"
            >
              {{ boundary.Name }}
            </button>
          </div>

          <div class="tabs-content">
            <!-- Tab para cada tipo de límite -->
            <div
              v-for="boundary in boundariesData"
              :key="boundary.Id"
              v-show="activeTab === boundary.Id"
              class="tab-panel"
            >
              <div class="places-list">
                <div
                  v-for="place in boundary.Items"
                  :key="place.Id"
                  class="place-item"
                  @click="goToPlace(boundary.Id, place)"
                >
                  <div class="place-icon">
                    {{ getIcon(boundary.Icon) }}
                  </div>
                  <div class="place-info">
                    <div class="place-name">{{ place.Name }}</div>
                    <div class="place-type">{{ boundary.Name }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { mixin as clickaway } from 'vue-clickaway';

export default {
  name: 'QuickPlaces',
  mixins: [clickaway],
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    // Prop para recibir los datos del JSON
    boundariesData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // Inicializar con el primer boundary si existe
      activeTab: this.boundariesData.length > 0 ? this.boundariesData[0].Id : null,
    };
  },
  watch: {
    isOpen(val) {
      if (!val) {
        // Reset to first tab when closing
        setTimeout(() => {
          if (this.boundariesData.length > 0) {
            this.activeTab = this.boundariesData[0].Id;
          }
        }, 300);
      }
    },
    boundariesData: {
      immediate: true,
      handler(newData) {
        if (newData.length > 0 && !this.activeTab) {
          this.activeTab = newData[0].Id;
        }
      }
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
    goToPlace(boundaryId, place) {
      // Emit event to parent with boundary type and place data
      this.$emit('place-selected', {
        boundaryId: boundaryId,
        place: place,
        boundaryType: this.getBoundaryType(boundaryId)
      });
      this.close();
    },
    getBoundaryType(boundaryId) {
      const boundary = this.boundariesData.find(b => b.Id === boundaryId);
      return boundary ? boundary.Name.toLowerCase() : 'unknown';
    },
    getIcon(iconName) {
      // Mapear iconos del JSON a clases de FontAwesome
      const iconMap = {
        map: "🗺️",
        public: "🌎",
        location_city: "🏙️",
        dashboard: "🗂️", // Delimitaciones
        star: "⭐", // Más consultados
        people: "👥",
        school: "🎓",
        favorite: "❤️",
        engineering: "💼",
        local_library: "🏛️",
        opacity: "💧",
        how_to_vote: "🗳️",
        account_balance: "⚖️",
        home: "🏠"
      };
      return iconMap[iconName] || 'fas fa-map-marker-alt';
    },
    getIconClass(iconName) {
      // Clases CSS específicas para diferentes tipos de iconos
      const classMap = {
        'map': 'province-icon',
        'public': 'region-icon',
        'location_city': 'urban-icon',
        'dashboard': 'delimitation-icon',
        'star': 'popular-icon',
        'people': 'population-icon',
        'school': 'education-icon',
        'favorite': 'health-icon',
        'engineering': 'work-icon',
        'local_library': 'culture-icon',
        'opacity': 'services-icon',
        'how_to_vote': 'elections-icon',
        'account_balance': 'justice-icon',
        'home': 'habitat-icon'
      };
      return classMap[iconName] || 'default-icon';
    }
  }
};
</script>

<style scoped>
/* Animación de slide desde la izquierda */
.slide-right-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-right-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter, .slide-right-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* Wrapper del panel */
.quick-places-wrapper {
  position: fixed;
  left: 92px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999;
}

.quick-places-panel {
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 350px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #666;
}

/* Tabs Container */
.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  flex-wrap: wrap;
}

.tab-button {
  flex: 1;
  min-width: 100px;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-button:hover {
  background: #f5f5f5;
  color: #333;
}

.tab-button.active {
  color: #2196F3;
  background: white;
  border-bottom-color: #2196F3;
}

/* Tab Content */
.tabs-content {
  flex: 1;
  overflow: hidden;
}

.tab-panel {
  height: 100%;
  overflow-y: auto;
  padding: 8px;
}

.tab-panel::-webkit-scrollbar {
  width: 6px;
}

.tab-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.tab-panel::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.tab-panel::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Places List */
.places-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.place-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.place-item:hover {
  background: #f5f7fa;
  border-color: #e3f2fd;
}

.place-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

/* Colores específicos para diferentes tipos de iconos */
.place-icon.province-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.place-icon.region-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.place-icon.urban-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.place-icon.delimitation-icon {
  background: linear-gradient(135deg, #5ee7df 0%, #b490ca 100%);
}

.place-icon.popular-icon {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
}

.place-icon.population-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.place-icon.education-icon {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.place-icon.health-icon {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.place-icon.work-icon {
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
}

.place-icon.culture-icon {
  background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
}

.place-icon.services-icon {
  background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
}

.place-icon.elections-icon {
  background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
}

.place-icon.justice-icon {
  background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
}

.place-icon.habitat-icon {
  background: linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%);
}

.place-icon.default-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.place-info {
  flex: 1;
  min-width: 0;
}

.place-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  line-height: 1.3;
}

.place-type {
  font-size: 12px;
  color: #999;
}

.place-arrow {
  color: #ccc;
  font-size: 12px;
  transition: all 0.2s;
}

.place-item:hover .place-arrow {
  color: #2196F3;
}

/* Media queries */
@media (max-width: 768px) {
  .quick-places-wrapper {
    left: 10px;
    right: 10px;
    top: 80px;
    transform: none;
  }

  .quick-places-panel {
    width: 100%;
    max-height: calc(100vh - 100px);
  }

  .tab-button {
    font-size: 11px;
    padding: 10px 4px;
    min-width: 80px;
  }

  .place-name {
    font-size: 13px;
  }

  .place-type {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .tab-button {
    font-size: 10px;
    padding: 8px 2px;
    min-width: 70px;
  }
}
</style>
