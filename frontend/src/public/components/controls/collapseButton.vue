<template>
	<div @click="doToggle" class='fa fa-2x hand left-arrow' :title="tooltipText"
		  :class="{ 'fa-caret-left': !collapsed, 'fa-caret-right': collapsed }"
		  :style="{ left: left + 'px' }">
		<div class="border-left"></div>
	</div>
</template>

<script>
export default {
	name: 'collapseButton',
	props: [
		'collapsed',
		'startLeft',
		'tooltip'
	],
	data() {
		return {
			left: 0,
		};
	},
	mounted() {
		this.left = this.startLeft;
	},
	computed: {
		tooltipText() {
			var inicio = (this.collapsed ? 'Mostrar' : 'Ocultar');
			if (this.tooltip) {
				inicio += ' ' + this.tooltip;
			}
			return inicio;
		},
		onLoc() {
			return this.startLeft;
		},
		offLoc() {
			return 0;
		},
	},
	methods: {
		doToggle(e) {
			e.preventDefault();
			this.$emit('click', e);
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
	top: 65px;
	font-size: 14px;
	padding-top: 17px;
  padding-right: 2px;
  color: #666;
	background: rgba(255,255,255,0.9);
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.3);
	z-index: 800;
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

