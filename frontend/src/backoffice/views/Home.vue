<template>
	<div>
		<TopWelcome :offerAdminLink='true' />
		<invoker ref="invoker">
		</invoker>


		<div class="app-singlebar app-container">
			<div class="md-layout">
				<div v-show="showTabs" class="md-layout-item md-size-90 md-small-size-100">
					<md-tabs md-sync-route ref="tabs">
						<template slot="md-tab" slot-scope="{ tab }">
							{{ tab.label }}
							<mp-help :text="tab.data.help" />
						</template>

						<md-tab class="transparentTab" to="/works" md-label="Cartografías" :md-active="isPath('/works')"
										:md-template-data="{ help: `<p>
											Para publicar información en la plataforma es necesario organizarla en cartografías.
										</p><p>
											Cada cartografía está compuesta por un conjunto de datasets e indicadores que se representan en el visor del mapa.
										</p>
										` }">
						<works filter="R"></works>
						</md-tab>
						<md-tab class="transparentTab" id="public-tab" v-if="showPublic" to="/public" :md-active="isPath('/public')" md-label="Datos públicos"
										:md-template-data="{ help: `
											<p>
											Los datos públicos reúnen información de carácter general sobre el territorio o la
											población descripta por la plataforma. Son datos típicamente producidos por fuentes
											estatales y son ofrecidos en el sitio a través del botón de acceso rápido en el
											visor del mapa.
											</p>` }">
							<works filter="P"></works>
						</md-tab>
					</md-tabs>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import TopWelcome from '@/common/components/TopWelcome';
import Works from './Work/Works';
import ActiveWork from '@/backoffice/classes/ActiveWork';
import arr from '@/common/js/arr';

export default {
	name: 'home',
	components: {
		TopWelcome,
		Works
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
			return (window.Context.Cartographies && window.Context.CanViewPublicData());
		},
	},
	methods: {
		isPath(path) {
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
	background-color: #fafafa;
	padding: 4px;
	//margin-top: -10px;
}
</style>
