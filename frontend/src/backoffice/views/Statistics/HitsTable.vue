<template>
	<div class="md-layout">
		<div class="md-layout-item md-size-80 md-xlarge-size-50 md-small-size-100">
			<md-table v-model="list" md-sort="LastQuarter" md-sort-order="asc" md-card="">
				<md-table-row slot="md-table-row" slot-scope="{ item }">
					<md-table-cell :md-label="label" md-sort-by="Caption">{{ item.Caption }}</md-table-cell>
					<md-table-cell md-label="90 días" md-sort-by="LastQuarter">{{ item.LastQuarter }}</md-table-cell>
					<md-table-cell md-label="30 días" md-sort-by="LastMonth">{{ item.LastMonth }}</md-table-cell>
					<md-table-cell md-label="7 días" md-sort-by="LastWeek">{{ item.LastWeek }}</md-table-cell>
				</md-table-row>
			</md-table>
		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import str from '@/common/framework/str';

export default {
	name: 'HitsTable',
	props: {
		label: String,
		list: Array,
	},
	computed: {

	},
	mounted() {
	},
	methods: {

	},
	components: {

	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>


</style>
