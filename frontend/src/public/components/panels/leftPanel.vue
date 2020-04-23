<template>
	<div v-if="open" class='left-panel' v-bind:style='{ width: panelWidth }'>
		<div v-on:click="doClose" class='fa fa-2x fa-times hand' style='float:right;margin:5px'></div>
		<div v-on:click="doToggle" class='fa fa-2x fa-caret-left hand left-arrow'
			  v-bind:class="{ 'fa-caret-left' : isCaretLeft, 'fa-caret-right': !isCaretLeft }"
			  v-bind:style='{ left: panelWidth }'></div>

		<div>
			<InfoPanel v-bind:dt="dt" v-if="typeInfo"/>
		</div>
	</div>
</template>

<script>
import InfoPanel from '@/public/components/panels/infoPanel';
import PanelType from '@/public/enums/PanelType';

export default {
	name: 'leftPanel',
	components: {
		InfoPanel,
	},
	data() {
		return {
			open: true,
			collapsed: false,
			panelWidth: '300px',
			container: '',
			panels: [],
			dt: {},
			typeInfo: false,
		};
	},
	// created () {
	// },
	// beforeDestroy () {
	// },
	mounted() {
		this.updatePanel();
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
		Add(dt) {
			if(this.open == false) {
				this.open = true;
				this.doToggle();
			}
			const index = this.panels.findIndex(function(el) {
				return dt.fid === el.fid;
			});
			if(index > -1) {
				this.panels.splice(index, 1);
			}
			this.panels.push(dt);
			this.showPanel();
		},
		showPanel() {
			const top = this.panels[this.panels.length - 1];
			// this.panel = top.$el.outerHTML;
			this.dt = top;
			if(this.dt.type == PanelType.InfoPanel) {
				this.typeInfo = true;
			}
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
			window.SegMap.SaveRoute.UpdateRoute();
		},
		doToggle() {
			this.collapsed = !this.collapsed;
			window.SegMap.SaveRoute.UpdateRoute();
		},
		updatePanel() {
			var mapType = document.getElementsByClassName('gmnoprint gm-style-mtc');
			var fav = document.getElementsByClassName('fab-wrapper');
			var search = document.getElementsByClassName('searchBar');
			/*
			if (!this.collapsed) {
				this.panelWidth = '300px';
				mapType[0].style.left = '300px';
				fav[0].style.left = '315px';
				search[0].style.left = '500px';
				search[0].style.width = 'calc(100% - 700px)';
				this.showPanel();
			} else {
				this.typeInfo = false;
				this.panelWidth = '0';
				mapType[0].style.left = '0';
				fav[0].style.left = '15px';
				search[0].style.left = '300px';
				search[0].style.width = 'calc(100% - 500px)';
			}*/
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
	background-color: white;
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

