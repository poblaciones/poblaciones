<template>
	<md-dialog :md-active.sync="openDialog" style="z-index: 5001 !important">
		<md-dialog-title>Seleccionar indicador</md-dialog-title>
		<md-dialog-content style="min-width: 500px;">
			<md-field class="md-toolbar-section-end" style="min-height: unset; padding-top: 0px;">
				<md-input ref="inputQuery" placeholder="Buscar por indicador o cartografía..." v-model="query" @input="doSearch" />
				<md-icon>search</md-icon>
			</md-field>
			<div v-if="searched && results.length === 0" class="mp-label" style="white-space: normal;">
				No se encontraron indicadores.
			</div>
			<md-list class="search-results">
				<md-list-item v-for="item in results" :key="item.Id" @click="select(item)">
					<div class="md-list-item-text">
						<div>{{ item.WorkCaption }}</div>
						<div>{{ item.Caption }}</div>
					</div>
				</md-list-item>
			</md-list>
		</md-dialog-content>
		<md-dialog-actions>
			<md-button @click="openDialog = false">Cancelar</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>

<script>
const MIN_QUERY_LENGTH = 3;
const SEARCH_DELAY_MS = 300;

// Buscador de indicadores publicados para agregar a una capa base.
export default {
	name: 'MetricSearchPopup',
	data() {
		return {
			openDialog: false,
			query: '',
			results: [],
			searched: false,
			searchTimer: null
		};
	},
	methods: {
		show() {
			this.query = '';
			this.results = [];
			this.searched = false;
			this.openDialog = true;
			var loc = this;
			setTimeout(() => {
				loc.$refs.inputQuery.$el.focus();
			}, 100);
		},
		// Espera a que el usuario deje de tipear antes de consultar al servidor.
		doSearch() {
			clearTimeout(this.searchTimer);
			if (this.query && this.query.length >= MIN_QUERY_LENGTH) {
				var loc = this;
				this.searchTimer = setTimeout(function () {
					loc.search(loc.query);
				}, SEARCH_DELAY_MS);
			} else {
				this.results = [];
				this.searched = false;
			}
		},
		search(query) {
			var loc = this;
			return window.Db.SearchBasemapMetrics(query).then(function (data) {
				loc.results = data;
				loc.searched = true;
			});
		},
		select(item) {
			this.openDialog = false;
			this.$emit('selected', item);
		}
	}
};
</script>

<style scoped>
.search-results {
	width: 100%;
	height: 220px;
	overflow-y: auto;
	padding: 0px;
	margin-top: 12px;
	border: 1px solid rgba(0, 0, 0, .12);
}

.md-list-item {
	border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.md-list-item-text :nth-child(1) {
	font-size: 13px;
	color: darkgrey;
}

.md-list-item-text :nth-child(2) {
	font-size: 16px;
	padding-top: 2px;
}
</style>
