<template>
	<div v-on:click="doToggle" class='fa fa-2x hand left-arrow'
		  :class="{ 'fa-caret-left': !collapsed, 'fa-caret-right': collapsed }"
		  :style='{ left: left }'>
		<div class="border-left"></div>
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
			this.$emit('click');
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
	height: 48px;
	width: 23px;
	margin-left: 1px;
	top: 50px;
	font-size: 14px;
	padding-top: 17px;
  padding-right: 2px;
  color: #666;
	background: rgba(255,255,255,0.9);
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.3);
	z-index: 1;
}
.border-left {
	position: absolute;
	height: 48px;
	width: 1px;
	top: 0;
	background-color: #D4D4D4;
	left: -1px;
}
</style>

