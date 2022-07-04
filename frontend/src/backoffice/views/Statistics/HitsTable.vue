<template>
	<div class="md-layout">
		<div class="md-layout-item md-size-80 md-xlarge-size-50 md-small-size-100">
			<md-table v-model="list" md-sort="Values0" md-sort-order="desc" md-card="" v-if="!loading && list.length > 0">
				<md-table-row slot="md-table-row" slot-scope="{ item }">
					<md-table-cell :md-label="label" md-sort-by="Caption">{{ item.Caption }}</md-table-cell>
					<template v-for="(period, index) in periods">
						<md-table-cell :md-label="dateFormatter.FormatLabelMonth(period, false)" :key="period" :md-sort-by="'Values' + index">{{ item['Values' + index] }}</md-table-cell>
					</template>
				</md-table-row>
			</md-table>
			<div v-else v-show="showMessageOnEmpty">
				<span v-if="!loading">
					No hay actividad registrada para este período.
				</span>
			</div>
		</div>
	</div>
</template>

<script>
import Context from '@/backoffice/classes/Context';
import f from '@/backoffice/classes/Formatter';
import date from '@/common/framework/date';

export default {
	name: 'HitsTable',
	props: {
		label: String,
		list: Array,
		showMessageOnEmpty: { type: Boolean, default: true},
		loading: { type: Boolean, default: false },
		periods: Array
	},
	computed: {
		dateFormatter() {
			return date;
		}
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
