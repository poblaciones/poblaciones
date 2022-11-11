<template>
	<div class="dropdown" style="padding-top: 8px;" v-if="LevelHasPartitions">
		<button class="dropdown-soft btn btn-xs btn-default dropdown-toggle" :title="metric.SelectedLevel().Partitions.Name"
						type="button" id="dropdownMenuButton" data-toggle="dropdown"
						aria-haspopup="true" aria-expanded="false">
			{{ selected }}<span class="exp-hiddable-visiblity arrow"></span>
		</button>
		<ul aria-labelledby="dropdownMenuButton" class="dropdown-menu dropPartitionFilter">
			<li v-for="(value, key) in this.List" :key="key" :class="(value.border ? 'liDividerNext' : '')">
				<a @click="changeValue(key)">
					{{ value.label }}
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
	data() {
		return {
			selected: ''
		};
	},
	mounted() {
		this.updateSelected();
	},
	computed: {
		LevelHasPartitions() {
			var level = this.metric.SelectedLevel();
			return level && level.Partitions !== null;
		},
		List() {
			if (!this.LevelHasPartitions) {
				return null;
			}
			var ret = {};
			for (var partition of this.metric.SelectedLevel().Partitions.Values) {
				ret[partition.Value] = { label: partition.Caption };
			}
			return ret;
		},
	},
	methods: {
		changeValue(mode) {
			this.metric.properties.SelectedPartition = mode;
			this.updateSelected();
			window.SegMap.SaveRoute.UpdateRoute();
			window.SegMap.UpdateMap();
		},
		updateSelected() {
			if (this.List === null) {
				this.selected = '-';
				return;
			}
			var sel = this.metric.GetSelectedPartition();
			if (!sel) {
				var vals = this.List;
				if (!vals || vals.length === 0) {
					this.selected = '-';
					return;
				} else {
					sel = Object.keys(vals)[0];
				}
			}
			this.selected = this.List[sel].label;
		}
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

