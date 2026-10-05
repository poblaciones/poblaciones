<template>
	<a class="topbar-logo" :href="homePage" target="_blank" rel="noopener" aria-label="Ir al inicio de Poblaciones">
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
		homePage() {
			return window.Context.Configuration.HomePage;
		}
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
