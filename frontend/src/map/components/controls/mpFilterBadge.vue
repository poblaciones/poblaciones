<template>
	<div class="filterElement"
			 :title="tooltip">
		{{ title }}
		<mp-close-button @click="onClose()" title="Quitar"
										 class="exp-hiddable-block filterElement-close" />
	</div>
</template>

<script>
import CloseIcon from 'vue-material-design-icons/Close.vue';


export default {
	name: 'mpFilterBadge',
	props: {
		tooltip: {
			type: String,
			default: ''
		},
		title: {
			type: String,
			default: ''
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
		margin-left: -3px;
	}
</style>

