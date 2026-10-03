<template>
	<div class="sourceInfo exp-hiddable-block mp-btn-group">

		<button v-if="useCompare" type="button" @click="clickComparar"
						:title="(valueCompare ? compareTitle : 'Comparar')" class="mp-btn mp-btn--icon" :class="(valueCompare ? 'is-selected' : '')">
			<i class="fas fa-columns"></i>
		</button>
		<button v-if="useRanking" type="button" title="Ránkings" @click="clickRanking" class="mp-btn mp-btn--icon" :class="(valueRanking ? 'is-selected' : '')"><i class="fas fa-list-ol"></i></button>
		<button type="button" title="Descargar" @click="clickDescargar" class="mp-btn mp-btn--icon"><i class="fas fa-download"></i></button>
		<button type="button" :title="'Fuente de \'' + sourceTitle + '\''" @click="clickFuente" class="mp-btn mp-btn--icon"><i class="fas fa-link"></i></button>

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
