<template>
  <div class="data-selector-wrapper">
    <!-- Botón FAB para abrir el panel -->
    <button
      class="fab-add btn btn-default btn-xs"
      :class="{ 'hidden': isOpen }"
      @click="openPanel"
      title="Agregar indicador"
    >
      <i class="fas fa-plus"></i>
    </button>

    <!-- Overlay oscuro -->
    <div class="overlay" :class="{ 'active': isOpen }" @click="closePanel"></div>

    <!-- Panel flotante principal -->
    <div class="floating-widget panel card" :class="{ 'open': isOpen }" v-if="isOpen">
      <!-- Encabezado del panel -->
      <div class="panel-header">
        <div class="panel-title title">Explorar datos</div>
        <button class="btn-close close" @click="closePanel">
          <span aria-label="Cerrar" class="material-design-icon close-icon">×</span>
        </button>
      </div>

      <!-- Navegación breadcrumb -->
      <div class="breadcrumb-nav">
        <span class="breadcrumb-item" :class="{ 'active': !currentCategory && !searchQuery }" @click="goHome">
          Categorías
        </span>
        <span v-if="currentCategory || searchQuery" class="breadcrumb-sep">/</span>
        <span v-if="searchQuery" class="breadcrumb-item active">
          Resultados de búsqueda
        </span>
        <span v-else-if="currentCategory" class="breadcrumb-item active">
          {{ currentCategory.Name }}
        </span>
      </div>

      <!-- Cuerpo del panel con contenido scrolleable -->
      <div class="panel-body thinScroll">
        <!-- Barra de búsqueda -->
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            class="search-input"
            v-model="searchQuery"
            placeholder="Buscar indicador, censo, renabap..."
            ref="searchInput"
            @keyup.esc="closePanel"
          />
        </div>

        <!-- Resultados de búsqueda -->
        <div v-if="searchQuery" class="results-list">
          <div v-if="filteredGlobalItems.length === 0" class="no-results">
            No se encontraron resultados para "{{ searchQuery }}"
          </div>
          <div
            v-for="item in filteredGlobalItems"
            :key="item.Id || item.Name"
            class="indicator-item hand"
            @click="selectItem(item)"
          >
            <div class="indicator-content">
              <div class="indicator-icon">{{ getIconEmoji(item.catIcon) }}</div>
              <div class="indicator-info">
                <div class="indicator-name">{{ item.Name }}</div>
                <div class="indicator-meta sourceInfo">{{ item.catName }}</div>
              </div>
            </div>
            <div class="indicator-actions">
              <button
                class="btn-preview btn btn-default btn-xs"
                @mouseenter.prevent="showTooltip($event, item)"
                @mouseleave.prevent="hideTooltip"
                @click.stop="preventDefault"
                title="Información"
              >
                <i class="fas fa-info-circle"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Grid de categorías -->
        <div v-else-if="!currentCategory" class="categories-grid">
          <div
            v-for="cat in metrics"
            :key="cat.Name"
            class="category-card hand"
            :class="{ 'featured': cat.Icon === 'star' }"
            @click="selectCategory(cat)"
          >
            <span class="category-icon">{{ getIconEmoji(cat.Icon) }}</span>
            <div class="category-name">{{ cat.Name }}</div>
            <div class="category-count sourceInfo">
              {{ getLabel(cat) }}
            </div>
          </div>
        </div>

        <!-- Lista de indicadores de la categoría -->
        <div v-else class="indicators-list">
          <div v-for="(item, index) in currentCategory.Items" :key="index">
            <div v-if="item.Header" class="source-header">
              {{ item.Name }}
            </div>
            <div v-else class="indicator-item hand" @click="selectItem(item)">
              <div class="indicator-content">
                <div class="indicator-icon">{{ getIconEmoji(currentCategory.Icon) }}</div>
                <div class="indicator-info">
                  <div class="indicator-name">{{ item.Name }}</div>
                  <div class="indicator-meta sourceInfo">
                    {{ getYearsString(item) }}
                  </div>
                </div>
              </div>
              <div class="indicator-actions">
                <button
                  class="btn-preview btn btn-default btn-xs"
                  @mouseenter="showTooltip($event, item)"
                  @mouseleave="hideTooltip"
                  @click.stop="preventDefault"
                  title="Información"
                >
                  <i class="fas fa-info-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Zona de sugerencias fija en el pie -->
      <div class="suggestions-zone" :class="{ 'expanded': showAllSuggestions }">
        <div class="suggestion-header">
          <span class="section-title">Sugerencias</span>
          <span class="more-link hand" @click="toggleSuggestions">
            {{ showAllSuggestions ? 'Ver menos' : 'Ver más' }}
          </span>
        </div>
        <div class="suggestions-content thinScroll" :class="{ 'expanded': showAllSuggestions }">
          <div
            v-for="item in visibleSuggestions"
            :key="item.Id"
            class="suggestion-item hand"
            @click="selectSuggestion(item)"
          >
            <div class="indicator-content">
              <div class="indicator-icon">{{ getIconEmoji(item.icon) }}</div>
              <div class="indicator-info">
                <div class="indicator-name">{{ item.Name }}</div>
                <div class="indicator-meta sourceInfo">{{ item.Provider }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tooltip de información -->
    <transition name="fade">
      <div
        v-if="tooltip.visible"
        class="preview-tooltip"
        :style="{
          top: tooltip.top + 'px',
          left: tooltip.left + 'px',
          position: 'fixed'
        }"
        @mouseenter="keepTooltip = true"
        @mouseleave="hideTooltip"
      >
        <div class="preview-header">
          <div class="preview-icon">{{ getTooltipIcon(tooltip.item) }}</div>
          <div class="preview-title">{{ tooltip.item.Name }}</div>
        </div>
        <div class="preview-section">
          <div class="preview-label">Fuente / Trabajo</div>
          <div class="preview-value">{{ getTooltipSource(tooltip.item) }}</div>
        </div>
        <div class="preview-section" v-if="tooltip.item.Versions">
          <div class="preview-label">Versiones Disponibles</div>
          <div class="year-tags">
            <span v-for="v in tooltip.item.Versions" :key="v.Id" class="year-tag btn btn-default btn-xs">
              {{ v.Name }}
            </span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'DataSelector',
  props: {
    metrics: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      isOpen: false,
      searchQuery: '',
      currentCategory: null,
      showAllSuggestions: false,
      keepTooltip: false,
      tooltip: {
        visible: false,
        top: 0,
        left: 0,
        item: null
      },
      suggestions: [
        { Id: 101, Name: 'Evolución de Manchas Urbanas', Type: 'B', icon: 'dashboard', Provider: 'CIPPEC' },
        { Id: 102, Name: 'Índice de Vulnerabilidad', Type: 'M', icon: 'warning', Provider: 'Observatorio Social' },
        { Id: 103, Name: 'Acceso a Red Eléctrica', Type: 'M', icon: 'bolt', Provider: 'ENRE' },
        { Id: 104, Name: 'Límites Departamentales', Type: 'B', icon: 'map', Provider: 'IGN' },
        { Id: 105, Name: 'Nivel de Hacinamiento', Type: 'M', icon: 'groups', Provider: 'INDEC' }
      ]
    };
  },
  computed: {
    filteredGlobalItems() {
      if (!this.searchQuery.trim()) return [];
      const term = this.searchQuery.toLowerCase().trim();
      const results = [];

      this.metrics.forEach(cat => {
        if (cat.Items && Array.isArray(cat.Items) && cat.Icon != 'star') {
          cat.Items.forEach(item => {
            if (!item.Header && item.Name.toLowerCase().includes(term)) {
              results.push({
                ...item,
                catName: cat.Name,
                catIcon: cat.Icon
              });
            }
          });
        }
      });

      return results;
    },
    visibleSuggestions() {
      return this.showAllSuggestions ? this.suggestions : this.suggestions.slice(0, 3);
    }
  },
  methods: {
    openPanel() {
      this.isOpen = true;
      this.$nextTick(() => {
        if (this.$refs.searchInput) {
          this.$refs.searchInput.focus();
        }
      });
    },
    closePanel() {
      this.isOpen = false;
      this.hideTooltip();
      this.keepTooltip = false;
      setTimeout(() => {
        this.currentCategory = null;
        this.searchQuery = '';
        this.showAllSuggestions = false;
      }, 300);
    },
    selectItem(item) {
      this.$emit('selectedItem', item);
      this.closePanel();
    },
    selectSuggestion(item) {
      this.$emit('selectedItem', item);
      this.closePanel();
    },
    getLabel(cat) {
      const count = this.countItems(cat);
      if (count === 0 || !cat.Items || cat.Items.length === 0) {
        return '0 indicadores';
      }
      const text = cat.Items[0].Type === 'B' ? 'delimitaciones' : 'indicadores';
      return `${count} ${text}`;
    },
    goHome() {
      this.currentCategory = null;
      this.searchQuery = '';
    },
    selectCategory(cat) {
      this.currentCategory = cat;
      this.$nextTick(() => {
        const body = this.$el.querySelector('.panel-body');
        if (body) body.scrollTop = 0;
      });
    },
    showTooltip(event, item) {
      if (this.keepTooltip) return;

      const rect = event.target.getBoundingClientRect();
      const tooltipWidth = 280;
      const viewportWidth = window.innerWidth;

      let left = rect.right + 10;
      if (left + tooltipWidth > viewportWidth) {
        left = rect.left - tooltipWidth - 10;
      }

      this.tooltip = {
        visible: true,
        top: rect.top,
        left: Math.max(10, left),
        item: {
          ...item,
          Icon: item.catIcon || item.Icon || 'dashboard'
        }
      };
    },
    hideTooltip() {
      if (!this.keepTooltip) {
        this.tooltip.visible = false;
        this.tooltip.item = null;
      }
    },
    toggleSuggestions() {
      this.showAllSuggestions = !this.showAllSuggestions;
    },
    preventDefault(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    countItems(cat) {
      if (!cat.Items) return 0;
      return cat.Items.filter(i => !i.Header).length;
    },
    getYearsString(item) {
      if (!item.Versions || item.Versions.length === 0) return 'Sin versiones';

      if (item.Versions.length > 3) {
        const first = item.Versions[0].Name;
        const last = item.Versions[item.Versions.length - 1].Name;
        return `${item.Versions.length} versiones (${first} - ${last})`;
      }
      return item.Versions.map(v => v.Name).join(', ');
    },
    getTooltipSource(item) {
      if (item.Versions && item.Versions.length > 0) {
        return item.Versions[0].Work || 'Fuente no especificada';
      }
      return item.Provider || item.catName || 'Fuente no especificada';
    },
    getTooltipIcon(item) {
      return this.getIconEmoji(item.Icon || item.catIcon || 'dashboard');
    },
    getIconEmoji(iconName) {
      const map = {
        'star': '⭐',
        'people': '👥',
        'school': '🏫',
        'favorite': '🏥',
        'engineering': '🏗️',
        'local_library': '🎭',
        'opacity': '💧',
        'how_to_vote': '🗳️',
        'account_balance': '⚖️',
        'home': '🏠',
        'dashboard': '📊',
        'warning': '⚠️',
        'bolt': '⚡',
        'map': '🗺️',
        'groups': '👨‍👩‍👧‍👦',
        'auto_awesome': '✨'
      };
      return map[iconName] || '📄';
    }
  }
};
</script>

