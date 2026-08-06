<template>
	<div>
		<md-dialog class="wide-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Agregar geografías</md-dialog-title>
			<md-dialog-content>
				<div class="helper">
					Marque las geografías que quiera asociar. Las que ya están asociadas aparecen marcadas y
					no pueden desmarcarse desde acá.
				</div>
				<div class="geographyCheckList">
					<template v-for="group in groupedByRootCaption">
						<div class="geographyGroupHeader" :key="'header-' + group.caption">{{ group.caption }}</div>
						<md-checkbox v-for="geo in group.items" :key="geo.Id"
							v-model="checkedIds[geo.Id]"
							:disabled="isAlreadyAssociated(geo.Id)">
							{{ geo.Caption }}
						</md-checkbox>
					</template>
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

import GeographySelectHelper from '@/packs/classes/GeographySelectHelper';

export default {
	name: 'GeographySelectionPopup',
	data() {
		return {
			activateEdit: false,
			allGeographies: [],
			associatedIds: [],
			checkedIds: {},
		};
	},
	computed: {
		// Agrupa por RootCaption, mismo criterio que el resto de los combos
		// de geografía del sistema.
		groupedByRootCaption() {
			var groups = {};
			var order = [];
			for (var i = 0; i < this.allGeographies.length; i++) {
				var geo = this.allGeographies[i];
				var key = geo.Caption;
				if (geo.RootCaption) {
					key = geo.RootCaption;
				}
				if (!groups[key]) {
					groups[key] = [];
					order.push(key);
				}
				groups[key].push(geo);
			}
			var ret = [];
			for (var j = 0; j < order.length; j++) {
				ret.push({ caption: order[j], items: groups[order[j]] });
			}
			return ret;
		},
		// Las ya asociadas arrancan marcadas, así que solo habilita Aceptar
		// cuando hay al menos una marcada que todavía no lo estaba.
		hasNewSelection() {
			return this.getNewlyCheckedIds().length > 0;
		},
	},
	methods: {
		show(allGeographies, associatedIds) {
			this.allGeographies = GeographySelectHelper.ResolveRootCaptions(allGeographies);
			this.associatedIds = associatedIds;
			var checked = {};
			for (var n = 0; n < associatedIds.length; n++) {
				checked[associatedIds[n]] = true;
			}
			this.checkedIds = checked;
			this.activateEdit = true;
		},
		isAlreadyAssociated(geographyId) {
			return this.associatedIds.indexOf(geographyId) !== -1;
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

.geographyCheckList {
	max-height: 360px;
	overflow-y: auto;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	padding: 8px 16px;
	margin-bottom: 12px;
}

.geographyCheckList ::v-deep .md-checkbox {
	display: flex;
}

.geographyGroupHeader {
	font-weight: 600;
	color: #757575;
	margin-top: 12px;
	margin-bottom: 2px;

	&:first-child {
		margin-top: 0;
	}
}

</style>
