<template>
	<div>
		<md-dialog class="wide-dialog" :md-active.sync="activateDialog" :md-click-outside-to-close="true">
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
				<md-button @click="activateDialog = false">Cancelar</md-button>
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
						if (loc.isExcluded(item)) {
							return item.Caption + ' (ya agregada)';
						}
						return item.Caption;
					},
				},
			];
		},
	},
	methods: {
		show(title, flatItems, excludeIds) {
			this.title = title;
			this.flatItems = flatItems;
			this.excludeIds = excludeIds || [];
			this.activateDialog = true;
		},
		isExcluded(item) {
			return this.excludeIds.indexOf(item.Id) !== -1;
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
