<template>
	<div style="height: 100%">
		<div id="app">
			<router-view></router-view>
		</div>
		<invoker ref="invoker" />
	</div>
</template>

<script>
	import Vue from 'vue';
	import arr from '@/common/framework/arr';
	import err from '@/common/framework/err';
	import session from '@/common/framework/session';
	import axios from 'axios';

	// Helpers del selector (mismas rutas que usa el main del mapa).
	import { addIndicatorSubtitles, addBoundarySubtitles } from '@/map/components/widgets/sideToolbar/selectorSubtitles';
	import { attachInfo, buildIndicatorInfo, buildBoundaryInfo } from '@/map/components/widgets/sideToolbar/selectorTooltips';

	export default {
		name: 'App',
		// components: { },
		created() {
		},
		data() {
			return {
				user: null,
				works: null,
				config: {},
				Signatures: {},
				context: window.Context
			};
		},
		mounted() {
			this.RegisterErrorHandler();
			this.InitializePage();
		},
		methods: {
			InitializePage() {
				var loc = this;
				// 1) Servidor de transacciones. 2) Configuración (trae user y Signatures).
				// 3) Recién entonces se cargan los árboles del catálogo.
				loc.GetServer().then(function (serverConfiguration) {
					return loc.GetConfiguration(serverConfiguration.data);
				}).then(function () {
					window.Messages.$emit('serverLoaded');
					window.Context.ServerLoaded = true;
					return loc.loadFabData();
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
			// Trae la configuración antes de cualquier otra llamada. De acá salen
			// this.user (para elegir endpoint general vs. por usuario) y this.Signatures
			// (para los parámetros de caché de los Fab*).
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
			// Dos árboles independientes, igual que el main del mapa:
			// Context.Metrics      <- GetFabIndicators / GetUserFabIndicators (columnas)
			// Context.Boundaries   <- GetFabBoundaries  (filas y filtros)
			loadFabData() {
				const loc = this;
				const params = session.AddSession(window.host, {
					params: {
						w: loc.Signatures.FabMetrics,
						h: loc.Signatures.Suffix
					}
				});

				// 1) Indicadores (árbol). La ruta general se cachea local; la de usuario no,
				//    por eso se usan endpoints distintos según si hay sesión iniciada.
				var indicatorsEndpoint = (loc.user && loc.user.Logged) ? 'GetUserFabIndicators' : 'GetFabIndicators';
				const indicators = axios.get(window.host + '/services/metrics/' + indicatorsEndpoint, params).then(function (res) {
					session.ReceiveSession(window.host, res);
					const data = res.data; // árbol: [{ Id, Name, Icon, Items }]
					addIndicatorSubtitles(data);
					attachInfo(data, buildIndicatorInfo);
					arr.AddRange(window.Context.Metrics, data);
				}).catch(function (error) {
					err.errDialog('LoadFabIndicators', 'obtener los indicadores', error);
				});

				// 2) Delimitaciones (árbol).
				const boundaries = axios.get(window.host + '/services/metrics/GetFabBoundaries', params).then(function (res) {
					session.ReceiveSession(window.host, res);
					const data = res.data; // árbol: [{ Id, Name, Items: [tipo...] }]
					addBoundarySubtitles(data);
					attachInfo(data, buildBoundaryInfo);
					arr.AddRange(window.Context.Boundaries, data);
				}).catch(function (error) {
					err.errDialog('LoadFabBoundaries', 'obtener las delimitaciones', error);
				});

				return Promise.all([indicators, boundaries]);
			},
			RegisterErrorHandler() {
				Vue.config.errorHandler = err.HandleError;
				window.onerror = err.HandleError;
			}
		},
	};

</script>

<style src="@/common/styles/popovers.css"></style>
<style src="@/common/styles/transition.css"></style>
<style src="@/credentials/styles/app.css"></style>
