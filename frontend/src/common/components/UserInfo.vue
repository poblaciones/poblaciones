<template>
	<div v-if="this.user" class="userInfo">
    <div>Usuario: {{ (user.master ? user.master + ' como ': '') }} {{ user.User }}</div>
		<div><a class="whiteLink" @click="logoff">Cerrar sesión</a></div>
  </div>
</template>

<script>
import a from '@/common/js/authentication';

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
				a.logoff();
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.userInfo {
	float: right;
	font-size: 12px;
	margin-top: -8px;
}
</style>

