<template>
	<Modal :title="title" ref="showPopup" :showCancel="false" :showOk="false" :backgroundColor="backgroundColor">
		<div v-if="list">
			<div class="listContainer">
				<div style="height: 240px; overflow: auto;
					 border: 1px solid #e2e2e2;">
					<table class="localTable">
						<tbody>
							<tr v-for="(item, index) in list" @mouseover="selected = item"
									@mouseleave="leave(item)"
									@click="select(item)" :key="item.Id"
									:class="[(index < list.length - 1 ? 'metricrowborder ' : ''), 'hand',
														(selected === item ? 'selectedRow' : ''), (item.Header ? 'row-header' : '')]">
								<td :colspan="(item.Header ? 2 : 1)" class="metricCell" style="width: 396px">{{ item.Name }}</td>
								<td v-if="!item.Header" class="metricCell" align="center" style="width: 150px">{{ joinVersions(item.Versions) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</Modal>
</template>


<script>
import h from '@/public/js/helper';
import Modal from '@/public/components/popups/modal';

export default {
	name: 'addMetricPopup',
	data() {
		return {
			list: [],
			workId: null,
			selected: null,
			title: ''
		};
	},
	props: [
		'backgroundColor'
	],
	components: {
		Modal
 },
  methods: {
		leave(item) {
			if (this.selected === item) {
				this.selected = null;
			}
		},
		select(metric) {
			this.selected = metric;
			if (metric !== null) {
				this.hide();
				if (this.workId) {
					window.SegMap.AddMetricByIdAndWork(metric.Id, this.workId);
				} else {
					window.SegMap.AddMetricById(metric.Id);
				}
			}
		},
		show(list, workId, title) {
			if (!list) {
				list = [];
			}
			this.title = (title ? title : 'Agregar indicador');
			this.workId = workId;
			this.list = list;
			this.$refs.showPopup.show();
		},
		hide() {
			this.$refs.showPopup.hide();
		},
		joinVersions(versions) {
			var ret = '';
			for(var n = 0; n < versions.length; n++) {
				if (ret !== '') ret += ', ';
				ret += versions[n].Name;
			}
			return ret;
		}
	},
	computed: {
	}
};
</script>

<style scoped>

.metricrowborder {
	border-bottom: 1px solid #e2e2e2;
}

.row-header {
  background-color: #efefef;
  text-transform: uppercase;
  font-size: 1.2rem;
	pointer-events: none;
}

.row-header > td {
	padding: 2px 6px;
}

.metricCell {
	padding-top: 10px;
	padding-bottom: 10px;

}
.listContainer {
	padding: 15px;
}

.selectedRow {
	background-color: #66615b;
	color: hsla(0,0%,100%,.7);
}
</style>
