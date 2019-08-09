<template>
	<div>
		<div class="btn-group pull-right" style="clear:both">
      <h4 class="title">
        <button title="Quitar" type="button" class="close buttonMargin" v-on:click="clickQuitar">
          <close-icon title="Quitar"/>
        </button><br/>
        <button title="Opciones" type="button" class="close buttonMargin"
                v-on:click="clickCustomize" style="margin-top: 4px; margin-right: 1px; font-size: 15px">
					<dots-vertical-icon title="Opciones"/>
        </button>
      </h4>
		</div>
		<div>
			<customize ref="customize" />
		</div>
	</div>
</template>

<script>
import Customize from '@/public/components/popups/customizePopup';
import CloseIcon from 'vue-material-design-icons/Close.vue';
import DotsVerticalIcon from 'vue-material-design-icons/DotsVertical.vue';

// https://materialdesignicons.com/cdn/1.9.32/

export default {
	name: 'metricTopButtons',
	props: [
		'metric',
		'clipping',
	],
	components: {
		Customize,
    DotsVerticalIcon,
    CloseIcon
	},
	data() {
		return {
			work: {},
		};
	},
	methods: {
		addMetric(id) {
			window.SegMap.AddMetricById(id);
		},
		clickCustomize(e) {
			e.preventDefault();
			this.$refs.customize.show(this.metric);
		},
		clickQuitar(e) {
			e.preventDefault();
			this.metric.Remove();
		},
	},
};

</script>

<style scoped>
  .vellipsis:after {
  content: '\2807';
  font-size: .8em;
  }

.buttonMargin {
  margin-right: -2px;
  margin-top: -4px;
}

</style>
