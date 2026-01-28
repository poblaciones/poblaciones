<template>
  <transition name="slide-right">
    <div class="search-panel-wrapper sidepanelOffset" v-if="isOpen" >
      <div class="search-panel" v-on-clickaway="close">
        <div class="search-header">
          <div class="panel-title">Buscar</div>
          <button class="btn-close" @click="close">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div class="search-body">
          <div class="search-input-container">
            <i class="fas fa-search search-icon"></i>
            <input
              v-model="searchText"
              ref="searchField"
              type="text"
              class="search-input"
              placeholder="Buscar indicadores y lugares en Poblaciones"
              @keyup="handleSearch"
              autocomplete="off"
            />
            <div v-if="loading" class="search-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </div>

          <transition name="fade">
            <div class="results-container" v-if="hasResults">
              <div class="results-list">
                <div
                  v-for="(item, index) in autolist"
                  :key="item.Id"
                  class="result-item"
                  :class="[
                    'result-type-' + item.Type,
                    { 'result-hover': item.Class === 'lihover' }
                  ]"
                  @click="selectResult($event, item)"
                  @mouseover="hoverResult(item, index)"
                  @mouseout="unhoverResult(item, index)"
                >
                  <div v-if="item.Type === 'L'" class="result-content">
                    <div class="result-icon">
                      <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="result-info">
                      <div class="result-name" v-html="item.Highlighted"></div>
                      <div class="result-extra">{{ item.Extra }}</div>
                    </div>
                  </div>

                  <div v-else class="result-content">
                    <div class="result-icon">
                      <i :class="getResultIcon(item)"></i>
                    </div>
                    <div class="result-info">
                      <div class="result-extra">{{ item.Extra }}</div>
                      <div class="result-name" v-html="item.Highlighted"></div>
                      <div v-if="item.Lat && item.Lon" class="result-coords">
                        <a
                          href="#"
                          v-clipboard="() => formatCoord(item)"
                          v-clipboard:success="clipboardSuccess"
                          v-clipboard:error="clipboardError"
                          @click.prevent
                          title="Copiar coordenadas"
                          class="copy-coords"
                        >
                          <i class="far fa-copy"></i>
                        </a>
                        <span class="coords-text">{{ formatCoord(item) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>

          <div v-if="searchText && !hasResults && !loading" class="no-results">
            <i class="fas fa-search"></i>
            <p>No se encontraron resultados</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { mixin as clickaway } from 'vue-clickaway';
import h from '@/map/js/helper';
import Search from '@/map/classes/Search';

const debounce = require('lodash.debounce');

export default {
  name: 'SearchPanel',
  mixins: [clickaway],
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchText: '',
      loading: false,
      autolist: [],
      searched: '',
      selindex: -1,
      retCancel: null,
      doSearchDebounced: debounce(function(e) {
        if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 27) {
          return;
        }
        const t = this.searchText.trim().toLowerCase();
        if (t === '' || this.searched === t) {
          return;
        }
        this.autolist = [];
        const s = new Search(this, window.SegMap.Signatures.Search, 'a');
        s.StartSearch(t);
      }, 1000)
    };
  },
  computed: {
    hasResults() {
      return this.autolist.length > 0;
    },
    keymap() {
      return {
        'ctrl+s': this.handleEnter,
        enter: this.handleEnter,
        down: this.handleArrowDown,
        up: this.handleArrowUp,
        esc: this.handleEscape,
        tab: this.handleArrowDown,
        'shift+tab': this.handleArrowUp
      };
    }
  },
  watch: {
    isOpen(val) {
      if (val) {
        this.$nextTick(() => {
          if (this.$refs.searchField) {
            this.$refs.searchField.focus();
          }
        });
      } else {
        this.searchText = '';
        this.autolist = [];
        this.searched = '';
        this.selindex = -1;
      }
    },
    searchText(val) {
      if (val === '') {
        this.handleEscape();
      }
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
    handleSearch(e) {
      if (e.keyCode === 13) {
        this.doSearchDebounced.flush();
      } else {
        return this.doSearchDebounced(e);
      }
    },
    selectResult(event, item) {
      if (item.Type === 'P') {
        window.SegMap.SetMyLocation(item);
      } else {
        window.SegMap.SelectId(item.Type, item.Id, item.Lat, item.Lon, event.ctrlKey);
      }
      this.searchText = '';
      this.autolist = [];
      this.close();
    },
    hoverResult(item, index) {
      this.clearHover();
      item.Class = 'lihover';
      this.selindex = index;
    },
    unhoverResult(item, index) {
      this.clearHover();
      this.selindex = -1;
    },
    clearHover() {
      this.autolist.forEach(el => {
        el.Class = '';
      });
    },
    formatCoord(item) {
      return h.trimNumberCoords(item.Lat) + ',' + h.trimNumberCoords(item.Lon);
    },
    clipboardSuccess({ value, event }) {
      event.preventDefault();
      event.stopPropagation();
    },
    clipboardError({ value, event }) {
      event.preventDefault();
      event.stopPropagation();
    },
    getResultIcon(item) {
      const icons = {
        'L': 'fas fa-map-marker-alt',
        'M': 'fas fa-chart-bar',
        'B': 'fas fa-map',
        'P': 'fas fa-location-arrow'
      };
      return icons[item.Type] || 'fas fa-circle';
    },
    handleEnter(e) {
      if (!this.hasResults) {
        if (this.$refs.searchField) {
          this.$refs.searchField.focus();
        }
      } else {
        const selected = this.autolist.find(el => el.Class !== '');
        if (selected) {
          this.selectResult(e, selected);
        }
      }
    },
    handleArrowDown(e) {
      if (!this.hasResults) return;
      e.preventDefault();

      if (this.$refs.searchField) {
        this.$refs.searchField.blur();
      }

      if (this.selindex >= 0 && this.selindex < this.autolist.length - 1) {
        this.autolist[this.selindex].Class = '';
        this.selindex++;
      } else {
        if (this.selindex >= 0) {
          this.autolist[this.autolist.length - 1].Class = '';
        }
        this.selindex = 0;
      }
      this.autolist[this.selindex].Class = 'lihover';
    },
    handleArrowUp(e) {
      if (!this.hasResults) return;
      e.preventDefault();

      if (this.$refs.searchField) {
        this.$refs.searchField.blur();
      }

      if (this.selindex > 0) {
        this.autolist[this.selindex].Class = '';
        this.selindex--;
      } else {
        if (this.selindex === 0) {
          this.autolist[0].Class = '';
        }
        this.selindex = this.autolist.length - 1;
      }
      this.autolist[this.selindex].Class = 'lihover';
    },
    handleEscape() {
      if (this.hasResults) {
        this.autolist = [];
      }
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
.search-panel-wrapper {
  position: fixed;
  left: 92px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999;
}

.search-panel {
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.search-header {
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

/* Body */
.search-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Search Input */
.search-input-container {
  position: relative;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.search-icon {
  position: absolute;
  left: 32px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 32px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  background: #f8f9fa;
}

.search-input:focus {
  border-color: #2196F3;
  background: white;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.search-input::placeholder {
  color: #999;
}

.search-spinner {
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  color: #2196F3;
  font-size: 14px;
}

/* Results Container */
.results-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.results-container::-webkit-scrollbar {
  width: 6px;
}

.results-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.results-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.results-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Result Item */
.result-item {
  padding: 12px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.result-item:hover,
.result-item.result-hover {
  background: #f5f7fa;
  border-left-color: #2196F3;
}

.result-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.result-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #e3f2fd;
  color: #2196F3;
  font-size: 14px;
  flex-shrink: 0;
}

.result-type-L .result-icon {
  background: #e8f5e9;
  color: #4caf50;
}

.result-type-M .result-icon {
  background: #fff3e0;
  color: #ff9800;
}

.result-type-B .result-icon {
  background: #f3e5f5;
  color: #9c27b0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.3;
}

.result-extra {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.result-coords {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 11px;
  color: #666;
}

.copy-coords {
  color: #2196F3;
  text-decoration: none;
  transition: color 0.2s;
}

.copy-coords:hover {
  color: #1976D2;
}

.coords-text {
  font-family: monospace;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
  text-align: center;
}

.no-results i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-results p {
  margin: 0;
  font-size: 15px;
}

/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Media queries */
@media (max-width: 768px) {
  .search-panel-wrapper {
    left: 10px;
    right: 10px;
    top: 80px;
    transform: none;
  }

  .search-panel {
    width: 100%;
    max-height: calc(100vh - 100px);
  }
}
</style>
