<template>
	<div>
		<md-dialog class="medium-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>Agregar a delimitaciones</md-dialog-title>
			<md-dialog-content>
				<div class="helper">
					Marque las versiones que quiera asociar. Las que ya están asociadas aparecen marcadas y
					no pueden desmarcarse desde acá.
				</div>
				<div class="versionCheckList">
					<template v-for="group in groups">
						<div class="versionGroupHeader" :key="'header-' + group.caption">{{ group.caption }}</div>
						<md-checkbox v-for="version in group.items" :key="version.Id"
							v-model="checkedIds[version.Id]"
							:disabled="isAlreadyAssociated(version.Id)">
							{{ version.Caption }}
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

export default {
	name: 'BoundaryVersionSelectionPopup',
	data() {
		return {
			activateEdit: false,
			groups: [],
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
		// allBoundaries es la lista plana de GetBoundaries (Level 0
		// delimitación, 1 versión): se agrupa acá por delimitación, ya
		// viene en el orden real (por Order) desde el backend.
		show(allBoundaries, associatedIds) {
			this.groups = this.buildGroups(allBoundaries);
			this.associatedIds = associatedIds;
			var checked = {};
			for (var n = 0; n < associatedIds.length; n++) {
				checked[associatedIds[n]] = true;
			}
			this.checkedIds = checked;
			this.activateEdit = true;
		},
		buildGroups(list) {
			var groups = [];
			var currentGroup = null;
			for (var i = 0; i < list.length; i++) {
				var item = list[i];
				if (item.Level === 0) {
					currentGroup = { caption: item.Caption, items: [] };
					groups.push(currentGroup);
				} else if (item.Level === 1 && currentGroup) {
					currentGroup.items.push(item);
				}
			}
			var withVersions = [];
			for (var j = 0; j < groups.length; j++) {
				if (groups[j].items.length > 0) {
					withVersions.push(groups[j]);
				}
			}
			return withVersions;
		},
		isAlreadyAssociated(versionId) {
			return this.associatedIds.indexOf(versionId) !== -1;
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

.versionCheckList {
	max-height: 360px;
	overflow-y: auto;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	padding: 8px 16px;
	margin-bottom: 12px;
}

.versionGroupHeader {
	font-weight: 600;
	color: #757575;
	margin-top: 12px;
	margin-bottom: 2px;

	&:first-child {
		margin-top: 0;
	}
}

</style>
