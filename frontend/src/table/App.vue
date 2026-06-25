<template>
	<div style="height: 100%">
		<WorkPanel v-if="work" :work="work" ref="workPanel" :backgroundColor="workColor" class="wp" />
		<div id="holder" style="overflow-x: hidden">
			<Dashboard ref="dashboard" :work="work" />
			<invoker ref="invoker" />
		</div>
		<AddMetricPopup ref="AddMetric" :backgroundColor="workColor" @add-metric="onAddMetric" />
		<WorkMetadataPopup ref="WorkMetadata" :backgroundColor="workColor" />
	</div>
</template>

<script>
	import Vue from 'vue';
	import arr from '@/common/framework/arr';
	import err from '@/common/framework/err';
	import session from '@/common/framework/session';
	import axios from 'axios';

	import { addIndicatorSubtitles, addBoundarySubtitles } from '@/map/components/widgets/sideToolbar/selectorSubtitles';
	import { attachInfo, buildIndicatorInfo, buildBoundaryInfo } from '@/map/components/widgets/sideToolbar/selectorTooltips';
	import StartTable from '@/table/classes/StartTable';
	import WorkPanel from '@/map/components/panels/workPanel';
	import Dashboard from '@/table/views/Dashboard';
	import AddMetricPopup from '@/table/components/popups/AddMetricPopup.vue';
	import WorkMetadataPopup from '@/table/components/popups/WorkMetadataPopup.vue';

	export default {
		name: 'App',
		components: { WorkPanel, Dashboard, AddMetricPopup, WorkMetadataPopup },
		data() {
			return {
				user: null,
				config: {},
				Signatures: {},
				context: window.Context,
				work: { Current: null }
			};
		},
		mounted() {
			this.RegisterErrorHandler();
			this.RegisterPopups();
			this.BindEvents();
			this.InitializePage();
		},
		beforeDestroy() {
			if (this._onResize) window.removeEventListener('resize', this._onResize);
			if (this._onLoad) window.removeEventListener('load', this._onLoad);
		},
		watch: {
			// Cuando llega el work, la barra superior se monta (v-if). En el
			// siguiente tick ya está en el DOM, así que se le pide recalcular la
			// altura para que el contenedor de abajo se reajuste.
			'work.Current': function (v) {
				if (!v) return;
				var loc = this;
				this.$nextTick(function () {
					if (loc.$refs.workPanel && loc.$refs.workPanel.onResize) {
						loc.$refs.workPanel.onResize();
					}
				});
			}
		},
		computed: {
			workColor() {
				if (this.work && this.work.Current &&
					this.work.Current.Metadata &&
					this.work.Current.Metadata.Institutions &&
					this.work.Current.Metadata.Institutions.length > 0 &&
					this.work.Current.Metadata.Institutions[0].Color) {
					return '#' + this.work.Current.Metadata.Institutions[0].Color;
				}
				return '#00A0D2';
			},
		},
		methods: {
			InitializePage() {
				var loc = this;
				loc.GetServer().then(function (serverConfiguration) {
					return loc.GetConfiguration(serverConfiguration.data);
				}).then(function () {
					window.Messages.$emit('serverLoaded');
					window.Context.ServerLoaded = true;
					return loc.loadFabData();
				}).then(function () {
					loc.StartByWork();
				});
			},
			GetServer() {
				return axios.get(window.host + '/services/GetTransactionServer', session.AddSession(window.host, {
					params: {}
				})).then(function (res) {
					session.ReceiveSession(window.host, res);
					return res;
				}).catch(function (error) {
					err.errDialog('GetTransactionServer', 'conectarse con el servidor', error);
				});
			},
			GetConfiguration(serverConfiguration) {
				const loc = this;
				return axios.get(serverConfiguration.Server + '/services/GetConfiguration', session.AddSession(serverConfiguration.Server, {
					params: {}
				})).then(function (res) {
					session.ReceiveSession(serverConfiguration.Server, res);
					res.data.DynamicServer = serverConfiguration.Server;
					window.mainHost = res.data.MainServer;
					window.host = res.data.DynamicServer;
					loc.config = res.data;
					loc.user = res.data.User;
					loc.Signatures = res.data.Signatures;
				}).catch(function (error) {
					err.errDialog('GetConfiguration', 'conectarse con el servidor', error);
				});
			},
			loadFabData() {
				const loc = this;
				const params = session.AddSession(window.host, {
					params: {
						w: loc.Signatures.FabMetrics,
						h: loc.Signatures.Suffix
					}
				});

				var indicatorsEndpoint = (loc.user && loc.user.Logged) ? 'GetUserFabIndicators' : 'GetFabIndicators';
				const indicators = axios.get(window.host + '/services/metrics/' + indicatorsEndpoint, params).then(function (res) {
					session.ReceiveSession(window.host, res);
					const data = res.data;
					addIndicatorSubtitles(data);
					attachInfo(data, buildIndicatorInfo);
					arr.AddRange(window.Context.Metrics, data);
				}).catch(function (error) {
					err.errDialog('LoadFabIndicators', 'obtener los indicadores', error);
				});

				const boundaries = axios.get(window.host + '/services/metrics/GetFabBoundaries', params).then(function (res) {
					session.ReceiveSession(window.host, res);
					const data = res.data;
					addBoundarySubtitles(data);
					attachInfo(data, buildBoundaryInfo);
					arr.AddRange(window.Context.Boundaries, data);
				}).catch(function (error) {
					err.errDialog('LoadFabBoundaries', 'obtener las delimitaciones', error);
				});

				return Promise.all([indicators, boundaries]);
			},
			// Si la ruta es /table/<id> y no tiene parámetros de pivot serializados
			// (ruta "limpia"), espera a que el Dashboard notifique que su pivot está
			// lista y entonces aplica el startup del work.
			// Si la URL es /table/<id>, carga el work para mostrar el zócalo
			// informativo. Si además la ruta está "limpia" (sin estado de pivot
			// serializado), aplica el startup del work; si la ruta trae estado
			// (deep-link), ese estado manda y el startup no se aplica.
			StartByWork() {
				var loc = this;
				var args = StartTable.ResolveWorkIdFromUrl();
				if (!args.workId) return;

				var hash = window.location.hash;
				var routeIsClean = !hash || hash === '' || hash === '#/' || hash === '#/view';

				var run = function (pivot) {
					var starter = new StartTable(loc.work, loc.config, pivot);
					starter.RestoreWork(args.workId, args.link, routeIsClean);
				};

				// Si el Dashboard ya terminó de construir su pivot, se actúa directo
				// sobre ella (cadena explícita App → dashboard → pivot); si todavía
				// está armándola, se espera el evento de arranque 'pivot-ready'.
				var dash = this.$refs.dashboard;
				if (dash && !dash.booting && dash.pivot) {
					run(dash.pivot);
				} else {
					window.Messages.$once('pivot-ready', run);
				}
			},
			RegisterErrorHandler() {
				Vue.config.errorHandler = err.HandleError;
				window.onerror = err.HandleError;
			},
			// El popup de la barra superior pidió agregar un indicador. App.vue
			// conoce el Dashboard (dueño de la pivot) y le delega la operación.
			onAddMetric(metricId) {
				if (this.$refs.dashboard) this.$refs.dashboard.addMetric(metricId);
			},
			// Popups invocables desde cualquier parte (p. ej. workPanel) sin importar
			// el z-order del control que los dispara: window.Popups.<Nombre>.show(...).
			RegisterPopups() {
				window.Popups = window.Popups || {};
				window.Popups.AddMetric = this.$refs.AddMetric;
				window.Popups.WorkMetadata = this.$refs.WorkMetadata;
			},
			// Avisa al WorkPanel (la barra superior) que recalcule su altura ante un
			// resize de ventana y al terminar la carga. Sin esto, el contenedor de
			// abajo (#holder) conserva el alto calculado inicial y no se reajusta.
			BindEvents() {
				var loc = this;
				this._onResize = function () {
					if (loc.$refs.workPanel && loc.$refs.workPanel.onResize) {
						loc.$refs.workPanel.onResize();
					}
				};
				this._onLoad = this._onResize;
				window.addEventListener('resize', this._onResize);
				window.addEventListener('load', this._onLoad);
			}
		},
	};
</script>

<style src="@/common/styles/popovers.css"></style>
<style src="@/common/styles/transition.css"></style>
<style src="@/credentials/styles/app.css"></style>


<style>
	.btn, .navbar .navbar-nav > li > a.btn {
		background-color: transparent;
		border-color: #66615b;
		border-radius: 20px;
		border-width: 2px;
		box-sizing: border-box;
		color: #66615b;
		font-size: 14px;
		font-weight: 500;
		padding: 7px 18px;
		-webkit-transition: all .15s linear;
		-moz-transition: all .15s linear;
		-o-transition: all .15s linear;
		-ms-transition: all .15s linear;
		transition: all .15s linear;
	}

	#holder {
		width: 100%;
	}
	.card {
		margin-bottom: 20px;
		z-index: 1;
		background-color: #fff;
		border-radius: 6px;
		box-shadow: 0 2px 2px hsla(38, 16%, 76%, .5);
		margin-bottom: 20px;
		position: relative;
		z-index: 1;
	}

	.pull-right {
		float: right !important;
	}

	.wp {
		line-height: .85em !important;
	}
</style>
