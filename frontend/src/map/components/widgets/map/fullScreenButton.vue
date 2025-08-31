<template>
	<div class="fsButton" id="fsButton" title="Pantalla completa" @click="goFullScreen">
		<fullscreen-icon class="bt"  title="Pantalla completa" v-if="!fullscreen" />
		<fullscreen-exit-icon class="bt" v-else title="Salir del modo de pantalla completa" />

	</div>
</template>

<script>
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';
	import FullscreenIcon from 'vue-material-design-icons/Fullscreen.vue';
	import FullscreenExitIcon from 'vue-material-design-icons/FullscreenExit.vue';

export default {
	name: 'fsButton',
	components: {
		FullscreenIcon,
		FullscreenExitIcon
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
		line-height: .8em;
		bottom: 24px;
		font-size: 1.8em;
		cursor: pointer;
		color: #5a5858;
		background-color: #fbfbfb;
		box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
		background-clip: padding-box;
		border-radius: 2px;
		-webkit-tap-highlight-color: rgba(51, 181, 229, 0.4);
	}
		.fsButton:hover, fsButton:focus {
			background-color: #f4f4f4;
		}

</style>

