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
import err from '@/common/framework/err';
import axiosClient from '@/common/js/axiosClient';

export default {
	name: 'App',
	// components: { },
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
			axiosClient.getPromise(window.host + '/services/GetTransactionServer', {},
				'acceder a la configuración de servidores').then(function (serverConfiguration) {
					window.mainHost = window.host;
					window.host = serverConfiguration.Server;
				});
		},
		RegisterErrorHandler() {
			Vue.config.errorHandler = err.HandleError;
			window.onerror = err.HandleError;
		}
	},
};

</script>

<style src="@/common/styles/popovers.css">
</style>
<style src="@/credentials/styles/app.css"></style>
