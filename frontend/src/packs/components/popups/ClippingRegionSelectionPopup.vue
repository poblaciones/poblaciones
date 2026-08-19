<template>
	<div>
		<md-dialog class="medium-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Agregar regiones</md-dialog-title>
			<md-dialog-content>
				<div class="helper">
					Marque las regiones que quiera asociar. Las que ya están asociadas aparecen marcadas y
					no pueden desmarcarse desde acá.
				</div>
				<div class="regionCheckList">
					<md-checkbox v-for="region in flatList" :key="region.Id"
						v-model="checkedIds[region.Id]"
						:disabled="isAlreadyAssociated(region.Id)"
						:style="{ marginLeft: (region.Level * 20) + 'px' }">
						{{ formatClippingRegion(region) }}
					</md-checkbox>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cancelar</md-button>
				<md-button class="md-primary" :disabled="!hasNewSelection" @click="accept">Aceptar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

export default {
	name: 'ClippingRegionSelectionPopup',
	data() {
		return {
			activateEdit: false,
			flatList: [],
			associatedIds: [],
			checkedIds: {},
		};
	},
	computed: {
		hasNewSelection() {
			return this.getNewlyCheckedIds().length > 0;
		},
	},
	methods: {
		// allClippingRegions es la lista jerárquica de GetClippingRegions,
		// ya con Level calculado: se muestra completa, indentada por
		// nivel, sin agrupar (a diferencia de las geografías, acá la
		// cantidad de categorías suele ser manejable de un vistazo).
		show(allClippingRegions, associatedIds) {
			this.flatList = allClippingRegions;
			this.associatedIds = associatedIds;
			var checked = {};
			for (var n = 0; n < associatedIds.length; n++) {
				checked[associatedIds[n]] = true;
			}
			this.checkedIds = checked;
			this.activateEdit = true;
		},
		isAlreadyAssociated(regionId) {
			return this.associatedIds.indexOf(regionId) !== -1;
		},
		// Mismo criterio que la columna Nombre del listado principal de
		// regiones: sin la versión, dos regiones con el mismo Caption
		// (ediciones distintas de una misma división geográfica) son
		// indistinguibles en esta lista.
		formatClippingRegion(region) {
			if (region.Version) {
				return region.Caption + ', ' + region.Version;
			}
			return region.Caption;
		},
		getNewlyCheckedIds() {
			var ret = [];
			for (var id in this.checkedIds) {
				if (this.checkedIds[id] && !this.isAlreadyAssociated(Number(id))) {
					ret.push(Number(id));
				}
			}
			return ret;
		},
		accept() {
			var selected = this.getNewlyCheckedIds();
			this.activateEdit = false;
			this.$emit('selected', selected);
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.regionCheckList {
	max-height: 360px;
	overflow-y: auto;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	padding: 8px 16px;
}

.regionCheckList ::v-deep .md-checkbox {
	display: flex;
}

</style>
