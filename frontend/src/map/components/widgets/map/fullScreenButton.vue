<template>
	<div class="fsButton inMapButton" id="fsButton" title="Pantalla completa" @click="goFullScreen">
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
		right: 53px;
		bottom: 24px;
	}

</style>

