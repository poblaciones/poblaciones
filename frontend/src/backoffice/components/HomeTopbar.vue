<template>
	<div class="topbar home-topbar">
		<topbar-logo class="home-logo" />
		<backoffice-search :results="results" :truncated-kinds="truncatedKinds" :loading="loading" :failed="failed"
											 @search="onSearch" @select="onSelect" />
		<div class="home-actions">
			<admin-links v-if="showAdminButton"></admin-links>
			<home-menu></home-menu>
			<profile-menu></profile-menu>
		</div>
	</div>
</template>

<script>
import AdminLinks from '@/common/components/AdminLinks';
import BackofficeSearch from '@/backoffice/components/BackofficeSearch';
import ProfileMenu from '@/backoffice/views/Account/ProfileMenu.vue';
import HomeMenu from '@/backoffice/views/Account/HomeMenu.vue';
import TopbarLogo from '@/backoffice/components/TopbarLogo';
import WorkSearch from '@/backoffice/classes/WorkSearch';

const MIN_QUERY_LENGTH = 2;
const SEARCH_DELAY_MS = 250;
const LIMIT_PER_GROUP = 6;

export default {
	name: 'HomeTopbar',
	components: {
		AdminLinks,
		BackofficeSearch,
		ProfileMenu,
		HomeMenu,
		TopbarLogo
	},
	data() {
		return {
			results: null,
			truncatedKinds: [],
			loading: false,
			failed: false
		};
	},
	created() {
		this.workSearch = new WorkSearch(LIMIT_PER_GROUP);
		this.searchTimer = null;
	},
	beforeDestroy() {
		clearTimeout(this.searchTimer);
		this.workSearch.Cancel();
	},
	computed: {
		showAdminButton() {
			return window.Context.User && window.Context.CanAccessAdminSite();
		}
	},
	methods: {
		onSearch(text) {
			clearTimeout(this.searchTimer);
			var query = text.trim();
			if (query.length < MIN_QUERY_LENGTH) {
				this.resetSearch();
			} else {
				this.loading = true;
				this.failed = false;
				this.searchTimer = setTimeout(() => {
					this.runSearch(query);
				}, SEARCH_DELAY_MS);
			}
		},
		resetSearch() {
			this.workSearch.Cancel();
			this.results = null;
			this.truncatedKinds = [];
			this.loading = false;
			this.failed = false;
		},
		runSearch(query) {
			var loc = this;
			this.workSearch.Search(query).then(function (found) {
				if (found !== null) {
					loc.addLinks(found.results);
					loc.results = found.results;
					loc.truncatedKinds = found.truncatedKinds;
					loc.failed = found.failed;
					loc.loading = false;
				}
			});
		},
		// Con el href, Ctrl, Cmd o Shift más clic abren el resultado en otra pestaña o ventana.
		addLinks(results) {
			if (results !== null) {
				for (var item of results) {
					item.href = this.$router.resolve(item.route).href;
				}
			}
		},
		onSelect(item) {
			this.$router.push(item.route);
		}
	}
};
</script>

<style scoped>
/* El buscador tiene un ancho fijo y las columnas laterales se reparten el resto por igual, de modo que
   queda centrado en la pantalla mientras las acciones lo permitan. */
.home-topbar {
	display: grid;
	grid-template-columns: 1fr 380px 1fr;
	grid-template-rows: 100%;
	align-items: center;
	gap: 16px;
	width: 100%;
	padding: 0 20px;
	overflow: visible;
}

.home-logo {
	justify-self: start;
}

.home-actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	white-space: nowrap;
}
</style>
