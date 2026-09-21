<template>
  <transition name="slide-right">
    <div class="search-panel-wrapper sidepanelOffset" v-if="isOpen" :style="positionStyle">
      <div class="search-panel" v-on-clickaway="close" :style="heightStyle">
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

          <!-- min-height fijo (results-area), para que el panel no cambie de
               tamaño según haya resultados, recientes, ninguno de los dos, o
               un mensaje de "sin resultados". -->
          <div class="results-area">
            <transition name="fade">
              <div class="results-container" v-if="hasResults">
                <div class="results-list">
                  <div
                    v-for="(item, index) in autolist"
                    :key="item.Id"
                    class="result-item"
                    :class="{ 'result-hover': item.Class === 'lihover' }"
                    @click="selectResult($event, item)"
                    @mouseover="hoverResult(item, index)"
                    @mouseout="unhoverResult(item, index)"
                  >
                    <div class="result-content">
                      <div class="result-icon">
                        <i :class="getResultIcon(item)"></i>
                      </div>
                      <div class="result-info">
                        <div class="result-name" v-html="item.Highlighted"></div>
                        <div class="result-extra">{{ item.Extra }}</div>
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

            <div class="recents-container" v-if="showRecents && hasRecents">
              <div class="recents-section-title">Visto recientemente</div>
              <div class="results-list">
                <template v-if="!showAllRecents">
                  <div
                    v-for="item in recentsPreview"
                    :key="item.DedupeKey"
                    class="result-item"
                    @click="selectRecent(item)"
                  >
                    <div class="result-content">
                      <div class="result-icon"><i class="fas fa-clock"></i></div>
                      <div class="result-info">
                        <div class="result-name">{{ item.Caption }}</div>
                      </div>
                      <button class="btn-remove-recent" @click.stop="removeRecent(item)" title="Eliminar de recientes">
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div v-for="row in recentsExpandedRows" :key="row.Key">
                    <div v-if="row.IsLabel" class="recents-group-label">{{ row.Label }}</div>
                    <div v-else class="result-item" @click="selectRecent(row.Item)">
                      <div class="result-content">
                        <div class="result-icon"><i class="fas fa-clock"></i></div>
                        <div class="result-info">
                          <div class="result-name">{{ row.Item.Caption }}</div>
                        </div>
                        <button class="btn-remove-recent" @click.stop="removeRecent(row.Item)" title="Eliminar de recientes">
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="!showAllRecents && hasMoreRecents" class="show-more-recents hand" @click="showAllRecents = true">
                Más vistos recientemente
              </div>
            </div>

            <div v-if="searchText && !hasResults && !loading" class="no-results">
              <p>No se encontraron resultados</p>
            </div>
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
import ActiveRecents from '@/map/classes/ActiveRecents';

const debounce = require('lodash.debounce');

