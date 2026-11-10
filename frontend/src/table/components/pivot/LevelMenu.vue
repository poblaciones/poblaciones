<template>
	<div class="level-menu">
		<div v-if="level.IsRoot() && rootBoundaries.length > 1" class="lm-show"
				 @mouseenter="showRoots = true" @mouseleave="showRoots = false" @click="showRoots = true">
			<span>Mostrar</span>
			<span class="lm-show-arrow">›</span>
			<div v-if="showRoots" class="lm-flyout">
				<div v-for="boundary in rootBoundaries" :key="'root-' + boundary.Id"
						 class="lm-flyout-option" @click.stop="$emit('change-root', boundary.Id)">
					<span class="lm-check">{{ checkGlyph(boundary) }}</span>
					<span>{{ boundary.Name }}</span>
				</div>
			</div>
		</div>
		<input ref="query" v-model="query" type="text" class="lm-search" placeholder="Buscar..." aria-label="Buscar elemento" />
		<div class="lm-list">
			<label class="lm-option lm-all">
				<input type="checkbox" :checked="allChecked" :indeterminate.prop="someChecked" @change="toggleAll" />
				<span>(todos)</span>
			</label>
			<label v-for="item in visibleItems" :key="'it-' + item.FID" class="lm-option">
				<input type="checkbox" :checked="isChecked(item)" @change="toggleItem(item, $event)" />
				<span>{{ item.Caption }}</span>
			</label>
			<div v-if="hiddenByLimit > 0" class="lm-note">
				Hay {{ hiddenByLimit }} elementos más. Escriba para filtrarlos.
			</div>
		</div>
	</div>
</template>

<script>
	import { normalizeText } from '@/table/classes/BoundaryHierarchy.js';

	var DISPLAY_LIMIT = 300;

	/*
	 * LevelMenu — menú de un nivel de filas: qué elementos se ven (casillas, con
	 * buscador) y, en la raíz, qué delimitación es la raíz. Las casillas mutan el
	 * nivel directamente (es su objeto de negocio, como CategoryPicker con el
	 * indicador) y avisan con 'change' para que la tabla se rehaga; el cambio de
	 * raíz se emite para que lo aplique el dueño.
	 */
	export default {
		name: 'LevelMenu',
		props: {
			level: { type: Object, required: true },
			// Cambia en cada refresco de la pivot: fuerza a releer el estado del nivel,
			// que es una clase que Vue no observa en detalle.
			tick: { type: Number, default: 0 }
		},
		data() {
			return { query: '', showRoots: false };
		},
		computed: {
			items() {
				this.tick;
				return this.level.Items();
			},
			filteredItems() {
				var needle = normalizeText(this.query);
				if (needle === '') {
					return this.items;
				}
				var out = [];
				for (var i = 0; i < this.items.length; i++) {
					if (normalizeText(this.items[i].Caption).indexOf(needle) !== -1) {
						out.push(this.items[i]);
					}
				}
				return out;
			},
			visibleItems() {
				return this.filteredItems.slice(0, DISPLAY_LIMIT);
			},
			hiddenByLimit() {
				return this.filteredItems.length - this.visibleItems.length;
			},
			checkedCount() {
				this.tick;
				var count = 0;
				for (var i = 0; i < this.filteredItems.length; i++) {
					if (this.level.IsBoxChecked(this.filteredItems[i].FID)) count++;
				}
				return count;
			},
			allChecked() {
				return this.filteredItems.length > 0 && this.checkedCount === this.filteredItems.length;
			},
			someChecked() {
				return this.checkedCount > 0 && !this.allChecked;
			},
			rootBoundaries() {
				return window.Context.BoundaryHierarchy.RootBoundaries();
			}
		},
		mounted() {
			// Al abrir, "ninguna marcada" (que en la grilla equivale a todos) se
			// muestra como todas marcadas.
			if (this.level.IsAll()) {
				this.level.checked = null;
			}
			if (this.$refs.query) this.$refs.query.focus();
		},
		methods: {
			checkGlyph(boundary) {
				/* eslint-disable-next-line eqeqeq */
				if (boundary.Id == this.level.boundary.Id) {
					return '✓';
				}
				return '';
			},
			isChecked(item) {
				this.tick;
				return this.level.IsBoxChecked(item.FID);
			},
			toggleItem(item, event) {
				this.level.SetChecked([item], event.target.checked);
				this.$emit('change');
			},
			toggleAll() {
				this.level.SetChecked(this.filteredItems, !this.allChecked);
				this.$emit('change');
			}
		}
	};
</script>

<style scoped>
	.level-menu {
		width: 280px;
		padding: 8px;
		box-sizing: border-box;
		text-align: left;
		font-size: 13px;
		color: #37474f;
	}
	.lm-show {
		position: relative;
		display: flex;
		justify-content: space-between;
		padding: 7px 8px;
		margin: -4px -4px 6px;
		border-bottom: 1px solid #eceff1;
		cursor: pointer;
	}
	.lm-show:hover {
		background: #e9f2fd;
	}
	.lm-show-arrow {
		color: #78909c;
	}
	.lm-flyout {
		position: absolute;
		left: 100%;
		top: 0;
		min-width: 200px;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 2;
	}
	.lm-flyout-option {
		display: flex;
		gap: 8px;
		padding: 7px 12px;
		cursor: pointer;
		white-space: nowrap;
	}
	.lm-flyout-option:hover {
		background: #f5f5f5;
	}
	.lm-check {
		width: 12px;
		color: #1976d2;
	}
	.lm-search {
		width: 100%;
		box-sizing: border-box;
		padding: 6px 8px;
		margin-bottom: 6px;
		border: 1px solid #b0bec5;
		border-radius: 4px;
		font-size: 13px;
	}
	.lm-list {
		max-height: 260px;
		overflow-y: auto;
		border: 1px solid #eceff1;
		border-radius: 4px;
		padding: 2px 4px;
	}
	.lm-option {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px;
		cursor: pointer;
		font-weight: 400;
	}
	.lm-option:hover {
		background: #f5f5f5;
	}
	.lm-all {
		border-bottom: 1px solid #eceff1;
		font-weight: 600;
	}
	.lm-note {
		padding: 6px 4px;
		color: #78909c;
		font-size: 12px;
	}
</style>
