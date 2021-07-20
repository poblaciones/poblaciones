<template>
	<div>
		<WorkPanel v-if="!Embedded.HideWorkPanel" :work="work" ref="workPanel" :backgroundColor="workColor" />
		<div class="embeddedNoOpener"></div>
		<div class="embedded" @click="embeddedClick" v-if="Embedded.Readonly"
				 :style="(Embedded.OpenOnClick ? 'cursor: pointer;' : '')"
				 :title="(Embedded.OpenOnClick ? 'Abrir en Poblaciones (nueva ventana)' : '')"></div>
		<div id="holder">
			<div id="panMain" class="split split-horizontal" style="position: relative">
				<Search class="exp-hiddable-block" v-show="!Embedded.HideSearch" />
				<LeftPanel ref='leftPanel' />
				<MapPanel />
				<MetricsButton v-show="!Embedded.HideAddMetrics" ref="fabPanel" :backgroundColor="workColor" id="fab-panel" class="exp-hiddable-unset" />
				<WatermarkFloat v-if="work.Current && work.Current.Metadata && work.Current.Metadata.Institution && work.Current.Metadata.Institution.WatermarkId" :work="work" />
				<EditButton v-if="work.Current && !Embedded.Active" ref="editPanel" class="exp-hiddable-unset" :backgroundColor="workColor" :work="work" />
				<CollapseButtonRight v-show="!Embedded.HideSidePanel && !Embedded.Readonly" :collapsed='collapsed' @click="doToggle" tooltip="panel de estadísticas" class="exp-hiddable-block" />
			</div>
			<div id="panRight" class="split split-horizontal">
				<SummaryPanel :metrics="metrics" id="panSummary" :config="config" :backgroundColor="workColor"
											:clipping="clipping" :frame="frame" :user="user" :currentWork="work.Current"
											:toolbarStates="toolbarStates"></SummaryPanel>
			</div>
		</div>
	</div>
</template>

