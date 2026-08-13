<template>
	<div class="dropdown" style="padding-top: 8px;" v-if="LevelHasPartitions">
		<button class="dropdown-soft btn btn-xs btn-default dropdown-toggle" :title="metric.SelectedLevel().Partitions.Name"
						type="button" id="dropdownMenuButton" data-toggle="dropdown"
						aria-haspopup="true" aria-expanded="false">
			{{ selected }}<span class="exp-hiddable-visiblity arrow"></span>
		</button>
		<ul aria-labelledby="dropdownMenuButton" class="dropdown-menu dropPartitionFilter">
			<li v-for="ele in this.List" :key="ele.key">
				<a @click="changeValue(ele.key)">
					{{ ele.label }}
				</a>
			</li>
		</ul>

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
		changeValue(mode) {
			this.metric.properties.SelectedPartition = mode;
			window.SegMap.SaveRoute.UpdateRoute();
			window.SegMap.UpdateMap();
		},
	},
};
</script>

<style scoped>

	.dropPartitionFilter {
		margin-top: 3px;
		cursor: pointer;
	}
	.arrow {
		display: inline-block;
		margin-left: 0.255em;
		vertical-align: 0.255em;
		content: "";
		border-top: 0.3em solid;
		border-right: 0.3em solid transparent;
		border-bottom: 0;
		border-left: 0.3em solid transparent;
	}
	.dropdown-soft {
		border-width: 0px;
		font-size: 14px;
		padding-left: 10px;
		padding-right: 10px;
		padding-bottom: 1px;
	}
	.dropdown-soft:hover, .dropdown-soft:focus {
		color: #333;
		background-color: #d4d4d4;
	}
</style>

