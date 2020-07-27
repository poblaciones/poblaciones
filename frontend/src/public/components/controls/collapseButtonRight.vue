<template>
	<div
		id="collapseButtonRight"
		v-on:click="doToggle" :title="tooltipText"
		class="fa fa-2x hand right-arrow"
		:class="{ 'fa-caret-right': !collapsed, 'fa-caret-left': collapsed }"
		:style="{ right: '0px' }"
	>
		<div class="border-right"></div>
	</div>
</template>

<script>
export default {
	name: "collapseButtonRight",
	props: ["collapsed", "tooltip"],
	data() {
		return {
		};
	},
	computed: {
		tooltipText() {
			var inicio = (this.collapsed ? 'Mostrar' : 'Ocultar');
			if (this.tooltip) {
				inicio += ' ' + this.tooltip;
			}
			return inicio;
		}
	},
	methods: {
		doToggle(e) {
			e.preventDefault();
			this.$emit("click", e);
		}
	}
};
</script>

<style scoped>
.right-arrow {
	position: absolute;
	height: 48px;
	width: 23px;
	top: 55px;
	font-size: 14px;
	padding-top: 17px;
	padding-left: 5px;
	color: #666;
	background: rgba(255, 255, 255, 0.9);
	box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.3);
	z-index: 1;
}
.border-left {
	position: absolute;
	height: 48px;
	width: 1px;
	top: 0;
	background-color: #d4d4d4;
	left: -1px;
}
</style>

