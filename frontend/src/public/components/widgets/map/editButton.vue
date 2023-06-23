<template>
	<div id="edit-button" :style="'background-color: ' + backgroundColor"
			 class="edit-button" title="Editar cartografía" @click="goEdit">
		<span data-v-ac5aa574="" aria-label="Descargar" role="img" class="material-design-icon pencil-icon">
			<svg fill="currentColor" style="width: 2em; height: 2em; margin-left: -10px;" class="material-design-icon__svg">
			<path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z">
				</path>
				</svg>

		</span>

	</div>
</template>

<script>
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';

export default {
	name: 'editButton',
	components: {
	},
	data() {
    return {

    };
  },
	props: [
		'work',
		'backgroundColor'
	],
    methods: {
		absoluteMap(url) {
			return str.AbsoluteUrl(url);
		},
		goEdit() {
			var id = this.work.Current.Id + '';
			id = id.substring(0, id.length - 2);
			var url = this.absoluteMap('/users/#/cartographies/' + id + '/content');
			window.open(url, '_blank');
		},
	},
};
</script>

<style scoped>
	.edit-button {
		border-radius: 10px;
		width: 40px;
		z-index: 1000;
		height: 40px;
		padding: 20px;
		background-color: rgb(0, 160, 210);
		color: white;
		position: relative;
		overflow: hidden;
		box-shadow: 0 6px 6px rgba(0, 0, 0, 0.10), 0 4px 4px rgba(0, 0, 0, 0.15);
		justify-content: center;
	}

	#edit-button {
		left: 15px!important;
		top: 25rem;
		cursor: pointer;
		position: fixed;
	}
</style>

