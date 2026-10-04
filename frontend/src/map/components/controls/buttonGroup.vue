<template>

	<div class="mp-btn-group">
		<button type="button" v-for="value, key in items"
						@click="change(value)"
						class="mp-btn" :key="key" :class="getActive(value)" :aria-pressed="$ariaPressed(isSelected(value))">
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
		isSelected(v) {
			return v === this.value;
		},
		getActive(v) {
			if (this.isSelected(v)) {
				return ' is-selected';
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

