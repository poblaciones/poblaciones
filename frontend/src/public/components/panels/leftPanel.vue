<template>
	<div v-if="open" class='left-panel' v-bind:style='{ width: panelWidth }'>
		<div v-on:click="doClose" class='fa fa-2x fa-times hand' style='float:right;margin:5px'></div>
		<div v-on:click="doToggle" class='fa fa-2x fa-caret-left hand left-arrow'
			  v-bind:class="{ 'fa-caret-left' : isCaretLeft, 'fa-caret-right': !isCaretLeft }"
			  v-bind:style='{ left: panelWidth }'></div>
		<div>
			<span v-html="panel"></span>
		</div>
	</div>
</template>

<script>

export default {
	name: 'leftPanel',
	// components: {
	// },
	data() {
		return {
			open: false,
			panelWidth: '300px',
			container: '',
			panel: '',
			panels: [],
		};
	},
	// created () {
	// },
	// beforeDestroy () {
	// },
	mounted() {
		if(this.panelWidth != '0') {
			this.doToggle();
		}
	},
	computed: {
		isCaretLeft() {
			return this.panelWidth != '0';
		},
	},
	methods: {
		Toggle() {
			this.doToggle();
		},
		Close() {
			this.doClose();
		},
		Add(panel) {
			panel.$mount();
			if(this.open == false) {
				this.open = true;
				this.doToggle();
			}
			const i = this.panels.findIndex(function(el) {
				return panel.fid === el.fid;
			});
			if(i > -1) {
				this.panels.splice(i, 1);
			}
			this.panels.push(panel);
			this.showPanel();
		},
		showPanel() {
			const top = this.panels[this.panels.length - 1];
			this.panel = top.$el.outerHTML;
		},
		doClose() {
			if(this.panels.length > 1) {
				this.panels.pop();
				this.showPanel();
				return;
			}
			if(this.panelWidth != '0') {
				this.doToggle();
			}
			this.open = false;
		},
		doToggle() {
			var mapType = document.getElementsByClassName('gmnoprint gm-style-mtc');
			var fav = document.getElementsByClassName('fab-wrapper');
			var search = document.getElementsByClassName('searchBar');
			if(this.panelWidth == '0') {
				this.panelWidth = '300px';
				mapType[0].style.left = '300px';
				fav[0].style.left = '315px';
				search[0].style.left = '500px';
				search[0].style.width = 'calc(100% - 700px)';
				this.showPanel();
			} else {
				this.panel = '';
				this.panelWidth = '0';
				mapType[0].style.left = '0';
				fav[0].style.left = '15px';
				search[0].style.left = '300px';
				search[0].style.width = 'calc(100% - 500px)';
			}
		},
	},
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

