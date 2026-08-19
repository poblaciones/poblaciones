<template>
	<div>
		<invoker ref="invoker"></invoker>
		<boundary-version-selection-popup ref="selectionPopup" @selected="onVersionsSelected"></boundary-version-selection-popup>
		<md-dialog class="medium-dialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>{{ dialogTitle }}</md-dialog-title>
			<md-dialog-content v-if="clippingRegion">
				<div class="helper">
					Administra a qué versiones de delimitación pertenece esta región (mismo vínculo que se
					edita desde 'Regiones asociadas' en cada versión).
				</div>
				<md-button v-if="canEdit" @click="openSelection">
					<md-icon>add_circle_outline</md-icon>
					Agregar a delimitaciones
				</md-button>
				<div v-if="associated.length === 0" class="helper">
					No está asociada a ninguna delimitación.
				</div>
				<md-table v-else v-model="associated" md-card>
					<md-table-row slot="md-table-row" slot-scope="{ item }">
						<md-table-cell md-label="Delimitación">{{ item.BoundaryVersion.Boundary.Caption }}</md-table-cell>
						<md-table-cell md-label="Versión">{{ item.BoundaryVersion.Caption }}</md-table-cell>
						<md-table-cell v-if="canEdit" md-label="Acciones" class="mpNoWrap">
							<md-button class="md-icon-button" @click="confirmRemoveAssociation(item)">
								<md-icon>delete</md-icon>
								<md-tooltip md-direction="bottom">Quitar</md-tooltip>
							</md-button>
						</md-table-cell>
					</md-table-row>
				</md-table>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

import BoundaryVersionSelectionPopup from './BoundaryVersionSelectionPopup.vue';

export default {
	name: 'ClippingRegionBoundaryVersionsPopup',
	components: {
		BoundaryVersionSelectionPopup,
	},
	data() {
		return {
			activateEdit: false,
			clippingRegion: null,
			associated: [],
			allBoundaries: [],
		};
	},
	computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		dialogTitle() {
			if (this.clippingRegion) {
				return 'Delimitaciones de ' + this.clippingRegion.Caption;
			}
			return 'Delimitaciones';
		},
	},
	created() {
		var loc = this;
		this.$refs.invoker.doMessage('Obteniendo delimitaciones', window.Db,
				window.Db.GetBoundaries).then(function (data) {
					loc.allBoundaries = data;
		});
	},
	methods: {
		show(clippingRegion) {
			this.clippingRegion = clippingRegion;
			this.activateEdit = true;
			this.reloadAssociated();
		},
		reloadAssociated() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo delimitaciones asociadas', window.Db,
					window.Db.GetClippingRegionBoundaryVersions, this.clippingRegion.Id).then(function (data) {
						loc.associated = data;
			});
		},
		openSelection() {
			var associatedIds = [];
			for (var n = 0; n < this.associated.length; n++) {
				associatedIds.push(this.associated[n].BoundaryVersion.Id);
			}
			this.$refs.selectionPopup.show(this.allBoundaries, associatedIds);
		},
		onVersionsSelected(boundaryVersionIds) {
			if (boundaryVersionIds.length === 0) {
				return;
			}
			var loc = this;
			var payload = { clippingRegionId: this.clippingRegion.Id, boundaryVersionIds: boundaryVersionIds };
			this.$refs.invoker.doSave(window.Db, window.Db.AddClippingRegionToBoundaryVersions, payload).then(function () {
				loc.reloadAssociated();
			});
		},
		confirmRemoveAssociation(item) {
			var loc = this;
			this.$refs.invoker.confirm('Quitar delimitación',
				'La región dejará de estar asociada a esa versión.',
				function () {
					loc.removeAssociation(item);
				});
		},
		removeAssociation(item) {
			var loc = this;
			var payload = { clippingRegionId: this.clippingRegion.Id, boundaryVersionId: item.BoundaryVersion.Id };
			this.$refs.invoker.doSave(window.Db, window.Db.RemoveClippingRegionFromBoundaryVersion, payload).then(function () {
				var index = loc.associated.indexOf(item);
				if (index !== -1) {
					loc.associated.splice(index, 1);
				}
			});
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

</style>
