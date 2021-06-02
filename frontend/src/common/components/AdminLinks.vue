<template>
	<div class="adminButton">
		<md-button @click="goAdmin" class="md-raised">
			Administración
		</md-button>
		<md-button @click="goLogs" class="md-raised" v-if="isAdmin">
			Logs
		</md-button>
	</div>
</template>

<script>

export default {
	name: 'adminLinks',
	components: {
	},
	data() {
		return {	};
	},
	computed: {
		isAdmin() {
			return window.Context.IsAdmin();
		}
	},
	methods: {
		goAdmin() {
				var url = '/admins';
				window.open(url, '_blank');
		},
		goLogs() {
				var url = window.host + '/logs';
				window.open(url, '_blank');
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.adminButton {
	float: right;
	font-size: 12px;
	margin-top: -12px;
}
</style>

