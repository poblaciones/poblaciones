<template>
	<div id="holder" style="height: 100%;">
		<div id="panMain" class="split split-horizontal" style="position: relative">

			<Search/>
			<LeftPanel v-show="config.UsePanels" ref='leftPanel'/>
			<MapPanel/>
			<WorkPanel :work="work" ref="workPanel" />
			<Fab ref="fabPanel" />
			<Edit v-if="work.Current" ref="editPanel" :work="work" />
		</div>
		<div id="panRight" class="split split-horizontal">
			<SummaryPanel :metrics="metrics" :config="config"
				:clipping="clipping" :frame="frame" :user="user"
				:toolbarStates="toolbarStates"></SummaryPanel>
		</div>
	</div>
</template>

<script>
import SegmentedMap from '@/public/classes/SegmentedMap';
import StartMap from '@/public/classes/StartMap';
import GoogleMapsApi from '@/public/googleMaps/GoogleMapsApi';
import WorkPanel from '@/public/components/panels/workPanel';
import MapPanel from '@/public/components/panels/mapPanel';
import Fab from '@/public/components/widgets/fabButton';
import LeftPanel from '@/public/components/panels/leftPanel';
import Edit from '@/public/components/widgets/editButton';
import SummaryPanel from '@/public/components/panels/summaryPanel';
import Search from '@/public/components/widgets/search';

import Split from 'split.js';
import axios from 'axios';
import Vue from 'vue';
import err from '@/common/js/err';

export default {
	name: 'app',
	components: {
		SummaryPanel,
		Search,
		MapPanel,
		Edit,
		Fab,
		LeftPanel,
		WorkPanel
	},
	created() {
		window.Popups = {};
		window.Panels = {};
	},
	data() {
		return {
			workStartupSetter: null,
			toolbarStates: { selectionMode: null, tutorialOpened: 0 },
			clipping: {
				IsUpdating: false,
				Region: {
					SelectedLevelIndex: 0,
					Levels: [],
					Canvas: null
				},
				Feature: {
					Summary: {
						Id: 0,
						Name: '',
						TypeName: '',
						Location: { Lat: 0.0, Lon: 0.0, },
						Population: 0,
						Households: 0,
						Children: 0,
						AreaKm2: 0,
					},
					SelectedLevelIndex: 0,
					Levels: [],
					Canvas: null
				}
			},
			user: {
				Logged: false
			},
			frame: {
				Envelope: {
					Min: { Lat: 0.0, Lon: 0.0, },
					Max: { Lat: 0.0, Lon: 0.0, },
				},
				Zoom: 0,
				ClippingRegionId: null,
				ClippingCircle: null,
				ClippingFeatureId: null,
			},
			metrics: [],
			config: {},
			work: { Current: null },
			workToLoad: false
		};
	},
	mounted() {
		Split(['#panMain', '#panRight'], {
			sizes: [75, 25],
			minSizes: 200,
			gutterSize: 7
		});

		this.BindEvents();
		var loc = this;
		this.GetConfiguration().then(function () {
			var start = new StartMap(loc.work, loc, loc.SetupMap);
			start.Start();
		});
		window.Panels.Left = this.$refs.leftPanel;
	},
	methods: {
		GetConfiguration() {
			const loc = this;
			return axios.get(window.host + '/services/GetConfiguration', {
				params: {}
			}).then(function(res) {
				loc.config = res.data;
				loc.user = res.data.User;
			}).catch(function(error) {
				err.errDialog('GetConfiguration', 'conectarse con el servidor', error);
			});
		},
		BindEvents() {
			var loc = this;
			this.RegisterErrorHandler();
			window.onpopstate = function(event) {
				if (event.state !== null) {
					var start = new StartMap(loc.work, loc, loc.SetupMap);
					start.Start();
				}
			};
			window.onresize = function(event) {
				loc.$refs.workPanel.onResize();
			};
			window.onload = function(event) {
				loc.$refs.workPanel.onResize();
			};
		},
		SetupMap(afterLoaded) {
			if (window.SegMap) {
				if (window.SegMap.MapIsInitialized) {
					afterLoaded();
				} else {
					window.SegMap.afterCallback2 = afterLoaded;
				}
				return;
			}
			var mapApi = new GoogleMapsApi(window.google);
			var segMap = new SegmentedMap(mapApi, this.frame, this.clipping, this.toolbarStates, this.metrics, this.config);
			segMap.Work = this.work;
			segMap.afterCallback = afterLoaded;
			window.SegMap = segMap;

			this.$refs.fabPanel.loadFabMetrics();
			mapApi.SetSegmentedMap(segMap);
			segMap.SaveRoute.DisableOnce = true;
			mapApi.Initialize();
			segMap.SetSelectionMode(0);
		},
		RegisterErrorHandler() {
			Vue.config.errorHandler = err.HandleError;
			window.onerror = err.HandleError;
		}
	},
};

