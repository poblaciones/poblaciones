<template>
  <transition name="slide-fade">
    <div class="indicator-selector-wrapper sidepanelOffset" v-if="isOpen" v-on-clickaway="closePanel">
      <!-- Overlay oscuro -->
      <div class="overlay" @click="closePanel"></div>

      <!-- Panel flotante principal -->
      <div class="floating-panel panel card">
        <!-- Encabezado del panel -->
        <div class="panel-header">
          <div class="panel-title">Explorar datos</div>
          <button class="btn-close" @click="closePanel">
            <span aria-hidden="true">×</span>
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
              placeholder="Buscar indicador o delimitación..."
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
  </transition>
</template>

<script>
import { mixin as clickaway } from 'vue-clickaway';

export default {
  name: 'IndicatorSelector',
  mixins: [clickaway],
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    metrics: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
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
  watch: {
    isOpen(val) {
      if (val) {
        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus();
          }
        });
      } else {
        this.hideTooltip();
        this.keepTooltip = false;
        setTimeout(() => {
          this.currentCategory = null;
          this.searchQuery = '';
          this.showAllSuggestions = false;
        }, 300);
      }
    }
  },
  methods: {
    closePanel() {
      this.$emit('close');
    },
    selectItem(item) {
      this.$emit('selected-item', item);
      this.closePanel();
    },
    selectSuggestion(item) {
      this.$emit('selected-item', item);
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
        left: left,
        item: item
      };
    },
    hideTooltip() {
      if (!this.keepTooltip) {
        this.tooltip.visible = false;
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
      return cat.Items.filter(item => !item.Header).length;
    },
    getIconEmoji(icon) {
      const icons = {
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
      return icons[icon] || '📌';
    },
    getYearsString(item) {
      if (item.Versions && item.Versions.length > 0) {
        return item.Versions.map(v => v.Name).join(', ');
      }
      return '';
    },
    getTooltipIcon(item) {
      return this.getIconEmoji(item.catIcon || item.icon);
    },
    getTooltipSource(item) {
      return item.Provider || item.catName || 'Sin especificar';
    }
  }
};
</script>

<style scoped>
/* Animación de entrada/salida */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter, .slide-fade-leave-to {
  opacity: 0;
}

.slide-fade-enter .floating-panel {
  transform: translateX(-100%) translateY(-50%);
}

.slide-fade-leave-to .floating-panel {
  transform: translateX(-100%) translateY(-50%);
}

/* Overlay oscuro */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Panel flotante */
.floating-panel {
  position: fixed;
  left: 92px;
  top: 50%;
  transform: translateY(-50%);
  width: 420px;
  max-width: calc(100vw - 112px);
  max-height: 90vh;
  background: white;
  border-radius: 6px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1050;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Encabezado del panel */
	.panel-header {
		padding: 12px 16px;
		border-bottom: 1px solid #e9ecef;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
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

/* Breadcrumb */
.breadcrumb-nav {
  padding: 12px 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 14px;
  flex-shrink: 0;
}

.breadcrumb-item {
  color: #666;
  transition: color 0.2s;
}

.breadcrumb-item:not(.active) {
  cursor: pointer;
}

.breadcrumb-item:not(.active):hover {
  color: #333;
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #333;
  font-weight: 500;
}

.breadcrumb-sep {
  margin: 0 8px;
  color: #ccc;
}

/* Cuerpo del panel */
	.panel-body {
		flex: 1;
		overflow-y: auto;
		padding: 20px 24px;
		min-height: 230px;
	}

.panel-body.thinScroll::-webkit-scrollbar {
  width: 6px;
}

.panel-body.thinScroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.panel-body.thinScroll::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.panel-body.thinScroll::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Barra de búsqueda */
.search-container {
  position: relative;
  margin-bottom: 20px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 42px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

/* Grid de categorías */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.category-card {
  padding: 14px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  text-align: center;
  transition: all 0.2s;
  background: white;
}

.category-card:hover {
  border-color: #2196F3;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
  transform: translateY(-2px);
}

.category-card.featured {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.category-card.featured .category-name {
  color: white;
}

.category-card.featured .category-count {
  color: rgba(255, 255, 255, 0.8);
}

.category-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 12px;
}

.category-name {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.3;
  font-weight: 500;
}

.category-count {
  font-size: 13px;
  color: #999;
}

/* Lista de indicadores */
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

.indicator-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
  margin-bottom: 2px;
}

.indicator-item:hover {
  background-color: #f8f9fa;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.indicator-icon {
  font-size: 20px;
  width: 24px;
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
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #999;
  transition: all 0.2s;
}

.btn-preview:hover {
  background: #e9ecef;
  color: #666;
}

.no-results {
  text-align: center;
  color: #999;
  padding: 40px 16px;
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
  padding: 10px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}

.more-link {
  color: #2196F3;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
}

.more-link:hover {
  color: #1976D2;
  text-decoration: underline;
}

.suggestions-content {
  flex: 1;
  overflow-y: hidden;
  padding: 8px 24px 12px 24px;
  max-height: 150px;
}

.suggestions-content.expanded {
  overflow-y: auto;
  max-height: 245px;
}

.suggestions-content.thinScroll::-webkit-scrollbar {
  width: 6px;
}

.suggestions-content.thinScroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.suggestions-content.thinScroll::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

.suggestion-item:hover {
  background-color: #e9ecef;
}

/* Tooltip */
.preview-tooltip {
  position: fixed;
  background: #333;
  color: white;
  border-radius: 8px;
  padding: 16px;
  width: 280px;
  z-index: 1060;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
}

.preview-header {
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #555;
  padding-bottom: 10px;
  margin-bottom: 12px;
}

.preview-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.preview-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.preview-section {
  margin-bottom: 12px;
}

.preview-section:last-child {
  margin-bottom: 0;
}

.preview-label {
  font-size: 11px;
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
  gap: 6px;
  margin-top: 6px;
}

.year-tag {
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #e9e9e9;
  border: none;
}

/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Utilidades */
.hand {
  cursor: pointer;
}

.sourceInfo {
  color: #999;
}

/* Media queries */
@media (max-width: 768px) {
  .floating-panel {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
    transform: none;
  }

  .slide-fade-enter .floating-panel,
  .slide-fade-leave-to .floating-panel {
    transform: translateY(100%);
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }

  .preview-tooltip {
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%);
    width: calc(100% - 40px);
    max-width: 320px;
  }
}
</style>
