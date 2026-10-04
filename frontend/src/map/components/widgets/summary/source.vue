<template>
	<div class="sourceInfo exp-hiddable-block mp-btn-group">

		<button v-if="useCompare" type="button" @click="clickComparar"
						:title="compareLabel" :aria-label="compareLabel" :aria-pressed="$ariaPressed(valueCompare)"
						class="mp-btn mp-btn--icon" :class="{ 'is-selected': valueCompare }">
			<i class="fas fa-columns"></i>
		</button>
		<button v-if="useRanking" type="button" title="Ránkings" aria-label="Ránkings" :aria-pressed="$ariaPressed(valueRanking)" @click="clickRanking" class="mp-btn mp-btn--icon" :class="{ 'is-selected': valueRanking }"><i class="fas fa-list-ol"></i></button>
		<button type="button" title="Descargar" aria-label="Descargar" @click="clickDescargar" class="mp-btn mp-btn--icon"><i class="fas fa-download"></i></button>
		<button type="button" :title="sourceLabel" :aria-label="sourceLabel" @click="clickFuente" class="mp-btn mp-btn--icon"><i class="fas fa-link"></i></button>

	</div>
</template>

<script>

export default {
	name: 'sourceLinks',
	components: {
	},
	props: {
		sourceTitle: { type: String, default: null },
		useCompare: { type: Boolean, default: false },
		valueCompare: { type: Boolean, default: false },
		valueRanking: { type: Boolean, default: false },
		useRanking: { type: Boolean, default: false },
		compareTitle: { type: String, default: '' }
	},
	data() {
		return {
			work: {},
		};
	},
	computed: {
		compareLabel() {
			if (this.valueCompare) {
				return this.compareTitle;
			}
			return 'Comparar';
		},
		sourceLabel() {
			return 'Fuente de \'' + this.sourceTitle + '\'';
		},
	},
		methods: {
			clickComparar(e) {
				e.preventDefault();
				this.$emit("clickCompare", e);
			},
		clickRanking(e) {
				e.preventDefault();
			this.$emit("clickRanking", e);
			},
		clickDescargar(e) {
			e.preventDefault();
			this.$emit("clickDownload", e);
		},
		clickFuente(e) {
			e.preventDefault();
			this.$emit("clickSource", e);
		},
	},
};
</script>

<style scoped>


</style>
