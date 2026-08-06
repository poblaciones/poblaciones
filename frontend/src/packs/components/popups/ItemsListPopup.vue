<template>
	<div>
		<md-dialog v-if="visible" class="itemsDialog" :md-active.sync="activateEdit" :md-click-outside-to-close="true">
			<md-dialog-title>{{ title }}</md-dialog-title>
			<md-dialog-content>
				<mp-grid
					compact
					:items="items"
					:columns="gridColumns"
					:pageSize="50" />
				<div v-if="hasMore" class="loadMoreBar">
					<md-button :disabled="loading" @click="loadMore">
						{{ loading ? 'Cargando...' : 'Cargar más ítems' }}
					</md-button>
					<span class="helper">Mostrando {{ items.length }} de {{ total }}.</span>
				</div>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="activateEdit = false">Cerrar</md-button>
			</md-dialog-actions>
		</md-dialog>
	</div>
</template>

<script>

// Trae de a lotes grandes (no todo de una vez, algunas geografías tienen
// decenas de miles de ítems) para que MpGrid los busque y pagine del lado
// del cliente sobre lo ya cargado: no es búsqueda sobre el total, pero
// alcanza para un popup de debug, y evita traer todo de golpe.
const BATCH_SIZE = 500;

export default {
	name: 'ItemsListPopup',
	data() {
		return {
			activateEdit: false,
			visible: false,
			title: '',
			columns: [],
			fetchPage: null,
			items: [],
			total: 0,
			loading: false,
		};
	},
	computed: {
		hasMore() {
			return this.items.length < this.total;
		},
		gridColumns() {
			return this.columns;
		},
	},
	methods: {
		// fetchPageFn(offset, pageSize) debe devolver una Promise que
		// resuelva a { Items: [...], Total: N }. columns es un array de
		// { property, caption }, en el orden en que se quiere ver: por
		// convención, descripción primero (columna izquierda, más ancha),
		// código después, id al final.
		show(title, columns, fetchPageFn) {
			this.title = title;
			this.columns = columns;
			this.fetchPage = fetchPageFn;
			this.visible = true;
			this.activateEdit = true;
			this.items = [];
			this.total = 0;
			this.loadMore();
		},
		loadMore() {
			var loc = this;
			this.loading = true;
			this.fetchPage(this.items.length, BATCH_SIZE).then(function (data) {
				loc.items = loc.items.concat(data.Items);
				loc.total = data.Total;
				loc.loading = false;
			});
		},
	},
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.loadMoreBar {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-top: 8px;
}

</style>
