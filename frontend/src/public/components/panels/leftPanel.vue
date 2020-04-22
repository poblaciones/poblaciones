<template>
	<div v-if="open" class='left-panel' v-bind:style='{ width: panelWidth }'>
		<div v-on:click="doClose" class='fa fa-2x fa-times hand' style='float:right;margin:5px'></div>
		<div v-on:click="doToggle" class='fa fa-2x fa-caret-left hand left-arrow'
			  v-bind:class="{ 'fa-caret-left' : isCaretLeft, 'fa-caret-right': !isCaretLeft }"
			  v-bind:style='{ left: panelWidth }'></div>
	</div>
</template>

<script>

export default {
	name: 'leftPanel',
	// components: {
	// },
	data() {
		return {
			open: true,
			collapsed: false,
			panelWidth: '0',
		};
	},
	// created () {
	// },
	// beforeDestroy () {
	// },
	// mounted() {
	// },
	computed: {
		isCaretLeft() {
			return this.panelWidth != '0';
		},
	},
	methods: {
		doClose(e) {
			this.open = false;
			window.SegMap.SaveRoute.UpdateRoute();
		},
		doToggle(e) {
			this.collapsed = !this.collapsed;
			window.SegMap.SaveRoute.UpdateRoute();
		},
		updatePanel() {
			var mapType = document.getElementsByClassName('gmnoprint gm-style-mtc');
			var fav = document.getElementsByClassName('fab-wrapper');
			var search = document.getElementsByClassName('searchBar');

			if (!this.collapsed) {
				this.panelWidth = '300px';
				if (mapType.length) {
					mapType[0].style.left = '300px';
				}
				fav[0].style.left = '315px';
				search[0].style.left = '500px';
				search[0].style.width = 'calc(100% - 700px)';
			} else {
				this.panelWidth = '0';
				if (mapType.length) {
					mapType[0].style.left = '0';
				}
				fav[0].style.left = '15px';
				search[0].style.left = '300px';
				search[0].style.width = 'calc(100% - 500px)';
			}
		},
	},
		watch: {
			collapsed() {
				this.updatePanel();
			}
		}
};
</script>

<style scoped>
.left-panel {
	position:absolute;
	height:100%;
	width:300px;
	left:0;
	top:0;
	z-index:1;
	background-color: red;
}
.left-arrow {
	position:absolute;
	height:30px;
	width:30px;
	top:50px;
	left:300px;
	background-color:gold
}
</style>

