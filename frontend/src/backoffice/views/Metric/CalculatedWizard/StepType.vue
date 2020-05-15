<template>
	<div>
		<div>Indique el tipo de indicador que desea crear:</div>

		<image-button @click="formulaClick" :text="'Fórmula'" :image="formulaImage" />
		<image-button @click="distanceClick" :text="'Distancia'" :image="distanceImage" />
		<image-button @click="radarClick" :text="'Contenido'" :image="radarImage" />
	</div>
</template>

<script>
import ImageButton from '@/backoffice/components/ImageButton.vue';

export default {
	// Step 1
	name: 'stepType',
	components: {
		ImageButton,
	},
	data() {
		return {
			formulaImage: "https://placekitten.com/80/80",
			distanceImage: "https://placekitten.com/79/79",
			radarImage: "https://placekitten.com/81/81",
		};
	},
	methods: {
		formulaClick(e) {
			e.preventDefault();
			this.$emit('formulaClick', e);
		},
		distanceClick(e) {
			e.preventDefault();
			this.$emit('distanceClick', e);
		},
		radarClick(e) {
			e.preventDefault();
			this.$emit('radarClick', e);
		},
	},
};
</script>

<style scoped>
</style>

