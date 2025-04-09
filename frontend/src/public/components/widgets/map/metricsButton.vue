<template>
	<div>
		<span v-if="fabMetrics.length > 0">
			<fabButton ref="vuefab" style="left: 15px!important"
					 icon-size="small"
					 z-index="1000000095"
					 :enable-rotation="false"
					 :position="position"
					 :bg-color="backgroundColor"
					 :actions="fabActions"
					 :mainTooltip="mainTooltip"
					 @selectedPanel="selectedPanel"
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
					 @selected11="selected(11)">
			</fabButton>
		</span>
	</div>
</template>

<script>
import axios from 'axios';
import err from '@/common/framework/err';
import color from '@/common/framework/color';
import fabButton from '@/public/components/widgets/fabButton/fabButton';
import session from '@/common/framework/session';

export default {
	name: 'metricsButton',
	components: {
		fabButton,
	},
	data() {
		return {
			action: {
				Metrics: [],
			},
			fabMetrics: [],
			position: 'bottom-left',
			mainTooltip: "Agregar",
		};
	},
	created () {
		window.addEventListener('keydown', this.keyProcess);
	},
	beforeDestroy () {
		window.removeEventListener('keydown', this.keyProcess);
	},
	computed: {
		fabActions() {
			var ret = [];
			for(var n = 0; n < this.fabMetrics.length; n++) {
				var action = this.fabMetrics[n];
				var fabAction = {
					name: 'selected' + n, tooltip: action.Name,
					icon: action.Icon,
					items: action.Items
				};
				if (action.Intensity) {
					fabAction.color = color.ReduceColor("#10AADB" /*this.backgroundColor*/, action.Intensity);
					if (n == 0) {
						fabAction.color = "#DF613D";
					} else if (n == 1) {
						fabAction.color = "#EBA206";
					}
				}
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
			axios.get(window.host + '/services/metrics/GetFabMetrics', session.AddSession(window.host, {
				params: {
					w: window.SegMap.Signatures.FabMetrics,
					h: window.SegMap.Signatures.Suffix
				}
			})).then(function (res) {
				session.ReceiveSession(window.host, res);
				loc.fabMetrics = res.data;
				window.fabMetrics = res.data;
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
			if (e.key == "+" && e.shiftKey) {
				window.Popups.AddMetric.show(this.action.Items, null, this.action.Name);
			}
		},
		selectedPanel(item) {
			if (item.Type === 'B') {
				window.SegMap.AddBoundaryById(item.Id, item.Name);
			} else {
				window.SegMap.AddMetricById(item.Id);
			}
			this.$refs.vuefab.toggle = false;
		},
		selected(n) {
			this.action = this.fabMetrics[n];
			this.$refs.vuefab.toggle = false;
			window.Popups.AddMetric.show(this.action.Items, null, this.action.Name);
		}
	},
};
</script>

<style scoped>

</style>