<script>
	import SegmentedMap from '@/public/classes/SegmentedMap';
	import StartMap from '@/public/classes/StartMap';
	import GoogleMapsApi from '@/public/googleMaps/GoogleMapsApi';
	import WorkPanel from '@/public/components/panels/workPanel';
	import MapPanel from '@/public/components/panels/mapPanel';
	import MetricsButton from '@/public/components/widgets/map/metricsButton';
	import LeftPanel from '@/public/components/panels/leftPanel';
	import EditButton from '@/public/components/widgets/map/editButton';
	import SummaryPanel from '@/public/components/panels/summaryPanel';
	import Search from '@/public/components/widgets/map/search';
	import WatermarkFloat from '@/public/components/widgets/map/watermarkFloat';
	import CollapseButtonRight from '@/public/components/controls/collapseButtonRight';

	import Split from 'split.js';
	import axios from 'axios';
	import Vue from 'vue';
	import err from '@/common/framework/err';
	import web from '@/common/framework/web';

	export default {
		name: 'app',
		components: {
			SummaryPanel,
			Search,
			MapPanel,
			EditButton,
			MetricsButton,
			LeftPanel,
			WorkPanel,
			WatermarkFloat,
			CollapseButtonRight,
		},
		created() {
			window.Popups = {};
			window.Panels = {
				Content: {
					FeatureInfo: null, FeatureList: null, FeatureNavigation: this.featureNavigation
				}
			};
			window.Use = {};
			window.Embedded = this.LoadEmbeddedSettings();
		},
		data() {
			return {
				selfCheckTimer: null,
				workStartupSetter: null,
				collapsed: false,
				isMobile: false,
				splitPanels: null,
				featureNavigation: { Key: null, Values: [], GettingKey: null },
				toolbarStates: { selectionMode: null, tutorialOpened: 0, showLabels: true },
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
					ClippingRegionIds: null,
					ClippingCircle: null
				},
				metrics: [],
				config: {},
				work: { Current: null },
				workToLoad: false
			};
		},
		mounted() {
			this.splitPanels = Split(['#panMain', '#panRight'], {
				sizes: [70, 30],
				minSize: [10, 300 + (this.Embedded.Readonly ? 25 : 0)],
				expandToMin: true,
				gutterSize: (this.Embedded.Readonly ? 0 : 5)
			});

			if (window.Embedded.HideSidePanel) {
				this.collapsed = true;
				this.SplitPanelsRefresh();
			}
			this.BindEvents();
			var loc = this;
			this.GetConfiguration().then(function () {
				var start = new StartMap(loc.work, loc, loc.SetupMap);
				start.Start();
				loc.isMobile = loc.$isMobile();
				if (!loc.Embedded.HideSidePanel) {
					loc.collapsed = loc.isMobile;
				} else {
					loc.collapsed = true;
				}
				loc.SplitPanelsRefresh();
				//loc.UpdateMapsControls();
			});
			window.Panels.Left = this.$refs.leftPanel;
		},
		computed: {
			workColor() {
				if (this.work && this.work.Current && this.work.Current.Metadata && this.work.Current.Metadata.Institution && this.work.Current.Metadata.Institution.Color) {
					return '#' + this.work.Current.Metadata.Institution.Color;
				}
				return '#00A0D2';
			},
			Embedded() {
				return window.Embedded;
			},
			Use() {
				return window.Use;
			},
		},
		methods: {
			GetConfiguration() {
				const loc = this;
				return axios.get(window.host + '/services/GetConfiguration', {
					params: {}
				}).then(function (res) {
					loc.config = res.data;
					loc.user = res.data.User;
				}).catch(function (error) {
					err.errDialog('GetConfiguration', 'conectarse con el servidor', error);
				});
			},
			embeddedClick() {
				if (window.Embedded.OpenOnClick) {
					window.Embedded.OpenNewWindow();
				}
			},
			LoadEmbeddedSettings() {
				var ret = {
				Compact: web.getParameterByName('co') != null,
					Active: web.getParameterByName('emb') != null,
					OpenNewWindow: function () {
						var url = window.location.href;
						// quita lo que tenga entre ? y #
						var i1 = url.indexOf('?');
						var i2 = url.indexOf('#');
						var newUrl;
						if (i1 && i2) {
							newUrl = url.substring(0, i1) + url.substring(i2);
						} else {
							newUrl = url;
						}
						window.open(newUrl, '_blank');
					}
					};
				ret.Readonly = web.getParameterByName('ro') != null;
				if (ret.Compact) {
					ret.HideSearch = true;
					ret.HideSidePanel = true;
					ret.HideAddMetrics = true;
					ret.HideWorkPanel = true;
				} else {
					ret.HideSearch = ret.Readonly || web.getParameterByName('ns') != null;
					ret.HideSidePanel = web.getParameterByName('np') != null;
					ret.HideAddMetrics = ret.Readonly || web.getParameterByName('na') != null;
				}
				if (ret.Readonly && web.getParameterByName('oc') != null) {
					ret.OpenOnClick = true;
				}
				return ret;
			},
			BindEvents() {
				var loc = this;
				this.RegisterErrorHandler();
				window.onpopstate = function (event) {
					if (event.state !== null) {
						var start = new StartMap(loc.work, loc, loc.SetupMap);
						start.Start();
						//loc.UpdateMapsControls();
					}
				};
				window.onresize = function (event) {
					if (loc.$refs.workPanel) {
						loc.$refs.workPanel.onResize();
					}
				};
				window.onload = function (event) {
					if (loc.$refs.workPanel) {
						loc.$refs.workPanel.onResize();
					}
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
				segMap.SaveRoute.DisableOnce = true;
				mapApi.Initialize();
				segMap.SetSelectionMode(0);
				/*
				var loc = this;
				this.selfCheckTimer = setInterval(function () {
					if (window.SegMap.MapsApi.__ob__ || window.SegMap.__ob__) {
						alert('got observed');
						debugger;
						clearInterval(loc.selfCheckTimer);
					}
				}, 100);
				*/
					},
			RegisterErrorHandler() {
				Vue.config.errorHandler = err.HandleError;
				window.onerror = err.HandleError;
			},
			/*
			UpdateMapsControls(){
				if (this.$isMobile()){
					window.SegMap.MapsApi.gMap.setOptions({
						mapTypeControlOptions: {
							style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
							position: google.maps.ControlPosition.LEFT_TOP
						},
						fullscreenControl: false
					});
				}
			},*/
			doToggle() {
				this.collapsed = !this.collapsed;
				this.SplitPanelsRefresh();
			},
			SplitPanelsRefresh() {
				if (this.collapsed) {
					if (this.splitPanels !== null) {
						this.splitPanels.destroy();
						this.splitPanels = null;
					}
				}
				else {
					if (this.splitPanels === null) {
						this.splitPanels = Split(['#panMain', '#panRight'], {
							sizes: [70, 30],
							minSizes: [10, 350],
							expandToMin: true,
							gutterSize: 5
						});
					}
				}
			},
		},
	};

