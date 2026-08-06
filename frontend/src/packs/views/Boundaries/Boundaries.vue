<template>
	<div>
		<div class="md-layout">
			<invoker ref="invoker"></invoker>

			<boundary-popup ref="editPopup" @completed="popupSaved">
			</boundary-popup>
			<boundary-version-popup ref="editVersionPopup" @completed="versionSaved">
			</boundary-version-popup>
			<metadata-popup ref="editMetadataPopup">
			</metadata-popup>
			<div v-if="canEdit" class="md-layout-item md-size-100">
				<md-button @click="createNewBoundary">
					<md-icon>add_circle_outline</md-icon>
					Nueva delimitación
				</md-button>
			</div>
			<div class="md-layout-item md-size-100">
				<mp-grid
					compact
					:items="treeList"
					:columns="gridColumns"
					:actions="gridActions"
					:rowClick="onRowClick"
					:canDelete="canEdit"
					:isItemDeleteEnabled="isItemDeleteEnabled"
					entityName="delimitación"
					:deleteConfirmMessage="deleteConfirmMessage"
					@itemDelete="onItemDelete"
					defaultSortBy="Order"
					hasChildren />
			</div>
		</div>
		</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import BoundaryPopup from './BoundaryPopup.vue';
import BoundaryVersionPopup from './BoundaryVersionPopup.vue';
import MetadataPopup from '../Metadata/MetadataPopup.vue';
import f from '@/backoffice/classes/Formatter';
import arr from '@/common/framework/arr';
import c from '@/common/framework/color';
import MpGridHelper from '@/backoffice/components/MpGrid.helper';

