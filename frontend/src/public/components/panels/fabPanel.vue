<template>
	<span v-if="fabMetrics.length > 0">
			<Modal class="panel card" title="Agregar fuente pública" ref="showPopup" :showCancel="false"
						 :showOk="false">
				<addMetric v-if="action" ref="addMetric" :list="action.Metrics" v-on:selectedItem="metricSelected" />
			</Modal>
		<fab style="left: 15px!important"
					icon-size="small"
					z-index="1000000095"
				 :enable-rotation="false"
			 :position="position"
			 :bg-color="bgColor"
			 :actions="fabActions"

				@selected0="selected(0)"
				@selected1="selected(1)"
				@selected2="selected(2)"
				@selected3="selected(3)"
				@selected4="selected(4)"
				@selected5="selected(5)"
				@selected6="selected(6)"
				@selected7="selected(7)"
				@selected8="selected(8)"
				@selected9="selected(9)"
				@selected10="selected(10)"
				@selected11="selected(11)"
		></fab>

	</span>
</template>

<script>
import axios from 'axios';
import addMetric from '@/public/components/popups/addMetric';
import Modal from '@/public/components/popups/modal';
import h from '@/public/js/helper';
import fab from 'vue-fab';
import err from '@/common/js/err';

// https://github.com/PygmySlowLoris/vue-fab


export default {
	name: 'fabPanel',
	components: {
		fab,
		Modal,
		addMetric
	},
	data(){
      return {
          bgColor: '#00A0D2',
					action: null,
					fabMetrics: [],
          position: 'bottom-left',
      };
  },
	mounted() {
		this.loadFabMetrics();
	},
	computed: {
		fabActions() {
			var ret = [];
			for(var n = 0; n < this.fabMetrics.length; n++) {
				var action = this.fabMetrics[n];
				var fabAction = { name: 'selected' + n, tooltip: action.Name, icon: action.Icon };
				ret.push(fabAction);
			}
			return ret;
		}
	},
  methods:{
		loadFabMetrics() {
			const loc = this;
				axios.get(window.host + '/services/metrics/GetFabMetrics', {
					params: { }
				}).then(function (res) {
					loc.fabMetrics = res.data;
				}).catch(function (error) {
					err.errDialog('LoadFabMetrics', 'obtener los indicadores de datos públicos', error);
				});
		},
    selected(n){
			this.action = this.fabMetrics[n];
			this.$refs.showPopup.show();
		},
		metricSelected() {
			var metric = this.$refs.addMetric.selected;
			this.$refs.showPopup.hide();
			window.SegMap.AddMetricById(metric.Id);
		}
  },
};
</script>

<style scoped>
#map {
	height: 100%;
	width: 100%;
}
</style>

