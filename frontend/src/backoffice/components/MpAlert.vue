<template>
	<md-dialog :md-click-outside-to-close="false" @md-closed="accept" class="zEnfasis"
						 :md-active.sync="dialog" @keyup.enter="accept()" @keyup.space="accept()">
		<md-dialog-title>{{ valueOrDefault(effectiveTitle, valueOrDefault(title, 'Atención')) }}</md-dialog-title>
		<md-dialog-content>
			<div>
				<p class='text-block'>{{ valueOrDefault(effectiveText, text) }}</p>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
			<md-button class="md-primary" @click="accept">{{ valueOrDefault(acceptText, 'Cerrar') }}</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>
<script>

	export default {
		name: 'MpAlert',
		methods: {
			show(text = null, title = null) {
				this.effectiveText = text;
				this.effectiveTitle = title;
				this.dialog = true;
				this.statusSent = false;
			},
			accept() {
				this.$emit('closed');
				this.statusSent = true;
				this.dialog = false;
			},
			valueOrDefault(value, def) {
				if (value) {
					return value;
				}
				return def;
			}
		},
		data() {
			return {
				dialog: false,
				effectiveText: null,
				effectiveTitle: null,
			};

		},
		props: {
			title: String,
			text: String,
			acceptText: String,
		},
	};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.text-block {
	white-space: pre-line;
}
.zEnfasis {
	z-index: 2002!important
}
</style>
