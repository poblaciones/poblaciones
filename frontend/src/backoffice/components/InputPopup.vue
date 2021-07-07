<template>
	<md-dialog :md-active.sync="openDialog">
		<md-dialog-title>{{ title }}</md-dialog-title>
		<md-dialog-content>
			<div class='md-layout'>
				<div class='md-layout-item md-size-100 md-small-size-100'>
					{{ text }}.
					<mp-simple-text ref="inputName" :label="label" :helper="helper" @enter="save()" :maxlength="maxlength"
													placeholder="" v-model="result" />
				</div>
			</div>
		</md-dialog-content>
		<md-dialog-actions>
			<md-button @click="openDialog = false">Cancelar</md-button>
			<md-button class="md-primary" @click="save()">Aceptar</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>
<script>
	import Context from "@/backoffice/classes/Context";

	export default {
		name: "inputPopup",
		mounted() {

		},
		data() {
			return {
				label: '',
				title: '',
				text: '',
				result: '',
				helper: null,
				maxlength: -1,
				retCancel: true,
				openDialog: false
			};
		},
		props: {
		},
		computed: {
		},
		methods: {
			show(title, text, label, helper, result, maxlength) {
				this.title = title;
				this.text = text;
				this.label = label;
				this.result = result;
				this.helper = helper;
				this.maxlength = maxlength;
				this.openDialog = true;
				var loc = this;
				setTimeout(() => {
					loc.$refs.inputName.focus();
				}, 100);
			},
			save() {
				if (this.result.trim() == '') {
					return;
				}
				this.openDialog = false;
				this.retCancel = true;
				this.$emit('selected', this.result);
			},
		},
		components: {
		}
	};
</script>

<style lang="scss" scoped>
	.md-list {
		width: 400px;
		height: 200px;
		max-width: 100%;
		overflow-y: auto;
		padding: 0px;
		margin-top: 12px;
		display: inline-block;
		vertical-align: top;
		border: 1px solid rgba(#000, .12);
	}
	.md-list-item {
		border-bottom: 1px solid rgba(0, 0, 0, 0.12);
	}
	.md-list-item-content {
		display: unset;
	}
	.md-list-item-text :nth-child(1) {
		font-size: 13px;
		color: darkgrey;
	}
	.md-list-item-text :nth-child(2), .md-list-item-text :nth-child(3) {
		font-size: 16px;
		padding-top: 2px;
	}
</style>
