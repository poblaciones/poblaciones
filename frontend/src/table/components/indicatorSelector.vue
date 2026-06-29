<template>
  <transition name="slide-fade">
    <div class="indicator-selector-wrapper sidepanelOffset" v-if="isOpen" v-on-clickaway="closePanel">
      <div ref="floatingPanel" class="work-offsetY floating-panel panel card" :style="panelStyle">
        <!-- Encabezado -->
        <div class="panel-header">
          <div class="panel-title">{{ title }}</div>
          <div class="panel-header-actions">
            <button
              v-if="allowMultiSelectToggle && hasSelectableRows"
              class="btn-tool"
              :class="{ 'active': isMulti }"
              @click="toggleMultiSelect"
              :title="isMulti ? 'Salir de selección múltiple' : 'Selección múltiple'"
              :aria-pressed="isMulti ? 'true' : 'false'"
            >
              <i class="fas fa-tasks"></i>
            </button>
            <button
              v-if="hasHeaders"
              class="btn-tool"
              @click="toggleCollapseAll"
              :title="allCollapsed ? 'Expandir todos' : 'Colapsar todos'"
            >
              <i :class="allCollapsed ? 'fas fa-caret-right' : 'fas fa-caret-down'"></i>
            </button>
            <button
              class="btn-tool"
              :class="{ 'active': listModeActive }"
              :disabled="!showingCards && !listModeActive"
              @click="toggleViewMode"
              :title="listModeActive ? 'Ver como grilla' : 'Ver como listado'"
            >
              <i class="fas fa-stream"></i>
            </button>
            <button class="btn-close" @click="closePanel" title="Cerrar" aria-label="Cerrar">
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        <!-- Breadcrumb (acumulativo, profundidad variable) -->
        <div class="breadcrumb-nav">
          <span class="breadcrumb-item" :class="{ 'active': !navStack.length && !searchQuery }" @click="goHome">
            {{ rootLabel }}
          </span>
          <template v-for="(node, depth) in navStack">
            <span :key="'sep' + depth" class="breadcrumb-sep">/</span>
            <span
              :key="'crumb' + depth"
              class="breadcrumb-item"
              :class="{ 'active': depth === navStack.length - 1 && !searchQuery }"
              @click="goToDepth(depth)"
            >{{ node.Name }}</span>
          </template>
          <span v-if="searchQuery" class="breadcrumb-sep">/</span>
          <span v-if="searchQuery" class="breadcrumb-item active">Resultados de búsqueda</span>
          <button
            v-if="navStack.length || searchQuery"
            class="btn-breadcrumb-clear"
            @click.stop="goHome"
            title="Volver al inicio"
          >×</button>
        </div>

        <!-- Zona fija: chips y buscador (no scrollean con la lista) -->
        <div class="panel-fixed">
          <div v-if="selection.length" class="chips-zone">
            <button
              class="chips-clear"
              @click="clearSelection"
              :title="selection.length === 1 ? 'Remover' : ('Remover todo (' + selection.length + ')')"
              aria-label="Remover toda la selección"
            >×</button>
            <div class="chips-scroll thinScroll">
              <div v-for="chip in selection" :key="chip.Key || chip.Id" class="chip" :title="chip.Description">
                <span class="chip-label">{{ chip.Caption }}</span>
                <button class="chip-remove" @click="removeChip(chip)" :aria-label="'Quitar ' + chip.Caption">×</button>
              </div>
            </div>
          </div>

          <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              class="search-input"
              v-model="searchQuery"
              :placeholder="dynamicPlaceholder"
              ref="searchInput"
              @keyup.esc="onEscape"
            />
            <button v-if="searchQuery" class="search-clear" @click="clearSearch" title="Borrar búsqueda" aria-label="Borrar búsqueda">×</button>
          </div>
        </div>

        <!-- Cuerpo (scrolleable) -->
        <div class="panel-body thinScroll">
          <!-- Grid navegable (raíz o sub-categorías/tipos), modo árbol, sin búsqueda -->
          <div v-if="!searchQuery && currentBranches.length && !listModeActive">
            <template v-if="!navStack.length && groupCategories">
              <div v-for="grp in groupedBranches" :key="grp.Name || '_'">
                <div v-if="grp.Name" class="source-header">{{ grp.Name }}</div>
                <div class="categories-grid">
                  <div
                    v-for="br in grp.Branches"
                    :key="br.Id != null ? br.Id : br.Name"
                    class="category-card hand"
                    @click="enterBranch(br)"
                  >
                    <span class="category-icon"><i :class="getIconClass(br.Icon)"></i></span>
                    <div class="category-name">{{ br.Name }}</div>
                    <div class="category-count sourceInfo">{{ branchLabel(br) }}</div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="categories-grid">
              <div
                v-for="br in currentBranches"
                :key="br.Id != null ? br.Id : br.Name"
                class="category-card hand"
                :class="{ 'featured': br.Icon === 'star' }"
                @click="enterBranch(br)"
              >
                <span class="category-icon" :class="{ 'featured': br.Icon === 'star' }">
                  <i :class="getIconClass(br.Icon)"></i>
                </span>
                <div class="category-name">{{ br.Name }}</div>
                <div class="category-count sourceInfo">{{ branchLabel(br) }}</div>
              </div>
            </div>
          </div>

          <!-- Lista de hojas: misma fila para búsqueda y para navegación -->
          <div v-else class="indicators-list">
            <div v-if="searchQuery && !filteredItems.length && !filteredBranches.length" class="no-results">
              <div>No se encontraron resultados para "{{ searchQuery }}"</div>
              <div v-if="navStack.length" class="no-results-broaden">
                <a class="no-results-link" @click.stop="searchFromRoot">
                  Buscar sin el filtro de "{{ navStack[0].Name }}"
                </a>
              </div>
            </div>

            <!-- Acción de grupo: agrega el nivel actual como capa (no marca hojas) -->
            <div
              v-if="!searchQuery && showAddAll && currentLeafItems.length"
              class="indicator-item add-all hand"
              @click="onSelectGroup"
            >
              <div class="indicator-content">
                <div class="indicator-icon"><i class="fas fa-layer-group"></i></div>
                <div class="indicator-info">
                  <div class="indicator-name">{{ addAllLabel }}</div>
                </div>
              </div>
            </div>

            <template v-for="row in renderRows">
              <!-- Separador colapsable (corte de control) -->
              <div
                v-if="row.type === 'header'"
                :key="row.key"
                class="source-header hand"
                @click="toggleCollapse(row.sectionKey)"
              >
                <span
                  v-if="selectableBranches && isMulti && row.selectable && row.items && row.items.length"
                  class="selcheck header-check"
                  :class="{ 'checked': leavesSelectionState(row.items) === 'all', 'partial': leavesSelectionState(row.items) === 'some' }"
                  @click.stop="toggleLeavesSelection(row.items, currentNode)"
                >
                  <i v-if="leavesSelectionState(row.items) === 'all'" class="fas fa-check"></i>
                  <i v-else-if="leavesSelectionState(row.items) === 'some'" class="fas fa-minus"></i>
                </span>
                <span class="source-header-text">{{ row.name }}</span>
                <i
                  v-if="selectableBranches && !isMulti && row.selectable && row.items && row.items.length"
                  class="fas fa-layer-group source-header-addall"
                  title="Agregar todos/as"
                  @click.stop="addLeaves(row.items, currentNode)"
                ></i>
                <span v-if="row.count != null" class="source-header-count">{{ row.count }}</span>
                <i class="source-header-caret fas" :class="isCollapsed(row.sectionKey) ? 'fa-caret-right' : 'fa-caret-down'"></i>
              </div>

              <!-- Rama navegable (modo listado: nivel 1 de delimitaciones) -->
              <div
                v-else-if="row.type === 'branch'"
                :key="row.key"
                class="indicator-item hand"
                @click="enterListBranch(row.parent, row.branch)"
              >
                <div class="indicator-content">
                  <div class="indicator-icon">
                    <i :class="getIconClass(row.branch.Icon || (row.parent && row.parent.Icon))"></i>
                  </div>
                  <div class="indicator-info">
                    <div class="indicator-name">{{ row.branch.Name }}</div>
                    <div class="indicator-meta sourceInfo">{{ branchLabel(row.branch) }}</div>
                  </div>
                </div>
              </div>

              <!-- Fila de hoja -->
              <div
                v-else-if="row.type === 'item'"
                :key="row.key"
                class="indicator-item hand"
                :class="{ 'is-selected': isSelected(row.item) }"
                @click="onItemClick(row.item, row.container)"
              >
                <span v-if="isMulti" class="selcheck" :class="{ 'checked': isSelected(row.item) }">
                  <i v-if="isSelected(row.item)" class="fas fa-check"></i>
                </span>
                <div class="indicator-content">
                  <div class="indicator-icon">
                    <i :class="itemIcon(row.item, row.container)"></i>
                  </div>
                  <div class="indicator-info">
                    <div class="indicator-name">{{ row.item.Name }}</div>
                    <div class="indicator-meta sourceInfo">{{ itemSubtitle(row.item, row.container) }}</div>
                  </div>
                </div>
                <div class="indicator-actions">
                  <button
                    v-if="!isMobile && hasInfo(row.item)"
                    class="btn-preview btn btn-default btn-xs"
                    @mouseenter="showTooltip($event, row.item)"
                    @mouseleave="hideTooltip"
                    @click.stop="preventDefault"
                  >
                    <i class="fas fa-info-circle"></i>
                  </button>
                </div>
              </div>
              <div
                v-else-if="row.type === 'more'"
                :key="row.key"
                class="search-more hand"
                @click="liftSearchLimit"
              >
                Ver {{ row.remaining }} resultado{{ row.remaining === 1 ? '' : 's' }} más
              </div>
            </template>
          </div>
        </div>

        <!-- Regiones: controla si clic en una delimitación entra a sus elementos
             (activo) o los agrega todos (inactivo, default). Visible al ver
             delimitaciones, también en resultados de búsqueda. -->
        <div v-if="showDrillToggle" class="add-all-bar">
          <label class="sw-toggle">
            <input type="checkbox" v-model="drillIntoElements" />
            <span class="sw-track"><span class="sw-thumb"></span></span>
            <span class="sw-label">Ver cada elemento de las delimitaciones al seleccionar</span>
          </label>
        </div>

        <!-- Sugerencias -->
        <div class="suggestions-zone" :class="{ 'expanded': showAllSuggestions }" v-show="visibleSuggestions.length > 0">
          <div class="suggestion-header">
            <span class="section-title">Sugerencias</span>
            <span class="more-link hand" @click="toggleSuggestions">
              {{ showAllSuggestions ? 'Ver menos' : 'Ver más' }}
            </span>
          </div>
          <div class="suggestions-content thinScroll" :class="{ 'expanded': showAllSuggestions }">
            <div v-for="item in visibleSuggestions" :key="item.Id" class="suggestion-item hand" @click="onItemClick(item)">
              <div class="indicator-content">
                <div class="indicator-icon"><i :class="getIconClass(item.Icon)"></i></div>
                <div class="indicator-info">
                  <div class="indicator-name">{{ item.Label || item.Name }}</div>
                  <div class="indicator-meta sourceInfo">{{ item.Provider || itemSubtitle(item, null) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tooltip data-driven -->
      <transition name="fade">
        <div
          v-if="tooltip.visible && tooltip.item && tooltip.item.Info"
          class="preview-tooltip"
          :style="{ top: tooltip.top + 'px', left: tooltip.left + 'px', position: 'fixed' }"
          @mouseenter="keepTooltip = true"
          @mouseleave="keepTooltip = false; hideTooltip()"
        >
          <div class="preview-header">
            <div class="preview-title">{{ tooltip.item.Info.Title || tooltip.item.Name }}</div>
          </div>
          <div v-for="(sec, i) in tooltip.item.Info.Sections" :key="i" class="preview-section">
            <div class="preview-label">{{ sec.Label }}</div>
            <div v-if="sec.Tags" class="year-tags">
              <span v-for="(t, ti) in sec.Tags" :key="ti" class="year-tag">{{ t }}</span>
            </div>
            <ul v-else-if="sec.List" :class="sec.List.length === 1 ? 'variablesSingle' : 'variables'">
              <li v-for="(v, vi) in sec.List" :key="vi">{{ v }}</li>
            </ul>
            <div v-else class="preview-value">{{ sec.Text }}</div>
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
    isOpen: { type: Boolean, default: false },
    // Punto de anclaje opcional { left, top } en coordenadas de viewport (p. ej.
    // el borde derecho del botón que abre el panel). Cuando se provee y no es
    // móvil, el panel se posiciona a la derecha de ese punto en vez de pegado al
    // borde izquierdo. El visor del mapa no lo usa, así que su layout no cambia.
    anchor: { type: Object, default: null },
    // Árbol nativo de GetFabIndicators / GetFabBoundaries. Cada nodo tiene
    // { Id, Name, Icon, Items }. La profundidad la determinan los datos:
    //   · Items diccionario { parent: hoja[] }        -> hojas agrupadas por separador
    //   · Items lista de nodos CON Items              -> sub-categorías navegables
    //   · Items lista de nodos SIN Items              -> hojas planas
    categories: { type: Array, default: () => [] },
    selection: { type: Array, default: () => [] },
    suggestions: { type: Array, default: () => [] },
    title: { type: String, default: 'Explorar indicadores' },
    rootLabel: { type: String, default: 'Categorías' },
    searchPlaceholder: { type: String, default: 'Buscar indicador o delimitación...' },
    itemNoun: { type: String, default: 'indicador' },
    itemNounPlural: { type: String, default: 'indicadores' },
    // Si está activo, el conteo de un nivel de hojas usa el nombre del propio
    // nodo en minúscula como sustantivo ("24 provincias", "539 municipios").
    nounFromNodeName: { type: Boolean, default: false },
    // Si está activo, los cortes de control de los NIVELES HOJA arrancan
    // expandidos (p. ej. los proveedores de indicadores). El listado unificado
    // de nivel 0 arranca colapsado igualmente.
    expandLeaves: { type: Boolean, default: false },
    multiSelect: { type: Boolean, default: false },
    allowMultiSelectToggle: { type: Boolean, default: true },
    showAddAll: { type: Boolean, default: false },
    addAllLabel: { type: String, default: 'Agregar todas' },
    // Si está activo, los nodos contenedores (ramas) muestran un checkbox que
    // selecciona o deselecciona todas sus hojas descendientes. Pensado para
    // delimitaciones (p. ej. marcar una provincia pinta sus departamentos).
    // No afecta la navegación: el checkbox no entra a la rama.
    selectableBranches: { type: Boolean, default: false },
    // Si está activo, los eventos select/deselect emiten como segundo argumento
    // el nodo contenedor actual (el "tipo", p. ej. la delimitación Departamentos),
    // necesario para resolver el boundary al que pertenecen las hojas.
    // El consumidor del mapa ignora este segundo argumento, así que no lo afecta.
    emitContainer: { type: Boolean, default: false },
    groupCategories: { type: Boolean, default: false },
    closeOnSelect: { type: Boolean, default: true },
  },
  data() {
    return {
      searchQuery: '',
      navStack: [],
      showAllSuggestions: false,
      keepTooltip: false,
      internalMulti: this.multiSelect,
      tooltip: { visible: false, top: 0, left: 0, item: null },
      viewMode: 'tree',   // 'tree' | 'list' (listado unificado de niveles 0 y 1)
      drillIntoElements: false,   // regiones: si está activo, clic en delimitación
                                  // entra a sus elementos; si no (default), agrega todos
      expanded: {},       // sectionKey -> true cuando el separador está expandido
                          // (en listado, por defecto expandido; en árbol, según expandLeaves)
      panelStyle: null,   // posición calculada cuando se ancla a un invocador
      searchRenderLimit: 50,    // máximo de filas de búsqueda a renderizar de entrada
      searchLimitLifted: false, // "Ver más": renderizar todas las coincidencias
    };
  },
  computed: {
    // El switch "Ver cada elemento de las delimitaciones al seleccionar" se ofrece
    // cuando hay delimitaciones a la vista: navegando boundaries reales (ramas que
    // llevan directo a hojas) o en resultados de búsqueda que incluyan alguna
    // delimitación. No aparece en la raíz (tipos de boundary) ni en hojas puras.
    showDrillToggle() {
      if (!this.selectableBranches) return false;
      if (this.searchQuery) {
        return this.filteredBranches.some(this.isDelimitation);
      }
      if (!this.navStack.length) return false;
      var branches = this.currentBranches;
      if (!branches.length) return false;
      return branches.every(this.isDelimitation);
    },
    isMobile() {
      return window.SegMap && window.SegMap.Configuration && window.SegMap.Configuration.IsMobile;
    },
    isMulti() { return this.internalMulti; },
    selectedIds() { return new Set(this.selection.map(s => s.Id)); },
    visibleSuggestions() {
      return this.showAllSuggestions ? this.suggestions : this.suggestions.slice(0, 3);
    },
    currentNode() {
      return this.navStack.length ? this.navStack[this.navStack.length - 1] : null;
    },
    // Contenido del nivel actual: ramas (navegables) o secciones de hojas.
    currentContent() {
      if (!this.currentNode) {
        return { branches: this.categories, sections: [] };
      }
      return this.contentOf(this.currentNode);
    },
    currentBranches() { return this.currentContent.branches; },
    currentSections() { return this.currentContent.sections; },
    groupedBranches() {
      const groups = [];
      const index = new Map();
      for (const br of this.currentBranches) {
        const key = br.Group || '';
        if (!index.has(key)) {
          const g = { Name: br.Group || '', Branches: [] };
          index.set(key, g);
          groups.push(g);
        }
        index.get(key).Branches.push(br);
      }
      return groups;
    },
    currentLeafItems() {
      const out = [];
      for (const section of this.currentSections) {
        for (const item of section.Items) out.push(item);
      }
      return out;
    },
    // Todas las hojas bajo el nodo actual (o todo el árbol en la raíz), con su
    // contenedor directo (el "tipo") para subtítulo e ícono en la búsqueda.
    searchScope() {
      const out = [];
      this.collectLeaves(this.currentNode ? [this.currentNode] : this.categories, out);
      return out;
    },
    filteredItems() {
      const raw = this.searchQuery.trim();
      const term = this.normalize(raw);
      if (!term) return [];
      // Coincide por nombre (parcial) o por código (exacto): si el término escrito
      // es idéntico al Code del ítem, también se incluye. El match de código es
      // completo, no parcial, para no traer ruido al teclear dígitos.
      const matches = this.searchScope.filter(e => {
        const byName = this.normalize(e.item.Name || '').includes(term);
        const code = e.item.Code != null ? String(e.item.Code) : '';
        const byCode = code !== '' && code === raw;
        return byName || byCode;
      });
      // Un mismo indicador puede figurar en varias categorías (p. ej. "más usados"
      // y los propios del usuario), por lo que el ámbito de búsqueda lo trae
      // repetido. Se deduplica por Id conservando la primera aparición.
      const seen = Object.create(null);
      const out = [];
      for (const e of matches) {
        const id = e.item && e.item.Id != null ? e.item.Id : null;
        if (id != null) {
          if (seen[id]) continue;
          seen[id] = true;
        }
        out.push(e);
      }
      return out;
    },
    // Todas las ramas (nodos contenedores navegables) bajo el ámbito actual, con
    // su padre, para poder entrar en ellas desde la búsqueda.
    branchScope() {
      const out = [];
      this.collectBranches(this.currentNode ? [this.currentNode] : this.categories, null, out);
      return out;
    },
    // Ramas cuyo nombre coincide con la búsqueda (p. ej. "Departamentos" al
    // buscar "departamento"): se ofrecen primero para entrar y ver sus hojas.
    filteredBranches() {
      const term = this.normalize(this.searchQuery.trim());
      if (!term) return [];
      const matches = this.branchScope.filter(e => this.normalize(e.branch.Name || '').includes(term));
      // Los agrupadores de mayor jerarquía (menor profundidad) aparecen primero,
      // para poder entrar al contenedor amplio antes que a sus sub-ramas.
      return matches.slice().sort((a, b) => (a.depth || 0) - (b.depth || 0));
    },
    listModeActive() {
      return this.viewMode === 'list' && !this.navStack.length;
    },
    // Se está mostrando el grid de tarjetas (cuadrados) en modo árbol.
    showingCards() {
      return !this.searchQuery && !this.listModeActive && this.currentBranches.length > 0;
    },
    renderRows() {
      if (this.searchQuery) {
        const branchRows = this.filteredBranches.map(e => ({
          type: 'branch',
          branch: e.branch,
          parent: e.parent,
          key: 'sb|' + this.containerKey(e.branch),
        }));
        const itemRows = this.filteredItems.map(e => ({
          type: 'item',
          item: e.item,
          container: e.container,
          key: this.containerKey(e.container) + '|' + e.item.Id,
        }));
        // Las ramas coincidentes (contenedores) van primero, para entrar en ellas.
        const all = branchRows.concat(itemRows);
        // Con búsquedas de pocos caracteres el match puede ser de miles de filas;
        // el filtrado es barato pero renderizarlas todas no. Se muestran las
        // primeras y se ofrece "Ver más" para renderizar el resto a pedido.
        if (!this.searchLimitLifted && all.length > this.searchRenderLimit) {
          const shown = all.slice(0, this.searchRenderLimit);
          shown.push({ type: 'more', key: '__more__', remaining: all.length - this.searchRenderLimit });
          return shown;
        }
        return all;
      }
      const rows = [];
      if (this.listModeActive) {
        // Listado unificado: nivel 0 como corte de control colapsable; debajo,
        // el nivel 1 (hojas seleccionables, o ramas navegables si son tipos).
        for (const cat of this.categories) {
          const sKey = 'cat_' + this.containerKey(cat);
          const content = this.contentOf(cat);
          rows.push({ type: 'header', key: 'h_' + sKey, sectionKey: sKey, name: cat.Name, count: this.branchLabel(cat), selectable: false });
          if (this.isCollapsed(sKey)) continue;
          if (content.branches.length) {
            for (const br of content.branches) {
              rows.push({ type: 'branch', key: sKey + '|b' + this.containerKey(br), branch: br, parent: cat });
            }
          } else {
            for (const section of content.sections) {
              for (const item of section.Items) {
                rows.push({ type: 'item', item, container: cat, key: sKey + '|' + item.Id });
              }
            }
          }
        }
        return rows;
      }
      for (const section of this.currentSections) {
        if (section.Name) {
          rows.push({ type: 'header', key: 'h_' + section.Key, sectionKey: section.Key, name: section.Name, count: null, selectable: true, items: section.Items });
          if (this.isCollapsed(section.Key)) continue;
        }
        for (const item of section.Items) {
          rows.push({ type: 'item', item, container: this.currentNode, key: section.Key + '|' + item.Id });
        }
      }
      return rows;
    },
    // Claves de los separadores visibles (para "Colapsar todos").
    visibleHeaderKeys() {
      if (this.searchQuery) return [];
      if (this.listModeActive) return this.categories.map(c => 'cat_' + this.containerKey(c));
      return this.currentSections.filter(s => s.Name).map(s => s.Key);
    },
    hasHeaders() { return this.visibleHeaderKeys.length > 0; },
    allCollapsed() {
      return this.hasHeaders && this.visibleHeaderKeys.every(k => this.isCollapsed(k));
    },
    // Hay hojas chequeables a la vista (ignora el colapso): habilita el modo múltiple.
    hasSelectableRows() {
      if (this.searchQuery) return true;
      if (this.listModeActive) {
        return this.categories.some(c => !this.contentOf(c).branches.length);
      }
      return this.currentSections.some(s => s.Items.length > 0);
    },
    dynamicPlaceholder() {
      return this.currentNode
        ? ('Buscar en ' + this.currentNode.Name.toLowerCase() + '...')
        : this.searchPlaceholder;
    },
  },
  watch: {
    isOpen(val) {
      if (val) {
        this.$nextTick(() => {
          if (this.$refs.searchInput) this.$refs.searchInput.focus();
          this.positionPanel();
        });
      } else {
        // Al cerrarse, el panel se oculta pero conserva su estado de navegación
        // (rama, listado, búsqueda), para reabrir donde estaba. La navegación se
        // reinicia con las acciones explícitas (inicio/breadcrumb), no al cerrar.
        this.panelStyle = null;
        this.hideTooltip();
        this.keepTooltip = false;
      }
    },
    multiSelect(val) { this.internalMulti = val; },
    // Cada cambio de texto vuelve a acotar el render de resultados (el "Ver más"
    // se reinicia): así escribir un carácter más no arrastra miles de filas.
    searchQuery() { this.searchLimitLifted = false; },
  },
  methods: {
    // Posiciona el panel a la derecha del invocador y centrado verticalmente en
    // él (mitad arriba, mitad abajo), sin pasar el borde superior ni inferior.
    positionPanel() {
      if (!this.anchor || this.isMobile) { this.panelStyle = null; return; }
      var panel = this.$refs.floatingPanel;
      if (!panel) return;
      var rect = panel.getBoundingClientRect();
      var width = rect.width || 420;
      var height = rect.height || 0;
      var gap = 8;
      var margin = 8;
      var left = this.anchor.left + gap;
      if (left + width > window.innerWidth) {
        left = Math.max(margin, window.innerWidth - width - margin);
      }
      var top = this.anchor.centerY - height / 2;
      var maxTop = Math.max(margin, window.innerHeight - height - margin);
      top = Math.min(Math.max(margin, top), maxTop);
      this.panelStyle = { left: left + 'px', top: top + 'px', bottom: 'auto', margin: '0' };
    },
    // Clasifica el contenido de un nodo en ramas u hojas.
    contentOf(node) {
      const items = node.Items;
      if (Array.isArray(items)) {
        if (items.length && items[0] && items[0].Items !== undefined) {
          return { branches: items, sections: [] }; // sub-categorías navegables
        }
        return { branches: [], sections: [{ Key: '_all', Name: '', Parent: null, Items: items }] };
      }
      if (items && typeof items === 'object') {
        const sections = Object.keys(items).map(parent => ({
          Key: parent, Name: parent, Parent: parent, Items: items[parent],
        }));
        return { branches: [], sections };
      }
      return { branches: [], sections: [] };
    },
    // Recolecta hojas recursivamente; container = nodo "tipo" que las contiene.
    collectLeaves(nodes, out) {
      for (const node of nodes) {
        const content = this.contentOf(node);
        if (content.branches.length) {
          this.collectLeaves(content.branches, out);
        } else {
          for (const section of content.sections) {
            for (const item of section.Items) out.push({ item, container: node });
          }
        }
      }
    },
    // Recolecta ramas (nodos navegables) con su padre, para la búsqueda.
    collectBranches(nodes, parent, out, depth) {
      depth = depth || 0;
      for (const node of nodes) {
        const content = this.contentOf(node);
        const hasBranches = content.branches.length > 0;
        const hasLeaves = content.sections.some(s => s.Items && s.Items.length);
        // Un nodo es navegable si contiene algo: sub-ramas u hojas. Incluye tanto
        // los agrupadores mayores (p. ej. "Límites políticos", que agrupa
        // delimitaciones) como los contenedores de hojas (p. ej. "Departamentos").
        if (hasBranches || hasLeaves) {
          out.push({ branch: node, parent: parent, depth: depth });
        }
        if (hasBranches) {
          this.collectBranches(content.branches, node, out, depth + 1);
        }
      }
    },
    // Cantidad de hijos directos: sub-categorías si es una rama, hojas si es un
    // nivel de hojas (planas o agrupadas por separador). No desciende a través
    // de las ramas. Las ramas cuentan con el sustantivo genérico ("2 delimitaciones");
    // los niveles de hojas, con el nombre del propio nodo si nounFromNodeName
    // ("24 provincias") o con el genérico si no.
    branchLabel(node) {
      const content = this.contentOf(node);
      if (content.branches.length) {
        const n = content.branches.length;
        return n + ' ' + (n === 1 ? this.itemNoun : this.itemNounPlural);
      }
      const n = content.sections.reduce((a, s) => a + s.Items.length, 0);
      if (this.nounFromNodeName && node.Name) {
        return n + ' ' + node.Name.toLowerCase();
      }
      return n + ' ' + (n === 1 ? this.itemNoun : this.itemNounPlural);
    },
    containerKey(container) {
      if (!container) return '';
      return container.Id != null ? container.Id : (container.Name || '');
    },
    closePanel() { this.$emit('close'); },
    onEscape() { if (this.isMulti) this.toggleMultiSelect(); else this.closePanel(); },
    toggleMultiSelect() {
      this.internalMulti = !this.internalMulti;
      this.$emit('update:multiSelect', this.internalMulti);
    },
    goHome() {
      this.navStack = [];
      this.searchQuery = '';
      // En la raíz, si no hay hojas chequeables, el modo múltiple no aplica.
      // (Antes esto lo hacía un watcher reactivo, que se disparaba con cualquier
      // transición —incluido limpiar la búsqueda— y apagaba el multi sin querer.)
      if (this.internalMulti && !this.hasSelectableRows) {
        this.internalMulti = false;
        this.$emit('update:multiSelect', false);
      }
    },
    goToDepth(depth) {
      this.navStack = this.navStack.slice(0, depth + 1);
      this.searchQuery = '';
    },
    // Repite la búsqueda actual desde la raíz, descartando la subruta. Útil cuando
    // el usuario buscó dentro de una rama (p. ej. "Regiones físicas") sin darse
    // cuenta y no hubo resultados: el término se conserva y el ámbito se amplía.
    searchFromRoot() {
      this.navStack = [];
    },
    // Una delimitación es una rama cuyos hijos son elementos (hojas), no más
    // sub-ramas. Distingue boundaries reales (Provincias, Municipios) de los
    // agrupadores de tipo (Límites políticos) y de las hojas sueltas.
    isDelimitation(node) {
      var content = this.contentOf(node);
      return content.branches.length === 0 && content.sections.some(function (s) {
        return s.Items && s.Items.length;
      });
    },
    enterBranch(node) {
      // Regiones: si "ver cada elemento" está inactivo (default), clic en una
      // delimitación agrega todos sus elementos en vez de entrar a navegarla.
      // Si está activo, se navega. Solo aplica a delimitaciones (no a grupos de
      // tipo ni a hojas).
      if (this.selectableBranches && !this.drillIntoElements && this.isDelimitation(node)) {
        this.$emit('select-group', node);
        if (!this.isMulti && this.closeOnSelect) this.closePanel();
        return;
      }
      this.navStack = this.navStack.concat(node);
      this.searchQuery = '';
      this.$nextTick(() => {
        const body = this.$el.querySelector('.panel-body');
        if (body) body.scrollTop = 0;
      });
    },
    // ── Selección ────────────────────────────────────────────────────────────
    isSelected(item) { return this.selectedIds.has(item.Id); },
    // Estado del check de un corte de control sobre su conjunto de hojas.
    leavesSelectionState(leaves) {
      if (!leaves || !leaves.length) return 'none';
      let selected = 0;
      for (const leaf of leaves) if (this.selectedIds.has(leaf.Id)) selected++;
      if (selected === 0) return 'none';
      if (selected === leaves.length) return 'all';
      return 'some';
    },
    // Pinta/despinta todas las hojas del corte de control.
    toggleLeavesSelection(leaves, container) {
      if (!leaves || !leaves.length) return;
      if (this.leavesSelectionState(leaves) === 'all') {
        this.emitDeselect(leaves, container);
      } else {
        const toAdd = leaves.filter(leaf => !this.selectedIds.has(leaf.Id));
        this.emitSelect(toAdd.length ? toAdd : leaves, container);
      }
    },
    // Agrega todas las hojas de un corte de control a la tabla (sin alternar):
    // usado por el ícono de capa cuando la multiselección está desactivada.
    addLeaves(leaves, container) {
      if (!leaves || !leaves.length) return;
      this.emitSelect(leaves, container);
      if (!this.isMulti && this.closeOnSelect) this.closePanel();
    },
    // Emisión con o sin contenedor según emitContainer.
    emitSelect(items, container) {
      if (this.emitContainer) this.$emit('select', items, container);
      else this.$emit('select', items);
    },
    emitDeselect(items, container) {
      if (this.emitContainer) this.$emit('deselect', items, container);
      else this.$emit('deselect', items);
    },
    onItemClick(item, container) {
      if (this.isMulti) {
        if (this.isSelected(item)) this.emitDeselect([item], container);
        else this.emitSelect([item], container);
      } else {
        this.emitSelect([item], container);
        if (this.closeOnSelect) this.closePanel();
      }
    },
    removeChip(chip) { this.emitDeselect([chip.Item || chip], chip.Container || null); },
    clearSelection() {
      if (!this.selection.length) return;
      this.emitDeselect(this.selection.map(c => c.Item || c), null);
    },
    clearSearch() {
      this.searchQuery = '';
      this.$nextTick(() => { if (this.$refs.searchInput) this.$refs.searchInput.focus(); });
    },
    liftSearchLimit() { this.searchLimitLifted = true; },
    // "Ver todas en el mapa": agrega el nivel actual como entidad (capa). No marca
    // hojas; emite el nodo contenedor para que el consumidor use su Id.
    onSelectGroup() {
      if (!this.currentNode) return;
      this.$emit('select-group', this.currentNode);
      if (!this.isMulti && this.closeOnSelect) this.closePanel();
    },
    // ── Colapso y vista ──────────────────────────────────────────────────────────
    // Colapsado salvo decisión explícita del usuario; el default depende del
    // contexto: el listado unificado siempre arranca colapsado, los niveles hoja
    // según expandLeaves.
    isCollapsed(key) {
      if (key in this.expanded) return !this.expanded[key];
      if (this.listModeActive) return false;
      return !this.expandLeaves;
    },
    toggleCollapse(key) { this.$set(this.expanded, key, this.isCollapsed(key)); },
    toggleCollapseAll() {
      const expand = this.allCollapsed;
      for (const key of this.visibleHeaderKeys) this.$set(this.expanded, key, expand);
    },
    toggleViewMode() {
      if (this.navStack.length) {
        // Desde un nivel interior, el botón lleva a la raíz en modo listado.
        this.navStack = [];
        this.searchQuery = '';
        this.viewMode = 'list';
        this.expanded = {};
        return;
      }
      this.viewMode = this.viewMode === 'tree' ? 'list' : 'tree';
      // Al entrar a listado, todos los tipos arrancan expandidos (se descartan
      // los colapsos manuales de una visita anterior).
      if (this.viewMode === 'list') this.expanded = {};
    },
    // Desde el listado unificado, entrar a un tipo apila ambos niveles
    // para que el breadcrumb refleje la ruta completa.
    enterListBranch(parent, branch) {
      // Misma lógica invertida que enterBranch: inactivo (default) agrega todos
      // los elementos de la delimitación; activo, entra a navegarla.
      if (this.selectableBranches && !this.drillIntoElements && this.isDelimitation(branch)) {
        this.$emit('select-group', branch);
        if (!this.isMulti && this.closeOnSelect) this.closePanel();
        return;
      }
      // Desde el listado, parent y branch forman la pila de dos niveles.
      // Desde la búsqueda, parent puede ser null (rama en la raíz): solo la rama.
      this.navStack = parent ? [parent, branch] : [branch];
      this.searchQuery = '';
      this.$nextTick(() => {
        const body = this.$el.querySelector('.panel-body');
        if (body) body.scrollTop = 0;
      });
    },
    // Comparación de búsqueda insensible a mayúsculas y tildes.
    normalize(s) {
      return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },
    // ── Display ────────────────────────────────────────────────────────────────
    itemIcon(item, container) {
      return this.getIconClass(item.Icon || (container ? container.Icon : null));
    },
    // Subtítulo: Subtitle si lo provee el backend; años (indicadores) o
    // "Parent > Tipo" (regiones; Tipo = nombre del contenedor directo).
    itemSubtitle(item, container) {
      if (item.Subtitle != null) return item.Subtitle;
      if (item.Versions && item.Versions.length) return item.Versions.map(v => v.Name).join(', ');
      if (item.Parent) return item.Parent + (container && container.Name ? ' > ' + container.Name : '');
      return '';
    },
    hasInfo(item) { return !!item.Info; },
    // Los íconos llegan como clases FontAwesome desde la base; sin traducción.
    getIconClass(icon) {
      return (icon && icon.indexOf('fa') === 0) ? icon : 'fas fa-map-pin';
    },
    // ── Tooltip ────────────────────────────────────────────────────────────────
    showTooltip(event, item) {
      if (this.keepTooltip) return;
      if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }
      const rect = event.target.getBoundingClientRect();
      const tooltipWidth = 420;
      let left = rect.right + 10;
      if (left + tooltipWidth > window.innerWidth) left = rect.left - tooltipWidth - 10;
      this.tooltip = { visible: true, top: rect.top, left, item };
      this.$nextTick(() => {
        const el = this.$el.querySelector('.preview-tooltip');
        if (!el) return;
        let top = rect.top;
        if (top + el.offsetHeight > window.innerHeight - 12) top = window.innerHeight - el.offsetHeight - 12;
        if (top < 8) top = 8;
        this.tooltip = { ...this.tooltip, top };
      });
    },
    hideTooltip() {
      this._hideTimer = setTimeout(() => {
        if (!this.keepTooltip) this.tooltip.visible = false;
        this._hideTimer = null;
      }, 120);
    },
    toggleSuggestions() { this.showAllSuggestions = !this.showAllSuggestions; },
    preventDefault(e) { e.preventDefault(); e.stopPropagation(); },
  },
};
</script>

