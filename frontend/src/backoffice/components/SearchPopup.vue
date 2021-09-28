<template>
	<md-dialog :md-active.sync="openDialog" style="z-index: 5001 !important">
		<md-dialog-title>Seleccionar {{ typeCaption }} </md-dialog-title>
		<md-dialog-content style="min-width: 500px;">
			<search-panel :searchType="searchType" :currentWork="currentWork" ref="searchPanel"
										:getDraftMetrics="getDraftMetrics" @selected="selected" />
		</md-dialog-content>
		<md-dialog-actions>
			<md-button @click="openDialog = false">Cancelar</md-button>
			<md-button class="md-primary" @click="save()">Aceptar</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>
<script>
	import SearchPanel from './SearchPanel';

	export default {
		name: "searchPopup",
		data() {
			return {
				openDialog: false,
			};
		},
		components: {
			SearchPanel
		},
		props: {
			searchType: String,
			currentWork: null,
			getDraftMetrics: {
				type: Boolean,
				default: true,
			},
		},
		computed: {
			typeCaption() {
				switch (this.searchType) {
					case 'r':
						return 'región';
					case 'm':
						return 'indicador';
					default:
						throw new Error('Tipo de búsqueda inválido.');
				}
			},
		},
		methods: {
			show() {
				var loc = this;
				setTimeout(() => {
					loc.$refs.searchPanel.prepare();
					loc.$refs.searchPanel.focus();
				}, 100);
				this.openDialog = true;
			},
			selected(item) {
				this.openDialog = false;
				this.$emit('selected', item);
			}
		},
	};
</script>

<style lang="scss" scoped>
</style>
