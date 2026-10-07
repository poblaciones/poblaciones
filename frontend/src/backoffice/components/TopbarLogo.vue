<template>
	<a class="topbar-logo" :href="getBackRoute" rel="noopener" aria-label="Ir al inicio de Poblaciones">
		<img :src="logo" alt="Poblaciones">
	</a>
</template>

<script>
import logo from '@/backoffice/assets/logo-topbar.png';

export default {
	name: 'TopbarLogo',
	data() {
		return {
			logo: logo
		};
	},
	computed: {
			getBackRoute() {
				var work = window.Context.CurrentWork;
				if (!work) {
					return '/users#/works';
				}
				if (work.properties.Type == 'P') {
					return '/users#/public';
				} else if (work.properties.Type == 'R') {
					return '/users#/works';
				} else {
					throw new Error('Tipo de obra no reconocida para getBackRoute.');
				}
			}
//			return window.Context.Configuration.HomePage;
	}
};
</script>

<style scoped>
.topbar-logo {
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	height: 100%;
}

/* El logo se muestra a su tamaño real, acotado a la altura de la barra. */
.topbar-logo img {
	display: block;
	max-width: 100%;
	max-height: 40px;
}
</style>
