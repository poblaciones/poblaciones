<template>
	<div>
		<addMetric ref="addMetricPopup" :list="action.Metrics" v-on:selectedItem="metricSelected" />
		<span v-if="fabMetrics.length > 0">
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
					 @selected11="selected(11)"></fab>
		</span>
	</div>
</template>

<script>
import axios from 'axios';
import addMetric from '@/public/components/popups/addMetric';
import fab from 'vue-fab';
import err from '@/common/js/err';

// https://github.com/PygmySlowLoris/vue-fab


export default {
	name: 'fabPanel',
	components: {
		fab,
		addMetric
	},
	data(){
      return {
          bgColor: '#00A0D2',
					action: {
						Metrics: []
					},
					fabMetrics: [],
          position: 'bottom-left',
      };
  },
	mounted() {
		
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
					params: { w : window.SegMap.Revisions.FabMetrics }
				}).then(function (res) {
					loc.fabMetrics = res.data;
				}).catch(function (error) {
					err.errDialog('LoadFabMetrics', 'obtener los indicadores de datos públicos', error);
				});
		},
    selected(n){
			this.action = this.fabMetrics[n];
			this.$refs.addMetricPopup.show();
		},
		metricSelected() {
			var metric = this.$refs.addMetricPopup.selected;
			this.$refs.addMetricPopup.hide();
			window.SegMap.AddMetricById(metric.Id);
		}
  },
};
</script>

<style scoped>
	.fab-wrapper {
		z-index: unset!important;
	}
</style>

