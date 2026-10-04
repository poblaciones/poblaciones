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
				var loc = this;
				axiosClient.getPromise(window.host + '/services/GetTransactionServer', {},
					'acceder a la configuración de servidores').then(function (serverConfiguration) {
						window.mainHost = window.host;
						window.host = serverConfiguration.Server;
						window.Messages.$emit('serverLoaded');
						window.Context.ServerLoaded = true;
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
<style src="@/common/styles/admin/feedback.css"></style>
<style src="@/common/styles/transition.css"></style>
<style src="@/common/styles/averta/typography.css"></style>
<style src="@/common/styles/averta/fields.css"></style>
<style src="@/common/styles/averta/theme.css"></style>
<style src="@/common/styles/averta/utilities.css"></style>
<style src="@/credentials/styles/credentials.css"></style>
