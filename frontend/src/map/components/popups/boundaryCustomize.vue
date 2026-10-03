<template>
	<Modal title="Personalizar delimitación" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="boundary">
			<div class="popupSubTitle">
				Opciones de mapa
			</div>
			<div class="fld">
				<div class="fld-label">Mostrar descripciones</div>
				<div class="fld-value">
					<label class="radio-inline">
						<input type="radio" name="descripciones" :value="true" @change="boundary.UpdateMap()" v-model="boundary.showDescriptions">Sí
					</label>
					<label class="radio-inline">
						<input type="radio" name="descripciones" :value="false" @change="boundary.UpdateMap()" v-model="boundary.showDescriptions">No
					</label>
				</div>
			</div>
			<div class="fld">
				<div class="fld-label">Trama</div>
				<div class="fld-value">
					<PatternButtons :patterns="boundary.getValidPatterns()" :customPattern="boundary.customPattern"
													:defaultPattern="boundary.pattern" @change="changePattern" />
				</div>
			</div>
		</div>
	</Modal>
</template>

<script>
import Modal from '@/map/components/popups/modal';
import PatternButtons from '@/map/components/controls/patternButtons';

export default {
	name: 'boundaryCustomize',
	components: {
		Modal,
		PatternButtons
	},
	props: [
		'backgroundColor'
	],
	data() {
		return {
			boundary: null
		};
	},
	methods: {
		show(boundary) {
			this.boundary = boundary;
			this.$refs.dialog.show();
		},
		changePattern(key) {
			var newPattern = key;
			if (key === this.boundary.pattern) {
				newPattern = '';
			}
			if (this.boundary.customPattern !== newPattern) {
				this.boundary.customPattern = newPattern;
				this.boundary.UpdateMap();
			}
		},
	},
};
</script>

<style scoped>
</style>

