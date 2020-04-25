<template>
	<div>
	<md-dialog :md-active.sync="showDialog">
		<md-dialog-title>Categoría</md-dialog-title>
		<md-dialog-content>
		<invoker ref="invoker"></invoker>
			<div v-if="item" class="md-layout md-gutter">
				<div v-if="previous !== null" class="md-layout-item md-size-45 md-small-size-100">
					<mp-simple-text @enter="save"
									label="Desde" ref="minInput"
									helper="Indique el mínimo."
									  v-model="previousValue"
								></mp-simple-text>
				</div>
				<div v-if="!isLast" class="md-layout-item md-size-45 md-small-size-100">
						<mp-simple-text @enter="save"
							label="Hasta" ref="maxInput"
							helper="Indique el valor máximo."
							  v-model="itemValue"
								></mp-simple-text>
				</div>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
				<md-button @click="hide">Cancelar</md-button>
				<md-button class="md-primary" @click="save">Guardar</md-button>
      </md-dialog-actions>

		</md-dialog>
	</div>
</template>

<script>

import axios from 'axios';
import str from '@/common/js/str';

export default {
  name: 'ValuePopup',
	components: {
	},
  methods: {
		show(variable, customColors, item, previous, isLast) {
			this.variable = variable;
			this.item = item;
			this.customColors = customColors;
			this.itemValue = item.Value;
			this.isLast = isLast;
			this.previous = previous;
			if (previous !== null) {
				this.previousValue = previous.Value;
			}
			this.showDialog = true;
			setTimeout(() => {
				if (previous !== null) {
					this.$refs.minInput.focus();
				} else {
					this.$refs.maxInput.focus();
				}
			}, 100);
		},
		hide() {
			this.showDialog = false;
		},
		parseNumber(cad) {
			if (cad === null) {
				cad = '';
			}
			return parseFloat(str.Replace(cad + '', ",", "."));
		},
		save() {
			var max = Number.MAX_VALUE;
			var min = Number.MIN_VALUE;
			if (this.previous !== null) {
				if (this.previousValue === null ||
					(this.previousValue + '').trim() === '') {
					alert("Debe indicar un valor mínimo.");
					this.$refs.minInput.focus();
					return;
				}
				min = this.parseNumber(this.previousValue);
				if (isNaN(min)) {
					alert("Debe indicar un valor numérico.");
						this.$refs.minInput.focus();
						return;
				}
			}
			if (!this.isLast) {
				if (this.itemValue === null || (this.itemValue + '').trim() === '') {
					alert("Debe indicar un valor máximo.");
					this.$refs.maxInput.focus();
					return;
				}
				max = this.parseNumber(this.itemValue);
				if (isNaN(max)) {
					alert("Debe indicar un valor numérico.");
						this.$refs.minInput.focus();
						return;
				}
			}
			if (min >= max) {
				alert("El máximo debe ser mayor al mínimo.");
				this.$refs.maxInput.focus();
				return;
			}
			if (this.previous !== null) {
				this.previous.Value = this.previousValue;
			}
			if (!this.isLast) {
				this.item.Value = this.itemValue;
			}
			this.Dataset.ScaleGenerator.FixManualRanges(this.variable, this.customColors);
			this.hide();
		},
  },
	computed: {
		 Dataset() {
      return window.Context.CurrentDataset;
    },
	},
	data() {
		return {
			showDialog: false,
			itemValue: '',
			variable: null,
			customColors: null,
			previous: null,
			previousValue: null,
			isLast: false,
			item: null,
		};
	},
};
</script>

<style lang="scss">
</style>

