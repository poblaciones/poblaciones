<template>
	<div>
		<div class="btn-group pull-right exp-hiddable-unset" style="clear:both; margin-top: 2px">
			<h5 class="title">
				<mp-close-button @click="clickQuitar" title="Quitar" class="exp-hiddable-block" v-if="!boundary.IsLocked" />

				<button title="Opciones" type="button" class="close "
								@click="clickCustomize" style="margin-right: 6px; margin-left: -2px; margin-top: 4px; font-size: 1.2rem">
					<i class="fas fa-sliders-h"></i>
				</button>

			</h5>
		</div>
	</div>
</template>

<script>
import Mercator from '@/public/js/Mercator';

// https://materialdesignicons.com/cdn/1.9.32/

export default {
	name: 'boundaryTopButtons',
	props: [
		'boundary',
	],
	components: {

	},
	data() {
		return {
			work: {},
		};
	},
	methods: {
		clickCustomize(e) {
			e.preventDefault();
			window.Popups.BoundaryCustomize.show(this.boundary);
		},
		clickQuitar(e) {
			e.preventDefault();
			this.boundary.Remove();
		},
	},
	computed: {
		Use() {
			return window.Use;
		},
	}
};
</script>

<style scoped>
  .vellipsis:after {
  content: '\2807';
  font-size: .8em;
  }

.activeButton {
	opacity: .45;
}

.filterDropdownButton {
	font-size: 11px;
	margin-left: -5px;
	margin-right: 3px;
}

.dropFilter {
  margin-top: 0px;
	cursor: pointer;
}
</style>