// Nivel artificial que agrupa las delimitaciones por Group: no viene del
// servidor (que sigue devolviendo Level 0 delimitación / 1 versión), se
// arma acá nada más que para la vista jerárquica. -1 lo mantiene fuera de
// cualquier condición existente basada en Level (===0, ===1).
const GROUP_LEVEL = -1;

	export default {
		name: 'Boundaries',
		components: {
			BoundaryPopup,
			BoundaryVersionPopup,
			MetadataPopup
		},
	data() {
		return {
			list: [],
			uniqueMetadatas: [],
			groups: [],
			};
	},
	computed: {
		canEdit() {
			return window.Context.IsAdmin();
		},
		// El servidor entrega el listado plano, en orden, con el nivel de
		// profundidad de cada ítem (Level: 0 delimitación, 1 versión), igual
		// que en regiones (ver ClippingRegions.vue). Cada delimitación debe
		// venir seguida inmediatamente de sus versiones, sin intercalar otra
		// delimitación en el medio: BuildTreeFromLevels arma esa parte de la
		// jerarquía por posición, no por una referencia explícita al padre.
		// El nivel de Group, más arriba, se arma acá agrupando por
		// Group.Id: si se edita una delimitación y cambia de grupo, el
		// árbol se recalcula solo (es un computed sobre this.list).
		treeList() {
			var boundaryTree = MpGridHelper.BuildTreeFromLevels(this.list, 'Level', 'Items');
			return this.groupByBoundaryGroup(boundaryTree);
		},
		gridColumns() {
			var loc = this;
			return [
				// No ordenable: las delimitaciones ya vienen en su Order real
				// (se reordenan con las acciones Subir/Bajar, no clickeando el
				// encabezado) y las versiones en su Caption (2010, 2022, ...);
				// permitir el sort por nombre acá rompería ese orden.
				{
					property: 'Caption', caption: 'Nombre', sortable: false, size: 5,
					tooltip: function (item) { return item.Metadata ? item.Metadata.Title : null; },
				},
				{
					property: 'Order', caption: 'Orden', sortable: false, sortType: 'number',
					value: function (item) {
						if (item.Level === 0) {
							return item.Order;
						}
						return '';
					},
				},
				{
					property: 'Geography.Caption', caption: 'Geografía',sortable: false,
					value: function (item) { return loc.formatGeography(item.Geography); },
				},
				{
					property: 'ClippingRegionsSummary', caption: 'Contenido',
					sortable: false, align: 'left', size: 5,
					value: function (item) {
						if (item.Level === 1) {
							return item.ClippingRegionsSummary;
						}
						return '';
					},
				},
				{
					property: 'IsPrivate', caption: 'Público', sortType: 'boolean', sortable: false,
					value: function (item) {
						if (item.Level === 0) {
							return loc.formatBool(!item.IsPrivate);
						}
						return '';
					},
					sortValue: function (item) { return !item.IsPrivate; },
				},
				{
					property: 'IsSuggestion', caption: 'Recomendado', sortable: false,
					value: function (item) {
						if (item.Level === 0) {
							return loc.formatBool(item.IsSuggestion);
						}
						return '';
					},
				},
			];
		},
		// 'Modificar' se degrada a 'Ver' cuando no se puede editar, en vez de
		// ocultarse (siguen siendo consultables). 'Nueva versión', 'Subir' y
		// 'Bajar' sí son acciones de edición real: se ocultan directamente
		// sin permisos. 'Metadatos' es consulta pura: siempre visible.
		gridActions() {
			var loc = this;
			var editBoundaryIcon = 'edit';
			var editBoundaryCaption = 'Modificar delimitación';
			var editVersionIcon = 'edit_calendar';
			var editVersionCaption = 'Modificar versión';
			if (!this.canEdit) {
				editBoundaryIcon = 'visibility';
				editBoundaryCaption = 'Ver delimitación';
				editVersionIcon = 'visibility';
				editVersionCaption = 'Ver versión';
			}
			return [
				{
					icon: editBoundaryIcon,
					caption: editBoundaryCaption,
					isEnabled: function (item) { return item.Level === 0; },
					onClick: function (grid, item) { loc.openEdition(item); },
				},
				{
					icon: editVersionIcon,
					caption: editVersionCaption,
					isEnabled: function (item) { return item.Level === 1; },
					onClick: function (grid, item) { loc.openEdition(item); },
				},
				{
					icon: 'add_circle_outline',
					caption: 'Nueva versión',
					isEnabled: function (item) { return item.Level === 0 && loc.canEdit; },
					onClick: function (grid, item) { loc.openNewVersion(item); },
				},
				{
					icon: 'arrow_upward',
					caption: 'Subir',
					isEnabled: function (item) { return item.Level === 0 && loc.canEdit && !loc.isFirstInGroup(item); },
					onClick: function (grid, item) { loc.moveBoundary(item, true); },
				},
				{
					icon: 'arrow_downward',
					caption: 'Bajar',
					isEnabled: function (item) { return item.Level === 0 && loc.canEdit && !loc.isLastInGroup(item); },
					onClick: function (grid, item) { loc.moveBoundary(item, false); },
				},
				{
					icon: 'label',
					caption: 'Metadatos',
					iconStyle: function (item) { return 'color: #' + loc.resolveColor(item); },
					badge: function (item) {
						if (item.MetadataId) {
							return null;
						}
						return loc.resolveVersionMetadataId(item);
					},
					isEnabled: function (item) { return item.Level === 1 && !!loc.resolveVersionMetadataId(item); },
					onClick: function (grid, item) { loc.openMetadata({ Id: loc.resolveVersionMetadataId(item) }); },
				},
			];
		},
	},
	mounted() {
		this.reloadList();
		var loc = this;
		window.Context.BoundaryGroups.GetAll(function (data) {
			arr.AddRange(loc.groups, data);
		});
	},
	methods: {
		formatGeography(geography) {
			if (!geography) {
				return '';
			}
			if (geography.Revision) {
				return geography.Caption + ' (' + geography.Revision + ')';
			}
			return geography.Caption;
		},
		reloadList() {
			var loc = this;
			this.$refs.invoker.doMessage('Obteniendo delimitaciones', window.Db,
					window.Db.GetBoundaries).then(function(data) {
						loc.list = [];
						arr.AddRange(loc.list, data);
						loc.uniqueMetadatas = [];
						loc.list.forEach(function (item) {
							var id = loc.resolveVersionMetadataId(item);
							if (id && !loc.uniqueMetadatas.includes(id)) {
								loc.uniqueMetadatas.push(id);
							}
						});
			});
		},
		groupByBoundaryGroup(boundaryTree) {
			var groupNodes = [];
			var nodesByGroupId = {};
			for (var i = 0; i < boundaryTree.length; i++) {
				var boundary = boundaryTree[i];
				var groupId = boundary.Group.Id;
				if (!nodesByGroupId[groupId]) {
					var groupNode = {
						Id: 'group-' + groupId,
						Caption: boundary.Group.Caption,
						Level: GROUP_LEVEL,
						Items: [],
					};
					nodesByGroupId[groupId] = groupNode;
					groupNodes.push(groupNode);
				}
				nodesByGroupId[groupId].Items.push(boundary);
			}
			return groupNodes;
		},
		formatBool(v) {
			if (v) {
				return 'Sí';
			}
			return '-';
		},
		isItemDeleteEnabled(item) {
			return item.Level !== GROUP_LEVEL;
		},
		createNewBoundary() {
			var loc = this;
			window.Context.Factory.GetCopy('Boundary', function(data) {
					loc.$refs.editPopup.show(data, loc.groups);
			});
		},
		asHtml(text) {
			if (text) {
				return text.replace('\n', '<br>');
			} else {
				return '';
			}

		},
		openEdition(item) {
			if (item.Level === 0) {
				this.$refs.editPopup.show(item, this.groups);
			} else {
				this.$refs.editVersionPopup.show(item, item.Boundary);
			}
		},
		openNewVersion(boundary) {
			var loc = this;
			// Referencia liviana, sin Items: si se le pasara boundary tal
			// cual (la fila real de this.list, con sus versiones ya anidadas
			// por treeList), la versión nueva terminaría con Boundary
			// apuntando a un objeto que la contiene a ella misma entre sus
			// Items, un ciclo que después rompe el clonado por JSON al abrir
			// 'Modificar versión' sobre esa misma fila.
			var lightBoundary = { Id: boundary.Id, Caption: boundary.Caption };
			window.Context.Factory.GetCopy('BoundaryVersion', function (data) {
				loc.$refs.editVersionPopup.show(data, lightBoundary);
			});
		},
		moveBoundary(item, up) {
			var method = window.Db.MoveBoundaryDown;
			if (up) {
				method = window.Db.MoveBoundaryUp;
			}
			var loc = this;
			this.$refs.invoker.doSave(window.Db, method, item).then(function () {
				loc.reloadList();
			});
		},
		// this.list ya viene ordenada por Order (ver GetBoundaries en el
		// backend): el primer/último hermano en ese orden es el primero/
		// último dentro de su grupo, y no tiene a dónde subir/bajar.
		getSiblings(item) {
			var ret = [];
			for (var n = 0; n < this.list.length; n++) {
				if (this.list[n].Level === 0 && this.list[n].Group.Id === item.Group.Id) {
					ret.push(this.list[n]);
				}
			}
			return ret;
		},
		isFirstInGroup(item) {
			var siblings = this.getSiblings(item);
			return siblings.length > 0 && siblings[0].Id === item.Id;
		},
		isLastInGroup(item) {
			var siblings = this.getSiblings(item);
			return siblings.length > 0 && siblings[siblings.length - 1].Id === item.Id;
		},
		onRowClick(grid, item) {
			if (item.Level === GROUP_LEVEL) {
				return;
			}
			this.openEdition(item);
		},
		openMetadata(metadata) {
			var loc = this;
			window.Db.LoadMetadata(metadata).then(function (activeMetadata) {
				loc.$refs.editMetadataPopup.show(activeMetadata);
			});
		},
		// Solo las versiones (Level 1) pueden tener metadatos propios
		// (bvr_metadata_id): Boundary no tiene ese campo en la base. Si
		// una versión no usa metadatos propios (switch "Usa metadatos
		// propios" desactivado en su popup), se edita en su lugar el
		// metadata de la primera región asociada, que el usuario ya
		// entiende como "lo que se está mostrando en el mapa".
		resolveVersionMetadataId(item) {
			if (item.MetadataId) {
				return item.MetadataId;
			}
			if (item.ClippingRegions && item.ClippingRegions.length > 0 && item.ClippingRegions[0].MetadataId) {
				return item.ClippingRegions[0].MetadataId;
			}
			return null;
		},
		resolveColor(item) {
			if (item.MetadataId) {
				return '9e9e9e';
			}
			var metadataId = this.resolveVersionMetadataId(item);
			if (!metadataId) {
				return '';
			}
			var palete = c.GetColorPalete();
			var position = this.uniqueMetadatas.indexOf(metadataId);
			var positionTrimed = position % palete.length;
			return palete[positionTrimed];
		},
		popupSaved(item) {
			item.Level = 0;
			arr.ReplaceByIdOrAdd(this.list, item);
		},
		versionSaved(item) {
			item.Level = 1;
			for (var n = 0; n < this.list.length; n++) {
				if (this.list[n].Level === 1 && this.list[n].Id === item.Id) {
					this.list.splice(n, 1, item);
					return;
				}
			}
			this.insertNewVersion(item);
		},
		insertNewVersion(item) {
			for (var n = 0; n < this.list.length; n++) {
				if (this.list[n].Level === 0 && this.list[n].Id === item.Boundary.Id) {
					// La inserta a continuación del bloque de versiones ya
					// existentes de esa delimitación (BuildTreeFromLevels arma la
					// jerarquía por posición, no por referencia al padre).
					var insertAt = n + 1;
					while (insertAt < this.list.length && this.list[insertAt].Level === 1 &&
								this.list[insertAt].Boundary.Id === item.Boundary.Id) {
						insertAt++;
					}
					this.list.splice(insertAt, 0, item);
					return;
				}
			}
		},
		deleteConfirmMessage(item) {
			if (item.Level === 0) {
				return 'Esta acción no puede deshacerse: se eliminará la delimitación \'' + item.Caption + '\' junto con todas sus versiones.';
			} else {
				return 'Esta acción no puede deshacerse: se eliminará la versión \'' + item.Caption + '\'.';
			}
		},
		onItemDelete(item) {
			var loc = this;
			if (item.Level === 0) {
				this.$refs.invoker.doSave(window.Db, window.Db.DeleteBoundary, item).then(function () {
					loc.removeBoundaryAndVersions(item);
				});
			} else {
				this.$refs.invoker.doSave(window.Db, window.Db.DeleteBoundaryVersion, item).then(function () {
					loc.removeFromList(item);
				});
			}
		},
		removeBoundaryAndVersions(boundary) {
			var index = 0;
			while (index < this.list.length) {
				var current = this.list[index];
				if (current === boundary || (current.Level === 1 && current.Boundary && current.Boundary.Id === boundary.Id)) {
					this.list.splice(index, 1);
				} else {
					index++;
				}
			}
		},
		removeFromList(item) {
			var index = this.list.indexOf(item);
			if (index !== -1) {
				this.list.splice(index, 1);
			}
		},
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.md-dialog-actions {
  padding: 8px 20px 8px 24px !important;
}

.close-button {
    min-width: unset;
    height: unset;
    margin: unset;
    float: right;
}

</style>
