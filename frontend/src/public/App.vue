<template>
	<div>
		<fs v-model="fullscreen" :teleport="teleport" :page-only="pageOnly">
			<WorkPanel v-if="!Embedded.HideWorkPanel" :work="work" ref="workPanel" :backgroundColor="workColor" />
			<WaitMessage ref="showWaitMessage" :backgroundColor="workColor" />
			<div class="embeddedNoOpener"></div>
			<div style="height:0px;width:0px;overflow:hidden">
				<i class="flaticon-001-cruiser-voyage"></i>
			</div>
			<div class="embedded" @click="embeddedClick" v-if="Embedded.Readonly"
					 :style="(Embedded.OpenOnClick ? 'cursor: pointer;' : '')"
					 :title="(Embedded.OpenOnClick ? 'Abrir en Poblaciones (nueva ventana)' : '')"></div>
			<div id="holder" style="overflow-x: hidden">
				<PopupsPanel :backgroundColor="workColor" />
				<div id="panRight" class="animatedFlyAway floatRightPanel thinScroll" v-touch:swipe.right="panRightSwipeClose" :style="rightPanelOverflow">
					<SummaryPanel :metrics="metrics" id="panSummary" :config="config"
												:clipping="clipping" :frame="frame" :user="user" ref="summaryPanel" :currentWork="work.Current"
												:toolbarStates="toolbarStates"></SummaryPanel>
				</div>
				<div id="panMain" class="" style="position: relative; width: 100%; z-index: 0; height: 100%; overflow: hidden">
					<Search class="exp-hiddable-block" :class="(toolbarStates.repositionSearch || toolbarStates.leftPanelVisible ? 'searchOffsetTop': '')" v-show="!Embedded.HideSearch" />
					<LeftPanel ref='leftPanel' />
					<MapPanel />
					<MetricsButton v-show="!Embedded.HideAddMetrics" ref="fabPanel" :backgroundColor="workColor" id="fab-panel" class="exp-hiddable-unset mapsOvercontrols" />
					<div v-if="work.Current && work.Current.Metadata" class="logosBox">
						<template v-for="institution in work.Current.Metadata.Institutions">
							<WatermarkFloat v-if="institution.WatermarkId" :key="institution.Id" :institution="institution" :work="work" />
						</template>
					</div>
					<WatermarkOwner v-if="ownerLogo && ownerLogo.Image"
													:url="ownerLogo.Url"
													:image="ownerLogo.Image"
													:name="ownerLogo.Name" />
					<EditButton v-if="work.Current && !Embedded.Active && work.Current.CanEdit" ref="editPanel" class="exp-hiddable-unset" :backgroundColor="workColor" :work="work" />
					<FullScreenButton v-if="!Embedded.Readonly" class="exp-hiddable-unset" :fullscreen="fullscreen" />
					<CollapseButtonRight v-show="!Embedded.HideSidePanel && !Embedded.Readonly"
															 :collapsed='toolbarStates.collapsed'
															 v-if="clippingStarted"
															 @click="doToggle"
															 tooltip="panel de estadísticas"
															 class="exp-hiddable-block"
															 :style="collapseButtonOffset" />
				</div>
				<div id="panLabelCalculus" style="display: block; width: 0px; height: 0px; overflow: hidden"></div>
			</div>
		</fs>
	</div>
</template>

