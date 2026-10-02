<template>
  <transition name="slide-right">
    <div class="search-panel-wrapper" v-if="isOpen" :style="positionStyle" v-touch:swipe.left="panLeftSwipeClose">
      <div class="search-panel" v-on-clickaway="close" :style="heightStyle">
        <div class="search-header">
          <div class="titleDialog">Buscar</div>
          <button class="btn-close" @click="close">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div class="search-body">
          <div class="search-input-container">
            <i class="fas fa-search search-icon"></i>
            <input v-model="searchText"
                   ref="searchInput"
                   type="text"
                   class="search-input"
                   placeholder="Buscar indicadores y lugares en Poblaciones"
                   @keyup="handleSearch"
                   autocomplete="off" />
            <button v-if="searchText" class="search-clear" @click="clearSearch" title="Borrar búsqueda" aria-label="Borrar búsqueda">×</button>

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
                    v-for="item in autolist"
                    :key="item.Id"
                    class="result-item"
                    data-kbd-item="result"
                    @click="selectResult($event, item)"
                  >
                    <div class="result-content">
                      <div class="list-icon">
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
                    data-kbd-item="recent"
                    @click="selectRecent(item)"
                  >
                    <div class="result-content">
                      <div class="list-icon"><i class="fas fa-clock"></i></div>
                      <div class="result-info">
                        <div class="result-name">{{ item.Caption }}</div>
                        <div v-if="item.Subtitle" class="result-extra">{{ item.Subtitle }}</div>
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
                    <div v-else class="result-item" data-kbd-item="recent" @click="selectRecent(row.Item)">
                      <div class="result-content">
                        <div class="list-icon"><i class="fas fa-clock"></i></div>
                        <div class="result-info">
                          <div class="result-name">{{ row.Item.Caption }}</div>
                          <div v-if="row.Item.Subtitle" class="result-extra">{{ row.Item.Subtitle }}</div>
                        </div>
                        <button class="btn-remove-recent" @click.stop="removeRecent(row.Item)" title="Eliminar de recientes">
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="!showAllRecents && hasMoreRecents" class="show-more-recents hand" data-kbd-item="more" @click="showAllRecents = true">
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
import KeyboardAwareList from '@/map/classes/KeyboardAwareList';

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
  created() {
    // Navegación por teclado de resultados y recientes (no reactivo a propósito).
    this.kbd = new KeyboardAwareList({
      getInput: () => this.$refs.searchInput,
      getContainer: () => this.$el,
      onDelete: this.kbdOnDelete
    });
  },
  mounted() {
    if (this.isOpen) this.kbd.attach();
  },
  beforeDestroy() {
    this.kbd.detach();
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
    // Cualquier cambio del contenido visible (resultados, recientes, vista
    // expandida) devuelve el elemento activo por teclado a -1. Se devuelve un
    // arreglo nuevo en cada recálculo para que el watcher dispare.
    kbdContentKey() {
      return [this.autolist, this.recentsList, this.showAllRecents, this.showRecents];
    },
    // Con sidebarPosition 'top'/'bottom', el panel se acerca al botón de
    // Buscar (que en esos casos está arriba o abajo, no en el medio de la
    // pantalla) en vez de quedar centrado; 60px, no pegado al borde extremo
    // como el resto de los controles del toolbar, para que se note más
    // cerca del botón que de la esquina de la pantalla.
    positionStyle() {
      if (this.sidebarPosition === 'top') {
        return { top: '20px', bottom: 'auto' };
      }
      if (this.sidebarPosition === 'bottom') {
        return { bottom: '60px', top: 'auto' };
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
        this.kbd.attach();
        // window.SegMap.Recents no es reactivo para Vue: se piden los
        // recientes recién al abrir el panel, que es cuando puede haber
        // cambiado lo guardado desde la última vez que se mostraron.
        this.refreshRecents();
        if (!this.$isMobile()) {
          this.$nextTick(() => {
            if (this.$refs.searchInput) {
              this.$refs.searchInput.focus();
            }
          });
        }
      } else {
        this.kbd.detach();
        this.searchText = '';
        this.autolist = [];
        this.searched = '';
        this.showAllRecents = false;
      }
    },
    searchText(val) {
      if (val === '') {
        this.handleEscape();
      }
    },
    kbdContentKey() {
      this.kbd.reset();
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
		clearSearch() {
			this.searchText = '';
			this.$nextTick(() => { if (this.$refs.searchInput) this.$refs.searchInput.focus(); });
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
    formatCoord(item) {
      return h.trimNumberCoords(item.Lat) + ',' + h.trimNumberCoords(item.Lon);
    },
		panLeftSwipeClose() {
			if (event.srcElement.className === 'excluded' ||
				window.getSelection().toLocaleString().length > 0) {
				return;
			}
			this.close();
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
    // Supr sobre un reciente lo elimina (equivale a su botón ×) y deja activo
    // al siguiente; si era el último, al anterior.
    kbdOnDelete(kind, el) {
      const btn = kind === 'recent' ? el.querySelector('.btn-remove-recent') : null;
      if (!btn) return false;
      const idx = this.kbd.index;
      btn.click();
      // Se registra después de que la eliminación encoló el reset del índice,
      // así corre tras el render, con la lista ya actualizada.
      this.$nextTick(() => this.kbd.select(idx));
      return true;
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


/* Wrapper del panel */
	.search-panel-wrapper {
		position: absolute;
    border-radius: 12px;
    align-self: center;
		left: 92px;
		z-index: 1050;
	}

	.search-panel {
		background: white;
		border-radius: inherit;
		border: 1px solid rgb(165 164 164 / 50%);
		width: 400px;
		align-self: center;
		max-height: 600px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

/* Header */
	.search-header {
		padding: 12px 16px 0px 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
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
		padding: 18px 20px 18px 20px;
	}


/* Área de resultados/recientes */
	.results-area {
		flex: 1;
		overflow: hidden;
		display: flex;
		padding-left: 15px;
		padding-right: 15px;
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
  padding: 0px;
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

/* Result Item: mismo estilo que .indicator-item de indicatorSelector.vue,
   para que este panel y el selector de indicadores/boundaries se vean como
   un único sistema visual. */
	.result-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px;
		border-radius: 26px;
		margin-bottom: 2px;
    padding-right: 12px;
		padding-left: 25px;
	}

.result-item:hover {
  background-color: #eee;
}

/* Elemento activo por teclado (KeyboardAwareList) */
.result-item[data-kbd-active] {
  background-color: #e3e3e3;
  box-shadow: inset 0 0 0 2px #90caf9;
}

.result-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  line-height: 1.3;
}

.result-extra {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
		font-size: 13.5px;
		color: #707070;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 4px 8px 8px 18px;
	}

	.recents-group-label {
		font-size: 14px;
		color: #707070;
		padding: 10px 22px 4px;
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

.show-more-recents:hover,
.show-more-recents[data-kbd-active] {
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
			margin: unset;
			width: 100%;
      left: 0px;
			max-width: 90%;
			max-height: 100% !important;
			border-radius: 0;
			border-top-right-radius: 12px;
			border-bottom-right-radius: 12px;
			border-bottom-left-radius: 0px;
			border-top-left-radius: 0px;
		}

		.search-panel {
			width: 100%;
			max-height: calc(100vh - 100px);
			border-left: 0px;
		}
}
</style>