</script>
<style src="@/common/styles/popovers.css">
</style>

<style>
	html, body {
		height: 100%;
		overflow-y: hidden;
		margin: 0;
		padding: 0;
		user-select: none;
	}

	.gm-ui-hover-effect {
		top: 0px !important;
		right: 0px !important;
	}

	.ls {
		fill: none !important;
	}

	.gm-fullscreen-control {
		transform: scale(0.8);
	}

	.gm-bundled-control {
		transform: scale(0.8);
		margin: 0px 0px -24px 0px !important;
	}

	.gm-style-mtc:first-of-type {
		transform: translateX(9px) scale(0.8);
	}

	.gm-style-mtc {
		transform: translateX(-8px) scale(0.8);
	}

		.gm-style-mtc:last-of-type {
			transform: translateX(-26px) scale(0.8);
		}

	.hand {
		cursor: pointer;
	}

	.indented1 {
		margin-left: 90px;
	}

	.dragHandle:hover {
		visibility: visible;
	}

	.metricPanel > .dragHandle {
		visibility: hidden;
	}

	.metricPanel:hover > .dragHandle {
		visibility: visible;
	}

	.metricPanel {
		padding-top: 4px;
		padding-bottom: 4px
	}

	.dragHandle {
		visibility: visible;
		height: 14px;
		margin-top: -13px;
		color: #cccccc;
		position: relative;
		overflow: hidden;
		cursor: move;
		text-align: center;
		font-size: 24px;
	}


	.md-layout-item .md-size-15 {
		padding: 0 !important;
	}

	.md-layout-item .md-size-25 {
		padding: 0 !important;
	}

	.md-layout-item .md-size-20 {
		padding: 0 !important;
	}

	.md-layout-item .md-size-10 {
		padding: 0 !important;
	}


	.tab1 {
		position: absolute;
		left: 90px;
	}

	.action-muted {
		color: #DDDDDD;
		border-color: #DDDDDD !important;
	}
	.center {
		text-align: center;
	}
	.downloadButton {
		border: 1.5px solid #68B3C8;
		color: #68B3C8;
		border-radius: 9px;
		background-color: transparent;
		padding: 4px;
		margin-right: 10px;
		margin-bottom: 5px;
	}

	.warningBox {
		font-size: 13px;
		line-height: 1.4em;
		margin-top: 4px;
	}

	.exp-showable-block {
		display: none;
	}

	.exp-high-contrast {
		color: #000000 !important;
		background-color: #ffffff !important;
	}

	.exp-high-button {
		color: #ffffff !important;
	}

	.exp-circles {
		margin-top: 5px !important;
		color: white !important;
		font-size: 0px;
	}

		.exp-circles:after {
			border-width: 7px;
			border-style: solid;
			border-color: inherit;
			border-radius: 8px;
			visibility: visible;
			width: 1px;
			height: 1px;
			content: '';
		}


	.exp-circles-large {
		margin-top: 8px !important;
		color: white !important;
		font-size: 0px !important;
	}

		.exp-circles-large:after {
			border-width: 7px;
			border-style: solid;
			border-color: inherit;
			border-radius: 8px;
			visibility: visible;
			width: 1px;
			height: 1px;
			content: '';
		}

	.exp-logodiv-right {
		right: 8px !important;
	}

	.exp-panel {
		padding: 10px !important;
		border-width: 8px !important;
		border-color: white !important;
		border-style: solid !important;
		box-shadow: unset !important;
	}

	.exp-rounded {
		border-radius: 26px !important;
	}
	.panel-body {
		border-radius: 0px !important;
		box-shadow: 0 2px 2px rgb(0 0 0 / 18%) !important;
	}
	.moderateHr {
		margin-top: 1.2rem;
		margin-bottom: 1.1rem;
		border-color: #ccc;
	}
	.gutter.gutter-horizontal {
		background-color: #ffffff !important;
		filter: contrast(0.675);
	}
	/* settings de split */
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
		width: 100%;
		float: left;
	}

	.split.split-vertical, .gutter.gutter-vertical {
		width: 100%;
	}
	/* fin de settings de split */

	.drop {
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
	.optionsLabel {
		padding-top: 10px!important;
	}
	.attachmentsDownloadPanel {
		max-height: 120px;
		overflow-y: auto;
	}
	.sl span {
		opacity: .5;
		color: #333;
		text-shadow: 0.75px 0.75px 1px #fff, -0.75px -1px 1px #fff, -0.75px 0.75px 1px #fff, 0.75px -1px 1px #fff;
	}
	.innerBoxTooltip {
		right: unset !important;
		max-height: 200px !important;
		overflow: auto !important;
		box-shadow: 0 4px 10px rgba(60,64,67,.28);
		margin-top: 20px;
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

	.activePath {
		stroke: #FFF;
		stroke-opacity: 1;
		stroke-width: 2px;
		fill: none;
		vector-effect: non-scaling-stroke;
	}
	.sat.sl span {
		opacity: .75!important;
	}

	.sat span {
		text-shadow: 0.75px 0.75px 1px #000, -0.75px -1px 1px #000, -0.75px 0.75px 1px #000, 0.75px -1px 1px #000 !important;
		color: #fff !important;
	}

		.sat .ibLinkC {
			color: #d4edff !important;
		}

			.sat .ibLinkC:hover {
				color: #5591ec !important;
				text-decoration: none !important;
			}

		.sat .ibLink {
			color: #fff !important;
		}

			.sat .ibLink:hover {
				color: #5591ec !important;
				text-decoration: none !important;
			}

	.ibTooltipNoYOffset {
		margin-top: -10px;
	}

	.tpValueTitle {
		border-bottom: 1px solid #666;
		padding-bottom: 4px;
		padding-right: 8px;
		margin-left: -8px;
		margin-right: -8px;
		font-weight: 500;
		margin-bottom: 5px;
	}

	.ibTooltip {
		color: #5a626d;
		pointer-events: none;
		cursor: pointer;
		background-color: #ffffff;
		padding: 8px;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 10px rgba(60,64,67,.28);
	}
	.embeddedOpener {
		position: absolute;
		background-color: #ffffff;
		color: #666666;
		opacity: 1;
		right: 8px;
		width: 32px;
		text-align: center;
		height: 32px;
		top: 14px;
		z-index: 2;
		cursor: pointer;
		border-radius: 2px;
		padding: 5px 0px;
		font-weight: bold;
		box-shadow: rgb(0, 0, 0, 0.3) 0px 1px 4px -1px;
	}


	.embeddedNoOpener {
		position: absolute;
		background-color: transparent;
		left: 0;
		bottom: 0;
		z-index: 1;
		height: 25px;
		width: 75px;
	}

	.embedded {
		position: absolute;
		background-color: transparent;
		left: 0;
		top: 0;
		z-index: 10;
		height: 100%;
		width: 100%;
	}
	.ibTooltipOffsetLeft {
		margin-left: 9px;
	}

	.ibLinkC {
		color: #5d89bf;
		cursor: pointer;
		pointer-events: all
	}

		.ibLinkC:hover {
			color: #2e8cff;
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

	.fab-wrapper {
		z-index: 2 !important;
	}

	.unselectable {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	.bottomBox {
		position: relative;
		/* pointer-events: none; */
		right: 50%;
		bottom: 0.4em;
		text-align: center;
	}

	.sourceRow {
		position: relative;
		padding: 0.6rem 0rem 0rem 0rem;
	}

	.coverageBox {
		padding: 8px 0px 0px 0px;
		font-size: 9px;
		line-height: 1.42857143;
		color: #252422;
	}

	.filterElement-close {
		font-size: 16px;
		margin-left: 1px !important;
		margin-right: -4px !important;
		margin-top: -1px !important;
	}

	.filterElement {
		color: #444444;
		font-weight: 300;
		font-size: 13px;
		padding: 2px 6px;
		margin-right: 10px;
		background-color: #efefef;
		margin-bottom: -3px;
		display: inline-block;
		border-radius: 4px;
		border: 1px solid #efefef;
		text-transform: uppercase;
	}

	.color-muted {
		color: #999 !important;
	}

	.mapLabels {
		max-width: 200px;
		background: transparent;
		border: 0px solid black;
		position: absolute;
		font-weight: 400;
		color: #333;
		font-size: 12px;
		text-shadow: .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px .75px 1px #fff, .75px -1px 1px #fff, .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px 1px 1px #fff, .75px -.75px 1px #FFF;
	}

	.mapLabelsLarger {
		max-width: 250px;
		font-size: 16px;
	}

	.ml0 {
		width: 250px;
		max-width: 250px;
		font-size: 24px;
		padding: 6px 0px;
	}

	.ml1 {
		width: 200px;
		font-size: 18px;
		padding: 5px 0px;
	}

	.ml2 {
		width: 200px;
		font-size: 16px;
		padding: 3px 0px;
	}

	.ml3 {
		width: 100px;
		font-size: 14px;
		padding: 2px 0px;
	}

	.ml4 {
		width: 100px;
		font-size: 12px;
		padding: 1px 0px;
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

	.card .category, .card label {
		color: #777777;
	}

	.popupSubTitle {
		font-weight: 600;
		text-transform: uppercase;
		font-size: 12px;
		padding-top: 6px;
		padding-bottom: 4px;
	}

	.frozen {
		pointer-events: none;
		border-color: #cecece;
	}

	.lightButton {
		font-size: 12px;
		padding: 4px 4px 4px 4px !important;
		line-height: 1em;
	}

		.lightButton[disabled]:hover {
			opacity: .1 !important;
			cursor: default !important;
		}

		.lightButton[disabled] {
			opacity: .1 !important;
			cursor: default !important;
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

	.liDividerNext {
		border-bottom: 1px solid #f1eae0;
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

	.btn-default.active.focus, .btn-default.active:focus, .btn-default.active:hover, .btn-default:active.focus, .btn-default:active:focus, .btn-default:active:hover, .open > .dropdown-toggle.btn-default.focus, .open > .dropdown-toggle.btn-default:focus, .open > .dropdown-toggle.btn-default:hover {
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

	.addthis_toolbox {
		display: none;
	}

	.summaryRow {
		padding: 0rem 0rem 0.475rem 0rem;
		font-size: 0.75em;
		color: #555;
	}

	.summaryBlock {
		padding: 0.2rem 0rem 0.3rem 0rem;
	}

	@media print {
		.no-print, .no-print * {
			display: none !important;
		}

		.always-print {
			visible: visible;
		}

		.only-print {
			display: block !important;
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
		background-color: rgba(255, 255, 255, .5);
		opacity: 0.9;
		border-top-left-radius: 6px;
		font-family: Roboto, Arial, sans-serif;
		font-size: 10px;
		white-space: nowrap;
		vertical-align: middle;
	}

	.gm-style-cc:last-child {
		display: none !important;
	}


a[title="Abrir esta área en Google&nbsp;Maps (se abre en una ventana nueva)"] {
 display: none !important;
}

a[title="Abrir esta área en Google Maps (se abre en una ventana nueva)"]
{ display: none !important; }

	a[title="Informar a Google errores en las imágenes o el mapa de carreteras."] {
		display: none !important;
	}

	#holder {
		top: 0px;
		height: 100%;
		width: 100%;
		position: absolute;
	}
</style>
