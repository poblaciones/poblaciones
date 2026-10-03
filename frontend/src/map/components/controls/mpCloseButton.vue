<template>
	<button :title="title" class="mp-icon-btn mp-icon-btn--dismiss" @click="onClose" style="float: right">
		<span aria-hidden="true" style="margin-top: -3px">×</span>
	</button>

</template>

<script>


export default {
	name: 'mpCloseButton',
	props: {
		title: {
			type: String,
			default: 'Quitar'
		},
	},
	components: {

	},
	data() {
		return {
		};
	},
	methods: {
		onClose(e) {
			this.$emit('click', e);
		},
	},
};
</script>

<style scoped>
	.buttonMargin {
		margin-right: -2px;
		margin-top: -4px;
	}
</style>

