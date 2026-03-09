<template>
  <transition name="slide-fade">
    <div class="indicator-selector-wrapper sidepanelOffset" v-if="isOpen" v-on-clickaway="closePanel">
      <!-- Panel flotante principal -->
      <div class="work-offsetY floating-panel panel card">
        <!-- Encabezado del panel -->
        <div class="panel-header">
          <div class="panel-title">Explorar indicadores</div>
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
          <button class="btn-breadcrumb-clear" @click.stop="goHome" title="Volver a categorías">×</button>
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
                <div class="indicator-icon">
                  <i :class="(item.Icon ? item.Icon : getIconClass(item.catIcon))"></i>
                </div>
                <div class="indicator-info">
                  <div class="indicator-name">{{ item.Name }}</div>
                  <div class="indicator-meta sourceInfo">{{ item.catName }}</div>
                </div>
              </div>
              <div class="indicator-actions">
                <button v-if="!isMobile"
                  class="btn-preview btn btn-default btn-xs"
                  @mouseenter.prevent="showTooltip($event, item)"
                  @mouseleave.prevent="hideTooltip"
                  @click.stop="preventDefault"

                >
                  <i class="fas fa-info-circle"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Grid de categorías -->
          <div v-else-if="!currentCategory" class="categories-grid">
            <div
              v-for="cat in excludeBoundaries(metrics)"
              :key="cat.Name"
              class="category-card hand"
              :class="{ 'featured': cat.Icon === 'star' }"
              @click="selectCategory(cat)"
            >
              <span class="category-icon" :class="{ 'featured': cat.Icon === 'star' }">
                <i :class="getIconClass(cat.Icon)"></i>
              </span>
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
                  <div class="indicator-icon">
                    <i :class="(item.Icon ? item.Icon : getIconClass(currentCategory.Icon))"></i>
                  </div>
                  <div class="indicator-info">
                    <div class="indicator-name">{{ item.Name }}</div>
                    <div class="indicator-meta sourceInfo">
                      {{ getYearsString(item) }}
                    </div>
                  </div>
                </div>
                <div class="indicator-actions">
                  <button  v-if="!isMobile"
                    class="btn-preview btn btn-default btn-xs"
                    @mouseenter="showTooltip($event, item)"
                    @mouseleave="hideTooltip"
                    @click.stop="preventDefault"

                  >
                    <i class="fas fa-info-circle"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Zona de sugerencias fija en el pie -->
        <div class="suggestions-zone" :class="{ 'expanded': showAllSuggestions }" v-show="visibleSuggestions.length > 0">
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
                <div class="indicator-icon">
                  <i :class="getIconClass(item.Icon)"></i>
                </div>
                <div class="indicator-info">
                  <div class="indicator-name">{{ item.Label }}</div>
                  <div class="indicator-meta sourceInfo">{{ item.Provider }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tooltip de información -->
      <transition name="fade">
        <div v-if="tooltip.visible"
             class="preview-tooltip"
             :style="{
            top: tooltip.top + 'px',
            left: tooltip.left + 'px',
            position: 'fixed'
          }"
             @mouseenter="keepTooltip = true"
             @mouseleave="keepTooltip = false; hideTooltip()">
          <div class="preview-header">
            <div class="preview-icon">
              <i :class="getTooltipIconClass(tooltip.item)"></i>
            </div>
            <div class="preview-title">{{ tooltip.item.Name }}</div>
          </div>
          <div class="preview-section">
            <div class="preview-label">{{ plural('Variable', getTooltipVariables(tooltip.item)) }}</div>
            <div class="preview-value">
              <ul :class="(getTooltipVariables(tooltip.item).length == 1 ? 'variablesSingle' : 'variables')">
                <li v-for="variable, index in getTooltipVariables(tooltip.item)" :key="index" :value="variable">
                  {{ addDot(variable) }}
                </li>
              </ul>
            </div>
          </div>
          <div class="preview-section">
            <div class="preview-label">
              {{ plural('Nivel', getTooltipLevels(tooltip.item)) }}
            </div>
            <div class="preview-value">
              {{
 getTooltipLevels(tooltip.item).join(', ')
              }}.
            </div>
          </div>
          <div class="preview-section">
            <div class="preview-label">{{ plural('Versión', tooltip.item.Versions) }}</div>
            <div class="year-tags">
              <span v-for="v in tooltip.item.Versions" :key="v.Id" class="year-tag">
                {{ v.Name }}
              </span>
            </div>
          </div>
          <div class="preview-section">
            <div class="preview-label">Fuente</div>
            <div class="preview-value">{{ getTooltipSource(tooltip.item) }}.</div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import { mixin as clickaway } from 'vue-clickaway';