<script>
	import WaitMessage from '@/public/components/popups/waitMessage';
	import SegmentedMap from '@/public/classes/SegmentedMap';
	import StartMap from '@/public/classes/StartMap';
	import GoogleMapsApi from '@/public/googleMaps/GoogleMapsApi';
	import LeafletApi from '@/public/leaflet/LeafletApi';
	import WorkPanel from '@/public/components/panels/workPanel';
	import PopupsPanel from '@/public/components/panels/popupsPanel';
	import MapExport from '@/public/classes/MapExport';
	import MapPanel from '@/public/components/panels/mapPanel';
	import MetricsButton from '@/public/components/widgets/map/metricsButton';
	import LeftPanel from '@/public/components/panels/leftPanel';
	import EditButton from '@/public/components/widgets/map/editButton';
	import FullScreenButton from '@/public/components/widgets/map/fullScreenButton';
	import SummaryPanel from '@/public/components/panels/summaryPanel';
	import Search from '@/public/components/widgets/map/search';
	import WatermarkFloat from '@/public/components/widgets/map/watermarkFloat';
	import WatermarkOwner from '@/public/components/widgets/map/WatermarkOwner';
	import CollapseButtonRight from '@/public/components/controls/collapseButtonRight';

	import Split from 'split.js';
	import axios from 'axios';
	import Vue from 'vue';
	import err from '@/common/framework/err';
	import web from '@/common/framework/web';

	import session from '@/common/framework/session';
	import authentication from '@/common/js/authentication';

	import { component } from 'vue-fullscreen';

	export default {
		name: 'app',
		components: {
			SummaryPanel,
			Search,
			MapPanel,
			WaitMessage,
			EditButton,
			FullScreenButton,
			MetricsButton,
			LeftPanel,
			PopupsPanel,
			WorkPanel,
			WatermarkFloat,
			WatermarkOwner,
			CollapseButtonRight,
			fs: component,
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
			window.ToggleFullscreen = this.toggleFullscreen;
		},
		data() {
			return {
				fullscreen: false,
				teleport: true,
				pageOnly: false,

				selfCheckTimer: null,
				workStartupSetter: null,
				isMobile: false,
				splitPanels: null,
				featureNavigation: { Key: null, Values: [], GettingKey: null },
				toolbarStates: {
					selectionMode: null, tutorialOpened: 0, showLabels: true,
					collapsed: false, repositionSearch: false, leftPanelVisible: false
				},
				flyRightTimeoutId: null,
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
			this.toolbarStates.collapsed = true;
			this.SplitPanelsRefresh();
			this.BindEvents();
			var loc = this;
			window.Popups.WaitMessage = this.$refs.showWaitMessage;
			this.GetServer().then(
				function (serverConfiguration) {
					return loc.GetConfiguration(serverConfiguration.data);
				}).then(function () {
					if (loc.Embedded.HideLabels) {
						loc.toolbarStates.showLabels = false;
					}
					var start = new StartMap(loc.work, loc, loc.SetupMap);
					start.Start();
				});
			window.Panels.Left = this.$refs.leftPanel;
		},
		computed: {
			collapseButtonOffset() {
				return (this.toolbarStates.collapsed ? '' : 'right: max(275px, calc(30% - 3px)); z-index: 999!important;');
			},
			clippingStarted() {
				return this.clipping.Region.Summary && !this.clipping.Region.Summary.Empty;
			},
			rightPanelOverflow() {
				return (this.clippingStarted ? 'overflow-y: auto;' : 'overflow-y: hidden');
			},
			workColor() {
				if (this.work && this.work.Current && this.work.Current.Metadata && this.work.Current.Metadata.Institutions.length > 0 && this.work.Current.Metadata.Institutions[0].Color) {
					return '#' + this.work.Current.Metadata.Institutions[0].Color;
				}
				return '#00A0D2';
			},
			ownerLogo() {
				return this.config.OwnerLogo;
			},
			Embedded() {
				return window.Embedded;
			},
			Use() {
				return window.Use;
			},
		},
		methods: {
			IsPreview() {
				var path = window.location.href;
				return path.indexOf('&pv=1#') > 0;
			},
			panRightSwipeClose(direction, event) {
				if (
					(event.srcElement && (
						event.srcElement.className === 'vue-slider-dot-handle' ||
						event.srcElement.className === 'vue-slider-process' ||
						event.srcElement.className === 'vue-slider vue-slider-ltr')) ||
					window.getSelection().toLocaleString().length > 0) {
					return;
				}
				this.doToggle();
			},
			toggleFullscreen() {
				this.fullscreen = !this.fullscreen;
			},
			GetConfiguration(serverConfiguration) {
				const loc = this;
				var params = {};
				if (window.self !== window.top && !this.IsPreview()) {
					var topUrl = (window.location.ancestorOrigin && window.location.ancestorOrigin.length > 0 ?
						window.location.ancestorOrigin[0] : document.referrer);
					if (!topUrl || document.location.href.startsWith(topUrl)) {
						topUrl = '<unknown>';
					}
					params.t = topUrl;
					params.c = document.location.href;
				}
				var args = StartMap.ResolveWorkIdFromUrl();
				params.w = args.workId;
				params.l = args.link;

				return axios.get(serverConfiguration.Server + '/services/GetConfiguration', session.AddSession(serverConfiguration.Server, {
					params: params
				})).then(function (res) {
					session.ReceiveSession(serverConfiguration.Server, res);
					res.data.DynamicServer = serverConfiguration.Server;
					window.mainHost = res.data.MainServer;
					window.host = res.data.DynamicServer;
					loc.config = res.data;
					loc.config.IsMobile = loc.$isMobile();
					loc.user = res.data.User;
					if (web.getParameterByName('leaflet') != null) {
						loc.config.MapsAPI = 'leaflet';
					}
					if (args.workId) {
						if (res.data.CanAccessContent === false) {
							if (loc.user.User !== '') {
								alert('El usuario actual (' + loc.user.User + ') no dispone de acceso para este contenido. Deberá identificarse con otra cuenta para poder ingresar.');
							}
							authentication.redirectLogin();
						} else {
							// puede accederlo
							if (res.data.ContentAttributes.Title) {
								window.DefaultTitle = res.data.ContentAttributes.Title;
								document.title = window.DefaultTitle;
							}
							if (res.data.ContentAttributes.Description) {
								document.querySelector('meta[name="description"]').setAttribute("content", res.data.ContentAttributes.Description);
							}
						}
					}
				}).catch(function (error) {
					err.errDialog('GetConfiguration', 'conectarse con el servidor', error);
				});
			},
			GetServer() {
				var params = {};
				return axios.get(window.host + '/services/GetTransactionServer', session.AddSession(window.host, {
					params: params
				})).then(function (res) {
					session.ReceiveSession(window.host, res);
					return res;
				}).catch(function (error) {
					err.errDialog('GetTransactionServer', 'conectarse con el servidor', error);
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
					Active: web.getParameterByName('emb') != null || this.inIframe(),
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
				ret.IsPreview = web.getParameterByName('pv') != null;
				if (ret.IsPreview) {
					ret.Readonly = true;
					ret.Compact = true;
					ret.HideLabels = true;
					ret.DisableClippingSelection = true;
				}
				if (ret.Compact) {
					ret.HideSearch = true;
					ret.HideSidePanel = true;
					ret.HideAddMetrics = true;
					ret.HideWorkPanel = true;
					ret.DisableClippingSelection = true;
				} else {
					ret.HideSearch = ret.Readonly || web.getParameterByName('ns') != null;
					ret.HideSidePanel = web.getParameterByName('np') != null;
					ret.HideAddMetrics = ret.Readonly || web.getParameterByName('na') != null;
					ret.DisableClippingSelection = ret.HideSidePanel;
				}
				if (ret.Readonly && web.getParameterByName('oc') != null) {
					ret.OpenOnClick = true;
				}
				return ret;
			},
			inIframe() {
				try {
					return window.self !== window.top;
				} catch (e) {
					return true;
				}
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
					if (window.SegMap) {
						window.SegMap.CheckSmallDevice();
					}
					if (loc.$refs.summaryPanel) {
						if (loc.$refs.summaryPanel.$el.offsetWidth > 320 && !loc.toolbarStates.collapsed) {
							loc.toolbarStates.collapsed = true;
							loc.SplitPanelsRefresh();
							loc.toolbarStates.collapsed = false;
							loc.SplitPanelsRefresh();
						}
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
				var mapApi;
				if (this.config.MapsAPI === 'google') {
					mapApi = new GoogleMapsApi(window.google);
				} else if (this.config.MapsAPI === 'leaflet') {
					mapApi = new LeafletApi();
				} else {
					throw new Error("Api no soportada");
				}
				var segMap = new SegmentedMap(mapApi, this.frame, this.clipping, this.toolbarStates, this.metrics, this.config);
				segMap.Work = this.work;
				segMap.afterCallback = afterLoaded;
				window.SegMap = segMap;
				if (!window.Embedded.Compact) {
					this.$refs.fabPanel.loadFabMetrics();
				}
				segMap.SaveRoute.DisableOnce = true;
				mapApi.Initialize();
				segMap.SetSelectionMode(0);
				if (window.Embedded.HideLabels) {
					segMap.Labels.Hide();
				}
				if (window.Embedded.IsPreview) {
					var mapExport = new MapExport(this.work.Current);
					mapExport.ExportPreview();
				} else {
					window.SegMap.CheckSmallDevice();
				}
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
			doToggle() {
				this.toolbarStates.collapsed = !this.toolbarStates.collapsed;
				window.SegMap.Session.UI.ToggleRightPanel(!this.toolbarStates.collapsed);
			},
			SplitPanelsRefresh() {
				return;
				if (this.toolbarStates.collapsed) {
					if (this.splitPanels !== null) {
						this.splitPanels.destroy();
						this.splitPanels = null;
					}
				}
				else {
					if (this.splitPanels === null) {
						var width = window.innerWidth;
						var prop = 320 / width * 100;
						if (prop < 30) { prop = 30; }
						if (prop > 50) { prop = 95; }

						this.splitPanels = Split(['#panMain', '#panRight'], {
							sizes: [100 - prop, prop],
							minSizes: [10, 320],
							expandToMin: true,
							gutterSize: 5,
							onDrag: function () { window.SegMap.TriggerResize(); },
							onDragEnd: function () { window.SegMap.TriggerResize(); }
						});
					}
				}
				if (window.SegMap) {
					window.SegMap.TriggerResize();
				}
			},
		},
		watch: {
			'toolbarStates.collapsed'(value) {
				var s = document.getElementById('panRight');
				if (this.flyRightTimeoutId) {
					clearTimeout(this.flyRightTimeoutId);
					this.flyRightTimeoutId = null;
				}
				if (!value) {
					// mostrar
					s.style.display = 'block';
					this.flyRightTimeoutId = setTimeout(() => {
						s.classList.remove('animatedFlyRight');
					}, 10);
				} else {
					// ocultar
					s.classList.add('animatedFlyRight');
					this.flyRightTimeoutId = setTimeout(() => {
						s.style.display = 'none';
					}, 300);
				}
				this.SplitPanelsRefresh();
			}
		}
	};

</script>
<style src="@/common/styles/popovers.css"></style>
<style src="@/common/styles/transition.css"></style>

<style>
	html, body {
		height: 100%;
		overflow-y: hidden;
		margin: 0;
		padding: 0;
		cursor: default;
	}

	.leaflet-tooltip {
		white-space: unset !important;
		border: unset !important;
		background-color: unset !important;
		box-shadow: unset !important;
		line-height: 1.15;
	}

	.leaflet-popup-content {
		font-size: 13px !important;
		margin: 8px 20px 5px 10px !important;
	}

	.leafletMapButton {
		background: none padding-box rgb(255, 255, 255);
		display: table-cell;
		border: 0px;
		margin: 0px;
		padding: 0px 17px;
		position: relative;
		cursor: pointer;
		direction: ltr;
		overflow: hidden;
		text-align: center;
		height: 40px;
		vertical-align: middle;
		color: rgb(0, 0, 0);
		font-family: Roboto, Arial, sans-serif;
		font-size: 18px;
		border-bottom-left-radius: 2px;
		border-top-left-radius: 2px;
		box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
		min-width: 45px;
		font-weight: 500;
		float: left;
	}

	.leaflet-control-scale-line {
		font-size: 9px !important;
		cursor: default;
	}

	.gm-ui-hover-effect {
		top: 0px !important;
		right: 0px !important;
	}

	.ls {
		fill: none !important;
	}

	.mapsOvercontrols {
		z-index: 900 !important;
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
			transform: translateX(4px) scale(0.8);
		}

	.trigger {
		width: 100%;
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

	.leaflet-tile-loaded {
		pointer-events: all !important;
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

	.leaflet-attribution-flag {
		width: 0px !important;
		margin-left: -3px;
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
		margin-top: 0.4rem;
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
		padding-top: 10px !important;
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
		opacity: .75 !important;
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

	#nprogress .bar {
		background: #29d;
		height: 1px !important;
		box-shadow: 0px 1px rgb(34 153 221 / 40%);
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
		z-index: 500;
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
		z-index: 900;
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

	.ibLinkTooltip {
		pointer-events: all;
	}

	.btn.active:not(:hover) + .btn.active:not(:hover)::before {
		content: '';
		width: 2px;
		position: absolute;
		left: -2px;
		top: 1px;
		bottom: 1px;
		background-color: #c3c3c3;
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
	.logosBox {
		bottom: 24px;
		right: 95px;
		z-index: 1000;
		position: absolute;
		background-color: transparent;
		display: flex;
		height: 100%;
		width: auto;
		max-width: 70%;
		max-height: 64px;
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
		padding: 0px 0px 12px 0px;
		font-size: 13px;
		text-align: justify;
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

	.markerSelectedLabel {
		text-shadow: .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px .75px 1px #fff, .75px -1px 1px #fff, .75px .75px 1px #fff, -.75px -1px 1px #fff, -.75px 1px 1px #fff, .75px -.75px 1px #FFF;
		transform: translateX(calc(50% + 17px));
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
		white-space: nowrap;
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

	.tdWrappable {
		overflow-wrap: anywhere;
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

	.animatedFlyAway {
		transition: transform .3s ease;
	}

	.animatedFlyLeft {
		transform: translateX(-100%);
		-webkit-transform: translateX(-100%);
	}

	.animatedFlyRight {
		transform: translateX(100%);
		-webkit-transform: translateX(100%);
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

	.leaflet-control-zoom {
		border: 0px solid black !important;
		box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px !important;
	}

	.leaflet-control-zoom-in {
		border-bottom: 1px solid #f0f0f0 !important;
		color: #666 !important;
	}

	.leaflet-control-zoom-out {
		color: #666 !important
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

	.dToolboxBox {
		pointer-events: auto;
		width: 27px;
		background-color: White;
		padding-left: 4px;
		padding-top: 4px;
	}

	.noTopPadding {
		padding-top: 0px !important;
	}

	.dropCapture {
		margin-top: 7px;
		margin-left: -8px;
	}

	.unselected {
		background-color: white !important;
		color: #333 !important;
	}

		.unselected:hover {
			background-color: #333 !important;
			color: #d4d4d4 !important;
			border-color: #8c8c8c !important;
		}

	.shareIt {
		min-width: 37px;
		margin-top: 8px;
		margin-left: -5px;
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

	.lihover {
		background: #efefef;
	}

	.thinScroll::-webkit-scrollbar {
		width: 6px;
		border-top-right-radius: 2px;
	}

	.thinScroll::-webkit-scrollbar-thumb {
		background: #777;
		border-top-right-radius: 2px;
		border-bottom-right-radius: 2px;
	}

	.thinScroll::-webkit-scrollbar-track {
		background: #ddd;
		border-top-right-radius: 2px;
		border-bottom-right-radius: 2px;
	}

	.floatRightPanel {
		width: calc(30% - 2.5px);
		min-width: 275px;
		position: absolute;
		right: 0px;
		z-index: 1000;
		border: 1px solid rgb(165 164 164 / 75%);
		border-radius: 2px;
		max-height: calc(100% - 95px);
		background-color: #ffffff;
		height: unset !important;
		box-shadow: rgba(0, 0, 0, 0.18) 0px 0px 12px !important;
	}

	.gm-svpc {
		left: -111px !important;
		top: 113px !important;
	}

	.searchOffsetTop {
		margin-top: 50px;
		transform: translateX(-55px)
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

	a[title="Abrir esta área en Google Maps (se abre en una ventana nueva)"] {
		display: none !important;
	}

	a[title="Informar a Google errores en las imágenes o el mapa de carreteras."] {
		display: none !important;
	}

	#holder {
		top: 0px;
		height: 100%;
		width: 100%;
		position: absolute;
	}

	.leaflet-mouse-marker {
		transition: none !important;
	}
	/*
	.leaflet-zoom-animated {
		transition: none !important;
	}*/
</style>
