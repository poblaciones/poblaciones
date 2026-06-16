<template>
  <transition name="slide-fade">
    <div class="indicator-selector-wrapper sidepanelOffset" v-if="isOpen" v-on-clickaway="closePanel">
      <div class="work-offsetY floating-panel panel card">
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
              <div v-for="chip in selection" :key="chip.Id" class="chip" :title="chip.Description">
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
            <div v-if="searchQuery && !filteredItems.length" class="no-results">
              No se encontraron resultados para "{{ searchQuery }}"
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
                <span class="source-header-text">{{ row.name }}</span>
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

              <!-- Fila de hoja (única en todo el template) -->
              <div
                v-else
                :key="row.key"
                class="indicator-item hand"
                :class="{ 'is-selected': isSelected(row.item) }"
                @click="onItemClick(row.item)"
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
            </template>
          </div>
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
      expanded: {},       // sectionKey -> true cuando el separador está expandido
                          // (por defecto, todo corte de control arranca colapsado)
    };
  },
  computed: {
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
      const term = this.normalize(this.searchQuery.trim());
      if (!term) return [];
      return this.searchScope.filter(e => this.normalize(e.item.Name || '').includes(term));
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
        return this.filteredItems.map(e => ({
          type: 'item',
          item: e.item,
          container: e.container,
          key: this.containerKey(e.container) + '|' + e.item.Id,
        }));
      }
      const rows = [];
      if (this.listModeActive) {
        // Listado unificado: nivel 0 como corte de control colapsable; debajo,
        // el nivel 1 (hojas seleccionables, o ramas navegables si son tipos).
        for (const cat of this.categories) {
          const sKey = 'cat_' + this.containerKey(cat);
          const content = this.contentOf(cat);
          rows.push({ type: 'header', key: 'h_' + sKey, sectionKey: sKey, name: cat.Name, count: this.branchLabel(cat) });
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
          rows.push({ type: 'header', key: 'h_' + section.Key, sectionKey: section.Key, name: section.Name, count: null });
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
        this.$nextTick(() => { if (this.$refs.searchInput) this.$refs.searchInput.focus(); });
      } else {
        this.hideTooltip();
        this.keepTooltip = false;
        setTimeout(() => {
          this.navStack = [];
          this.searchQuery = '';
          this.showAllSuggestions = false;
          this.expanded = {};
        }, 300);
      }
    },
    multiSelect(val) { this.internalMulti = val; },
    // Si el contexto deja de tener hojas chequeables (p. ej. volver del listado
    // al árbol en la raíz), el modo múltiple se apaga y su botón se oculta.
    hasSelectableRows(val) {
      if (!val && this.internalMulti) {
        this.internalMulti = false;
        this.$emit('update:multiSelect', false);
      }
    },
  },
  methods: {
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
    goHome() { this.navStack = []; this.searchQuery = ''; },
    goToDepth(depth) {
      this.navStack = this.navStack.slice(0, depth + 1);
      this.searchQuery = '';
    },
    enterBranch(node) {
      this.navStack = this.navStack.concat(node);
      this.searchQuery = '';
      this.$nextTick(() => {
        const body = this.$el.querySelector('.panel-body');
        if (body) body.scrollTop = 0;
      });
    },
    // ── Selección ────────────────────────────────────────────────────────────
    isSelected(item) { return this.selectedIds.has(item.Id); },
    onItemClick(item) {
      if (this.isMulti) {
        this.$emit(this.isSelected(item) ? 'deselect' : 'select', [item]);
      } else {
        this.$emit('select', [item]);
        if (this.closeOnSelect) this.closePanel();
      }
    },
    removeChip(chip) { this.$emit('deselect', [chip.Item || chip]); },
    clearSelection() {
      if (!this.selection.length) return;
      this.$emit('deselect', this.selection.map(c => c.Item || c));
    },
    clearSearch() {
      this.searchQuery = '';
      this.$nextTick(() => { if (this.$refs.searchInput) this.$refs.searchInput.focus(); });
    },
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
      if (this.listModeActive) return true;
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
        return;
      }
      this.viewMode = this.viewMode === 'tree' ? 'list' : 'tree';
    },
    // Desde el listado unificado, entrar a un tipo apila ambos niveles
    // para que el breadcrumb refleje la ruta completa.
    enterListBranch(parent, branch) {
      this.navStack = [parent, branch];
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
.category-count { font-size: 13px; color: #999; }

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

/* Items */
.indicator-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px; border-radius: 6px; transition: background-color 0.2s; margin-bottom: 2px;
}
.indicator-item:hover { background-color: #eee; }
.indicator-item.is-selected { background-color: #e3f2fd; }
.indicator-item.is-selected:hover { background-color: #d6ebfc; }
.indicator-item.add-all .indicator-icon { color: #2196F3; }
.indicator-item.add-all .indicator-name { font-weight: 600; color: #1565c0; }

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
.indicator-item.is-selected .selcheck:not(.checked) { border-color: #2196F3; }


.btn-preview {
  width: 28px; height: 28px; padding: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; border-radius: 4px; border: none;
  background: transparent; color: #999; transition: all 0.2s;
}
.btn-preview:hover { background: #e9ecef; color: #666; }

.no-results { text-align: center; color: #999; padding: 40px 16px; font-style: italic; font-size: 15px; }

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