<style scoped>
/* Animación de entrada/salida */
.slide-fade-enter-active { transition: all 0.3s ease; }
.slide-fade-leave-active { transition: all 0.25s ease; }
.slide-fade-enter, .slide-fade-leave-to { opacity: 0; }
.slide-fade-enter .floating-panel,
.slide-fade-leave-to .floating-panel { transform: translateX(-100%) translateY(-50%); }

/* Panel flotante */
.floating-panel {
  position: absolute;
  left: 92px; top: 0; bottom: 0;
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

/* Encabezado */
.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
}
.panel-title { margin: 0; font-size: 18px; color: #333; }
.panel-header-actions { display: flex; align-items: center; gap: 4px; }

.btn-tool {
  background: none; border: none; cursor: pointer;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #999; font-size: 15px; transition: all 0.2s;
}
.btn-tool:hover:not(:disabled) { background: #f0f0f0; color: #666; }
.btn-tool.active { background: #e3f2fd; color: #2196F3; }
.btn-tool:disabled { color: #d5d5d5; cursor: default; }

.btn-close {
  background: none; border: none; font-size: 28px; line-height: 1;
  color: #999; cursor: pointer; padding: 0;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px; transition: all 0.2s;
}
.btn-close:hover { background: #f0f0f0; color: #666; }

/* Breadcrumb */
.breadcrumb-nav {
  padding: 8px 24px; background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 14px; flex-shrink: 0; line-height: 2em;
}
.breadcrumb-item { color: #666; transition: color 0.2s; }
.breadcrumb-item:not(.active) { cursor: pointer; }
.breadcrumb-item:not(.active):hover { color: #333; text-decoration: underline; }
.breadcrumb-item.active { color: #333; font-weight: 500; }
.breadcrumb-sep { margin: 0 8px; color: #ccc; }
.btn-breadcrumb-clear {
  background: none; border: none; color: #999; float: right;
  font-size: 24px; line-height: 1; padding: 0 0 0 6px;
  cursor: pointer; vertical-align: middle; transition: color 0.2s;
}
.btn-breadcrumb-clear:hover { color: #333; }

/* Zona fija (chips + buscador), no scrollea */
.panel-fixed { flex-shrink: 0; padding: 20px 24px 0 24px; }

/* Cuerpo */
.panel-body { flex: 1; overflow-y: auto; padding: 4px 24px 20px 24px; min-height: 150px; }
.panel-body.thinScroll::-webkit-scrollbar { width: 6px; }
.panel-body.thinScroll::-webkit-scrollbar-track { background: #f1f1f1; }
.panel-body.thinScroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
.panel-body.thinScroll::-webkit-scrollbar-thumb:hover { background: #999; }

/* Chips */
.chips-zone {
  position: relative;
  margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #e0e0e0;
}
.chips-clear {
  position: absolute; top: 1px; right: 0;
  background: none; border: none; color: #999; cursor: pointer;
  width: 24px; height: 24px; border-radius: 50%;
  font-size: 18px; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; z-index: 1;
}
.chips-clear:hover { background: #f0f0f0; color: #666; }
.chips-scroll {
  display: flex; flex-wrap: wrap; gap: 6px;
  max-height: 96px; overflow-y: auto; /* ~3 renglones, luego scroll */
  padding-right: 28px; /* lugar para la cruz */
}
.chips-scroll::-webkit-scrollbar { width: 6px; }
.chips-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
.chips-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: #e3f2fd; color: #1565c0;
  border-radius: 14px; padding: 4px 6px 4px 12px; font-size: 13px; max-width: 100%;
}
.chip-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
.chip-remove {
  background: rgba(21, 101, 192, 0.12); border: none; color: #1565c0; cursor: pointer;
  width: 18px; height: 18px; border-radius: 50%; font-size: 14px; line-height: 1;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s;
}
.chip-remove:hover { background: rgba(21, 101, 192, 0.28); }

/* Búsqueda */
.search-container { position: relative; margin-bottom: 20px; }
.search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: #999; font-size: 16px; pointer-events: none;
}
.search-input {
  width: 100%; padding: 12px 38px 12px 42px;
  border: 1px solid #e0e0e0; border-radius: 8px; font-size: 15px; outline: none; transition: all 0.2s;
}
.search-input:focus { border-color: #2196F3; box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1); }
.search-clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #999; cursor: pointer;
  width: 24px; height: 24px; border-radius: 50%; font-size: 20px; line-height: 1;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.search-clear:hover { background: #f0f0f0; color: #666; }

/* Grid de categorías */
.categories-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 8px; }
.category-card {
  padding: 14px 10px; border: 1px solid #e0e0e0; border-radius: 4px;
  text-align: center; transition: all 0.2s; background: white;
}
.category-card:hover {
  border-color: #2196F3; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15); transform: translateY(-2px);
}
.category-card.featured { background: linear-gradient(135deg, #c3c3c3 0%, #818181 100%); color: white; border: none; }
.category-card.featured .category-name { color: white; }
.category-card.featured .category-count { color: rgba(255, 255, 255, 0.8); }
.category-icon { font-size: 32px; text-shadow: 2px 2px 4px rgb(223 216 220 / 50%); color: #0fa7d8; display: block; margin-bottom: 12px; }
.category-icon.featured { text-shadow: none; color: #69bad5; }
.category-name { font-size: 15px; color: #333; margin-bottom: 4px; line-height: 1.3; font-weight: 500; }
.category-count { font-size: 13px; color: #999; padding-top: 2px; line-height: 1.3; }

.add-all-bar { padding: 8px 14px; border-top: 1px solid #eee; background: #fafafa; flex: 0 0 auto; }
.add-all-bar .sw-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #455a64; cursor: pointer; user-select: none; }
.add-all-bar .sw-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
.add-all-bar .sw-track { position: relative; width: 32px; height: 17px; background: #cfd8dc; border-radius: 9px; transition: background 0.15s; flex: 0 0 auto; }
.add-all-bar .sw-thumb { position: absolute; top: 2px; left: 2px; width: 13px; height: 13px; background: #fff; border-radius: 50%; transition: transform 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.25); }
.add-all-bar .sw-toggle input:checked + .sw-track { background: #1976d2; }
.add-all-bar .sw-toggle input:checked + .sw-track .sw-thumb { transform: translateX(15px); }

/* Separadores / encabezados de sección (colapsables) */
.source-header {
  font-size: 13px; font-weight: 700; color: #999;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin: 12px 0 8px 0; padding: 4px; border-bottom: 1px solid #e9ecef;
  display: flex; align-items: center; gap: 8px;
  border-radius: 4px 4px 0 0; transition: background 0.15s;
}
.source-header:first-child { margin-top: 0; }
.source-header.hand:hover { background: #f5f5f5; color: #777; }
.source-header-text { flex: 1; }
.source-header-count { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 12px; }
.source-header-caret { width: 14px; text-align: center; font-size: 13px; }
.source-header-addall {
  color: #1976d2;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
  border-radius: 4px;
}
.source-header-addall:hover { background: #e3f2fd; }

/* Items */
.indicator-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px; border-radius: 6px; transition: background-color 0.2s; margin-bottom: 2px;
}
.indicator-item:hover { background-color: #eee; }
.indicator-item.is-selected { background-color: #e3f2fd; }
.indicator-item.is-selected:hover { background-color: #d6ebfc; }
.indicator-item.add-all { background-color: #f1f1f1; }
.indicator-item.add-all:hover { background-color: #e8e8e8; }

.indicator-content { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.indicator-icon {
  text-shadow: 2px 2px 1px rgb(223 216 220 / 50%);
  color: #0fa7d8; font-size: 20px; width: 24px; text-align: center; flex-shrink: 0;
}
.indicator-info { flex: 1; min-width: 0; }
.indicator-name { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 2px; line-height: 1.3; }
.indicator-meta { font-size: 12px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.indicator-actions { display: flex; gap: 6px; margin-left: 8px; }

/* Checkbox */
.selcheck {
  flex-shrink: 0; width: 18px; height: 18px;
  border: 2px solid #bdbdbd; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: white; transition: all 0.15s; margin-right: 4px;
}
.selcheck.checked { background: #2196F3; border-color: #2196F3; }
.selcheck.partial { background: #2196F3; border-color: #2196F3; }
.indicator-item.is-selected .selcheck:not(.checked) { border-color: #2196F3; }


.btn-preview {
  width: 28px; height: 28px; padding: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; border-radius: 4px; border: none;
  background: transparent; color: #999; transition: all 0.2s;
}
.btn-preview:hover { background: #e9ecef; color: #666; }

.no-results { text-align: center; color: #999; padding: 40px 16px; font-style: italic; font-size: 15px; }
.no-results-broaden { margin-top: 12px; font-style: normal; }
.no-results-link { color: #2196F3; font-size: 14px; cursor: pointer; text-decoration: underline; }
.no-results-link:hover { color: #1976D2; }
.search-more { text-align: center; color: #1976d2; padding: 12px 16px; font-size: 13px; cursor: pointer; border-top: 1px solid #eee; }
.search-more:hover { background: #f5f9ff; }

/* Sugerencias */
.suggestions-zone {
  border-top: 1px solid #e9ecef; background: #f8f9fa;
  flex-shrink: 0; transition: all 0.3s ease; max-height: 110px;
  display: flex; flex-direction: column;
}
.suggestions-zone.expanded { max-height: 230px; }
.suggestion-header {
  padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e0e0e0;
}
.more-link { color: #2196F3; font-size: 13px; font-weight: 500; transition: color 0.2s; }
.more-link:hover { color: #1976D2; text-decoration: underline; }
.suggestions-content { flex: 1; overflow-y: hidden; padding: 8px 24px 12px 24px; max-height: 150px; }
.suggestions-content.expanded { overflow-y: auto; max-height: 245px; }
.suggestions-content.thinScroll::-webkit-scrollbar { width: 6px; }
.suggestions-content.thinScroll::-webkit-scrollbar-track { background: #f1f1f1; }
.suggestions-content.thinScroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
.suggestion-item {
  display: flex; align-items: center; padding: 8px 12px; border-radius: 6px; transition: background-color 0.2s; margin-bottom: 4px;
}
.suggestion-item:hover { background-color: #e9ecef; }

/* Tooltip */
.preview-tooltip {
  position: fixed; background: #333; color: white;
  border-radius: 8px; padding: 12px; width: 420px;
  z-index: 1060; box-shadow: 0 4px 10px rgba(60,64,67,.28); pointer-events: auto;
}
.preview-header {
  display: flex; gap: 12px; align-items: center;
  border-bottom: 1px solid #555; padding-bottom: 10px; margin-bottom: 12px;
}
.preview-title { font-size: 13px; text-transform: uppercase; line-height: 1.3; }
.preview-section { margin-bottom: 12px; }
.preview-section:last-child { margin-bottom: 0; }
.preview-label { font-size: 11px; text-transform: uppercase; color: #aaa; margin-bottom: 4px; letter-spacing: 0.5px; }
.preview-value { font-size: 14px; color: #e9e9e9; line-height: 1.4; }
.variablesSingle { padding-left: 0; list-style: none; }
.variables { padding-left: 20px; }
.year-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.year-tag { background: rgba(255, 255, 255, 0.15); padding: 4px 10px; border-radius: 4px; font-size: 12px; color: #e9e9e9; }

/* Fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter, .fade-leave-to { opacity: 0; }

/* Utilidades */
.hand { cursor: pointer; }
.sourceInfo { color: #999; }

@media (prefers-reduced-motion: reduce) {
  .slide-fade-enter-active, .slide-fade-leave-active,
  .category-card, .indicator-item, .selcheck { transition: none; }
  .category-card:hover { transform: none; }
}

@media (max-width: 768px) {
  .floating-panel {
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%; max-width: 100%; max-height: 100%; border-radius: 0; transform: none;
  }
  .slide-fade-enter .floating-panel,
  .slide-fade-leave-to .floating-panel { transform: translateY(100%); }
  .categories-grid { grid-template-columns: 1fr; }
  .preview-tooltip {
    left: 50% !important; top: 50% !important; transform: translate(-50%, -50%);
    width: calc(100% - 40px); max-width: 320px;
  }
}
</style>
