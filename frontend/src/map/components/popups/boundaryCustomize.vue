<template>
	<Modal title="Personalizar delimitación" ref="dialog" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="boundary">
			<table class="localTable">
				<tr>
					<td colspan="2">
						<div class="popupSubTitle">
							Opciones de mapa
						</div>
					</td>
				</tr>
				<tr>
					<td class="nowrapwords">Mostrar descripciones:</td>
					<td>
						<label class="radio-inline">
							<input type="radio" name="descripciones" :value="true" @change="boundary.UpdateMap()" v-model="boundary.showDescriptions">Sí
						</label>
						<label class="radio-inline">
							<input type="radio" name="descripciones" :value="false" @change="boundary.UpdateMap()" v-model="boundary.showDescriptions">No
						</label>
					</td>
				</tr>
				<tr>
					<td class="optionsLabel">Trama:</td>
					<td>
						<PatternButtons :patterns="boundary.getValidPatterns()" :customPattern="boundary.customPattern"
														:defaultPattern="boundary.pattern" @change="changePattern" />
					</td>
				</tr>
			</table>
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
	.nowrapwords {
		white-space: nowrap;
	}
	.col1 {
		width: 150px;
	}
</style>

