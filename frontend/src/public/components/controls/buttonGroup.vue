<template>

	<div class="btn-group">
		<button type="button" v-for="value, key in items"
						v-on:mouseup="change(value)"  v-on:click="change(value)" class="btn btn-default btn-xs" :key="key" :class="getActive(value)">
			{{ key }}
		</button>
	</div>
</template>

<script>
export default {
	name: 'buttonGroup',
		props: {
			items: {
				type: Object, default: function () {
					return {};
				}
			},
			value: null
		},
	data() {
		return {
			left: 0,
		};
	},
	mounted() {
	},
	computed: {
	},
	methods: {
		getActive(v) {
			if (v === this.value) {
				return ' active';
			} else {
				return '';
			}
		},
		change(value) {
			this.$emit('input', value);
			this.$emit('change', value);

		}
	},
	watch: {

		},
};
</script>

<style scoped>
</style>

