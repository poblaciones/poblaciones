<template>
	<div>
		<TopWelcome welcomeMessage="Administración de Poblaciones" backColor='#5a8ae2' />
		<invoker ref="invoker">
		</invoker>


		<div class="app-singlebar app-container">
			<div class="md-layout">
				<div v-show="showTabs" class="md-layout-item md-size-90 md-small-size-100">
					<md-tabs md-sync-route ref="tabs">
						<template slot="md-tab" slot-scope="{ tab }">
							{{ tab.label }} <help-icon v-if="tab.data.help" :size="14"
									class="md-icon-button hand md-small-hide"
									style="margin-top: 10px;
											margin-left: -7px;
											color: #b1b1b1;
											position: absolute;"
									v-tooltip.bottom-start="{ content: tab.data.help, autoHide: false,
										classes : 'tooltipInTitleBar' }"  />
						</template>

						<md-tab class="transparentTab" id="users-tab" v-if="isAdmin" to="/" :md-active="isPath('/')" md-label="Usuarios">
							<users></users>
						</md-tab>

						<md-tab class="transparentTab" to="/works" id="works-tab" md-label="Cartografías" :md-active="isPath('/works')"
										:md-template-data="{ help: `<p>
											Acceso al listado de cartografías del sitio.
										</p>
										` }">
						<works filter="R" :createEnabled="false" :offerAdminActions="true"></works>
						</md-tab>
						<md-tab class="transparentTab" id="public-tab" v-if="showPublic" to="/public" :md-active="isPath('/public')" md-label="Datos públicos"
										:md-template-data="{ help: `
											<p>
											Los datos públicos son las cartografías que se ofrecen a los usuarios
											en el botón inferior (+) del visor. 
										</p>` }">
							<works filter="P" :createEnabled="false" :offerAdminActions="true"></works>
						</md-tab>
					</md-tabs>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import TopWelcome from '@/backoffice/views/Layout/TopWelcome';
import Works from '@/backoffice/views/Work/Works';
import Users from './Users/Users';
import ActiveWork from '@/backoffice/classes/ActiveWork';
import arr from '@/common/js/arr';

export default {
	name: 'home',
	components: {
		TopWelcome,
		Works,
		Users
	},
	mounted() {
		document.title = 'Poblaciones';
		window.Context.CurrentWork = null;
		window.Context.CurrentDataset = null;
	},
	data() {
		return {
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
			} else if (this.$route.path === '/works' && this.$refs.tabs) {
				this.$refs.tabs.activeTab = 'works-tab';
			}
			return this.$route.path === path;
		},
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
	background-color: #fafafa; padding: 4px;
	margin-top: -10px;
}
</style>
