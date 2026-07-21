<template>
	<md-menu md-size="medium" md-direction="bottom-end" md-align-trigger
					 style=" position: absolute; right: 19px; z-index: 100; top: 8px;">
		<md-button md-menu-trigger class="md-icon-button" @click.stop="menu">
			<md-icon>more_vert</md-icon>
		</md-button>
		<md-menu-content class="content">
			<md-menu-item v-if="canArchive" @click="onArchive">Archivar</md-menu-item>
			<md-menu-item v-if="canModify" @click="onModify">Modificar</md-menu-item>
			<md-menu-item v-if="!canModify" @click="onModify">Consultar</md-menu-item>
			<md-menu-item v-if="canDuplicate" @click="onDuplicate">Duplicar</md-menu-item>
			<md-menu-item v-if="canDuplicateExample" @click="onDuplicate">Copiar a mis cartografías</md-menu-item>
			<md-menu-item v-if="canUnarchive" @click="onUnarchive">Reactivar</md-menu-item>
			<md-menu-item v-if="canDemoteExample" @click="onDemoteExample">Convertir a cartografía</md-menu-item>
			<md-menu-item v-if="canDelete" @click="onDelete">Eliminar</md-menu-item>
			<md-menu-item v-if="canRestore" @click="onRestore">Restaurar</md-menu-item>
			<md-menu-item v-if="canPurge" @click="onPurge">Eliminar</md-menu-item>
		</md-menu-content>
		<invoker ref="invoker"></invoker>
	</md-menu>
</template>
<script>

	import WorkPermissions from '@/backoffice/classes/WorkPermissions';

	export default {
		name: 'WorkItemActions',
		components: {

		},
		data() {
			return {
			};
		},
		mounted() {
		},
		props: {
			item: Object,
			actions: { type: String, default: null },
			filter: { type: String, default: null },
			// Los tipos de acción son los correspondientes a los estados:
			// - I: inbox (activo)
			// - A: archivado
			// - D: borrado
			// - S: ejemplo
		},
		computed: {
			canModify() {
				return WorkPermissions.CanModify(this.item, this.filter, this.actions);
			},
			canDelete() {
				return WorkPermissions.CanDelete(this.item, this.actions);
			},
			canDuplicateExample() {
				return WorkPermissions.CanDuplicateExample(this.actions);
			},
			canDuplicate() {
				return WorkPermissions.CanDuplicate(this.item, this.filter, this.actions);
			},
			canRestore() {
				return WorkPermissions.CanRestore(this.item, this.actions);
			},
			canPurge() {
				return WorkPermissions.CanPurge(this.item, this.actions);
			},
			canArchive() {
				return WorkPermissions.CanArchive(this.actions);
			},
			canDemoteExample() {
				return WorkPermissions.CanDemoteExample(this.actions);
			},
			canUnarchive() {
				return WorkPermissions.CanUnarchive(this.actions);
			},
		},
		methods: {
			menu() {

			},
			selected(action) {
				this.$emit('action', action, this.item);
			},
			onDuplicate() {
				this.selected('DUPLICATE');
			},
			onModify() {
				this.selected('EDIT');
			},
			onDelete() {
				this.selected('DELETE');
			},
			onDemoteExample() {
				this.selected('DEMOTEEXAMPLE');
			},
			onRestore() {
				this.selected('RESTORE');
			},
			onArchive() {
				this.selected('ARCHIVE');
			},
			onUnarchive() {
				this.selected('UNARCHIVE');
			},
			onPurge() {
				this.selected('PURGE');
			},

		},
	};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>

</style>
