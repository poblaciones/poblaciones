<template>
	<div class="fsButton" id="fsButton" title="Pantalla completa" @click="goFullScreen">
		<arrow-expand-icon class="bt" title="Pantalla completa" v-if="!fullscreen" />
		<arrow-collapse-icon class="bt" v-else title="Salir del modo de pantalla completa" />
	</div>
</template>

<script>
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';
	import ArrowExpandIcon from 'vue-material-design-icons/ArrowExpand.vue';
	import ArrowCollapseIcon from 'vue-material-design-icons/ArrowCollapse.vue';

export default {
	name: 'fsButton',
	components: {
		ArrowExpandIcon,
		ArrowCollapseIcon
	},
	data() {
    return {
    };
  },
		props: {
			fullscreen: false,
		},
   methods: {
		goFullScreen() {
			 window.ToggleFullscreen();
		},
	},
};
</script>

<style scoped>
	.bt {
		margin-top: -2px;
		margin-bottom: 3px;
		margin-right: 1px;
		margin-left: 1px;
	}
	.fsButton {
		z-index: 900;
		position: absolute;
		right: 55px;
		border: 1px solid rgb(165 164 164 / 50%) !important;
		bottom: 24px;
		font-size: 16px;
		padding: 6px 0px 0px 5px;
		width: 30px;
		height: 30px;
		cursor: pointer;
		color: #5a5858;
		background-color: #fbfbfb;
		border-radius: 50%;
		-webkit-tap-highlight-color: rgba(51, 181, 229, 0.4);
	}
		.fsButton:hover, fsButton:focus {
			background-color: #f4f4f4;
		}

</style>

