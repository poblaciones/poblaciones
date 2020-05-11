<template>
	<div>
		<div>Indique el tipo de indicador que desea crear:</div>

		<image-button @click="formulaClick" :text="'Fórmula'" :image="formulaImage" />
		<image-button @click="rulerClick" :text="'Distancia'" :image="rulerImage" />
		<image-button @click="radarClick" :text="'Contenido'" :image="radarImage" />
	</div>
</template>

<script>
import ImageButton from '@/backoffice/components/ImageButton.vue';

export default {
	// Step 1
	name: 'calculatedType',
	components: {
		ImageButton,
	},
	data() {
		return {
			formulaImage: "https://placekitten.com/80/80",
			rulerImage: "https://placekitten.com/79/79",
			radarImage: "https://placekitten.com/81/81",
		};
	},
	methods: {
		formulaClick(e) {
			e.preventDefault();
			this.$emit('formulaClick', e);
		},
		rulerClick(e) {
			e.preventDefault();
			this.$emit('rulerClick', e);
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

