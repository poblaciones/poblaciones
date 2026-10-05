<template>
	<div class="bs-search" role="search" v-on-clickaway="close">
		<div class="bs-field" :aria-busy="loading.toString()">
			<i class="fas fa-search bs-field-icon" aria-hidden="true"></i>
			<input ref="input" class="bs-input" type="text" role="combobox" autocomplete="off" :value="query"
						 :placeholder="placeholder" aria-label="Buscar cartografías, datasets e indicadores" aria-autocomplete="list"
						 :aria-expanded="ariaExpanded" :aria-controls="listId" :aria-activedescendant="activeDescendantId"
						 @input="onInput" @focus="open" @click="open" @keydown.down.prevent="moveHighlight(1)"
						 @keydown.up.prevent="moveHighlight(-1)" @keydown.enter.prevent="selectHighlighted" @keydown.esc="close" />
			<i v-if="loading" class="fas fa-spinner fa-spin bs-spinner" aria-hidden="true"></i>
			<button v-if="hasQuery" type="button" class="bs-clear" aria-label="Borrar la búsqueda" @click="clear">
				<i class="fas fa-times" aria-hidden="true"></i>
			</button>
		</div>
		<div v-if="panelVisible" :id="listId" class="bs-panel" role="listbox" @mousedown.prevent>
			<template v-if="groups.length > 0">
				<div v-for="group in groups" :key="group.kind" class="bs-group" role="group" :aria-labelledby="groupId(group)">
					<div :id="groupId(group)" class="bs-group-title">
						<span>{{ group.title }}</span>
						<span v-if="group.truncated" class="bs-group-more">Hay más resultados</span>
					</div>
					<a v-for="item in group.items" :key="item.kind + '-' + item.id" :id="optionId(item)" role="option"
							 class="bs-item" :class="{ 'is-highlighted': isHighlighted(item) }" :href="item.href" tabindex="-1"
							 :aria-selected="isHighlighted(item).toString()" :title="itemTitle(item)" @click="onItemClick($event, item)"
							 @mousemove="highlight(item)">
						<i class="bs-item-icon" :class="group.icon" aria-hidden="true"></i>
						<span class="bs-item-text">
							<span class="bs-item-caption">{{ item.caption }}</span>
							<span v-if="item.context" class="bs-item-context">{{ item.context }}</span>
						</span>
						<span v-if="item.tag" class="bs-item-tag">{{ item.tag }}</span>
					</a>
				</div>
			</template>
			<div v-else-if="failed" class="bs-message" role="status">No se pudo completar la búsqueda. Intente nuevamente.</div>
			<div v-else class="bs-message" role="status">No hay resultados para «{{ query }}».</div>
		</div>
	</div>
</template>

<script>
import { mixin as clickaway } from 'vue-clickaway';

const GROUP_DEFINITIONS = [
	{ kind: 'cartography', title: 'Cartografías', icon: 'fas fa-map' },
	{ kind: 'dataset', title: 'Datasets', icon: 'fas fa-table' },
	{ kind: 'metric', title: 'Indicadores', icon: 'fas fa-chart-bar' }
];

/*
 * Buscador de la barra superior. Emite 'search' con el texto tipeado y 'select' con el resultado elegido,
 * y muestra lo que reciba en 'results' (null mantiene el panel cerrado). Con 'loading' muestra una ruedita en el
 * campo y deja los resultados anteriores hasta que lleguen los nuevos. El foco permanece en el campo:
 * la navegación por teclado sigue el patrón combobox con lista (flechas, Enter y Esc).
 * Cada resultado tiene la forma { id, kind: 'cartography' | 'dataset' | 'metric', caption, context, tag, href }.
 * 'truncatedKinds' lista los grupos que tienen más resultados que los mostrados.
 * Con 'href', el resultado es un enlace: un clic común emite 'select', pero con Ctrl, Cmd o Shift (o el botón
 * central) el navegador lo abre aparte, como cualquier enlace.
 */
