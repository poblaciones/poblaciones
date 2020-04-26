<template>
	<div v-if="open" class='left-panel' v-bind:style='{ width: panelWidth }'>
		<button title="Quitar" type="button" v-on:click="doClose"
						class="close buttonMargin">
			<close-icon title="Quitar" />
		</button>
		<div v-on:click="doToggle" class='fa fa-2x fa-caret-left hand left-arrow' title="{ isCaretLeft ? 'Contraer' : 'Expandir' { 'fa-caret-left' : isCaretLeft) panel lateral"
				 v-bind:class="{ 'fa-caret-left' : isCaretLeft, 'fa-caret-right': !isCaretLeft }"
				 v-bind:style='{ left: panelWidth }'></div>
		<div>
			<InfoPanel v-bind:dt="dt" v-if="typeInfo" />
		</div>
	</div>
</template>

<script>
import InfoPanel from '@/public/components/panels/infoPanel';
import PanelType from '@/public/enums/PanelType';
import CloseIcon from 'vue-material-design-icons/close.vue';

export default {
	name: 'leftPanel',
	components: {
		InfoPanel,
		CloseIcon
	},
	data() {
		return {
			open: true,
			collapsed: false,
			panelWidth: '330px',
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

			if (!this.collapsed) {
				this.panelWidth = '330px';
				mapType[0].style.left = '330px';
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
	width:330px;
	left:0;
	top:0;
	box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
	z-index:1;
	background-color: white;
}
.left-arrow {
	position:absolute;
	height: 48px;
	width: 23px;
	top: 50px;
	font-size: 14px;
	padding-top: 17px;
  padding-right: 2px;
  color: #767676;
	left: 330px;
  background: rgba(255,255,255,0.9) url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAUCAQAAAAXDMSnAAAAi0lEQ…ueTldC08kcT5YOY9xYujqQM03XKXuaLmEtNF1e1Nz89gbL+0do6OEwRwAAAABJRU5ErkJggg==) 7px center/7px 10px no-repeat;
  border-left: 1px solid #D4D4D4;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.3);
}
</style>

