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
	import axiosClient from '@/common/js/axiosClient';
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
				axiosClient.getPromise(window.host + '/services/GetTransactionServer', {},
					'acceder a la configuración de servidores').then(function (serverConfiguration) {
						window.mainHost = window.host;
						window.host = serverConfiguration.Server;
						window.Messages.$emit('serverLoaded');
						window.Context.ServerLoaded = true;
					}).then(function () {
						return loc.loadFabData();
					});
			},
			// Dos árboles independientes, igual que el main del mapa:
			// Context.Metrics      <- GetFabIndicators (alimenta el panel de columnas)
			// Context.Boundaries   <- GetFabBoundaries  (alimenta filas y filtros)
			loadFabData() {
				const loc = this;
				const params = session.AddSession(window.host, {
					params: {
						w: -1 /* window.SegMap.Signatures.FabMetrics */,
						h: '' /* window.SegMap.Signatures.Suffix */
					}
				});

				// 1) Indicadores (árbol).
				const indicators = axios.get(window.host + '/services/metrics/GetFabIndicators', params).then(function (res) {
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
