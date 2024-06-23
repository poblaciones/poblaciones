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
			<md-menu-item v-if="canDemoteExample" @click="onDemoteExample">Quitar ejemplo</md-menu-item>
			<md-menu-item v-if="canDelete" @click="onDelete">Eliminar</md-menu-item>
			<md-menu-item v-if="canRestore" @click="onRestore">Restaurar</md-menu-item>
			<md-menu-item v-if="canPurge" @click="onPurge">Eliminar</md-menu-item>
		</md-menu-content>
		<invoker ref="invoker"></invoker>
	</md-menu>
</template>
<script>

	import arr from '@/common/framework/arr';

	export default {
		name: 'WorkActions',
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
			actions: { type: String, default: null }
			// Los tipos de acción son los correspondientes a los estados:
			// - I: inbox (activo)
			// - A: archivado
			// - D: borrado
			// - S: ejemplo
		},
		computed: {
			canModify() {
				return this.canEdit && this.actions !== 'D' && this.actions !== 'S';
			},
			canDelete() {
				return ((this.canAdmin && this.actions !== 'D') || this.actions == 'S') && !this.isExamplesManager;
			},
			canDuplicateExample() {
				return this.actions === 'S';
			},
			canDuplicate() {
				return (this.canEdit && this.actions !== 'D' && this.actions !== 'S');
			},
			canRestore() {
				return this.canAdmin && this.actions === 'D';
			},
			canPurge() {
				return this.canAdmin && this.actions === 'D';
			},
			canArchive() {
				return this.actions !== 'D' && this.actions !== 'S' && this.actions !== 'A';
			},
			canDemoteExample() {
				return this.isExamplesManager;
			},
			isExamplesManager() {
				return this.actions === 'S' && window.Context.IsAdmin();
			},
			canUnarchive() {
				return this.actions === 'A';
			},
			canDownload() {
				return this.actions !== 'D';
			},
			canEdit() {
				if (window.Context.User.Privileges === 'A') {
					return true;
				}
				return this.item.privileges !== 'V';
			},
			canAdmin() {
				if (window.Context.User.Privileges === 'A') {
					return true;
				}
				return this.item.privileges === 'A';
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
