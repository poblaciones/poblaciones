<template>
	<div>
		<TopWelcome welcomeMessage="Administración de Poblaciones" backColor='#5a8ae2' />
		<invoker ref="invoker">
		</invoker>


		<div class="app-singlebar app-container">
			<div class="md-layout">
				<div v-show="showTabs" class="md-layout-item md-size-80 md-small-size-100">
					<md-tabs md-sync-route ref="tabs">
						<template slot="md-tab" slot-scope="{ tab }">
							{{ tab.label }}
							<i class="badge" v-if="tab.data.badge">{{ tab.data.badge }}</i>
							<mp-help :text="tab.data.help" />
						</template>

						<md-tab class="transparentTab" id="users-tab" v-if="isAdmin" to="/" :md-active="isPath('/')" md-label="Usuarios">
							<users></users>
						</md-tab>
						<md-tab class="transparentTab" to="/works" id="works-tab" md-label="Cartografías" :md-active="isPath('/works')">

							<works filter="R"></works>
						</md-tab>

						<md-tab class="transparentTab" id="public-tab" v-if="showPublic" to="/public" :md-active="isPath('/public')" md-label="Datos públicos">
							<works filter="P"></works>
						</md-tab>

						<md-tab class="transparentTab" id="boundaries-tab" v-if="isAdmin" to="/boundaries" :md-active="isPath('/boundaries')" md-label="Delimitaciones">
							<boundaries></boundaries>
						</md-tab>

						<md-tab class="transparentTab" id="clipping-regions-tab" v-if="isAdmin" to="/regions" :md-active="isPath('/regions')" md-label="Regiones">
							<clipping-regions></clipping-regions>
						</md-tab>

						<md-tab class="transparentTab" id="reviews-tab" v-if="isAdmin" to="/reviews" :md-active="isPath('/reviews')" md-label="Revisiones"
										:md-template-data="{ badge: (pendingReviews ? pendingReviews : '') }">
							<reviews @pendingUpdated="pendingUpdated"></reviews>
						</md-tab>

						<md-tab class="transparentTab" id="stats-tab" v-if="isAdmin" to="/stats" :md-active="isPath('/stats')" md-label="Estadísticas">
							<statistics></statistics>
						</md-tab>
					</md-tabs>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import TopWelcome from '@/common/components/TopWelcome';

import Works from './Works/Works';
import Users from './Users/Users';
import Statistics from './Statistics/Statistics';
import Reviews from './Reviews/Reviews';
import ClippingRegions from './ClippingRegions/ClippingRegions';
import Boundaries from './Boundaries/Boundaries';

export default {
	name: 'Layout',
	components: {
		TopWelcome,
		Works,
		Boundaries,
		ClippingRegions,
		Statistics,
		Reviews,
		Users
	},
	mounted() {
		document.title = 'Poblaciones';
		window.Context.CurrentWork = null;
		window.Context.CurrentDataset = null;
	},
	data() {
		return {
			pendingReviews: 0
		};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		},
		showTabs() {
			return (window.Context.Cartographies);
		},
		filter() {
			var isInPublic = (this.$route.path === '/public');
			return (isInPublic ? 'P' : 'R');
		},
		showPublic() {
			return (window.Context.Cartographies);
		},
	},
	methods: {
		isPath(path) {
			if (this.$route.path === '/public' && this.$refs.tabs) {
				this.$refs.tabs.activeTab = 'public-tab';
			} else if (this.$route.path === '/boundaries' && this.$refs.tabs) {
				this.$refs.tabs.activeTab = 'boundaries-tab';
			} else if (this.$route.path === '/regions' && this.$refs.tabs) {
				this.$refs.tabs.activeTab = 'clipping-regions-tab';
			} else if (this.$route.path === '/reviews' && this.$refs.tabs) {
				this.$refs.tabs.activeTab = 'reviews-tab';
			} else if (this.$route.path === '/stats' && this.$refs.tabs) {
				this.$refs.tabs.activeTab = 'stats-tab';
			} else if (this.$route.path === '/works' && this.$refs.tabs) {
				this.$refs.tabs.activeTab = 'works-tab';
			}
			return this.$route.path === path;
		},
		pendingUpdated(pending) {
			this.pendingReviews = pending;
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.dashboard {
	&-container {
		margin: 30px;
	}
	&-text {
		font-size: 20px;
		line-height: 30px;
	}
}

.transparentTab {
	background-color: #fafafa;
	padding: 4px;
}

	.badge {
		padding: 2px 6px;
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		top: 6px;
		right: 6px;
		background: #b7b7b7;
		border-radius: 6px;
		color: #fff;
		font-size: 10px;
		font-style: normal;
		font-weight: 600;
		letter-spacing: -.05em;
		font-family: 'Roboto Mono', monospace;
	}
</style>