</script>

<style>
html, body {
	height: 100%;
	overflow-y: hidden;
	margin: 0;
	padding: 0;
}
.gm-ui-hover-effect {
	top: 0px !important;
	right: 0px !important;
}
.gAlpha {
	opacity: 0;
}
.gm-fullscreen-control {
	zoom: 0.8;
	-moz-transform: scale(0.8);
}
.gm-bundled-control {
	transform: scale(0.8);
	margin: 0px 0px -24px 0px !important;
}
.gm-style-mtc {
	zoom: 0.8;
	-moz-transform: scale(0.8);
}

.hand {
	cursor: pointer;
}

.indented1 {
	margin-left: 90px;
}
.tab1 {
	position: absolute;
	left: 90px;
}
.action-muted {
	color: #DDDDDD;
}

.moderateHr {
	margin-top: 12px;
	margin-bottom: 12px;
}

// settings de split
.split p, .split-flex p {
	padding: 20px;
}

.split, .split-flex {
	-webkit-box-sizing: border-box;
	-moz-box-sizing: border-box;
	box-sizing: border-box;

	overflow-y: auto;
	overflow-x: hidden;
}

.gutter {
	background-color: #eee;
	background-repeat: no-repeat;
	background-position: 50%;
}
.superSmallButton {
	border: 1px solid #68B3C8;
	padding: 0px 3px;
	margin-left: 2px;
}
.gutter.gutter-vertical {
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
	cursor: ns-resize;
}

.gutter.gutter-horizontal {
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
	cursor: ew-resize;
}

.split.split-horizontal, .gutter.gutter-horizontal {
	height: 100%;
	float: left;
}

.split.split-vertical, .gutter.gutter-vertical {
	width: 100%;
}
// fin de settings de split

.drop {
	font-size: 11px;
	vertical-align: top !important;
	padding-top: 5px;
}
.dropMetric {
	cursor: pointer;
	cursor: hand;
	color: rgb(99, 150, 234);
}
.dropMetricMuted {
	cursor: pointer;
	cursor: hand;
	color: #DDDDDD;
}

.quotation {
	font-size: 12px;
}

.form-control {
	background-color: #fefefe;
}

a:hover {
	text-decoration: underline;
}

.innerBoxTooltip {
	right: unset!important;
	max-height: 200px!important;
	overflow: auto!important;
	box-shadow: 0 4px 10px rgba(60,64,67,.28);
	padding-top: 20px;
	padding-left: 0px;
}
.innerBox {
	pointer-events: none;
	position: relative;
	max-height: 3.5em;
	overflow: hidden;
	text-overflow: ellipsis;
	right: 50%;
	color: #5a626d;
	bottom: 0.4em;
	text-align: center;
}

.mapLabelsSat .ibLink {
	color: #fff!important;
}

.mapLabelsSat .ibLink:hover {
	color: #5591ec!important;
	text-decoration: none !important;
}
.ibTooltipNoYOffset {
	margin-top: -18px;
}

.ibTooltip {
	color: #5a626d;
	pointer-events: none;
	cursor: pointer;
  background-color: #ffffff;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(60,64,67,.28);
}
.ibTooltipOffsetLeft {
	margin-left: 9px;
}
.ibLink {
	color: #5a626d;
	cursor: pointer;
	pointer-events: all
}

.ibLink:hover {
	color: #2e8cff;
	text-decoration: none !important;
}

.bottomBox {
	position: relative;
	pointer-events: none;
	right: 50%;
	bottom: 0.4em;
	text-align: center;
}

.sourceRow {
	position: relative;
	padding: 4px 0px 0px 0px;
}

.coverageBox {
	padding: 8px 0px 0px 0px;
	font-size: 9px;
	line-height: 1.42857143;
	color: #252422;
}

