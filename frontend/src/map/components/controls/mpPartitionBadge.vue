<template>
	<div style="padding-top: 8px;" v-if="LevelHasPartitions">
		<mp-dropdown-menu variant="pill" :items="List" :label="selected" :floatRight="false"
											icon="fas fa-caret-down exp-hiddable-visiblity"
											:tooltip="metric.SelectedLevel().Partitions.Name" @itemClick="itemSelected" />
	</div>
</template>

<script>

export default {
	name: 'mpPartitionBadge',
	props: [
		'metric'
	],
	components: {

	},
	computed: {
		LevelHasPartitions() {
			var level = this.metric.SelectedLevel();
			return !!(level && level.Partitions);
		},
		List() {
			if (!this.LevelHasPartitions) {
				return null;
			}
			var ret = [];
			for (var partition of this.metric.SelectedLevel().Partitions.Values) {
				ret.push({ key: partition.Value, label: partition.Caption });
			}
			return ret;
		},
		// Etiqueta del valor vigente. Es derivada, no un dato propio: el nivel
		// seleccionado cambia con el zoom, y summaryPanel usa el índice del
		// array como key del v-for, así que Vue reusa esta instancia entre
		// métricas distintas. Calcularla una sola vez la dejaría desfasada.
		selected() {
			var vals = this.List;
			if (!vals || vals.length === 0) {
				return '-';
			}
			var sel = this.metric.GetSelectedPartition();
			for (var n of vals) {
				if (n.key === sel) {
					return n.label;
				}
			}
			// Siempre hay un valor vigente: si el guardado no está entre los
			// posibles rige el primero, igual que en GetSelectedPartition.
			return vals[0].label;
		},
	},
	methods: {
		itemSelected(item) {
			this.changeValue(item.key);
		},
		changeValue(mode) {
			this.metric.properties.SelectedPartition = mode;
			window.SegMap.SaveRoute.UpdateRoute();
			window.SegMap.UpdateMap();
		},
	},
};
</script>
