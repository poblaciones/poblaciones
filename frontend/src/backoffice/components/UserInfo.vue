<template>
	<div v-if="this.user" class="userInfo">
    <div>Usuario: {{ (user.master ? user.master + ' como ': '') }} {{ user.user }}</div>
		<div><a class="whiteLink" @click="logoff">Cerrar sesión</a></div>
  </div>
</template>

<script>

export default {
	name: 'userInfo',
	components: {
	},
	data() {
		return {	};
	},
	computed: {
		user() {
			return window.Context.User;
		}
	},
	methods: {
		logoff() {
				var url = window.host + '/authenticate/logoff';
				document.location = url;
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
</style>