<style scoped>
/* Reset básico */
* {
  box-sizing: border-box;
}

/* Overlay oscuro */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1040;
  display: none;
}

.overlay.active {
  display: block;
}

/* Botón FAB - estilo Pampeana */
.fab-add {
  position: fixed;
  left: 20px;
  top: 20px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: white;
  border: 1px solid #ddd;
  box-shadow: rgba(0, 0, 0, 0.18) 0px 1px 1px;
  color: #666;
  cursor: pointer;
  z-index: 1030;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.fab-add:hover {
  background: #f8f9fa;
  border-color: #ccc;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 2px 4px;
}

.fab-add.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
}

/* Panel flotante principal - estilo Pampeana */
.floating-widget {
  position: fixed;
  top: 20px;
  left: 20px;
  height: auto;
  max-height: calc(100vh - 40px);
  width: 420px;
  background: white;
  border-radius: 0;
  box-shadow: rgba(0, 0, 0, 0.18) 0px 1px 1px;
  border: 1px solid #ddd;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  z-index: 1050;
  transform: translateX(-20px);
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  overflow: hidden;
}

.floating-widget.open {
  transform: translateX(0);
  opacity: 1;
  pointer-events: all;
}

/* Encabezado del panel */
.panel-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.panel-title {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: #666;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #333;
}

