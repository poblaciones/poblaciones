<template>
	<md-dialog :md-click-outside-to-close="false" @md-closed="cancel"
        :md-active.sync="dialog" @keyup.enter="confirm()" @keyup.space="confirm()">
		<md-dialog-title>{{ valueOrDefault(title, 'Confirmación') }}</md-dialog-title>
		<md-dialog-content>
			<div>
				<p>{{ text }}</p><p>{{ valueOrDefault(question, '¿Está seguro de que desea hacer esto?') }}</p>
			</div>
		</md-dialog-content>

		<md-dialog-actions>
			<md-button @click="cancel">{{ valueOrDefault(cancelText, 'Cancelar') }}</md-button>
			<md-button class="md-primary" @click="confirm">{{ valueOrDefault(confirmText, 'Aceptar') }}</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>

<script>

export default {
  name: 'MpConfirm',
  components: {

	},
	methods:  {
		show() {
			this.dialog = true;
			this.statusSent = false;
		},
		confirm() {
			this.$emit('confirm');
			this.statusSent = true;
			this.dialog = false;
		},
		cancel() {
			if (!this.statusSent) {
				this.$emit('cancel');
				this.statusSent = true;
				this.dialog = false;
			}
		},
		valueOrDefault(value, def) {
			if (value) {
				return value;
			} else {
				return def;
			}
		}
  },
	data() {
		return {
			dialog: false
		};

	},
  props: {
    title: String,
    text: String,
		question: String,
    confirmText: String,
    cancelText: String
  },
};
</script>
