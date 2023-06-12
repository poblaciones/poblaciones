<template>
	<div :class="transitioning">
		<slot></slot>
	</div>
</template>

<script>

export default {
	name: 'MpInput',
	components: {

	},
	mounted() {
	},
	props: {
	},
	data() {
		return {
			trans: false,
		};
	},
	computed: {
		transitioning() {
			return (this.trans ? ' transitioning' : '');
		}
	},
	methods: {
		Start() {
			this.trans = true;
		},
		Stop() {
			this.trans = false;
		}
	}
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>

.transitioning {
	opacity: .6;
	pointer-events: none;
}

</style>
