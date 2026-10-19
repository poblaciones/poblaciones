<template>
	<div class="adminButton">
		<md-button @click="goAdmin" class="md-raised" :class="{ 'md-primary': isCurrent('admin') }"
							 :aria-current="ariaCurrent('admin')">
			Administración
		</md-button>
		<md-button @click="goPacks" class="md-raised" :class="{ 'md-primary': isCurrent('packs') }"
							 :aria-current="ariaCurrent('packs')">
			Paquetes
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
	props: {
		// Sitio en el que se muestran los botones ('admin' o 'packs'); su botón queda marcado como seleccionado.
		current: { type: String, default: '' }
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
		isCurrent(site) {
			return this.current === site;
		},
		ariaCurrent(site) {
			if (this.isCurrent(site)) {
				return 'page';
			}
			return null;
		},
		goAdmin() {
				var url = '/admins';
				window.open(url, '_blank');
		},
		goPacks() {
			var url = '/packs';
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
		padding-top: 15px;
		margin-top: -12px;
	}
</style>

