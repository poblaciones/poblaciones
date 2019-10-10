<template>
	<div id="holder" style="height: 100%;">
		<div id="panMain" class="split split-horizontal" style="position: relative">
			<WorkPanel :work="work" ref="workPanel" />
			<Search/>
			<Mapa/>
			<Fab/>
		</div>
		<div id="panRight" class="split split-horizontal">
			<SummaryPanel :metrics="metrics"
				:clipping="clipping" :frame="frame"
				:toolbarStates="toolbarStates"></SummaryPanel>
		</div>
	</div>
</template>

<script>
import SegmentedMap from '@/public/classes/SegmentedMap';
import GoogleMapsApi from '@/public/googleMaps/GoogleMapsApi';
import WorkPanel from '@/public/components/panels/workPanel';
import Mapa from '@/public/components/panels/mapPanel';
import Fab from '@/public/components/panels/fabPanel';
import SummaryPanel from '@/public/components/panels/summaryPanel';
import Search from '@/public/components/widgets/search';
import Split from 'split.js';
import axios from 'axios';
import Vue from 'vue';
import h from '@/public/js/helper';
import err from '@/common/js/err';
import str from '@/common/js/str';

export default {
	name: 'app',
	components: {
		SummaryPanel,
		Search,
		Mapa,
		Fab,
		WorkPanel
	},
	data() {
		return {
			toolbarStates: { selectionMode: 0, tutorialOpened: 0 },
			clipping: {
				IsUpdating: false,
				Region: {
					Summary: {
						Id: 0,
						Name: '',
						TypeName: '',
						Location: { Lat: 0.0, Lon: 0.0, },
						Population: 0,
						Households: 0,
						Children: 0,
						AreaKm2: 0,
						Empty: true
					},
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
			frame: {
				Envelope: {
					Min: { Lat: 0.0, Lon: 0.0, },
					Max: { Lat: 0.0, Lon: 0.0, },
				},
				Zoom: 0,
				ClippingRegionId: 0,
				ClippingCircle: {
					Center: { Lat: 0.0, Lon: 0.0, },
					Radius: { Lat: 0.0, Lon: 0.0, },
				},
				ClippingFeatureId: null,
			},
			metrics: [],
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
		this.RestoreWork();
		this.RegisterErrorHandler();
		var hash = window.location.hash;
		if (hash.length > 3 && hash.substr(0, 3) === '#/@') {
			this.StartByUrl(hash);
		} else {
			this.StartByDefaultFrameAndClipping();
		}
		var loc = this;
		window.onpopstate = function(event) {
			if (event.state !== null) {
				loc.workToLoad = false;
				window.SegMap.RestoreRoute.LoadRoute(event.state.route);
				loc.RestoreWork();
			}
		};
		window.onresize = function(event) {
			loc.$refs.workPanel.onResize();
		};
		window.onload = function(event) {
			loc.$refs.workPanel.onResize();
		};
	},
	methods: {
		RestoreWork() {
			var pathArray = window.location.pathname.split('/');
			if (pathArray.length > 0 && pathArray[pathArray.length - 1] === '') {
				pathArray.pop();
			}
			if (pathArray.length > 0 && pathArray[pathArray.length - 1] === 'map') {
				pathArray.pop();
			}
			if (pathArray.length === 0 || !str.isNumeric(pathArray[pathArray.length - 1])) {
				this.work.Current = null;
				return;
			}
			var wk = parseInt(pathArray[pathArray.length - 1]);
			this.GetWork(wk);
		},
		StartByUrl(route) {
			var afterLoaded = function() {
				window.SegMap.RestoreRoute.LoadRoute(route);
			};
			this.SetupMap(afterLoaded);
			window.SegMap.Tutorial.UpdateOpenTutorial();
			window.SegMap.RestoreRoute.LoadLocationFromRoute(route);
		},
		StartByDefaultFrameAndClipping() {
			const loc = this;
			axios.get(window.host + '/services/clipping/GetDefaultFrameAndClipping', {
				params: {}
			}).then(function(res) {
				var canvas = res.data.clipping.Canvas;
				res.data.clipping.Canvas = null;

				loc.clipping.Region = res.data.clipping;
				loc.frame = res.data.frame;
				var afterLoaded = function() {
					window.SegMap.SaveRoute.UpdateRoute();
				};
				loc.SetupMap(afterLoaded);
				if (loc.workToLoad === false) {
					window.SegMap.Tutorial.CheckOpenTutorial();
				}
				window.SegMap.Clipping.FitCurrentRegion();
				window.SegMap.Clipping.SetClippingCanvas(canvas);
			}).catch(function(error) {
				err.errDialog('GetDefaultFrameAndClipping', 'conectarse con el servidor', error);
			});
		},
		SetupMap(afterLoaded) {
			var mapApi = new GoogleMapsApi(window.google);
			var segMap = new SegmentedMap(mapApi, this.frame, this.clipping, this.toolbarStates, this.metrics);
			segMap.Work = this.work;
			segMap.afterCallback = afterLoaded;

			window.SegMap = segMap;
			mapApi.SetSegmentedMap(segMap);
			mapApi.Initialize();
		},
		GetSummaryAll() {
			this.metrics.forEach(function(metric) {
				metric.UpdateSummary();
			});
		},
		GetWork(workId) {
			const loc = this;
			this.workToLoad = true;
			axios.get(window.host + '/services/works/GetWork', {
				params: { w: workId }
			}).then(function(res) {
				loc.work.Current = res.data;
			}).catch(function(error) {
				err.errDialog('GetWork', 'obtener la información del servidor', error);
			});
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
.gm-fullscreen-control
{
	zoom: 0.8;
	-moz-transform: scale(0.8);
}
.gm-bundled-control
{
	transform: scale(0.8);
	margin: 0px 0px -24px 0px !important;
}
.gm-style-mtc
{
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
.action-muted
{
	color: #DDDDDD;
}

.moderateHr
{
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

.gutter.gutter-vertical {
	background-image:  url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
	cursor: ns-resize;
}

.gutter.gutter-horizontal {
	background-image:  url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
	cursor: ew-resize;
}

.split.split-horizontal, .gutter.gutter-horizontal {
	height: 100%;
	float: left;
}
// fin de settings de split

.drop
{
	font-size: 11px;
	vertical-align: top !important;
	padding-top: 5px;
}
.dropMetric
{
	cursor: pointer;
	cursor: hand;
	color: rgb(99, 150, 234);
}
.dropMetricMuted
{
	cursor: pointer;
	cursor: hand;
	color: #DDDDDD;
}
.statsHeader
{
	color: #a9a9a9;
	font-weight: 300;
	font-size: 11px;
	height: 16px;
	text-transform: uppercase;
}

.form-control {
	background-color: #fefefe;
}

a:hover {
text-decoration: underline;
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

.sourceRow
{
	position: relative;
	padding: 4px 0px 0px 0px;
}

.coverageBox
{
	padding: 8px 0px 0px 0px;
	font-size: 9px;
	line-height: 1.42857143;
	color: #252422;
}

.mapLabelsSat
{
	text-shadow: .75px .75px 1px #000, -.75px -1px 1px #000, -.75px .75px 1px #000, .75px -1px 1px #000, .75px .75px 1px #000, -.75px -1px 1px #000, -.75px 1px 1px #000, .75px -.75px 1px #000 !important;
}
.mapLabels {
	width: 200px;
	background: transparent;
	border: 0px solid black;
	position: absolute;
	position: absolute;
	font-weight: 400;
	color: #333;
	font-size: 12px;
	text-shadow: .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px .75px 1px #fff, .75px -1px 1px #fff,
							.75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px 1px 1px #fff, .75px -.75px 1px #FFF;
}

.mapLabelsLarger {
	width: 250px;
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
.popupSubTitle
{
	font-weight: 600;
	text-transform: uppercase;
	font-size: 12px;
	padding-top: 6px;
	padding-bottom: 4px;
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

.summaryRow
{
	padding: 0px 0px 6px 0px;
	font-size: 0.9em;
	color: #777;
}
.summaryBlock
{
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

</style>