.mapLabelsSat {
	text-shadow: .75px .75px 1px #000, -.75px -1px 1px #000, -.75px .75px 1px #000, .75px -1px 1px #000, .75px .75px 1px #000, -.75px -1px 1px #000, -.75px 1px 1px #000, .75px -.75px 1px #000 !important;
}
.mapLabels {
	max-width: 200px;
	background: transparent;
	border: 0px solid black;
	position: absolute;
	font-weight: 400;
	color: #333;
	font-size: 12px;
	text-shadow: .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px .75px 1px #fff, .75px -1px 1px #fff,
	.75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px 1px 1px #fff, .75px -.75px 1px #FFF;
}

.mapLabelsLarger {
	max-width: 250px;
	font-size: 16px;
}
.ml1 {
	width: 200px;
	font-size: 18px;
}
.ml2 {
	width: 200px;
	font-size: 16px;
}
.ml3 {
	width: 100px;
	font-size: 14px;
}
.ml4 {
	width: 100px;
	font-size: 12px;
}

.bItem {
	border: 1px solid #999;
	padding-right: 6px;
	padding-left: 6px;
	border-right-width: 0px;
}
.bItemRL {
	border-bottom-left-radius: 1em;
	border-top-left-radius: 1em;
}
.bItemRR {
	border-bottom-right-radius: 1em;
	border-top-right-radius: 1em;
	border-right-width: 1px;
}

.bItemGroup {
	border-top: 1px solid #999;
	border-bottom: 1px solid #999;
	border-radius: 1em;
}

.localTable td {
	border: 0px;
	padding: 6px;
	vertical-align: top;
}
.text-softer {
	color: #777;
}
.popupSubTitle {
	font-weight: 600;
	text-transform: uppercase;
	font-size: 12px;
	padding-top: 6px;
	padding-bottom: 4px;
}

.dropdown-menu > li:last-child > a {
	border-bottom-left-radius: 4px;
	border-bottom-right-radius: 4px;
}

.dropdown-menu > li:first-child > a {
	border-top-left-radius: 4px;
	border-top-right-radius: 4px;
}

.dropdown-menu > li > a {
	padding: 8px 15px;
}

.dropdown-menu, .dropdown.open .dropdown-menu {
	transform: translate3d(5px, 1px, 0px);
	background-color: white;
}
@media (max-width: 991px) {
	.dropdown-menu {
		display: block;
	}
	.dropdown-menu > li > a:hover, .dropdown-menu > li > a:focus {
		background-color: #66615B;
	}
	.dropdown-menu .divider {
		background-color: #F1EAE0;
	}
}
.dropdown-menu {
	border-radius: 4px;
}

.btn-default.active.focus, .btn-default.active:focus, .btn-default.active:hover, .btn-default:active.focus, .btn-default:active:focus, .btn-default:active:hover, .open>.dropdown-toggle.btn-default.focus, .open>.dropdown-toggle.btn-default:focus, .open>.dropdown-toggle.btn-default:hover {
	border-color: #66615B;
}
.btn:hover, .btn:focus, .btn:active, .open > .btn.dropdown-toggle,
.navbar .navbar-nav > li > a.btn:hover,
.navbar .navbar-nav > li > a.btn:focus,
.navbar .navbar-nav > li > a.btn:active,
.navbar .navbar-nav > li > a.btn.dropdown-toggle {
	border-color: #333;
}

.btn.active,
.navbar .navbar-nav > li > a.btn.active {
	background-color: #66615B;
	color: rgba(255, 255, 255, 0.7);
	border-color: #66615B;
}

.summaryRow {
	padding: 0px 0px 6px 0px;
	font-size: 0.9em;
	color: #777;
}
.summaryBlock {
	padding: 2px 0px 4px 0px;
}

@media print {
	.no-print, .no-print * {
		display: none !important;
	}

	.always-print {
		visible: visible;
	}
	.only-print {
		display: block!important;
	}
}
.only-print {
	display: none;
}

.copyrightText {
	color: #000000;
}
.copyrightText:active {
	color: #000000;
}
.copyrightText:visited {
	color: #000000;
}
.copyrightText:hover {
	text-decoration: none;
	color: #000000;
}

.copyright {
	padding: 0px 5px;
	user-select: none;
	height: 14px;
	line-height: 14px;
	background-color: #ffffff;
	opacity: 0.7;
	border-top-left-radius: 6px;
	font-family: Roboto, Arial, sans-serif;
	font-size: 10px;
	white-space: nowrap;
	vertical-align: middle;
}
</style>