/* Breadcrumb navigation */
.breadcrumb-nav {
  padding: 8px 16px;
  border-bottom: 1px solid #e9ecef;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.breadcrumb-item {
  cursor: pointer;
  transition: color 0.2s;
  padding: 2px 4px;
  border-radius: 2px;
}

	.breadcrumb-item:hover:not(.active) {
		color: #333;
		background: #f0f0f0;
	}

.breadcrumb-item.active {
  color: #333;
  cursor: default;
}

.breadcrumb-sep {
  color: #999;
}

/* Cuerpo del panel con scroll */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Scroll delgado - estilo Pampeana */
.thinScroll::-webkit-scrollbar {
  width: 8px;
}

.thinScroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.thinScroll::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.thinScroll::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Barra de búsqueda */
.search-container {
  margin-bottom: 16px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 15px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #999;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 14px;
  pointer-events: none;
}

/* Grid de categorías */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.category-card {
  background: white;
  border: 1px solid #ddd;
  padding: 14px 10px;
  border-radius: 4px;
  text-align: center;
  transition: all 0.2s;
  box-shadow: rgba(0, 0, 0, 0.05) 0px 1px 2px;
}

.category-card:hover {
  background: #f8f9fa;
  border-color: #999;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 4px;
}

.category-card.featured {
  background: linear-gradient(135deg, #fff8db, #ffec99);
  border-color: #ffd43b;
}

.category-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 8px;
}