import str from '@/common/framework/str';

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
    },
    suggestions: {
      type: Array,
      default: () => []
    },
  },
  data() {
    return {
      searchQuery: '',
      currentCategory: null,
      showAllSuggestions: false,
      keepTooltip: false,
      tooltipHideTimer: null,
      tooltip: {
        visible: false,
        top: 0,
        left: 0,
        item: null
      },
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
              results.push(item);
            }
          });
        }
      });

      return results;
    },
    isMobile() {
      return window.SegMap.Configuration.IsMobile;
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
    plural(term, collection) {
      return str.Plural(term, collection.length);
    },
    addDot(term) {
			return str.AddDot(term);
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
    excludeBoundaries(list) {
      var ret = [];
      for (var item of list) {
        if (item.Name != 'Delimitaciones') {
          ret.push(item);
        }
      }
      return ret;
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

			// Cancelar cualquier hide pendiente
			if (this._hideTimer) {
				clearTimeout(this._hideTimer);
				this._hideTimer = null;
			}

			const rect = event.target.getBoundingClientRect();
			const tooltipWidth = 420;
			const viewportWidth = window.innerWidth;

			let left = rect.right + 10;
			if (left + tooltipWidth > viewportWidth) {
				left = rect.left - tooltipWidth - 10;
			}

			this.tooltip = { visible: true, top: rect.top, left, item };

			this.$nextTick(() => {
				const el = this.$el.querySelector('.preview-tooltip');
				if (!el) return;
				const actualHeight = el.offsetHeight;
				const viewportHeight = window.innerHeight;
				let top = rect.top;
				if (top + actualHeight > viewportHeight - 12) {
					top = viewportHeight - actualHeight - 12;
				}
				if (top < 8) top = 8;
				this.tooltip = { ...this.tooltip, top };
			});
		},

		hideTooltip() {
			this._hideTimer = setTimeout(() => {
				if (!this.keepTooltip) {
					this.tooltip.visible = false;
				}
				this._hideTimer = null;
			}, 120);
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
    getIconClass(icon) {
      const icons = {
        'star': 'fas fa-star',
        'people': 'fas fa-users',
        'school': 'fas fa-graduation-cap',
        'favorite': 'fas fa-heart',
        'engineering': 'fas fa-hard-hat',
        'local_library': 'fas fa-book',
        'opacity': 'fas fa-tint',
        'how_to_vote': 'fas fa-vote-yea',
        'account_balance': 'fas fa-balance-scale',
        'home': 'fas fa-home',
        'dashboard': 'fas fa-th',
        'warning': 'fas fa-exclamation-triangle',
        'bolt': 'fas fa-bolt',
        'map': 'fas fa-map',
        'groups': 'fas fa-users',
        'auto_awesome': 'fas fa-magic'
      };
      return icons[icon] || 'fas fa-map-pin';
    },
    getYearsString(item) {
      if (item.Versions && item.Versions.length > 0) {
        return item.Versions.map(v => v.Name).join(', ');
      }
      return '';
    },
    getTooltipIconClass(item) {
      return this.getIconClass(item.catIcon || item.icon);
    },
		getTooltipVariables(item) {
			var ret = [];
      for (var version of item.Versions) {
        for (var level of version.Levels) {
          for (var variable of level.Variables) {
            if (!ret.includes(variable.Name)) {
              if (variable.Name) {
                if (variable.Name == 'N') {
									ret.push('Conteo');
                } else {
                  ret.push(variable.Name);
                }
              }
            }
          }
        }
      }
      if (ret.length == 0) {
        ret.push('Conteo');
      }
			return ret;
		},
    getTooltipLevels(item) {
      var ret = [];
      for (var version of item.Versions) {
        for (var level of version.Levels) {
					if (!ret.includes(level.Name)) {
            ret.push(level.Name);
          }
        }
      }
			return ret;
		},
    getTooltipSource(item) {
      var provider = this.getItemProvider(item);
      if (provider) {
        return provider.Name;
      } else {
        return '';
      }
    },
    getItemGroup(item) {
      for (var metric of this.metrics) {
        if (item.MetricGroupId && item.MetricGroupId === metric.Id) {
          return metric;
        }
      }
			return null;
    },
		getItemProvider(item) {
			for (var metric of this.metrics) {
				for (var provider of metric.Items) {
					if (provider.Header) {
						if (item.MetricProviderId && item.MetricProviderId === provider.Id) {
							return provider;
            }
          }
        }
      }
			return null;
		},
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
  position: absolute;
  left: 92px;
  top: 0px;
  bottom: 0px;
  margin: auto 0;
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

	.variablesSingle {
		padding-left: 0px;
		list-style: none;
	}

	.variables {
		padding-left: 20px;
	}


/* Breadcrumb */
.breadcrumb-nav {
  padding: 8px 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 14px;
  flex-shrink: 0;
  line-height: 2em;
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

	.btn-breadcrumb-clear {
		background: none;
		border: none;
		color: #999;
    float: right;
		font-size: 24px;
		line-height: 1;
		padding: 0 0 0 6px;
		cursor: pointer;
		vertical-align: middle;
		transition: color 0.2s;
	}

		.btn-breadcrumb-clear:hover {
			color: #333;
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
  background: linear-gradient(135deg, #c3c3c3 0%, #818181 100%);
  color: white;
  border: none;
}

.category-card.featured .category-name {
  color: white;
}

.category-card.featured .category-count {
  color: rgba(255, 255, 255, 0.8);
}

	.category-icon.featured {
		text-shadow: none;
		color: #69bad5;
	}

.category-icon {
  font-size: 32px;
  text-shadow: 2px 2px 4px rgb(223 216 220 / 50%);
  color: #0fa7d8;
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
  background-color: #eee;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

	.indicator-icon {
		text-shadow: 2px 2px 1px rgb(223 216 220 / 50%);
		color: #0fa7d8;
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
		padding: 12px;
		width: 420px;
		z-index: 1060;
		box-shadow: 0 4px 10px rgba(60,64,67,.28);
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
  display: none;
  font-size: 20px;
  flex-shrink: 0;
}

.preview-title {
  font-size: 13px;
  text-transform: uppercase;
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
