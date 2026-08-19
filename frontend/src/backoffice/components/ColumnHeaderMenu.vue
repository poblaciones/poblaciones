<template>
	<div class="columnHeaderMenu" v-show="visible" :style="menuStyle" @click.stop>
		<div class="menuItem" @click="emitAndClose('sortAsc')">
			<md-icon>arrow_upward</md-icon><span>Ordenar ascendente</span>
			<md-icon v-if="sortDirection === 'asc'" class="checkIcon">check</md-icon>
		</div>
		<div class="menuItem" @click="emitAndClose('sortDesc')">
			<md-icon>arrow_downward</md-icon><span>Ordenar descendente</span>
			<md-icon v-if="sortDirection === 'desc'" class="checkIcon">check</md-icon>
		</div>
		<div class="menuItem" :class="{ disabled: !hasSort }" @click="hasSort && emitAndClose('sortNone')">
			<md-icon>clear</md-icon><span>Quitar orden</span>
		</div>
		<template v-if="canEdit">
			<div class="menuSeparator"></div>
			<div class="menuItem" :class="{ disabled: !canAutoRecode }"
					 @click="canAutoRecode && emitAndClose('autoRecode')">
				<md-icon>toc</md-icon><span>Auto-recodificar</span>
			</div>
			<div class="menuItem" @click="emitAndClose('modify')">
				<md-icon>edit</md-icon><span>Modificar</span>
			</div>
			<div class="menuItem" :class="{ disabled: !canCategories }"
					 @click="canCategories && emitAndClose('categories')">
				<md-icon>ballot</md-icon><span>Categorías</span>
			</div>
			<div class="menuSeparator"></div>
			<div class="menuItem" @click="emitAndClose('delete')">
				<md-icon>delete</md-icon><span>Eliminar</span>
			</div>
		</template>
	</div>
</template>

<script>
var columnFormatEnum = require('@/common/enums/columnFormatEnum');

const MENU_WIDTH = 230;

export default {
	name: 'ColumnHeaderMenu',
	data() {
		return {
			visible: false,
			left: 0,
			top: 0,
			column: null,
			sortDirection: null
		};
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		canEdit() {
			return window.Context.CurrentWork ? window.Context.CurrentWork.CanEdit() : false;
		},
		menuStyle() {
			return 'left: ' + this.left + 'px; top: ' + this.top + 'px; width: ' + MENU_WIDTH + 'px;';
		},
		hasSort() {
			return this.sortDirection !== null && this.sortDirection !== undefined;
		},
		canAutoRecode() {
			return this.column !== null && this.column.Format === columnFormatEnum.STRING;
		},
		canCategories() {
			return this.column !== null;
		}
	},
	mounted() {
		// El menú se mueve al body para que no herede contexto de estilo de la
		// grilla (jqx impone alineaciones y direcciones a sus descendientes) y
		// para que no lo recorte el overflow:hidden de los encabezados.
		if (this.$el && this.$el.parentNode !== document.body) {
			document.body.appendChild(this.$el);
		}
		document.addEventListener('mousedown', this.onDocumentClick, true);
		document.addEventListener('keydown', this.onKeyDown, true);
		window.addEventListener('resize', this.close);
	},
	beforeDestroy() {
		document.removeEventListener('mousedown', this.onDocumentClick, true);
		document.removeEventListener('keydown', this.onKeyDown, true);
		window.removeEventListener('resize', this.close);
		if (this.$el && this.$el.parentNode === document.body) {
			document.body.removeChild(this.$el);
		}
	},
	methods: {
		// anchorRect es el getBoundingClientRect() del botón que abre el menú.
		show(column, anchorRect, sortDirection) {
			this.column = column;
			this.sortDirection = (sortDirection === undefined ? null : sortDirection);
			// Se alinea el borde derecho del menú con el del botón y se corrige
			// si se saliera de la ventana.
			var left = anchorRect.right - MENU_WIDTH;
			if (left < 4) {
				left = 4;
			}
			if (left + MENU_WIDTH > window.innerWidth - 4) {
				left = window.innerWidth - MENU_WIDTH - 4;
			}
			this.left = Math.round(left);
			this.top = Math.round(anchorRect.bottom + 2);
			this.visible = true;
		},
		close() {
			this.visible = false;
		},
		onDocumentClick(e) {
			if (!this.visible) {
				return;
			}
			if (this.$el && !this.$el.contains(e.target)) {
				this.close();
			}
		},
		onKeyDown(e) {
			if (this.visible && e.keyCode === 27) {
				this.close();
			}
		},
		emitAndClose(action) {
			var col = this.column;
			this.close();
			this.$emit(action, col);
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
/* Se fijan alineación y dirección de forma explícita: al vivir en el body
	 no hereda de la grilla, pero se declara igual para no depender de ello. */
.columnHeaderMenu {
	position: fixed;
	z-index: 6000;
	background: #fff;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
	padding: 4px 0;
	text-align: left !important;
	direction: ltr !important;
	font-family: Roboto, Arial, sans-serif;
	box-sizing: border-box;
}

.menuItem {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start !important;
	text-align: left !important;
	padding: 7px 16px;
	font-size: 13px;
	cursor: pointer;
	white-space: nowrap;
	color: rgba(0, 0, 0, 0.87);
	box-sizing: border-box;
}

.menuItem span {
	flex: 1 1 auto;
	text-align: left !important;
}

.menuItem:hover {
	background-color: #f2f2f2;
}

.menuItem .md-icon {
	font-size: 18px !important;
	min-width: 18px;
	width: 18px;
	margin: 0 12px 0 0;
	color: rgba(0, 0, 0, 0.54);
	flex: 0 0 auto;
}

.menuItem.disabled {
	opacity: 0.4;
	cursor: default;
}

.menuItem.disabled:hover {
	background-color: transparent;
}

.checkIcon {
	margin: 0 0 0 8px !important;
	color: #00A0D2 !important;
	flex: 0 0 auto;
}

.menuSeparator {
	height: 1px;
	background-color: #e6e6e6;
	margin: 4px 0;
}
</style>
