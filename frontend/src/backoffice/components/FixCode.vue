<template>
	<md-dialog :md-active.sync="openPopup">
		<md-dialog-title>
			Corregir valor
		</md-dialog-title>

		<md-dialog-content>
			<div>
				<p>
				Indique el nuevo valor para el código.
				</p>
				<div style="margin-top: 20px; margin-bottom: -10px">
					<div class="md-layout md-gutter">
						<div class="md-layout-item md-size-30">
							<mp-simple-text
								label="Código" ref="input" @enter="save" v-model="newValue" />
						</div>
					</div>
				</div>
			</div>
		</md-dialog-content>

		<md-dialog-actions>
			<div>
				<md-button @click="openPopup = false">Cancelar</md-button>
				<md-button class="md-primary" @click="save()">Aceptar</md-button>
			</div>
		</md-dialog-actions>
	</md-dialog>
</template>

<script>
import h from '@/map/js/helper';

export default {
	name: 'fixValue',
  components: {

  },
	mounted() {

	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
	},
	methods: {
		show(value) {
			var loc = this;
			this.openPopup = true;
		  setTimeout(() => {
				loc.$refs.input.focus();
		  }, 75);
			this.newValue = value;
		},
		save() {
			this.$emit('fixed');
			this.openPopup = false;
		},
	},
	props: {
  },
	data() {
		return {
			newValue: null,
			openPopup: false,
		};
	},
};
</script>
