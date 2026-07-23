<template>
	<div>
		<TopWelcome welcomeMessage="Paquetes de Poblaciones" :offerAdminLink="true" backColor='#5a8ae2' />
		<invoker ref="invoker">
		</invoker>


		<div class="app-singlebar app-container">
			<div class="md-layout">
				<div v-show="showTabs" class="md-layout-item md-size-90 md-small-size-100">
					<md-tabs md-sync-route ref="tabs">
						<template slot="md-tab" slot-scope="{ tab }">
							{{ tab.label }}
							<i class="badge" v-if="tab.data.badge">{{ tab.data.badge }}</i>
							<mp-help :text="tab.data.help" />
						</template>

						<md-tab class="transparentTab" id="boundaries-tab" v-if="isAdminReader" to="/boundaries" :md-active="isPath('/boundaries')" md-label="Delimitaciones">
							<boundaries></boundaries>
						</md-tab>

						<md-tab class="transparentTab" id="clipping-regions-tab" v-if="isAdminReader" to="/regions" :md-active="isPath('/regions')" md-label="Regiones">
							<clipping-regions></clipping-regions>
						</md-tab>

						<md-tab class="transparentTab" id="geographies-tab" v-if="isAdminReader" to="/geographies" :md-active="isPath('/geographies')" md-label="Geografías">
							<geographies></geographies>
						</md-tab>

						<md-tab class="transparentTab" id="gradients-tab" v-if="isAdminReader" to="/gradients" :md-active="isPath('/gradients')" md-label="Gradientes">
							<gradients></gradients>
						</md-tab>

						<md-tab class="transparentTab" id="metric-catalogs-tab" v-if="isAdminReader" to="/metric-catalogs" :md-active="isPath('/metric-catalogs')" md-label="Indicadores">
							<metric-catalogs></metric-catalogs>
						</md-tab>

						<md-tab class="transparentTab" id="geography-tuples-tab" v-if="isAdminReader" to="/geography-tuples" :md-active="isPath('/geography-tuples')" md-label="Equivalencias">
							<geography-tuples></geography-tuples>
						</md-tab>

					</md-tabs>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import TopWelcome from '@/common/components/TopWelcome';

import ClippingRegions from './ClippingRegions/ClippingRegions';
import Boundaries from './Boundaries/Boundaries';
import Geographies from './Geographies/Geographies';
import Gradients from './Gradients/Gradients';
import MetricCatalogs from './MetricCatalogs/MetricCatalogs';
import GeographyTuples from './GeographyTuples/GeographyTuples';

export default {
	name: 'Layout',
	components: {
		TopWelcome,
		Boundaries,
		ClippingRegions,
		Geographies,
		Gradients,
		MetricCatalogs,
		GeographyTuples,
	},
	mounted() {
		document.title = 'Poblaciones';
		window.Context.CurrentWork = null;
		window.Context.CurrentDataset = null;
		this.checkLazyLoading();
	},
	data() {
		return {
			pendingReviews: 0,
		};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		},
		isDataAdmin() {
			return window.Context.IsDataAdmin();
		},
		isAdminReader() {
			return window.Context.IsAdminReader();
		},
		showTabs() {
			return (window.Context.Cartographies);
		},
		},
		beforeRouteUpdate(to, from, next) {
			next();
		},

		methods: {
			isPath(path) {
				return this.$route.path === path;
			},
			checkLazyLoading() {
				var tabPath = this.$route.path;
			},
		},
		watch:
		{
			'$route'(to, from) {
				this.checkLazyLoading();
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
