<template>
	<div>
		<md-dialog class="medium-dialog" :md-active.sync="activateDialog" :md-click-outside-to-close="true">
			<md-dialog-title>{{ title }}</md-dialog-title>
			<md-dialog-content>
				<mp-grid
					:items="treeList"
					:columns="gridColumns"
					:rowClick="onRowClick"
					:pageSize="null"
					hasChildren />
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateDialog = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import arr from '@/common/framework/arr';

// Popup de selección única en árbol. Se usa para elegir un ítem existente
// (una región, una geografía, un padre) a partir de un listado jerárquico
// plano con Level (mismo formato que consume ClippingRegions.vue). Hacer
// click en una fila la selecciona y cierra el popup; no hay selección
// múltiple ni botón "Aceptar" aparte. Los ítems ya asociados (excludeIds)
// se muestran igual, para no romper la jerarquía, pero marcados y sin
// acción al hacer click sobre ellos.
export default {
	name: 'TreePickerPopup',
	data() {
		return {
			activateDialog: false,
			title: '',
			flatItems: [],
			excludeIds: [],
		};
	},
	computed: {
		treeList() {
			return arr.ListToTreeFromIndentedItems(this.flatItems, 'Level', 'Items');
		},
		gridColumns() {
			var loc = this;
			return [
				{
					property: 'Caption', caption: 'Nombre',
					value: function (item) {
						var caption = loc.formatCaption(item);
						if (loc.isExcluded(item)) {
							return caption + ' (ya agregada)';
						}
						return caption;
					},
				},
			];
		},
	},
	watch: {
		// Este picker siempre se abre desde otro popup ya activo (md-dialog):
		// Vue Material monta cada md-dialog como hijo directo de <body> (ver
		// MdPortal en el paquete vue-material), así que dos diálogos abiertos
		// quedan como hermanos en el DOM, no uno anidado dentro del otro. El
		// keydown.esc que cada md-dialog escucha en su propio contenedor solo
		// se dispara si el foco quedó ahí adentro; si al abrir este picker el
		// foco sigue en el popup de abajo (por ejemplo, en el botón que lo
		// abrió), el ESC termina cerrando ese popup de abajo en vez de este,
		// dejando a este picker huérfano. Se intercepta acá, en fase de
		// captura (antes de que el evento llegue a burbujear por el popup de
		// abajo), mientras este picker está activo.
		activateDialog(isActive) {
			if (isActive) {
				document.addEventListener('keydown', this.handleEscCapture, true);
			} else {
				document.removeEventListener('keydown', this.handleEscCapture, true);
			}
		},
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.handleEscCapture, true);
	},
	methods: {
		handleEscCapture(e) {
			if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				this.activateDialog = false;
			}
		},
		show(title, flatItems, excludeIds) {
			this.title = title;
			this.flatItems = flatItems;
			this.excludeIds = excludeIds || [];
			this.activateDialog = true;
		},
		isExcluded(item) {
			return this.excludeIds.indexOf(item.Id) !== -1;
		},
		// Geografías y regiones pueden repetir el mismo nombre entre
		// distintos censos o ediciones (ej. varias "Provincias"): sin la
		// revisión/versión a la vista, no habría forma de distinguirlas
		// en este selector.
		formatCaption(item) {
			if (item.Revision) {
				return item.Caption + ' (' + item.Revision + ')';
			}
			if (item.Version) {
				return item.Caption + ' (' + item.Version + ')';
			}
			return item.Caption;
		},
		onRowClick(grid, item) {
			if (this.isExcluded(item)) {
				return;
			}
			this.activateDialog = false;
			this.$emit('selected', item);
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
