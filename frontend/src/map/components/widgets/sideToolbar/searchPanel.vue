<template>
  <transition name="slide-right">
    <div class="search-panel-wrapper" v-if="isOpen" :style="positionStyle" v-touch:swipe.left="panLeftSwipeClose">
      <div class="search-panel" v-on-clickaway="close" :style="heightStyle">
        <div class="search-header">
          <div class="titleDialog">Buscar</div>
          <button class="mp-icon-btn mp-icon-btn--dismiss" @click="close" aria-label="Cerrar">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div class="search-body">
          <div class="search-input-container">
            <i class="fas fa-search mp-search-icon"></i>
            <input v-model="searchText"
                   ref="searchInput"
                   type="text"
                   class="mp-search-input"
                   placeholder="Buscar indicadores y lugares en Poblaciones"
                   @keyup="handleSearch"
                   autocomplete="off" />
            <button v-if="searchText" class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--dismiss mp-icon-btn--muted mp-search-clear" @click="clearSearch" title="Borrar búsqueda" aria-label="Borrar búsqueda">×</button>

            <div v-if="loading" class="mp-search-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </div>

          <!-- min-height fijo (results-area), para que el panel no cambie de
               tamaño según haya resultados, recientes, ninguno de los dos, o
               un mensaje de "sin resultados". -->
          <div class="results-area">
            <transition name="fade">
              <div class="results-container" v-if="hasResults">
                <search-result-section
                  v-for="section in resultSections"
                  :key="section.Key"
                  :title="section.Title"
                  :rows="section.Rows"
                  :limit="section.Limit"
                  @more="expandSection(section.Key, $event)"
                >
                  <template slot="row" slot-scope="{ row }">
                    <div class="mp-list-item result-item" data-kbd-item="result" @click="selectResult($event, row)">
                      <div class="result-content">
                        <div class="list-icon">
                          <i :class="getResultIcon(row)"></i>
                        </div>
                        <div class="result-info">
                          <div class="result-name" v-html="row.Highlighted"></div>
                          <div v-if="row.Snippet" class="result-extra result-extra--snippet" v-html="row.Snippet"></div>
                          <div v-else class="result-extra">{{ row.Extra }}</div>
                          <div v-if="row.Lat && row.Lon" class="result-coords">
                            <a
                              href="#"
                              v-clipboard="() => formatCoord(row)"
                              v-clipboard:success="clipboardSuccess"
                              v-clipboard:error="clipboardError"
                              @click.prevent
                              title="Copiar coordenadas"
                              class="copy-coords"
                            >
                              <i class="far fa-copy"></i>
                            </a>
                            <span class="coords-text">{{ formatCoord(row) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </search-result-section>
              </div>
            </transition>

            <div class="recents-container" v-if="showRecents && hasRecents">
              <div class="recents-section-title">Visto recientemente</div>
              <div class="results-list">
                <template v-if="!showAllRecents">
                  <div
                    v-for="item in recentsPreview"
                    :key="item.DedupeKey"
                    class="mp-list-item result-item"
                    data-kbd-item="recent"
                    @click="selectRecent(item)"
                  >
                    <div class="result-content">
                      <div class="list-icon"><i class="fas fa-clock"></i></div>
                      <div class="result-info">
                        <div class="result-name">{{ item.Caption }}</div>
                        <div v-if="item.Subtitle" class="result-extra">{{ item.Subtitle }}</div>
                      </div>
                      <button class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--dismiss mp-icon-btn--faint js-remove-recent" @click.stop="removeRecent(item)" title="Eliminar de recientes" aria-label="Eliminar de recientes">
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div v-for="row in recentsExpandedRows" :key="row.Key">
                    <div v-if="row.IsLabel" class="recents-group-label">{{ row.Label }}</div>
                    <div v-else class="mp-list-item result-item" data-kbd-item="recent" @click="selectRecent(row.Item)">
                      <div class="result-content">
                        <div class="list-icon"><i class="fas fa-clock"></i></div>
                        <div class="result-info">
                          <div class="result-name">{{ row.Item.Caption }}</div>
                          <div v-if="row.Item.Subtitle" class="result-extra">{{ row.Item.Subtitle }}</div>
                        </div>
                        <button class="mp-icon-btn mp-icon-btn--sm mp-icon-btn--dismiss mp-icon-btn--faint js-remove-recent" @click.stop="removeRecent(row.Item)" title="Eliminar de recientes" aria-label="Eliminar de recientes">
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <search-more-button v-if="!showAllRecents && hasMoreRecents" @more="showAllRecents = true">
                Más vistos recientemente
              </search-more-button>
            </div>

            <div v-if="searchText && !hasResults && !awaitingPlaces" class="no-results">
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
import CatalogTree from '@/map/classes/catalog/CatalogTree';
import CatalogSearch from '@/map/classes/catalog/CatalogSearch';
import SearchQuery from '@/map/classes/catalog/SearchQuery';
import SearchResultRows from '@/map/classes/catalog/SearchResultRows';
import SearchResultSection from './searchResultSection.vue';
import SearchMoreButton from './searchMoreButton.vue';

const debounce = require('lodash.debounce');

export default {
  name: 'SearchPanel',
  components: { SearchResultSection, SearchMoreButton },
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
    },
    // Catálogos de indicadores y de delimitaciones (los mismos árboles que
    // indicatorSelector.vue): se buscan en el cliente. El servidor solo
    // aporta lugares.
    indicators: {
      type: Array,
      default: () => []
    },
    boundaries: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      searchText: '',
      loading: false,
      // Lugares (resultados del servidor) y coordenadas tecleadas. El nombre
      // lo exige Search.js, que escribe en view.autolist.
      autolist: [],
      // Filas visibles de cada sección del catálogo (ver SearchResultRows).
      limits: { indicators: SearchResultRows.INITIAL_LIMIT, regions: SearchResultRows.INITIAL_LIMIT },
      // Hay una búsqueda de lugares programada (debounce) aún no iniciada.
      debouncePending: false,
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
      doSearchDebounced: debounce(function() {
        this.debouncePending = false;
        const t = this.searchText.trim().toLowerCase();
        if (t === '' || this.searched === t) {
          return;
        }
        this.autolist = [];
        // 'p': el servidor devuelve solo lugares.
        const s = new Search(this, window.SegMap.Signatures.Search, 'p');
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
      return this.indicatorRows.length > 0 || this.regionRows.length > 0 || this.autolist.length > 0;
    },
    // Faltan lugares por llegar: hay una búsqueda programada o en curso.
    awaitingPlaces() {
      return this.loading || this.debouncePending;
    },
    queryResolver() {
      return new SearchQuery(window.SegMap.Configuration.Search);
    },
    // El texto con las palabras vacías y el autocompletado del servidor.
    resolvedText() {
      const text = this.searchText.trim();
      return text === '' ? '' : this.queryResolver.Resolve(text);
    },
    // El índice de palabras de cada catálogo se reconstruye solo al cambiar el catálogo.
    indicatorsSearch() {
      return new CatalogSearch(new CatalogTree(this.indicators));
    },
    boundariesSearch() {
      return new CatalogSearch(new CatalogTree(this.boundaries));
    },
    indicatorRows() {
      const search = this.indicatorsSearch;
      return new SearchResultRows(search.tree).Indicators(search.FindItems(this.resolvedText, null));
    },
    // Delimitaciones (se agregan completas al mapa) y regiones.
    regionRows() {
      const search = this.boundariesSearch;
      return new SearchResultRows(search.tree).Regions(
        search.FindBranches(this.resolvedText, null),
        search.FindItems(this.resolvedText, null)
      );
    },
    placeRows() {
      const rows = [];
      for (let n = 0; n < this.autolist.length; n++) {
        const item = this.autolist[n];
        rows.push(Object.assign({}, item, { Key: item.Type + '|' + item.Id + '|' + n }));
      }
      return rows;
    },
    resultSections() {
      return [
        { Key: 'indicators', Title: 'Indicadores', Rows: this.indicatorRows, Limit: this.limits.indicators },
        { Key: 'regions', Title: 'Regiones', Rows: this.regionRows, Limit: this.limits.regions },
        { Key: 'places', Title: 'Lugares', Rows: this.placeRows, Limit: null }
      ];
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
    // arreglo nuevo en cada recálculo para que el watcher dispare. No incluye
    // los lugares ni los límites de las secciones: los lugares llegan al final
    // de la lista y "Ver más" agrega filas después de la activa, así que ni
    // su llegada ni su expansión deben perder la posición (ver autolist y
    // expandSection).
    kbdContentKey() {
      return [this.indicatorRows, this.regionRows, this.recentsList, this.showAllRecents, this.showRecents];
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
      this.limits = { indicators: SearchResultRows.INITIAL_LIMIT, regions: SearchResultRows.INITIAL_LIMIT };
      if (val === '') {
        this.handleEscape();
      }
    },
    // Los lugares se agregan o se quitan al final de la lista: con la lista
    // activa se conserva el índice (acotado al nuevo rango), sin quitarle el
    // foco al campo si lo tiene.
    autolist() {
      const idx = this.kbd.index;
      if (idx > -1 && document.activeElement !== this.$refs.searchInput) {
        this.$nextTick(() => this.kbd.select(idx));
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
      if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 27) {
        return;
      }
      if (e.keyCode === 13) {
        this.doSearchDebounced.flush();
        return;
      }
      this.debouncePending = true;
      this.doSearchDebounced();
    },
    // "Ver más" de una sección. Si el botón era el elemento activo por teclado,
    // el mismo índice pasa a ser la primera fila agregada (el botón queda
    // después de las filas o desaparece), por lo que se vuelve a activar tras
    // el render.
    expandSection(key, wasActive) {
      const idx = this.kbd.index;
      this.limits[key] = SearchResultRows.NextLimit(this.limits[key]);
      if (wasActive) {
        this.$nextTick(() => this.kbd.select(idx));
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
      const btn = kind === 'recent' ? el.querySelector('.js-remove-recent') : null;
      if (!btn) return false;
      const idx = this.kbd.index;
      btn.click();
      // Se registra después de que la eliminación encoló el reset del índice,
      // así corre tras el render, con la lista ya actualizada.
      this.$nextTick(() => this.kbd.select(idx));
      return true;
    },
    handleEscape() {
      this.autolist = [];
      this.searched = '';
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
		left: calc(92px + var(--mp-side-offset, 0px));
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
		padding-bottom: 12px;
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

.result-item {
	padding-right: 12px;
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

/* Snippet de match por keyword: "... villas ... 2022, 2023". Se renderiza con
   v-html porque contiene la palabra matcheada envuelta en <mark>; el subtítulo
   y el resto de la frase llegan ya escapados desde SearchResultRows. */
.result-extra--snippet {
  color: #707070;
}

.result-extra--snippet mark {
  background: #fff3a8;
  color: #5a4700;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}
.result-extra--snippet mark strong { font-weight: inherit; }

/* Highlighting del título: <mark><strong>palabra</strong></mark>. markStrong
   toma el mismo amarillo que el snippet para que se vea igual; strong va en
   bold (redundante con font-weight:600, pero lo dejamos por si cambian los
   estilos de mark). */
.result-name mark {
  background: #fff3a8;
  color: #5a4700;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}
.result-name mark strong {
  font-weight: inherit;
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
