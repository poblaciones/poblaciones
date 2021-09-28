<template>
	<div class='md-layout md-gutter'>
		<div class='md-layout-item md-size-70 md-small-size-100'>
			<md-field>
				<label for="state">Latitud</label>
				<md-select v-model="value.latitude" md-dense>
					<md-option v-for="column in Dataset.GetNumericAndTextColumns()" :class="(column.Separator ? 'mpSeparator' : '')"
										 :key="column.Id" :value="column.Id">{{ formatColumn(column) }}</md-option>
				</md-select>
			</md-field>
		</div>
		<div class='md-layout-item md-size-70 md-small-size-100'>
			<md-field>
				<label for="state">Longitud</label>
				<md-select v-model="value.longitude" md-dense>
					<md-option v-for="column in Dataset.GetNumericAndTextColumns" :class="(column.Separator ? 'mpSeparator' : '')"
										 :key="column.Id" :value="column.Id">{{ formatColumn(column) }}</md-option>
				</md-select>
			</md-field>
		</div>
	</div>
</template>

<script>

import f from '@/backoffice/classes/Formatter';

export default {
	name: 'LatLongSelection',
	components: {
	},
	computed: {
		Dataset() {
			return window.Context.CurrentDataset;
		},
		Work() {
			return window.Context.CurrentWork;
		},
	},
	props: {
		value: { type: Object }
	},
	mounted() {

	},
	data() {
		return {

		};
	},
	methods: {
		formatColumn(column) {
			return f.formatColumn(column);
		},
	},
};
</script>


<style rel='stylesheet/scss' lang='scss' scoped>
</style>

