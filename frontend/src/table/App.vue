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
						return loc.loadFabMetrics();
					});
			},
			loadFabMetrics() {
				const loc = this;
				return axios.get(window.host + '/services/metrics/GetFabMetrics', session.AddSession(window.host, {
					params: {
						w: -1 /* window.SegMap.Signatures.FabMetrics */,
						h: '' /*window.SegMap.Signatures.Suffix*/
					}
				})).then(function (res) {
					session.ReceiveSession(window.host, res);
					arr.AddRange(window.Context.Metrics, res.data.Metrics);
					arr.AddRange(window.Context.Boundaries, res.data.Boundaries);
				}).catch(function (error) {
					err.errDialog('LoadFabMetrics', 'obtener los indicadores de datos públicos', error);
				});
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