.category-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.3;
}

.category-count {
  font-size: 13px;
  color: #999;
}

/* Encabezado de fuente */
.source-header {
  font-size: 13px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 16px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #e9ecef;
}

.source-header:first-child {
  margin-top: 0;
}

/* Items de indicadores */
.indicator-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-bottom: 2px;
}

.indicator-item:hover {
  background-color: #f8f9fa;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.indicator-icon {
  font-size: 18px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.indicator-info {
  flex: 1;
  min-width: 0;
}

.indicator-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  line-height: 1.3;
}

.indicator-meta {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.indicator-actions {
  display: flex;
  gap: 6px;
  margin-left: 8px;
}

.btn-preview {
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  border: 0px solid white;
  justify-content: center;
  font-size: 14px;
  border-radius: 3px;
}

.btn-preview:hover {
  background: #f8f9fa;
}

.no-results {
  text-align: center;
  color: #999;
  padding: 32px 16px;
  font-style: italic;
  font-size: 15px;
}

/* Zona de sugerencias */
.suggestions-zone {
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  flex-shrink: 0;
  transition: all 0.3s ease;
  max-height: 110px;
  display: flex;
  flex-direction: column;
}

.suggestions-zone.expanded {
  max-height: 230px;
}

.suggestion-header {
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e9ecef;
}

.more-link {
  color: #666;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
}

.more-link:hover {
  color: #333;
  text-decoration: underline;
}

.suggestions-content {
  flex: 1;
  overflow-y: hidden;
  padding: 8px 16px 6px 16px;
  max-height: 150px;
}

.suggestions-content.expanded {
  overflow-y: auto;
  max-height: 245px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

	.suggestion-item:hover {
		background-color: #f0f0f0;
	}

/* Tooltip de preview */
.preview-tooltip {
  position: fixed;
  background: #333;
  color: white;
  border-radius: 4px;
  padding: 12px;
  width: 280px;
  z-index: 1060;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 4px 12px;
  pointer-events: auto;
}

.preview-header {
  display: flex;
  gap: 10px;
  align-items: center;
  border-bottom: 1px solid #555;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.preview-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.preview-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.preview-section {
  margin-bottom: 10px;
}

.preview-section:last-child {
  margin-bottom: 0;
}

.preview-label {
  font-size: 12px;
  text-transform: uppercase;
  color: #aaa;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.preview-value {
  font-size: 14px;
  color: #e9e9e9;
  line-height: 1.4;
}

.year-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.year-tag {
  background: rgba(255,255,255,0.15);
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 12px;
  color: #e9e9e9;
  border: none;
}

/* Animaciones de transición */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

/* Utilidades */
.hand {
  cursor: pointer;
}

.sourceInfo {
  color: #999;
}

/* Media queries para responsive */
@media (max-width: 768px) {
  .floating-widget {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    transform: translateY(100%);
  }

  .floating-widget.open {
    transform: translateY(0);
  }

  .fab-add {
    left: auto;
    right: 20px;
    bottom: 20px;
    top: auto;
  }

  .suggestions-zone {
    max-height: 138px;
  }

  .suggestions-zone.expanded {
    max-height: 230px;
  }

  .preview-tooltip {
    position: fixed;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%);
    width: calc(100% - 40px);
    max-width: 320px;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