export default {
  name: 'SearchPanel',
  mixins: [clickaway],
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    // 'top' | 'middle' (default) | 'bottom'. Igual criterio que
    // indicatorSelector.vue: en top/bottom el panel se acerca al botón de
    // Buscar del sideToolbar en vez de quedar centrado, sin salirse de la
    // pantalla (ver positionStyle/heightStyle).
    sidebarPosition: {
      type: String,
      default: 'middle'
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
      // Si se está mostrando la lista completa de recientes (agrupada por
      // fecha) en lugar de la vista previa de hasta 4 ítems.
      showAllRecents: false,
      // Copia local de los recientes. window.SegMap.Recents no es reactivo
      // para Vue, así que en vez de leerlo desde un computed (quedaría
      // cacheado con el valor de la primera lectura) se vuelve a pedir de
      // forma explícita con refreshRecents(), en los momentos en que puede
      // haber cambiado: al abrir el panel y al eliminar un ítem.
      recentsList: [],
      recentsGroups: [],
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
    // Los recientes solo se ofrecen antes de tipear texto de búsqueda, igual
    // que en Google Maps.
    showRecents() {
      return this.searchText.trim() === '';
    },
    hasRecents() {
      return this.recentsList.length > 0;
    },
    recentsPreview() {
      return this.recentsList.slice(0, 4);
    },
    hasMoreRecents() {
      return this.recentsList.length > 4;
    },
    // Filas de la vista expandida: un separador de grupo (Hoy/Última
    // semana/Último mes) seguido de sus ítems, aplanado para poder iterar
    // con un único v-for en el template.
    recentsExpandedRows() {
      var rows = [];
      for (var g = 0; g < this.recentsGroups.length; g++) {
        var group = this.recentsGroups[g];
        if (group.Label) {
          rows.push({ IsLabel: true, Label: group.Label, Key: 'label-' + group.Label });
        }
        for (var i = 0; i < group.Items.length; i++) {
          rows.push({ IsLabel: false, Item: group.Items[i], Key: group.Items[i].DedupeKey });
        }
      }
      return rows;
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
    },
    // Con sidebarPosition 'top'/'bottom', el panel se acerca al botón de
    // Buscar (que en esos casos está arriba o abajo, no en el medio de la
    // pantalla) en vez de quedar centrado; 60px, no pegado al borde extremo
    // como el resto de los controles del toolbar, para que se note más
    // cerca del botón que de la esquina de la pantalla.
    positionStyle() {
      if (this.sidebarPosition === 'top') {
        return { top: '60px', bottom: 'auto', transform: 'none' };
      }
      if (this.sidebarPosition === 'bottom') {
        return { bottom: '60px', top: 'auto', transform: 'none' };
      }
      return null;
    },
    // max-height dinámico según el viewport: sin esto, el valor fijo de
    // 600px podría hacer que el panel se salga de la pantalla al anclarlo
    // arriba o abajo en vez de centrarlo.
    heightStyle() {
      var avail = (typeof window !== 'undefined' ? window.innerHeight : 800) - 80;
      return { maxHeight: Math.min(600, avail) + 'px' };
    }
  },
  watch: {
    isOpen(val) {
      if (val) {
        // window.SegMap.Recents no es reactivo para Vue: se piden los
        // recientes recién al abrir el panel, que es cuando puede haber
        // cambiado lo guardado desde la última vez que se mostraron.
        this.refreshRecents();
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
        this.showAllRecents = false;
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
    // Type de un resultado de búsqueda: F = feature/ubicación, L = indicador
    // (por "layer"), C = región de recorte, B = delimitación, P = coordenada
    // tecleada (ver Search.js: preSearch).
    getResultIcon(item) {
      const icons = {
        'F': 'fas fa-map-marker-alt',
        'L': 'fas fa-chart-bar',
        'C': 'fas fa-draw-polygon',
        'B': 'fas fa-map',
        'P': 'fas fa-location-arrow'
      };
      return icons[item.Type] || 'fas fa-circle';
    },
    // Reabre un ítem de "Visto recientemente" según su tipo, siguiendo el
    // mismo camino de negocio que usa SegmentedMap.SelectId para un
    // resultado de búsqueda equivalente.
    selectRecent(item) {
      if (item.Type === ActiveRecents.Types.Metric) {
        window.SegMap.AddMetricById(item.Payload.MetricId);
      } else if (item.Type === ActiveRecents.Types.Boundary) {
        window.SegMap.AddBoundaryById(item.Payload.BoundaryId);
      } else if (item.Type === ActiveRecents.Types.ClippingRegion) {
        window.SegMap.Clipping.SetClippingRegion(item.Payload.RegionIds, true, false, false);
      } else if (item.Type === ActiveRecents.Types.Location) {
        window.SegMap.InfoWindow.InfoRequestedInteractive(
          { Coordinate: { Lat: item.Lat, Lon: item.Lon } },
          item.Payload,
          item.Payload.Id
        );
      }
      this.close();
    },
    removeRecent(item) {
      window.SegMap.Recents.Remove(item.DedupeKey);
      this.refreshRecents();
    },
    refreshRecents() {
      this.recentsList = window.SegMap.Recents.GetRecents();
      this.recentsGroups = window.SegMap.Recents.GetGroupedRecents();
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
  position: absolute;
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

/* Área de resultados/recientes */
.results-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* Alto equivalente a 4 result-item vacíos, para que el panel no cambie
     de tamaño según haya resultados, recientes, ninguno de los dos, o un
     mensaje de "sin resultados". */
  min-height: 232px;
}

.results-container,
.recents-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.results-container::-webkit-scrollbar,
.recents-container::-webkit-scrollbar {
  width: 6px;
}

.results-container::-webkit-scrollbar-track,
.recents-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.results-container::-webkit-scrollbar-thumb,
.recents-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.results-container::-webkit-scrollbar-thumb:hover,
.recents-container::-webkit-scrollbar-thumb:hover {
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
  color: #0fa7d8;
  font-size: 18px;
  flex-shrink: 0;
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

/* Recientes */
.recents-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 4px 8px 8px;
}

.recents-group-label {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  padding: 12px 8px 4px;
}

.recents-container .result-content {
  align-items: center;
}

.btn-remove-recent {
  background: none;
  border: none;
  color: #bbb;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 6px;
  flex-shrink: 0;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-remove-recent:hover {
  background: #eee;
  color: #666;
}

.show-more-recents {
  text-align: center;
  padding: 10px 8px 4px;
  font-size: 13px;
  color: #0fa7d8;
  cursor: pointer;
}

.show-more-recents:hover {
  text-decoration: underline;
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
