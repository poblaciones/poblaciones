<template>
	<div style="height: 100%">
		<div v-if="user && user.Logged == true" id="app">
			<router-view></router-view>
		</div>
		<invoker ref="invoker" />
	</div>
</template>

<script>
	import Db from '@/backoffice/classes/Db';
	import authentication from '@/common/js/authentication';
	import axios from 'axios';
	import Vue from 'vue';
	import err from '@/common/framework/err';

	export default {
		name: 'App',
		components: {
		},
		data() {
			return {
				user: null,
				menu: [{ caption: 'Cartografías', link: 'cartographies' }],
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
				const loc = this;
				authentication.loadHeaderBar(loc.LoadData);
			},
			LoadData(data) {
				// Inicia sesión autenticada
				this.user = data.User;
				const loc = this;
				window.Context.User = this.user;
				window.Context.Configuration = data;
				this.$refs.invoker.doMessage('Obteniendo cartografías', window.Db, window.Db.LoadWorks)
					.then(function () {
						loc.works = window.Db.Works;
					});
				window.Context.LoadStaticLists();
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
<style src="@/common/styles/material.css"></style>
