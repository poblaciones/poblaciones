<template>
	<div>
		<div class="listContainer">
			<table class="localTable">
				<tbody>
					<tr style="font-size: 1.2em">
						<td style="width: 390px">Indicador</td>
						<td style="width: 130px" align="center">Ediciones</td>
					</tr>
				</tbody>
			</table>
			<div style="height: 240px; width: 540px; overflow: auto;
					 border: 1px solid #e2e2e2;">
			<table class="localTable">
				<tbody>
					<tr v-for="(item, index) in list" @mouseover="selected = item"
							 @mouseleave="leave(item)"
							@click="select(item)" :key="item.Id"
							:class="(index < list.length - 1 ? 'metricrowborder ' : '') + ' hand ' + (selected === item ? 'selectedRow' : '')">
						<td class="metricCell" style="width: 390px">{{ item.Name }}</td>
						<td class="metricCell" align="center" style="width: 150px">{{ joinVersions(item.Versions) }}</td>
					</tr>
				</tbody>
			</table>
			</div>
		</div>
	</div>
</template>


<script>
import h from '@/public/js/helper';

export default {
	name: 'addMetricPopup',
	data() {
		return {
			selected: null
		};
	},
	props: [
		'list',
	],
	components: {
 },
  methods: {
		leave(item) {
			if (this.selected === item) {
				this.selected = null;
			}
		},
		select(item) {
			this.selected = item;
			if (item !== null) {
				this.$nextTick(() => {
					this.$emit('selectedItem');
				});
			}
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
.metricCell {
	padding-top: 10px;
	padding-bottom: 10px;

}
.listContainer {
	padding-left: 15px; padding-right: 15px; margin-bottom: 8px;
}

.selectedRow {
	background-color: #efefef;
	}
</style>
