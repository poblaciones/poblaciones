<template>
	<div>
		<span v-if="fabMetrics.length > 0">
			<fab ref="vuefab" style="left: 15px!important"
					 icon-size="small"
					 z-index="1000000095"
					 :enable-rotation="false"
					 :position="position"
					 :bg-color="backgroundColor"
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
import fab from 'vue-fab';
import err from '@/common/js/err';

// https://github.com/PygmySlowLoris/vue-fab


export default {
	name: 'fabPanel',
	components: {
		fab
	},
	data() {
		return {
			action: {
				Metrics: []
			},
			fabMetrics: [],
			position: 'bottom-left',
		};
	},
	created () {
		window.addEventListener('keydown', this.keyProcess);
	},
	beforeDestroy () {
		window.removeEventListener('keydown', this.keyProcess);
	},
	// mounted() { },
	computed: {
		fabActions() {
			var ret = [];
			for(var n = 0; n < this.fabMetrics.length; n++) {
				var action = this.fabMetrics[n];
				var fabAction = { name: 'selected' + n, tooltip: action.Name, icon: action.Icon };
				ret.push(fabAction);
			}
			return ret;
		},
	},
	props: [
		'backgroundColor'
	],
	methods: {
		loadFabMetrics() {
			const loc = this;
			axios.get(window.host + '/services/metrics/GetFabMetrics', {
				params: { w: window.SegMap.Revisions.FabMetrics }
			}).then(function (res) {
				loc.fabMetrics = res.data;
			}).catch(function (error) {
				err.errDialog('LoadFabMetrics', 'obtener los indicadores de datos públicos', error);
			});
		},
		keyProcess(e) {
			if (e.key === "Escape") {
				if (this.$refs.vuefab.toggle) {
					this.$refs.vuefab.toggle = false;
				}
			}
		},
		selected(n) {
			this.action = this.fabMetrics[n];
			window.Popups.AddMetric.show(this.action.Metrics);
		}
	},
};
</script>

<style scoped>

</style>

