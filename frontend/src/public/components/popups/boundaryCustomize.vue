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
							<input type="radio" name="descripciones" :value="true" v-on:change="boundary.UpdateMap()" v-model="boundary.showDescriptions">Sí
						</label>
						<label class="radio-inline">
							<input type="radio" name="descripciones" :value="false" v-on:change="boundary.UpdateMap()" v-model="boundary.showDescriptions">No
						</label>
					</td>
				</tr>
			</table>
		</div>
	</Modal>
</template>

<script>
import Modal from '@/public/components/popups/modal';

export default {
	name: 'boundaryCustomize',
	components: {
		Modal
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
		range(col, from, to) {
			var ret = [];
			for(var n = 0; n < col.length; n++) {
				if (n >= from && n <= to) {
					ret.push(col[n]);
				}
			}
			return ret;
		},
		show(boundary) {
			this.boundary = boundary;
			this.$refs.dialog.show();
		},
		getActiveOpacity(key) {
			if (key === this.boundary.opacity) {
				return ' active';
			} else {
				return '';
			}
		},
		changeOpacity(key) {
			if (this.boundary.opacity !== key) {
				this.boundary.opacity = key;
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

