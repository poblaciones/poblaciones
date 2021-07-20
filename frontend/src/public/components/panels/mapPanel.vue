<template>
	<div style="width: 100%; height: 100%;">

		<div class="embeddedOpener exp-hiddable-block" @click="embeddedClick" v-if="Embedded.Active && !Embedded.Readonly"
				 title="Abrir en Poblaciones (en nueva ventana)">
			<i class="fas fa-external-link-alt"></i>
		</div>

		<div id="map" style="width: 100%; height: 100%;">
		</div>

	</div>
</template>

<script>

export default {
		name: 'mapPanel',
		computed: {
			Embedded() {
				return window.Embedded;
			},
		},
		methods: {
			embeddedClick() {
				window.Embedded.OpenNewWindow();
			},
		}
};
</script>

<style scoped>
#map {
	height: 100%;
	width: 100%;
}
</style>