export default {
	name: 'BackofficeSearch',
	mixins: [clickaway],
	props: {
		results: { type: Array, default: null },
		truncatedKinds: { type: Array, default: () => [] },
		loading: { type: Boolean, default: false },
		failed: { type: Boolean, default: false },
		placeholder: { type: String, default: 'Buscar cartografías, datasets o indicadores' }
	},
	data() {
		return {
			query: '',
			isOpen: false,
			highlightedIndex: -1
		};
	},
	computed: {
		hasQuery() {
			return this.query !== '';
		},
		// Mientras se espera una respuesta se conservan los resultados anteriores; si no hay nada que mostrar,
		// el panel permanece cerrado y la espera la indica la ruedita del campo.
		panelVisible() {
			var hasMessage = !this.loading && (this.failed || this.results !== null);
			return this.isOpen && (this.groups.length > 0 || hasMessage);
		},
		ariaExpanded() {
			return this.panelVisible.toString();
		},
		listId() {
			return 'bs-list-' + this._uid;
		},
		groups() {
			var groups = [];
			if (this.results === null) {
				return groups;
			}
			for (var definition of GROUP_DEFINITIONS) {
				var items = [];
				for (var result of this.results) {
					if (result.kind === definition.kind) {
						items.push(result);
					}
				}
				if (items.length > 0) {
					groups.push({
						kind: definition.kind,
						title: definition.title,
						icon: definition.icon,
						items: items,
						truncated: this.truncatedKinds.indexOf(definition.kind) >= 0
					});
				}
			}
			return groups;
		},
		flatItems() {
			var items = [];
			for (var group of this.groups) {
				for (var item of group.items) {
					items.push(item);
				}
			}
			return items;
		},
		activeDescendantId() {
			if (this.panelVisible && this.highlightedIndex >= 0 && this.highlightedIndex < this.flatItems.length) {
				return this.optionId(this.flatItems[this.highlightedIndex]);
			}
			return null;
		}
	},
	watch: {
		results() {
			this.highlightedIndex = -1;
		}
	},
	methods: {
		onInput(event) {
			this.query = event.target.value;
			this.isOpen = true;
			this.$emit('search', this.query);
		},
		open() {
			this.isOpen = true;
		},
		close() {
			this.isOpen = false;
		},
		clear() {
			this.query = '';
			this.$emit('search', this.query);
			this.$refs.input.focus();
		},
		select(item) {
			this.isOpen = false;
			this.$emit('select', item);
		},
		onItemClick(event, item) {
			var browserOpensLink = item.href && this.hasModifierKey(event);
			if (!browserOpensLink) {
				event.preventDefault();
				this.select(item);
			}
		},
		hasModifierKey(event) {
			return event.ctrlKey || event.metaKey || event.shiftKey;
		},
		groupId(group) {
			return 'bs-group-' + this._uid + '-' + group.kind;
		},
		optionId(item) {
			return 'bs-option-' + this._uid + '-' + item.kind + '-' + item.id;
		},
		itemTitle(item) {
			if (item.context) {
				return item.caption + ' — ' + item.context;
			}
			return item.caption;
		},
		isHighlighted(item) {
			return this.highlightedIndex >= 0 && this.flatItems[this.highlightedIndex] === item;
		},
		highlight(item) {
			this.highlightedIndex = this.flatItems.indexOf(item);
		},
		moveHighlight(step) {
			if (!this.panelVisible) {
				this.open();
			} else if (this.flatItems.length > 0) {
				var index = this.highlightedIndex + step;
				if (index < 0) {
					index = this.flatItems.length - 1;
				} else if (index >= this.flatItems.length) {
					index = 0;
				}
				this.highlightedIndex = index;
				this.$nextTick(this.scrollHighlightedIntoView);
			}
		},
		scrollHighlightedIntoView() {
			var row = this.$el.querySelector('.is-highlighted');
			if (row) {
				row.scrollIntoView({ block: 'nearest' });
			}
		},
		selectHighlighted() {
			if (this.panelVisible && this.flatItems.length > 0) {
				var index = this.highlightedIndex;
				if (index < 0) {
					index = 0;
				}
				this.select(this.flatItems[index]);
			}
		}
	}
};
</script>

<style scoped>
.bs-search {
	position: relative;
	width: 100%;
}

.bs-field {
	display: flex;
	align-items: center;
	height: 36px;
	padding: 0 6px 0 14px;
	border: 1px solid var(--mp-outline);
	border-radius: var(--mp-radius-pill);
	background: var(--mp-surface);
	transition: border-color var(--mp-transition), box-shadow var(--mp-transition);
}

.bs-field:focus-within {
	border-color: var(--mp-selection);
	box-shadow: 0 0 0 2px var(--mp-focus-ring);
}

.bs-field-icon {
	flex: 0 0 auto;
	margin-right: 10px;
	color: var(--mp-text-faint);
	font-size: 14px;
}

.bs-input {
	flex: 1 1 auto;
	min-width: 0;
	height: 100%;
	padding: 0;
	border: 0;
	outline: 0;
	background: transparent;
	color: var(--mp-text);
	font-family: inherit;
	font-size: 14px;
	-webkit-appearance: none;
	appearance: none;
}

.bs-input::placeholder {
	color: var(--mp-text-faint);
	opacity: 1;
}

.bs-spinner {
	flex: 0 0 auto;
	margin: 0 6px;
	color: var(--mp-selection);
	font-size: 14px;
}

.bs-clear {
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	padding: 0;
	border: 0;
	border-radius: 50%;
	background: transparent;
	color: var(--mp-text-muted);
	font-size: 12px;
	cursor: pointer;
}

.bs-clear:hover {
	background: var(--mp-hover);
}

/* Alineado a la izquierda del campo y más ancho que él cuando este es angosto, para que los títulos no queden recortados. */
.bs-panel {
	position: absolute;
	top: calc(100% + 6px);
	left: 0;
	width: max(100%, 500px);
	max-height: 420px;
	padding: 6px 0;
	border: 1px solid var(--mp-outline);
	border-radius: var(--mp-radius-md);
	background: var(--mp-surface);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
	overflow-y: auto;
}

.bs-message {
	padding: 12px 16px;
	color: var(--mp-text-muted);
	font-size: 14px;
}

.bs-group + .bs-group {
	margin-top: 4px;
	padding-top: 4px;
	border-top: 1px solid var(--mp-hover);
}

.bs-group-title {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	padding: 6px 16px 4px;
	color: var(--mp-text-faint);
	font-size: 12px;
	font-weight: 500;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.bs-group-more {
	font-size: 11.5px;
	letter-spacing: 0;
	text-transform: none;
}

.bs-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 16px;
	color: var(--mp-text);
	font-size: 14px;
	text-decoration: none;
	cursor: pointer;
}

.bs-item.is-highlighted {
	background: var(--mp-selected);
}

.bs-item-icon {
	flex: 0 0 20px;
	color: var(--mp-text-muted);
	font-size: 14px;
	text-align: center;
}

.bs-item-text {
	display: flex;
	flex: 1 1 auto;
	flex-direction: column;
	min-width: 0;
}

.bs-item-caption {
	color: var(--mp-text);
}

.bs-item-caption,
.bs-item-context {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.bs-item-context {
	color: var(--mp-text-faint);
	font-size: 12.5px;
}

.bs-item-tag {
	flex: 0 0 auto;
	padding: 1px 8px;
	border-radius: var(--mp-radius-pill);
	background: var(--mp-surface-muted);
	color: var(--mp-text-muted);
	font-size: 11.5px;
}
</style>
