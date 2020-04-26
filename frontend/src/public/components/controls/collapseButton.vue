<template>
	<div v-on:click="doToggle" class='fa fa-2x hand left-arrow'
		  :class="{ 'fa-caret-left': !collapsed, 'fa-caret-right': collapsed }"
		  :style='{ left: left }'>
	</div>
</template>

<script>
export default {
	name: 'collapseButton',
	props: [
		'collapsed',
	],
	data() {
		return {
			left: '300px',
		};
	},
	computed: {
		onLoc() {
			return '300px';
		},
		offLoc() {
			return 0;
		},
	},
	methods: {
		doToggle() {
			this.$parent.doToggle();
		},
	},
	watch: {
		collapsed() {
			if(this.collapsed) {
				this.left = this.offLoc;
			} else {
				this.left = this.onLoc;
			}
		},
	},
};
</script>

<style scoped>
.left-arrow {
	position:absolute;
	height:30px;
	width:30px;
	top:50px;
	left:300px;
	background-color:gold;
	z-index: 1;
}
</style>

