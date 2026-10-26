<template>
	<div v-if="readonly" class="ro">
		¡Atención! El sitio se encuentra en modo SOLO LECTURA. Los usuarios no pueden ingresar a editar. Los administradores no deben hacer cambios o actualizaciones porque pueden perderse.
	</div>
</template>

<script>

export default {
		name: 'readonlyWarning',
	components: {
		},
		mounted() {
			var loc = this;
			setTimeout(() => {
				loc.readonly = (loc.isReadonly());
			}, 500);
		},
	data() {
		return {
			readonly: false
		};
	},
	computed: {
		user() {
			return window.Context.User;
		},

	},
		methods: {
			isReadonly() {
				if (!window.Context || !window.Context.Configuration) {
					return false;
				}
				return window.Context.Configuration.ReadonlyForMaintenance;
			},
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
	.ro {
		color: red;
		font-size: 12px;
		max-width: 600px;
		position: absolute;
		background-color: #eaeaea;
		top: 35px;
		left: 300px;
		border: 2px solid #a0a0a0;
		padding: 4px;
		border-radius: 6px;
		font-weight: bold;
		z-index: 1000;
	}


</style>
